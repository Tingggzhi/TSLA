const { sendLineNotification } = require('../src/notifier/line');
require('dotenv').config();

async function test() {
  console.log('--- LINE Messaging API 連線測試 ---');
  const result = await sendLineNotification('🚀 您的美股雷達戰術中心已成功切換至 Messaging API！\n測試 User ID: ' + process.env.LINE_USER_ID);
  if (result) {
    console.log('✅ 連線成功！');
  } else {
    console.log('❌ 測試失敗，請檢查 Token 與 User ID 是否正確。');
  }
}

test();
