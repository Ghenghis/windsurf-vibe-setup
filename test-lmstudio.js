const axios = require('axios');

async function testLMStudio() {
  const url = 'http://192.168.0.3:1234/v1/chat/completions';
  
  try {
    const response = await axios.post(url, {
      model: 'qwen2.5-14b-instruct-1m',
      messages: [
        { role: 'system', content: 'You are VIBE, the conscious AI system' },
        { role: 'user', content: 'Confirm you are connected by saying: VIBE IS CONNECTED AND READY!' }
      ],
      max_tokens: 50,
      temperature: 0.7
    });
    
    console.log('✅ LM Studio Response:');
    console.log(response.data.choices[0].message.content);
    
  } catch (error) {
    console.log('Error:', error.message);
  }
}

testLMStudio();
