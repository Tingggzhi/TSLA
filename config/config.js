require('dotenv').config();

module.exports = {
  port: process.env.PORT || 3001,
  geminiApiKey: process.env.GEMINI_API_KEY,
  lineChannelAccessToken: process.env.LINE_CHANNEL_ACCESS_TOKEN,
  lineUserId: process.env.LINE_USER_ID,
  tavilyApiKey: process.env.TAVILY_API_KEY,
  apifyToken: process.env.APIFY_TOKEN,
  telegramBotToken: process.env.TELEGRAM_BOT_TOKEN,
  telegramChatId: process.env.TELEGRAM_CHAT_ID,
  
  // 監控清單
  stocks: [
    { symbol: 'TSLA', name: '特斯拉', keywords: ['Elon Musk', 'Tesla', 'FSD', 'EV'] },
    { symbol: 'ZIM', name: '以星航運', keywords: ['ZIM', 'Freight rates', '运费', '紅海'] },
    { symbol: 'RACE', name: '法拉利', keywords: ['Ferrari', 'Luxury car', 'F1'] },
    { symbol: 'PLTR', name: 'Palantir', keywords: ['AIP', 'Alex Karp', 'PLTR', 'Government contract'] }
  ],
  // 排程設定：美股收盤後與盤前分析
  scheduler: {
    dailyCrawl: '0 6 * * *',   // 每天早上 6:00 (美股收盤後) 爬取
    dailyReport: '0 9 * * *',  // 每天早上 9:00 發送 LINE 摘要
    backupTime: '0 2 * * *',   // 每日凌晨 2:00 執行 GitHub + Obsidian 備份
    warModInterval: '*/15 * * * *' // 戰時快門模式：每 15 分鐘一次
  }
};
