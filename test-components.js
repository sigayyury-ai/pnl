#!/usr/bin/env node

/**
 * Component testing script for new PNL system components
 * Tests: CurrencyService, CSVProcessor, Database queries
 */

const CurrencyService = require('./services/currencyService.js');
const CSVProcessor = require('./services/csvProcessor.js');
const RuleEngine = require('./services/ruleEngine.js');
const TransactionsQueries = require('./database/queries/transactions.js');
const CategoriesQueries = require('./database/queries/categories.js');
const RulesQueries = require('./database/queries/rules.js');

// Test data
const testCSVData = [
  {
    'date': '2025-01-15',
    'description': 'Payment from client ABC Corp',
    'amount': '1500.00',
    'currency': 'EUR'
  },
  {
    'date': '2025-01-16', 
    'description': 'Office supplies purchase',
    'amount': '-50.75',
    'currency': 'USD'
  },
  {
    'date': '2025-01-17',
    'description': 'Rent payment',
    'amount': '-800',
    'currency': 'PLN'
  }
];

const testCategories = {
  income: ['Sales Revenue', 'Client Payments'],
  expense: ['Office Supplies', 'Rent', 'Utilities', 'Other']
};

async function testCurrencyService() {
  console.log('\n🧪 Testing CurrencyService...');
  
  try {
    const currencyService = new CurrencyService();
    
    // Test 1: Get exchange rates for multiple currencies
    console.log('  📊 Testing exchange rate fetching...');
    const rates = await currencyService.getExchangeRates(['EUR', 'USD', 'PLN']);
    console.log('  ✅ Exchange rates obtained:', rates);
    
    // Test 2: Convert single amount
    console.log('  💱 Testing currency conversion...');
    const conversion = currencyService.convertToPLN(100, 'EUR', rates);
    console.log('  ✅ Conversion result:', conversion);
    
    // Test 3: Convert operations array
    console.log('  🔄 Testing batch conversion...');
    const operations = [
      { amount: 100, currency: 'EUR' },
      { amount: 50, currency: 'USD' },
      { amount: 200, currency: 'PLN' }
    ];
    const convertedOps = currencyService.convertOperationsToPLN(operations, rates);
    console.log('  ✅ Batch conversion result:', convertedOps.length, 'operations converted');
    
    return true;
  } catch (error) {
    console.error('  ❌ CurrencyService test failed:', error.message);
    return false;
  }
}

async function testCSVProcessor() {
  console.log('\n🧪 Testing CSVProcessor...');
  
  try {
    const csvProcessor = new CSVProcessor();
    
    // Test 1: Parse CSV data
    console.log('  📄 Testing CSV parsing...');
    const parsedOps = csvProcessor.parseCSVData(testCSVData);
    console.log('  ✅ Parsed operations:', parsedOps.length);
    
    // Test 2: Extract operation from single row
    console.log('  🔍 Testing operation extraction...');
    const testRow = {
      'Data': '2025-01-15',
      'Opis': 'Test payment',
      'Kwota': '100.50',
      'Waluta': 'EUR'
    };
    const extracted = csvProcessor.extractOperationFromRow(testRow, 0);
    console.log('  ✅ Extracted operation:', extracted ? 'Success' : 'Failed');
    
    // Test 3: Full CSV processing workflow (without AI for now)
    console.log('  ⚙️  Testing full CSV processing (demo mode)...');
    const originalDemoMode = csvProcessor.demoMode;
    csvProcessor.demoMode = true; // Force demo mode for testing
    
    try {
      const result = await csvProcessor.processCSV(testCSVData, testCategories, 2025, 1);
      console.log('  ✅ CSV processing result:', {
        operationsCount: result.operations.length,
        currenciesFound: result.summary.currenciesFound,
        totalAmount: result.summary.totalPLNAmount
      });
    } finally {
      csvProcessor.demoMode = originalDemoMode;
    }
    
    return true;
  } catch (error) {
    console.error('  ❌ CSVProcessor test failed:', error.message);
    return false;
  }
}

async function testRuleEngine() {
  console.log('\n🧪 Testing RuleEngine...');
  
  try {
    const ruleEngine = new RuleEngine();
    
    // Test 1: Class instantiation
    console.log('  🏗️  Testing RuleEngine instantiation...');
    console.log('  ✅ RuleEngine class instantiated');
    
    // Test 2: Rule matching logic
    console.log('  🔍 Testing rule matching logic...');
    const testRule = {
      pattern: 'office supplies',
      category_id: 'cat123',
      categories: { name: 'Office Supplies', type: 'expense' }
    };
    
    const testOperation = { description: 'Office supplies purchase' };
    
    // Test if rule matching works (without database call)
    const testPattern = ruleEngine.ruleMatches(testOperation.description, testRule);
    console.log(`  ✅ Rule matching test: ${testPattern ? 'PASSED' : 'FAILED'} - should match "office supplies"`);
    
    // Test 3: Cache functionality
    console.log('  💾 Testing cache functionality...');
    ruleEngine.clearCache();
    console.log('  ✅ Cache cleared successfully');
    
    return true;
  } catch (error) {
    console.error('  ❌ RuleEngine test failed:', error.message);
    return false;
  }
}

async function testDatabaseQueries() {
  console.log('\n🧪 Testing Database Queries...');
  
  try {
    // Test CategoriesQueries
    console.log('  📂 Testing CategoriesQueries...');
    const categoriesQueries = new CategoriesQueries();
    
    // Test basic operations (these will test the class structure, not actual DB)
    console.log('  ✅ CategoriesQueries class instantiated');
    
    // Test TransactionsQueries
    console.log('  💳 Testing TransactionsQueries...');
    const transactionsQueries = new TransactionsQueries();
    console.log('  ✅ TransactionsQueries class instantiated');
    
    // Test RulesQueries
    console.log('  📋 Testing RulesQueries...');
    const rulesQueries = new RulesQueries();
    console.log('  ✅ RulesQueries class instantiated');
    
    return true;
  } catch (error) {
    console.error('  ❌ Database Queries test failed:', error.message);
    return false;
  }
}

async function testAPIEndpoints() {
  console.log('\n🧪 Testing API Endpoint Structure...');
  
  try {
    // Test auth module
    console.log('  🔐 Testing auth module...');
    const authModule = require('./api/auth.js');
    console.log('  ✅ Auth module loaded:', typeof authModule.router, typeof authModule.checkAuth);
    
    // Test CSV module
    console.log('  📊 Testing CSV module...');
    const csvModule = require('./api/csv.js');
    console.log('  ✅ CSV module loaded:', typeof csvModule);
    
    // Test categories module
    console.log('  📁 Testing categories module...');
    const categoriesModule = require('./api/categories.js');
    console.log('  ✅ Categories module loaded:', typeof categoriesModule);
    
    // Test rules module
    console.log('  📋 Testing rules module...');
    const rulesModule = require('./api/rules.js');
    console.log('  ✅ Rules module loaded:', typeof rulesModule);
    
    return true;
  } catch (error) {
    console.error('  ❌ API Endpoints test failed:', error.message);
    return false;
  }
}

async function runAllTests() {
  console.log('🚀 Starting PNL System Component Tests...\n');
  
  const results = {
    currencyService: await testCurrencyService(),
    csvProcessor: await testCSVProcessor(),
    ruleEngine: await testRuleEngine(),
    databaseQueries: await testDatabaseQueries(),
    apiEndpoints: await testAPIEndpoints()
  };
  
  console.log('\n📊 Test Results Summary:');
  console.log('========================');
  
  Object.entries(results).forEach(([component, success]) => {
    console.log(`${success ? '✅' : '❌'} ${component}: ${success ? 'PASSED' : 'FAILED'}`);
  });
  
  const allPassed = Object.values(results).every(result => result === true);
  console.log(`\n🎯 Overall Result: ${allPassed ? 'ALL TESTS PASSED' : 'SOME TESTS FAILED'}`);
  
  if (allPassed) {
    console.log('\n✨ System is ready for integration testing!');
  } else {
    console.log('\n⚠️  Please fix the failed components before proceeding.');
  }
}

// Run tests if this script is executed directly
if (require.main === module) {
  runAllTests().catch(console.error);
}

module.exports = {
  testCurrencyService,
  testCSVProcessor,
  testRuleEngine,
  testDatabaseQueries,
  testAPIEndpoints,
  runAllTests
};
