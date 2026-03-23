const axios = require('axios');
require('dotenv').config();

async function findChatId() {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  if (!token || token === 'your_telegram_bot_token_here') {
    console.error('❌ 請先在 .env 中填寫 TELEGRAM_BOT_TOKEN!');
    return;
  }

  console.log('🔍 正在從 Telegram 獲取最近更新 (請先發送一條訊息給您的機器人)...');
  try {
    const res = await axios.get(`https://api.telegram.org/bot${token}/getUpdates`);
    const updates = res.data.result;
    
    if (updates.length === 0) {
      console.warn('⚠️ 暫無消息。請先打開您的機器人聊天視窗並隨意發送一個訊息！');
      return;
    }

    console.log('\n✅ 找到以下聊天資訊：');
    console.log('════════════════════════════════════');
    updates.forEach(u => {
      const chat = u.message ? u.message.chat : u.channel_post.chat;
      const type = chat.type;
      const name = chat.first_name || chat.title || '未知';
      console.log(`👤 名稱: ${name} (${type})`);
      console.log(`🆔 Chat ID: ${chat.id}`);
      console.log('---------------------------');
    });
    console.log('════════════════════════════════════');
    console.log('💡 請將 ID 複製到 .env 的 TELEGRAM_CHAT_ID 欄位中。');
    
  } catch (err) {
    if (err.response && err.response.status === 404) {
      console.error('❌ Token 無效 (404)。請檢查 @BotFather 給您的 Token 是否正確。');
    } else {
      console.error(`❌ 出錯了: ${err.message}`);
    }
  }
}

findChatId();
