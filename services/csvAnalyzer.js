const OpenAI = require('openai');
require('dotenv').config();

/**
 * CSV Analyzer Service for automatic column mapping using ChatGPT
 */
class CSVAnalyzer {
  constructor() {
    this.openai = process.env.OPENAI_API_KEY ? new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    }) : null;
    this.demoMode = process.env.DEMO_MODE === 'true';
  }

  /**
   * Analyze CSV structure and return column mapping
   * @param {Array} csvData - First few rows of CSV data
   * @param {Array} headers - CSV headers
   * @returns {Object} Column mapping configuration
   */
  async analyzeCSVStructure(csvData, headers) {
    try {
      if (this.demoMode || !this.openai) {
        return this.getDemoMapping(headers);
      }

      const prompt = this.buildAnalysisPrompt(csvData, headers);
      
      const response = await this.openai.chat.completions.create({
        model: 'gpt-3.5-turbo',
        messages: [
          {
            role: 'system',
            content: 'Ты эксперт по анализу банковских CSV файлов. Анализируй структуру файла и определи маппинг колонок для финансовых операций. Отвечай ТОЛЬКО JSON.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        max_tokens: 1000,
        temperature: 0.1
      });

      const analysisResult = response.choices[0].message.content;
      const parsedResult = this.parseAnalysisResult(analysisResult, headers);
      
      // Detect bank type
      const bankType = this.detectBankType(headers, csvData);
      parsedResult.bank = bankType;
      
      return parsedResult;

    } catch (error) {
      console.error('CSV analysis error:', error);
      return this.getFallbackMapping(headers);
    }
  }

  /**
   * Build prompt for ChatGPT analysis
   */
  buildAnalysisPrompt(csvData, headers) {
    const sampleRows = csvData.slice(0, 3).map(row => 
      headers.map(header => `${header}: ${row[header] || ''}`).join(' | ')
    ).join('\n');

    let prompt = `Проанализируй структуру банковского CSV файла и определи маппинг колонок.\n\n`;
    prompt += `ЗАГОЛОВКИ: ${headers.join(', ')}\n\n`;
    prompt += `ПРИМЕРЫ СТРОК:\n${sampleRows}\n\n`;
    
    prompt += `Определи, какие колонки содержат:\n`;
    prompt += `1. ДАТУ операции (может быть в разных форматах)\n`;
    prompt += `2. ОПИСАНИЕ операции (название, детали транзакции)\n`;
    prompt += `3. ОРИГИНАЛЬНУЮ СУММУ операции (в оригинальной валюте, НЕ конвертированную)\n`;
    prompt += `4. ОРИГИНАЛЬНУЮ ВАЛЮТУ операции (если есть отдельная колонка)\n`;
    prompt += `5. ТИП операции (доход/расход, если есть)\n\n`;
    prompt += `ВАЖНО: Если есть колонки "Orig amount" и "Orig currency", используй их для суммы и валюты!\n`;
    prompt += `Если есть колонки "Amount" и "Payment currency", это конвертированные значения - НЕ используй их!\n\n`;
    
    prompt += `Верни JSON в формате:\n`;
    prompt += `{\n`;
    prompt += `  "date": "название_колонки_с_датой",\n`;
    prompt += `  "description": "название_колонки_с_описанием",\n`;
    prompt += `  "amount": "название_колонки_с_суммой",\n`;
    prompt += `  "currency": "название_колонки_с_валютой_или_null",\n`;
    prompt += `  "type": "название_колонки_с_типом_или_null",\n`;
    prompt += `  "bank": "название_банка_если_определено",\n`;
    prompt += `  "confidence": 0.95\n`;
    prompt += `}\n\n`;
    prompt += `Если колонка не найдена, используй null.`;

    return prompt;
  }

  /**
   * Parse ChatGPT analysis result
   */
  parseAnalysisResult(result, headers) {
    try {
      const jsonStart = result.indexOf('{');
      const jsonEnd = result.lastIndexOf('}');
      
      if (jsonStart === -1 || jsonEnd === -1) {
        throw new Error('No JSON found in ChatGPT response');
      }
      
      const jsonString = result.substring(jsonStart, jsonEnd + 1);
      const mapping = JSON.parse(jsonString);
      
      // Validate that mapped columns exist in headers
      const validatedMapping = {};
      Object.entries(mapping).forEach(([field, columnName]) => {
        if (columnName && headers.includes(columnName)) {
          validatedMapping[field] = columnName;
        } else if (field !== 'bank' && field !== 'confidence') {
          validatedMapping[field] = null;
        }
      });
      
      return {
        success: true,
        mapping: validatedMapping,
        bank: mapping.bank || 'Unknown',
        confidence: mapping.confidence || 0.5
      };
      
    } catch (error) {
      console.error('Failed to parse ChatGPT analysis:', error);
      return this.getFallbackMapping(headers);
    }
  }

  /**
   * Get demo mapping for testing
   */
  getDemoMapping(headers) {
    const mapping = {
      date: this.findColumnByPattern(headers, ['date', 'data', 'datum']),
      description: this.findColumnByPattern(headers, ['description', 'opis', 'desc']),
      amount: this.findColumnByPattern(headers, ['amount', 'kwota', 'suma']),
      currency: this.findColumnByPattern(headers, ['currency', 'waluta', 'curr']),
      type: this.findColumnByPattern(headers, ['type', 'typ'])
    };

    return {
      success: true,
      mapping: mapping,
      bank: 'Demo Bank',
      confidence: 0.8
    };
  }

  /**
   * Get fallback mapping when analysis fails
   */
  getFallbackMapping(headers) {
    // Check for Revolut format first
    if (headers.includes('Orig currency') && headers.includes('Orig amount')) {
      return {
        success: true,
        mapping: {
          date: this.findColumnByPattern(headers, ['date completed (utc)', 'date started (utc)', 'date', 'data']),
          description: this.findColumnByPattern(headers, ['description', 'opis', 'desc']),
          amount: 'Orig amount',
          currency: 'Orig currency',
          type: this.findColumnByPattern(headers, ['type', 'typ'])
        },
        bank: 'Revolut',
        confidence: 0.9
      };
    }

    const mapping = {
      date: this.findColumnByPattern(headers, ['date', 'data', 'datum', 'transaction_date']),
      description: this.findColumnByPattern(headers, ['description', 'opis', 'desc', 'memo']),
      amount: this.findColumnByPattern(headers, ['amount', 'kwota', 'suma', 'value']),
      currency: this.findColumnByPattern(headers, ['currency', 'waluta', 'curr']),
      type: this.findColumnByPattern(headers, ['type', 'typ'])
    };

    return {
      success: false,
      mapping: mapping,
      bank: 'Unknown',
      confidence: 0.3
    };
  }

  /**
   * Find column by pattern matching
   */
  findColumnByPattern(headers, patterns) {
    for (const pattern of patterns) {
      const found = headers.find(header => 
        header.toLowerCase().includes(pattern.toLowerCase())
      );
      if (found) return found;
    }
    return null;
  }

  /**
   * Detect bank type from CSV structure
   */
  detectBankType(headers, sampleData) {
    const headerString = headers.join(' ').toLowerCase();
    const dataString = JSON.stringify(sampleData).toLowerCase();

    if (headerString.includes('orig currency') || headerString.includes('orig amount') || headerString.includes('revolut')) {
      return 'Revolut';
    }
    if (headerString.includes('iban') || headerString.includes('bic')) {
      return 'European Bank';
    }
    if (headerString.includes('routing') || headerString.includes('account number')) {
      return 'US Bank';
    }
    if (headerString.includes('sort code')) {
      return 'UK Bank';
    }

    return 'Unknown';
  }
}

module.exports = CSVAnalyzer;
