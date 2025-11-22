// DeepSeek API 테스트 스크립트
const DEEPSEEK_API_KEY = 'sk-544bab27c2794528a5d8dfd9e8c9ab7d';

async function testDeepSeekAPI() {
  console.log('🔍 Testing DeepSeek API...\n');
  console.log('API Key:', DEEPSEEK_API_KEY.substring(0, 10) + '...');

  const testTexts = [
    'Hello, how are you?',
    'This is a test subtitle from a Udemy course.',
    'Machine learning is transforming the technology industry.'
  ];

  for (const text of testTexts) {
    console.log('\n' + '='.repeat(60));
    console.log(`Original text: "${text}"`);
    console.log('-'.repeat(60));

    try {
      const response = await fetch('https://api.deepseek.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${DEEPSEEK_API_KEY}`
        },
        body: JSON.stringify({
          model: 'deepseek-chat',
          messages: [
            {
              role: 'system',
              content: 'You are a professional translator. Translate the following text to Korean. Only respond with the translation, no additional text.'
            },
            {
              role: 'user',
              content: text
            }
          ],
          temperature: 0.3
        })
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.log(`❌ API Error (${response.status}):`, errorText);
        continue;
      }

      const data = await response.json();
      const translation = data.choices[0].message.content.trim();

      console.log(`✅ Translation: "${translation}"`);
      console.log(`✅ Model: ${data.model}`);
      console.log(`✅ Tokens used: ${data.usage.total_tokens}`);

    } catch (error) {
      console.log('❌ Error:', error.message);
    }
  }

  console.log('\n' + '='.repeat(60));
  console.log('🎉 DeepSeek API Test Completed!');
  console.log('='.repeat(60));
}

testDeepSeekAPI();
