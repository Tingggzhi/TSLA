const express = require('express');
const cron = require('node-cron');
const path = require('path');
const config = require('../config/config');
const { getDashboardData, insertArticle } = require('./db/database');
const { analyzePending } = require('./analyzer/llm');
const { setupBotCommands } = require('./notifier/telegram');

// 啟動 Telegram 互動指令
setupBotCommands();

const app = express();
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'reporter/views'));
app.use(express.static(path.join(__dirname, 'reporter/public')));

// 戰情室路由
app.get('/', async (req, res) => {
  try {
    const stocks = await getDashboardData();
    res.render('dashboard', { stocks });
  } catch (err) {
    res.status(500).send('Database Error: ' + err.message);
  }
});

/**
 * 模擬爬蟲 (實際應用中可接入 Google News, X, 或財經 RSS)
 */
async function crawlMockData() {
  console.log('[Crawler] 開始爬取監控目標...');
  
  const mockArticles = [
    { symbol: 'TSLA', source: 'FinHub', title: 'Tesla price cuts in China continues!', content: 'Reports say Tesla is cutting prices again in the Chinese market to boost demand.', url: 'https://example.com/tsla-china' },
    { symbol: 'ZIM', source: 'FreightWaves', title: 'Red Sea tensions spike shipping rates.', content: 'Shipping rates are climbing as global tensions in the Red Sea disrupt trade routes.', url: 'https://example.com/zim-red-sea' },
    { symbol: 'RACE', source: 'FormulaOne', title: 'Ferrari earnings beat expectations.', content: 'Ferrari reported strong earnings growth driven by luxury model sales.', url: 'https://example.com/race-earnings' },
    { symbol: 'PLTR', source: 'Palantir News', title: 'Palantir wins new US Army contract.', content: 'Palantir AIP to be integrated into US Army logistics systems.', url: 'https://example.com/pltr-army' }
  ];

  for (const article of mockArticles) {
    await insertArticle(article);
  }
  console.log('[Crawler] 爬取完成');
}

/**
 * 完整執行流程: 爬取 -> 分析 -> (警報)
 */
async function runFullProcess() {
  await crawlMockData();
  await analyzePending();
}

// 排程設定
// 1. 每日定時爬取與分析 (依 config.scheduler.dailyCrawl)
cron.schedule(config.scheduler.dailyCrawl, async () => {
  console.log('[Schedule] 開始每日例行分析...');
  await runFullProcess();
});

// 2. 戰時快門模式 (測試用或緊急時)
cron.schedule(config.scheduler.warModInterval, async () => {
  console.log('[Schedule] 戰時快門檢查中...');
  // 可能只執行分析 pending
  await analyzePending();
});

// 啟動伺服器
const PORT = config.port || 3001;
app.listen(PORT, () => {
  console.log(`
  ══════════════════════════════════════════
  🚀 StockRadar v1.0 上線中
  📍 戰情室伺服器: http://localhost:${PORT}
  💻 入門監控: ${config.stocks.map(s => s.symbol).join(', ')}
  ══════════════════════════════════════════
  `);

  // 如果參數包含 --run-once，立即執行一次
  if (process.argv.includes('--run-once')) {
    (async () => {
      console.log('[Main] 立即執行一次完全監控...');
      await runFullProcess();
    })();
  }
});
