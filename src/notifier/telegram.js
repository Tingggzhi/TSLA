const TelegramBot = require('node-telegram-bot-api');
const config = require('../../config/config');
const { getDashboardData } = require('../db/database');

// 初始化 Bot
let bot = null;
if (config.telegramBotToken && config.telegramBotToken !== 'your_telegram_bot_token_here') {
  // 對於主程序，我們讓它進入 polling 模式以接收消息
  bot = new TelegramBot(config.telegramBotToken, { polling: true });
}

/**
 * 格式化 Telegram 消息 (Markdown)
 */
function formatTelegramMessage(alert) {
  let message = `*📉 美股雷達 - 深度異動警報*\n`;
  message += `══════════════════\n`;
  message += `📍 *目標*：${alert.symbol} (${alert.name || alert.symbol})\n`;
  message += `⚠️ *風險預判*：${alert.riskLevel}\n`;
  message += `💬 *毒舌分析*：\n_${alert.summary}_\n`;
  message += `══════════════════\n`;
  return message;
}

/**
 * 發送消息
 */
async function sendTelegramNotification(message) {
  if (!bot || !config.telegramChatId || config.telegramChatId === 'your_telegram_chat_id_here') {
    return null;
  }
  try {
    await bot.sendMessage(config.telegramChatId, message, { parse_mode: 'Markdown' });
  } catch (err) {
    console.error(`[Telegram] 發送失敗: ${err.message}`);
  }
}

/**
 * 初始化機器人指令 (與用戶互動)
 */
function setupBotCommands() {
  if (!bot) return;

  console.log('[Telegram] 機器人互動指令模式已啟動...');

  // 監聽所有文字訊息
  bot.on('message', async (msg) => {
    const chatId = msg.chat.id;
    const text = msg.text;

    // 檢查是否為本人使用 (安全檢查)
    if (chatId.toString() !== config.telegramChatId.toString()) {
      console.warn(`[Telegram] 拒絕來自未授權用戶 ${chatId} 的訪問`);
      return;
    }

    if (!text) return;

    if (text.includes('今天') && text.includes('消息')) {
      await bot.sendMessage(chatId, '🔍 正在從戰情室調取最新分析報告...');
      try {
        const data = await getDashboardData();
        if (data.length === 0) {
          await bot.sendMessage(chatId, '📭 目前尚無分析數據，請稍後再試。');
          return;
        }

        let report = `*📊 今日深度監控摘要*\n══════════════════\n`;
        data.forEach(item => {
          const emoji = item.risk_level === 'Critical' ? '🔴' : (item.risk_level === 'High' ? '🟠' : '🟢');
          report += `${emoji} *${item.symbol}*\n`;
          report += `> 風險: ${item.risk_level}\n`;
          report += `> 分析: ${item.summary}\n\n`;
        });
        report += `══════════════════\n🔗 詳細資訊請查看戰情室 Web 面板`;

        await bot.sendMessage(chatId, report, { parse_mode: 'Markdown' });
      } catch (err) {
        await bot.sendMessage(chatId, '❌ 調取數據失敗: ' + err.message);
      }
    } else if (text === '/start' || text === '/status') {
      await bot.sendMessage(chatId, '🚀 *TSLA 戰情中心 Bot 已就緒*\n\n您可以問我：\n1. "今天有什麼新消息？"\n2. "/stocks" 查看監控清單', { parse_mode: 'Markdown' });
    } else if (text === '/stocks') {
      const stocksList = config.stocks.map(s => `• ${s.symbol} (${s.name})`).join('\n');
      await bot.sendMessage(chatId, `📌 *當前監控清單*：\n${stocksList}`, { parse_mode: 'Markdown' });
    }
  });
}

async function triggerTelegramAlert(alertData) {
  const stock = config.stocks.find(s => s.symbol === alertData.symbol) || { symbol: alertData.symbol, name: alertData.symbol };
  const message = formatTelegramMessage({
    symbol: stock.symbol,
    name: stock.name,
    riskLevel: alertData.riskLevel,
    summary: alertData.summary
  });
  await sendTelegramNotification(message);
}

module.exports = { triggerTelegramAlert, sendTelegramNotification, setupBotCommands };
