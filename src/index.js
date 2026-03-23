const express = require('express');
const cron = require('node-cron');
const path = require('path');
const config = require('../config/config');
const { getDashboardData, insertArticle } = require('./db/database');
const { analyzePending } = require('./analyzer/llm');
const { setupBotCommands } = require('./notifier/telegram');
const { fetchRealStockNews } = require('./crawler/news');
const { triggerDailyConsolidatedReport } = require('./notifier/notifier');
const { runAutoBackup } = require('./reporter/exporter');

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
 * 核心數據爬取 (實時)
 */
async function crawlRealData() {
  console.log('[Crawler] 開始爬取全球即時監控目標...');
  for (const stock of config.stocks) {
    console.log(`[Crawler] 正在搜尋 ${stock.symbol} 的最新資訊...`);
    const articles = await fetchRealStockNews(stock.symbol);
    for (const article of articles) {
      await insertArticle(article);
    }
  }
  console.log('[Crawler] 全球實時爬取完成');
}

/**
 * 完整執行流程: 爬取 -> 分析
 */
async function runFullProcess() {
  await crawlRealData();
  await analyzePending();
}

/**
 * 發送每日日報
 */
async function runDailyReport() {
  console.log('[Report] 正在生成每日總結日報...');
  try {
    const data = await getDashboardData();
    await triggerDailyConsolidatedReport(data);
    console.log('[Report] 每日日報發送完成');
  } catch (err) {
    console.error(`[Report] 每日日報發送失敗: ${err.message}`);
  }
}

// 排程設定
// 1. 每日定時爬取與分析 (06:00)
cron.schedule(config.scheduler.dailyCrawl, async () => {
  console.log('[Schedule] 開始每日例行分析...');
  await runFullProcess();
});

// 2. 每日定時發送總結日報 (09:00)
cron.schedule(config.scheduler.dailyReport, async () => {
  console.log('[Schedule] 觸發每日定時日報...');
  await runDailyReport();
});

// 3. 每日凌晨自動備份 (02:00) - GitHub + Obsidian
cron.schedule(config.scheduler.backupTime, async () => {
  console.log('[Schedule] 執行自動備份流程...');
  await runAutoBackup();
});

// 4. 戰時快門模式 (15分鐘)
cron.schedule(config.scheduler.warModInterval, async () => {
  console.log('[Schedule] 戰時快門檢查中...');
  await analyzePending();
});

// 啟動伺服器
const PORT = config.port || 3001;
app.listen(PORT, () => {
  console.log(`
  ══════════════════════════════════════════
  🚀 StockRadar v1.3 - 雙效備份與日報增強版
  📍 戰績匯報伺服器: http://localhost:${PORT}
  📬 每日日報: ${config.scheduler.dailyReport}
  📦 自動備份: ${config.scheduler.backupTime} (Git + Obsidian)
  ══════════════════════════════════════════
  `);

  if (process.argv.includes('--run-once')) {
    (async () => {
      console.log('[Main] 執行即時監控、分析與備份測試...');
      await runFullProcess();
      await runDailyReport();
      await runAutoBackup();
    })();
  }
});
