#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

// Тестируем CSV обработчик напрямую
async function testCSVHandler() {
  console.log('🧪 Testing CSV Handler...');
  
  try {
    // Импортируем нужные модули
    const CSVProcessor = require('./services/csvProcessor.js');
    const CategoriesQueries = require('./database/queries/categories.js');
    
    console.log('✅ Modules loaded successfully');
    
    // Читаем тестовый CSV
    const csvPath = path.join(__dirname, 'test-data.csv');
    const csvContent = fs.readFileSync(csvPath, 'utf8');
    
    console.log('✅ Test CSV file read:', csvPath);
    console.log('📄 CSV content preview:', csvContent.substring(0, 200) + '...');
    
    // Создаем CSVProcessor
    const csvProcessor = new CSVProcessor();
    
    // Тестовые категории
    const testCategories = {
      income: ['Sales Revenue', 'Client Payments'],
      expense: ['Office Supplies', 'Rent', 'Food', 'Other']
    };
    
    // Парсим CSV данные в том же формате, что ожидает API
    const Papa = require('papaparse');
    const parseResult = Papa.parse(csvContent, {
      header: true,
      skipEmptyLines: true
    });
    
    console.log('✅ CSV parsed successfully');
    console.log('📊 Parsed rows:', parseResult.data.length);
    
    if (parseResult.data.length > 0) {
      console.log('📝 First row:', parseResult.data[0]);
    }
    
    // Тестируем полный процесс обработки
    console.log('🔄 Testing full CSV processing...');
    
    const result = await csvProcessor.processCSV(
      parseResult.data,
      testCategories,
      2025, // year
      1     // month
    );
    
    console.log('✅ CSV processing completed!');
    console.log('📈 Results summary:');
    console.log('  - Operations processed:', result.operations?.length || 0);
    console.log('  - Currencies found:', result.summary?.currenciesFound || []);
    console.log('  - Total PLN amount:', result.summary?.totalPLNAmount || 0);
    console.log('  - Method:', result.summary?.categorizationMethod || 'unknown');
    
    if (result.operations && result.operations.length > 0) {
      console.log('🔍 First operation details:');
      const firstOp = result.operations[0];
      console.log('  - Description:', firstOp.description);
      console.log('  - Amount:', firstOp.amount);
      console.log('  - Currency:', firstOp.currency);
      console.log('  - Amount PLN:', firstOp.amount_pln);
      console.log('  - Exchange Rate:', firstOp.exchange_rate);
      console.log('  - Category:', firstOp.category);
    }
    
    return true;
    
  } catch (error) {
    console.error('❌ CSV Handler test failed:', error.message);
    console.error('Stack:', error.stack);
    return false;
  }
}

// Запускаем тест
testCSVHandler()
  .then(success => {
    console.log(`\n🎯 Test result: ${success ? 'PASSED' : 'FAILED'}`);
    process.exit(success ? 0 : 1);
  })
  .catch(error => {
    console.error('Test execution failed:', error);
    process.exit(1);
  });
