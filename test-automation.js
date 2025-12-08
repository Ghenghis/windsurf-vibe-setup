const { automateEverything } = require('./mcp-server/src/integrations/full-automation');

async function test() {
  console.log('Testing Full Automation System...');
  
  try {
    const result = await automateEverything(
      'Create a simple todo app with React and local storage'
    );
    console.log('Success!', result);
  } catch (error) {
    console.error('Test failed:', error.message);
  }
}

test();