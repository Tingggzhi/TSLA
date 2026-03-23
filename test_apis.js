const axios = require('axios');
const config = require('./config/config');

async function testGemini() {
  console.log('--- Testing Gemini ---');
  if (!config.geminiApiKey) { console.log('❌ Gemini API Key missing'); return; }
  const URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${config.geminiApiKey}`;
  try {
    const res = await axios.post(URL, { contents: [{ parts: [{ text: "Hello, reply with 'Gemini OK'" }] }] });
    console.log('✅ Gemini Response:', res.data.candidates?.[0]?.content?.parts?.[0]?.text?.trim());
  } catch (err) {
    console.log('❌ Gemini Failed:', err.response?.data?.error?.message || err.message);
  }
}

async function testLineNotify() {
  console.log('\n--- Testing LINE Notify ---');
  if (!config.lineNotifyToken) { console.log('❌ LINE Notify Token missing'); return; }
  try {
    const res = await axios.post('https://notify-api.line.me/api/notify', 'message=API+Connection+Test+Success!', {
      headers: { 'Authorization': `Bearer ${config.lineNotifyToken}`, 'Content-Type': 'application/x-www-form-urlencoded' }
    });
    console.log('✅ LINE Notify Result:', res.data);
  } catch (err) {
    console.log('❌ LINE Notify Failed:', err.response?.data?.message || err.message);
  }
}

async function testTavily() {
  console.log('\n--- Testing Tavily ---');
  if (!config.tavilyApiKey) { console.log('❌ Tavily API Key missing'); return; }
  try {
    const res = await axios.post('https://api.tavily.com/search', { api_key: config.tavilyApiKey, query: 'latest stock news', search_depth: 'basic' });
    console.log('✅ Tavily Search:', res.data.results?.[0]?.title || 'No results');
  } catch (err) {
    console.log('❌ Tavily Failed:', err.response?.data?.detail || err.message);
  }
}

async function testApify() {
  console.log('\n--- Testing Apify ---');
  if (!config.apifyToken) { console.log('❌ Apify Token missing'); return; }
  try {
    const res = await axios.get('https://api.apify.com/v2/users/me', { headers: { 'Authorization': `Bearer ${config.apifyToken}` } });
    console.log('✅ Apify User:', res.data.data.username);
  } catch (err) {
    console.log('❌ Apify Failed:', err.response?.data?.error?.message || err.message);
  }
}

(async () => {
  await testGemini();
  await testLineNotify();
  await testTavily();
  await testApify();
})();
