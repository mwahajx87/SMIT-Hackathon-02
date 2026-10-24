import 'dotenv/config';

const apiKey = process.env.AI_API_KEY;
const model  = process.env.AI_MODEL || 'gemini-2.0-flash';
const baseUrl = (process.env.AI_BASE_URL || 'https://generativelanguage.googleapis.com/v1beta/openai').replace(/\/$/, '');

console.log('--- Gemini API Diagnostic ---');
console.log('Key prefix :', apiKey ? apiKey.slice(0, 8) + '...' : '(empty)');
console.log('Model      :', model);
console.log('Base URL   :', baseUrl);
console.log('');

if (!apiKey) {
  console.error('❌ AI_API_KEY is empty. Set it in .env and restart.');
  process.exit(1);
}

try {
  const res = await fetch(`${baseUrl}/chat/completions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`
    },
    body: JSON.stringify({
      model,
      messages: [{ role: 'user', content: 'Say OK' }],
      max_tokens: 5
    })
  });

  const body = await res.text();
  console.log('HTTP Status:', res.status);
  console.log('Response   :', body);

  if (res.ok) {
    console.log('\n✅ API key and model are working correctly!');
  } else {
    console.log('\n❌ Request failed. See response above for details.');
  }
} catch (err) {
  console.error('❌ Network error:', err.message);
}
