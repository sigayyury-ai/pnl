const CurrencyService = require('./currencyService.js');
const RuleEngine = require('./ruleEngine.js');
const CSVAnalyzer = require('./csvAnalyzer.js');
const OpenAI = require('openai');
require('dotenv').config();

/**
 * CSV Processor Service for handling CSV file parsing and operation categorization
 */
class CSVProcessor {
  constructor() {
    this.currencyService = new CurrencyService();
    this.ruleEngine = new RuleEngine();
    this.csvAnalyzer = new CSVAnalyzer();
    this.openai = process.env.OPENAI_API_KEY ? new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    }) : null;
    this.demoMode = process.env.DEMO_MODE === 'true';
    this.columnMapping = null; // Will be set after CSV analysis
  }

  /**
   * Parse CSV data using PapaParse format with automatic column mapping
   */
  async parseCSVData(csvData) {
    if (!Array.isArray(csvData) || csvData.length === 0) {
      throw new Error('Invalid CSV data provided');
    }

    // Analyze CSV structure if not already done
    if (!this.columnMapping) {
      const headers = Object.keys(csvData[0]);
      const sampleData = csvData.slice(0, 5); // First 5 rows for analysis
      
      console.log('Analyzing CSV structure...');
      const analysisResult = await this.csvAnalyzer.analyzeCSVStructure(sampleData, headers);
      
      this.columnMapping = analysisResult.mapping;
      console.log('CSV Analysis Result:', {
        bank: analysisResult.bank,
        confidence: analysisResult.confidence,
        mapping: this.columnMapping
      });
    }

    const operations = [];
    
    csvData.forEach((row, index) => {
      const operation = this.extractOperationFromRow(row, index);
      if (operation) {
        operations.push(operation);
      }
    });

    if (operations.length === 0) {
      throw new Error('No valid operations found in CSV data');
    }

    return operations;
  }

  /**
   * Extract operation from CSV row using dynamic column mapping
   */
  extractOperationFromRow(row, rowIndex) {
    const operation = {
      raw_data: row,
      row_index: rowIndex
    };

    // Use dynamic column mapping from CSV analysis
    if (this.columnMapping) {
      Object.entries(this.columnMapping).forEach(([field, columnName]) => {
        if (columnName && row[columnName] !== undefined && row[columnName] !== '') {
          operation[field] = row[columnName];
        }
      });
    } else {
      // Fallback to static mapping if analysis failed
      this.extractOperationWithStaticMapping(row, operation);
    }

    // Validate required fields
    if (!operation.description || operation.amount === undefined || operation.amount === '') {
      return null; // Skip invalid rows
    }

    // Parse and clean amount
    const amountStr = String(operation.amount || '').replace(',', '.');
    const parsedAmount = parseFloat(amountStr);
    
    if (isNaN(parsedAmount)) {
      return null; // Skip rows with invalid amounts
    }
    
    operation.amount = parsedAmount;
    
    // Clean currency and set default
    const originalCurrency = operation.currency;
    operation.currency = (operation.currency || 'PLN').toString().toUpperCase().trim();
    
    // Debug logging for currency detection
    if (originalCurrency !== operation.currency) {
      console.log(`Currency changed from "${originalCurrency}" to "${operation.currency}" for operation: ${operation.description}`);
    }
    
    // Parse and validate date
    if (operation.date) {
      try {
        const date = new Date(operation.date);
        if (!isNaN(date.getTime()) && date.getFullYear() > 1900) {
          operation.date = date.toISOString().split('T')[0];
        } else {
          throw new Error('Invalid date');
        }
      } catch (e) {
        console.warn(`Invalid date format in row ${rowIndex}: ${operation.date}. Using current date.`);
        operation.date = new Date().toISOString().split('T')[0];
      }
    } else {
      operation.date = new Date().toISOString().split('T')[0];
    }

    return operation;
  }

  /**
   * Fallback method for static column mapping
   */
  extractOperationWithStaticMapping(row, operation) {
    const columnMappings = {
      date: ['date', 'data', 'datum', 'transaction_date', 'operation_date', 'data_operacji', 'date started (utc)', 'date completed (utc)'],
      description: ['description', 'opis', 'desc', 'transaction_description', 'details', 'memo', 'opis_operacji', 'szczegoly'],
      amount: ['amount', 'kwota', 'suma', 'transaction_amount', 'value', 'wartosc', 'kwota_transakcji', 'orig amount'],
      currency: ['currency', 'waluta', 'curr', 'currency_code', 'kod_waluty', 'orig currency'],
      type: ['type', 'typ', 'transaction_type', 'operation_type', 'typ_operacji']
    };

    // Find matching columns (case insensitive)
    Object.entries(columnMappings).forEach(([field, possibleNames]) => {
      for (const colName of possibleNames) {
        const foundKey = Object.keys(row).find(key => 
          key.toLowerCase().trim() === colName.toLowerCase()
        );
        
        if (foundKey && row[foundKey] !== undefined && row[foundKey] !== '') {
          operation[field] = row[foundKey];
          break;
        }
      }
    });
  }

  /**
   * Convert currencies to PLN using CurrencyService
   */
  async convertCurrenciesToPLN(operations) {
    try {
      const currencies = [...new Set(operations.map(op => op.currency?.toUpperCase()).filter(Boolean))];
      
      if (currencies.length === 0) {
        throw new Error('No currencies found in operations');
      }
      
      console.log(`Converting currencies: ${currencies.join(', ')}`);
      
      // Get exchange rates
      const exchangeRates = await this.currencyService.getExchangeRates(currencies);
      console.log('Exchange rates obtained:', exchangeRates);
      
      // Convert operations
      const convertedOperations = this.currencyService.convertOperationsToPLN(operations, exchangeRates);
      
      return {
        success: true,
        operations: convertedOperations,
        exchangeRates: exchangeRates,
        currenciesFound: currencies
      };
      
    } catch (error) {
      console.error('Currency conversion error:', error);
      throw new Error(`Currency conversion failed: ${error.message}`);
    }
  }

  /**
   * Categorize operations using rules first, then ChatGPT or demo mode
   */
  async categorizeOperations(operations, categories) {
    try {
      console.log(`Starting categorization for ${operations.length} operations`);
      
      // Step 1: Apply rules first (highest priority)
      const ruleProcessedOperations = await this.ruleEngine.categorizeWithRules(operations, categories);
      
      // Step 2: Separate operations that need AI/demo categorization
      const pendingOperations = ruleProcessedOperations.filter(op => !op.ruleMatched);
      const ruleMatchedOperations = ruleProcessedOperations.filter(op => op.ruleMatched);
      
      console.log(`Rules matched: ${ruleMatchedOperations.length}, Pending AI/demo: ${pendingOperations.length}`);
      
      // Step 3: Apply AI or demo categorization to remaining operations
      let aiProcessedOperations = [];
      if (pendingOperations.length > 0) {
        if (this.demoMode) {
          const demoResult = this.demoCategorizeOperations(pendingOperations, categories);
          aiProcessedOperations = demoResult.operations;
        } else {
          const aiResult = await this.chatGPTCategorizeOperations(pendingOperations, categories);
          aiProcessedOperations = aiResult.operations;
        }
      }
      
      // Step 4: Combine results
      const allOperations = [...ruleMatchedOperations, ...aiProcessedOperations];
      
      return {
        success: true,
        operations: allOperations,
        method: this.demoMode ? 'demo_with_rules' : 'chatgpt_with_rules',
        stats: {
          total: operations.length,
          ruleMatched: ruleMatchedOperations.length,
          aiProcessed: aiProcessedOperations.length
        }
      };
      
    } catch (error) {
      console.error('Error in categorizeOperations:', error);
      // Fallback to simple categorization
      if (this.demoMode) {
        return this.demoCategorizeOperations(operations, categories);
      } else {
        return await this.chatGPTCategorizeOperations(operations, categories);
      }
    }
  }

  /**
   * Demo categorization (for testing without OpenAI API)
   */
  demoCategorizeOperations(operations, categories) {
    const categorized = operations.map(operation => {
      const category = this.assignDemoCategory(operation.description, operation.operation_type, categories);
      return { ...operation, category };
    });
    
    return {
      success: true,
      operations: categorized,
      method: 'demo'
    };
  }

  /**
   * Assign demo category based on description patterns
   */
  assignDemoCategory(description, operationType, categories) {
    const desc = description.toLowerCase();
    
    // Income patterns
    if (operationType === 'income' || desc.includes('income') || desc.includes('revenue')) {
      const incomeCategories = categories.income || [];
      return incomeCategories.length > 0 ? incomeCategories[0] : 'Sales Revenue';
    }
    
    // Expense patterns
    if (desc.includes('food') || desc.includes('restaurant')) {
      return 'Food & Dining';
    }
    if (desc.includes('transport') || desc.includes('uber') || desc.includes('taxi')) {
      return 'Transportation';
    }
    if (desc.includes('office') || desc.includes('supplies')) {
      return 'Office Supplies';
    }
    if (desc.includes('marketing') || desc.includes('ads') || desc.includes('advertising')) {
      return 'Marketing & Advertising';
    }
    
    // Default to first available category or "Other"
    const expenseCategories = categories.expense || [];
    return expenseCategories.length > 0 ? expenseCategories[0] : 'Other';
  }

  /**
   * ChatGPT categorization
   */
  async chatGPTCategorizeOperations(operations, categories) {
    try {
      if (!this.openai) {
        console.log('OpenAI not configured, falling back to demo mode');
        return this.demoCategorizeOperations(operations, categories);
      }
      
      const prompt = this.buildCategorizationPrompt(operations, categories);
      
      const response = await this.openai.chat.completions.create({
        model: 'gpt-3.5-turbo',
        messages: [
          {
            role: 'system',
            content: 'Ты эксперт по финансам польской компании. Анализируй операции и присваивай категории доходов и расходов. Отвечай ТОЛЬКО JSON массивом.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        max_tokens: 2000,
        temperature: 0.3
      });
      
      const chatGPTResponse = response.choices[0].message.content;
      return this.parseChatGPTResponse(operations, chatGPTResponse);
      
    } catch (error) {
      console.error('ChatGPT categorization error:', error);
      console.log('Falling back to demo categorization');
      return this.demoCategorizeOperations(operations, categories);
    }
  }

  /**
   * Build prompt for ChatGPT categorization
   */
  buildCategorizationPrompt(operations, categories) {
    const operationsText = operations.map((op, index) => 
      `${index + 1}. ${op.description} - ${op.amount_pln || op.amount} PLN (${op.amount >= 0 ? 'доход' : 'расход'})`
    ).join('\n');
    
    let prompt = `Проанализируй следующие финансовые операции польской компании и присвой каждой подходящую категорию.\n\n`;
    prompt += `ОПЕРАЦИИ:\n${operationsText}\n\n`;
    
    prompt += `ДОСТУПНЫЕ КАТЕГОРИИ:\n\n`;
    prompt += `ДОХОДЫ:\n`;
    (categories.income || []).forEach(cat => {
      prompt += `- ${cat}\n`;
    });
    
    prompt += `\nРАСХОДЫ:\n`;
    (categories.expense || []).forEach(cat => {
      prompt += `- ${cat}\n`;
    });
    
    prompt += `\nВерни ТОЛЬКО JSON массив в формате:\n`;
    prompt += `[{"operation": 1, "category": "Sales Revenue"}, {"operation": 2, "category": "Marketing & Advertising"}]\n`;
    prompt += `Где "operation" это номер операции (1, 2, 3...), а "category" это точное название категории из списка выше.`;
    
    return prompt;
  }

  /**
   * Parse ChatGPT response and assign categories
   */
  parseChatGPTResponse(operations, response) {
    try {
      const jsonStart = response.indexOf('[');
      const jsonEnd = response.lastIndexOf(']');
      
      if (jsonStart === -1 || jsonEnd === -1) {
        throw new Error('No JSON array found in ChatGPT response');
      }
      
      const jsonString = response.substring(jsonStart, jsonEnd + 1);
      const categoryAssignments = JSON.parse(jsonString);
      
      if (!Array.isArray(categoryAssignments)) {
        throw new Error('Response is not an array');
      }
      
      const categorized = operations.map((operation, index) => {
        const assignment = categoryAssignments.find(c => c.operation === index + 1);
        const category = assignment?.category || this.assignDemoCategory(operation.description, operation.amount >= 0 ? 'income' : 'expense', {});
        
        return { ...operation, category };
      });
      
      return {
        success: true,
        operations: categorized,
        method: 'chatgpt'
      };
      
    } catch (error) {
      console.error('Failed to parse ChatGPT response:', error);
      throw new Error(`Failed to parse AI response: ${error.message}`);
    }
  }

  /**
   * Process complete CSV workflow: parse, convert currencies, categorize
   */
  async processCSV(csvData, categories, year, month) {
    try {
      // Step 1: Parse CSV data with automatic column mapping
      const operations = await this.parseCSVData(csvData);
      console.log(`Parsed ${operations.length} operations from CSV`);
      
      // Step 2: Convert currencies to PLN
      const conversionResult = await this.convertCurrenciesToPLN(operations);
      const convertedOperations = conversionResult.operations;
      
      // Step 3: Add year, month, and operation type
      const finalOperations = convertedOperations.map(operation => ({
        ...operation,
        year: parseInt(year),
        month: parseInt(month),
        operation_type: operation.amount >= 0 ? 'income' : 'expense'
      }));
      
      // Step 4: Categorize operations
      const categorizationResult = await this.categorizeOperations(finalOperations, categories);
      
      return {
        success: true,
        operations: categorizationResult.operations,
        summary: {
          totalOperations: finalOperations.length,
          currenciesFound: conversionResult.currenciesFound,
          exchangeRates: conversionResult.exchangeRates,
          totalPLNAmount: finalOperations.reduce((sum, op) => sum + (op.amount_pln || 0), 0),
          categorizationMethod: categorizationResult.method
        },
        year: parseInt(year),
        month: parseInt(month)
      };
      
    } catch (error) {
      console.error('CSV processing error:', error);
      throw error;
    }
  }

  /**
   * Create a categorization rule from user correction
   */
  async createRuleFromUserCorrection(operationDescription, categoryId, categoryName) {
    try {
      const result = await this.ruleEngine.createRuleFromCorrection(
        operationDescription, 
        categoryId, 
        categoryName
      );
      
      console.log(`Rule creation result:`, result);
      return result;
      
    } catch (error) {
      console.error('Error creating rule from user correction:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }
}

module.exports = CSVProcessor;
