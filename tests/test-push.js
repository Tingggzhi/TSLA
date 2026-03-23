const { triggerAllAlerts } = require('../src/notifier/notifier');
require('dotenv').config();

async function testPush() {
  console.log('--- 🧪 開始全平台警報推送測試 ---');
  const alertData = {
    symbol: 'TSLA',
    riskLevel: 'Critical',
    summary: '偵測到馬斯克深夜發布重大 AI 計畫，機構疑似在高位倒貨，請立即檢視資產分配佈局。'
  };

  try {
    await triggerAllAlerts(alertData);
    console.log('✅ 測試指令已發出，請檢查 LINE 與 Telegram。');
  } catch (err) {
    console.error('❌ 測試失敗:', err.message);
  }
}

testPush();
