#!/usr/bin/env node

/**
 * Простой скрипт для тестирования API после пробуждения Render сервиса
 * Можно использовать для "разогрева" заснувшего сервиса
 */

const https = require('https');
const http = require('http');

function testAPI(baseURL) {
  console.log(`🧪 Testing API at: ${baseURL}`);
  
  const testEndpoints = [
    '/health',
    '/api/categories',
    '/'
  ];
  
  testEndpoints.forEach((endpoint, index) => {
    setTimeout(() => {
      const url = `${baseURL}${endpoint}`;
      const client = url.startsWith('https') ? https : http;
      
      const req = client.get(url, (res) => {
        console.log(`✅ ${endpoint}: ${res.statusCode} ${res.statusMessage}`);
      });
      
      req.on('error', (err) => {
        console.log(`❌ ${endpoint}: ${err.message}`);
      });
      
      req.setTimeout(10000, () => {
        req.destroy();
        console.log(`⏰ ${endpoint}: Timeout`);
      });
    }, index * 1000); // 1 секунда между запросами
  });
}

// Использование: node test-api.js https://your-render-app.onrender.com
const baseURL = process.argv[2] || 'http://localhost:3000';
testAPI(baseURL);
