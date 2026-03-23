const { sendTelegramNotification } = require('../src/notifier/telegram');
require('dotenv').config();

async function test() {
  console.log('--- Telegram Bot 測試 ---');
  await sendTelegramNotification('🚀 這是來自 TSLA 戰情中心的測試訊息！如果您看到這條訊息，表示 Telegram Bot 已成功配置。');
}

test();
