#!/usr/bin/env node

const fs = require('fs');
const FormData = require('form-data');
const fetch = require('node-fetch');

async function testCSVAPI() {
  console.log('🧪 Testing CSV API endpoint...');
  
  try {
    // Создаем form data
    const form = new FormData();
    form.append('file', fs.createReadStream('test-data.csv'));
    form.append('year', '2025');
    form.append('month', '1');
    
    console.log('📤 Sending request to /api/csv/analyze-csv...');
    
    const response = await fetch('http://localhost:3000/api/csv/analyze-csv', {
      method: 'POST',
      body: form,
      headers: form.getHeaders()
    });
    
    console.log('📥 Response status:', response.status);
    
    const result = await response.text();
    console.log('📄 Response:', result.substring(0, 500) + '...');
    
    if (response.ok) {
      const jsonResult = JSON.parse(result);
      if (jsonResult.success) {
        console.log('✅ API test PASSED!');
        console.log('📊 Operations processed:', jsonResult.operations?.length || 0);
        console.log('💱 Summary:', jsonResult.summary);
        return true;
      } else {
        console.log('❌ API returned error:', jsonResult.error);
        return false;
      }
    } else {
      console.log('❌ HTTP Error:', response.status);
      return false;
    }
    
  } catch (error) {
    console.error('❌ API test failed:', error.message);
    return false;
  }
}

// Проверяем что сервер запущен
fetch('http://localhost:3000/health')
  .then(res => res.json())
  .then(() => {
    console.log('✅ Server is running, testing CSV API...');
    return testCSVAPI();
  })
  .then(success => {
    console.log(`\n🎯 API Test result: ${success ? 'PASSED' : 'FAILED'}`);
    process.exit(success ? 0 : 1);
  })
  .catch(() => {
    console.log('❌ Server is not running on port 3000');
    console.log('💡 Run: node server.js first');
    process.exit(1);
  });
