import { defaultLLMClient } from './src/modules/ai/llm.client.js';

async function testClient() {
  const res = await defaultLLMClient.generate({
    systemPrompt: 'You are an HR assistant. Answer concisely.',
    messages: [{ role: 'user', content: 'What is the standard work grace period?' }]
  });
  console.log('LLMClient Status:', res.fallback ? 'FALLBACK' : 'SUCCESS');
  console.log('Answer:', res.answer || res.reason);
}

testClient();
