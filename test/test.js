const http = require('http');
const path = require('path');

// Path to our sample code directory
const samplePath = path.resolve(__dirname, 'sample');

/**
 * Make a GET request to the MCP server
 * @param {string} endpoint - The endpoint to call
 * @param {Object} params - Query parameters
 * @returns {Promise<Object>} - Response data
 */
function makeRequest(endpoint, params = {}) {
  return new Promise((resolve, reject) => {
    // Build query string
    const queryParams = new URLSearchParams(params).toString();
    const url = `http://localhost:3000/${endpoint}?${queryParams}`;
    
    console.log(`Making request to: ${url}`);
    
    // Set a timeout of 30 seconds
    const req = http.get(url, { timeout: 30000 }, (res) => {
      let data = '';
      
      // A chunk of data has been received
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      // The whole response has been received
      res.on('end', () => {
        console.log(`Response status: ${res.statusCode}`);
        
        try {
          // If it's JSON, parse it
          if (res.headers['content-type'].includes('application/json')) {
            resolve(JSON.parse(data));
          } else {
            // Otherwise return as string
            resolve(data);
          }
        } catch (error) {
          console.error('Error parsing response:', error);
          resolve(data); // Return raw data if parsing fails
        }
      });
    });
    
    req.on('error', (error) => {
      console.error(`Error making request: ${error.message}`);
      reject(error);
    });
    
    req.on('timeout', () => {
      console.error('Request timed out after 30 seconds');
      req.destroy();
      reject(new Error('Request timed out'));
    });
  });
}

/**
 * Run tests for the MCP server
 */
async function runTests() {
  console.log('=== TESTING MCP SERVER ===');
  
  try {
    // Test 1: Get functions (JSON format)
    console.log('\n--- Test 1: Get Functions (JSON) ---');
    const functionsJson = await makeRequest('get_functions', { path: samplePath });
    console.log('Functions found:', functionsJson.functions.length);
    console.log('Sample functions:');
    functionsJson.functions.slice(0, 3).forEach(func => {
      console.log(`- ${func.name} (${func.file}, line ${func.line})`);
    });
    
    // Test 2: Get functions (Table format)
    console.log('\n--- Test 2: Get Functions (Table) ---');
    const functionsTable = await makeRequest('get_functions', { path: samplePath, format: 'table' });
    console.log(functionsTable);
    
    // Test 3: Get classes (JSON format)
    console.log('\n--- Test 3: Get Classes (JSON) ---');
    const classesJson = await makeRequest('get_classes', { path: samplePath });
    console.log('Classes found:', classesJson.classes.length);
    console.log('Sample classes:');
    classesJson.classes.slice(0, 3).forEach(cls => {
      console.log(`- ${cls.name} (${cls.file}, line ${cls.line})`);
    });
    
    // Test 4: Get classes (Table format)
    console.log('\n--- Test 4: Get Classes (Table) ---');
    const classesTable = await makeRequest('get_classes', { path: samplePath, format: 'table' });
    console.log(classesTable);
    
    console.log('\n=== ALL TESTS COMPLETED SUCCESSFULLY ===');
  } catch (error) {
    console.error('\n=== TEST FAILED ===');
    console.error(error);
  }
}

// Run the tests
runTests();
