#!/usr/bin/env node

/**
 * Integration testing script for PNL system API endpoints
 * Tests the actual server endpoints and data flow
 */

const http = require('http');
const https = require('https');
const fs = require('fs');
const path = require('path');

class IntegrationTester {
  constructor(baseURL = 'http://localhost:3000') {
    this.baseURL = baseURL;
    this.results = [];
    this.client = baseURL.startsWith('https') ? https : http;
  }

  async makeRequest(method, endpoint, data = null, headers = {}) {
    return new Promise((resolve, reject) => {
      const url = new URL(endpoint, this.baseURL);
      const options = {
        hostname: url.hostname,
        port: url.port || (url.protocol === 'https:' ? 443 : 80),
        path: url.pathname + url.search,
        method: method,
        headers: {
          'Content-Type': 'application/json',
          ...headers
        }
      };

      const req = this.client.request(options, (res) => {
        let responseData = '';
        
        res.on('data', (chunk) => {
          responseData += chunk;
        });
        
        res.on('end', () => {
          try {
            const parsedData = responseData ? JSON.parse(responseData) : null;
            resolve({
              statusCode: res.statusCode,
              headers: res.headers,
              data: parsedData
            });
          } catch (e) {
            resolve({
              statusCode: res.statusCode,
              headers: res.headers,
              data: responseData
            });
          }
        });
      });

      req.on('error', (err) => {
        reject(err);
      });

      req.setTimeout(10000, () => {
        req.destroy();
        reject(new Error('Request timeout'));
      });

      if (data) {
        req.write(JSON.stringify(data));
      }

      req.end();
    });
  }

  async testHealthEndpoint() {
    console.log('🏥 Testing health endpoint...');
    try {
      const response = await this.makeRequest('GET', '/health');
      const success = response.statusCode === 200;
      console.log(`  ${success ? '✅' : '❌'} Health check: ${response.statusCode}`);
      return { test: 'health', success, statusCode: response.statusCode };
    } catch (error) {
      console.log(`  ❌ Health check failed: ${error.message}`);
      return { test: 'health', success: false, error: error.message };
    }
  }

  async testConfigEndpoint() {
    console.log('⚙️  Testing config endpoint...');
    try {
      const response = await this.makeRequest('GET', '/api/config');
      const success = response.statusCode === 200 && response.data;
      console.log(`  ${success ? '✅' : '❌'} Config endpoint: ${response.statusCode}`);
      if (response.data) {
        console.log(`  📋 Google Client ID present: ${!!response.data.googleClientId}`);
      }
      return { test: 'config', success, statusCode: response.statusCode };
    } catch (error) {
      console.log(`  ❌ Config endpoint failed: ${error.message}`);
      return { test: 'config', success: false, error: error.message };
    }
  }

  async testCategoriesEndpoint() {
    console.log('📁 Testing categories endpoint...');
    try {
      // Test GET categories (should work in dev mode or require auth)
      const response = await this.makeRequest('GET', '/api/categories');
      const success = response.statusCode === 200 || response.statusCode === 401;
      console.log(`  ${success ? '✅' : '❌'} Categories GET: ${response.statusCode}`);
      
      if (response.statusCode === 200 && response.data) {
        console.log(`  📊 Categories returned: ${response.data.count || 0} items`);
      } else if (response.statusCode === 401) {
        console.log(`  🔒 Authentication required (expected in production)`);
      }
      
      return { test: 'categories-get', success, statusCode: response.statusCode };
    } catch (error) {
      console.log(`  ❌ Categories endpoint failed: ${error.message}`);
      return { test: 'categories-get', success: false, error: error.message };
    }
  }

  async testCsvEndpoint() {
    console.log('📊 Testing CSV endpoint...');
    try {
      // Test CSV endpoint without file (should return 400)
      const response = await this.makeRequest('POST', '/api/csv/analyze-csv', {
        year: 2025,
        month: 1
      });
      
      // We expect 400 for missing file or 401 for auth required
      const success = response.statusCode === 400 || response.statusCode === 401;
      console.log(`  ${success ? '✅' : '❌'} CSV endpoint structured: ${response.statusCode}`);
      
      if (response.statusCode === 400) {
        console.log(`  📄 Endpoint expects file upload (correct)`);
      } else if (response.statusCode === 401) {
        console.log(`  🔒 Authentication required (expected in production)`);
      }
      
      return { test: 'csv-endpoint', success, statusCode: response.statusCode };
    } catch (error) {
      console.log(`  ❌ CSV endpoint failed: ${error.message}`);
      return { test: 'csv-endpoint', success: false, error: error.message };
    }
  }

  async testStaticFiles() {
    console.log('📄 Testing static file serving...');
    try {
      const response = await this.makeRequest('GET', '/');
      const success = response.statusCode === 200;
      console.log(`  ${success ? '✅' : '❌'} Index page: ${response.statusCode}`);
      
      return { test: 'static-files', success, statusCode: response.statusCode };
    } catch (error) {
      console.log(`  ❌ Static files test failed: ${error.message}`);
      return { test: 'static-files', success: false, error: error.message };
    }
  }

  async runAllTests() {
    console.log(`🚀 Starting Integration Tests for: ${this.baseURL}\n`);

    const tests = [
      this.testHealthEndpoint(),
      this.testConfigEndpoint(), 
      this.testCategoriesEndpoint(),
      this.testCsvEndpoint(),
      this.testStaticFiles()
    ];

    const results = await Promise.all(tests);
    this.results = results;

    console.log('\n📊 Integration Test Results:');
    console.log('============================');
    
    results.forEach(result => {
      const status = result.success ? '✅ PASS' : '❌ FAIL';
      console.log(`${status} ${result.test}: ${result.statusCode || 'ERROR'}`);
      if (result.error) {
        console.log(`    Error: ${result.error}`);
      }
    });

    const allPassed = results.every(result => result.success);
    const serverResponsive = results.some(result => 
      result.statusCode && result.statusCode !== 0 && !result.error
    );

    console.log(`\n🎯 Overall Assessment:`);
    console.log(`   Server Responsive: ${serverResponsive ? '✅ YES' : '❌ NO'}`);
    console.log(`   All Tests Passed: ${allPassed ? '✅ YES' : '❌ NO'}`);

    if (serverResponsive) {
      console.log('\n✨ Server is running and responding to requests!');
      console.log('💡 Run the server with: npm run dev:local (for testing without auth)');
    } else {
      console.log('\n⚠️  Server may not be running or accessible.');
      console.log('💡 Start server with: npm start or npm run dev:local');
    }

    return { allPassed, serverResponsive, results };
  }
}

async function main() {
  const baseURL = process.argv[2] || 'http://localhost:3000';
  const tester = new IntegrationTester(baseURL);
  
  try {
    await tester.runAllTests();
  } catch (error) {
    console.error('❌ Integration tests failed:', error.message);
    process.exit(1);
  }
}

// Run tests if this script is executed directly
if (require.main === module) {
  main();
}

module.exports = IntegrationTester;
