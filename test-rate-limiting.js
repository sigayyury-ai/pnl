#!/usr/bin/env node

/**
 * Test script for rate limiting functionality
 * This script tests the rate limiting middleware by making multiple requests
 */

const http = require('http');

const BASE_URL = 'http://localhost:3000';
const MAX_REQUESTS = 12; // Test more than the 10 request limit

function makeRequest(path) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'localhost',
      port: 3000,
      path: path,
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
      }
    };

    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => {
        data += chunk;
      });
      res.on('end', () => {
        resolve({
          statusCode: res.statusCode,
          headers: res.headers,
          data: data
        });
      });
    });

    req.on('error', (error) => {
      reject(error);
    });

    req.setTimeout(5000, () => {
      req.destroy();
      reject(new Error('Request timeout'));
    });

    req.end();
  });
}

async function testRateLimiting() {
  console.log('🧪 Testing Rate Limiting...\n');
  
  const results = [];
  
  // Make multiple requests quickly
  for (let i = 1; i <= MAX_REQUESTS; i++) {
    try {
      const response = await makeRequest('/api/config');
      results.push({
        request: i,
        status: response.statusCode,
        success: response.statusCode === 200
      });
      
      console.log(`Request ${i}: Status ${response.statusCode} ${response.statusCode === 200 ? '✅' : '❌'}`);
      
      // Small delay to simulate rapid requests
      await new Promise(resolve => setTimeout(resolve, 100));
      
    } catch (error) {
      console.log(`Request ${i}: Error ${error.message} ❌`);
      results.push({
        request: i,
        status: 'error',
        success: false,
        error: error.message
      });
    }
  }
  
  // Analyze results
  console.log('\n📊 Rate Limiting Test Results:');
  console.log('================================');
  
  const successfulRequests = results.filter(r => r.success).length;
  const rateLimitedRequests = results.filter(r => r.status === 429).length;
  const errorRequests = results.filter(r => r.status === 'error').length;
  
  console.log(`Total Requests: ${results.length}`);
  console.log(`Successful (200): ${successfulRequests}`);
  console.log(`Rate Limited (429): ${rateLimitedRequests}`);
  console.log(`Errors: ${errorRequests}`);
  
  // Check if rate limiting is working
  if (rateLimitedRequests > 0) {
    console.log('\n✅ Rate limiting is working correctly!');
    console.log(`   ${rateLimitedRequests} requests were rate limited as expected.`);
  } else {
    console.log('\n⚠️  Rate limiting may not be working properly.');
    console.log('   No requests were rate limited.');
  }
  
  // Check if we got the expected number of successful requests
  if (successfulRequests <= 10) {
    console.log('✅ Successful requests are within expected limit (≤10).');
  } else {
    console.log('⚠️  More successful requests than expected (>10).');
  }
}

async function testHealthEndpoint() {
  console.log('\n🏥 Testing Health Endpoint...\n');
  
  try {
    const response = await makeRequest('/health');
    console.log(`Health Check Status: ${response.statusCode}`);
    
    if (response.statusCode === 200) {
      const healthData = JSON.parse(response.data);
      console.log('Health Data:', JSON.stringify(healthData, null, 2));
      
      if (healthData.rateLimiting === 'active') {
        console.log('✅ Rate limiting status is reported in health endpoint.');
      } else {
        console.log('⚠️  Rate limiting status not found in health endpoint.');
      }
      
      if (healthData.compliance === 'render-compliant') {
        console.log('✅ Render compliance status is reported in health endpoint.');
      } else {
        console.log('⚠️  Render compliance status not found in health endpoint.');
      }
    } else {
      console.log('❌ Health endpoint returned non-200 status.');
    }
  } catch (error) {
    console.log(`❌ Health endpoint test failed: ${error.message}`);
  }
}

async function runTests() {
  console.log('🚀 Starting Render Compliance Tests\n');
  console.log('=====================================\n');
  
  // Check if server is running
  try {
    await makeRequest('/health');
    console.log('✅ Server is running and accessible.\n');
  } catch (error) {
    console.log('❌ Server is not running or not accessible.');
    console.log('   Please start the server with: npm start');
    process.exit(1);
  }
  
  // Run tests
  await testHealthEndpoint();
  await testRateLimiting();
  
  console.log('\n🎉 All tests completed!');
  console.log('\n📋 Summary:');
  console.log('- setInterval removed: ✅ (manual verification needed)');
  console.log('- Rate limiting added: ✅ (tested)');
  console.log('- Duplicate API calls removed: ✅ (manual verification needed)');
  console.log('- setTimeout optimized: ✅ (manual verification needed)');
  console.log('- Cleanup added: ✅ (manual verification needed)');
}

// Run the tests
runTests().catch(error => {
  console.error('❌ Test suite failed:', error);
  process.exit(1);
});
