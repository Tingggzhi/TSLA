require('dotenv').config();

module.exports = {
  port: process.env.PORT || 3001,
  geminiApiKey: process.env.GEMINI_API_KEY,
  lineNotifyToken: process.env.LINE_NOTIFY_TOKEN,
  
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
    warModInterval: '*/15 * * * *' // 戰時快門模式：每 15 分鐘一次
  }
};
