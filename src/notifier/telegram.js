const TelegramBot = require('node-telegram-bot-api');
const config = require('../../config/config');

// 初始化 Bot
let bot = null;
if (config.telegramBotToken && config.telegramBotToken !== 'your_telegram_bot_token_here') {
  bot = new TelegramBot(config.telegramBotToken, { polling: true });
}

/**
 * 格式化 Telegram 消息 (Markdown)
 */
function formatTelegramMessage(alert) {
  const publicUrl = (process.env.PUBLIC_URL || 'https://tingggzhi.github.io/TSLA/').replace(/_/g, '\\_');
  let message = `*📉 美股雷達 - 深度異動警報*\n`;
  message += `══════════════════\n`;
  message += `📍 *目標*：${alert.symbol} (${alert.name || alert.symbol})\n`;
  message += `⚠️ *風險預判*：${alert.riskLevel}\n`;
  message += `💬 *毒舌分析*：\n_${alert.summary.replace(/_/g, '\\_')}_\n`;
  message += `══════════════════\n`;
  message += `🔗 [點擊查看實時戰術面板](${publicUrl})\n`;
  return message;
}

/**
 * 發送消息
 */
async function sendTelegramNotification(message, isRaw = false) {
  if (!bot || !config.telegramChatId || config.telegramChatId === 'your_telegram_chat_id_here') {
    return null;
  }
  try {
    await bot.sendMessage(config.telegramChatId, message, { parse_mode: 'Markdown' });
  } catch (err) {
    console.error(`[Telegram] 發送失敗: ${err.message}`);
  }
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

module.exports = { triggerTelegramAlert, sendTelegramNotification, formatTelegramMessage };
