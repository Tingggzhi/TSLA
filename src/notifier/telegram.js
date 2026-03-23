const TelegramBot = require('node-telegram-bot-api');
const config = require('../../config/config');
const { getDashboardData } = require('../db/database');

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

/**
 * 初始化機器人指令 (與用戶互動)
 */
function setupBotCommands() {
  if (!bot) return;

  bot.on('message', async (msg) => {
    const chatId = msg.chat.id;
    const text = msg.text;
    if (chatId.toString() !== config.telegramChatId.toString()) return;

    if (text && text.includes('今天') && text.includes('消息')) {
      await bot.sendMessage(chatId, '🔍 探索中...');
      try {
        const data = await getDashboardData();
        if (data.length === 0) {
          await bot.sendMessage(chatId, '📭 目前尚無數據。');
          return;
        }
        let report = `*📊 今日戰略導航*\n══════════════════\n`;
        data.forEach(item => {
           report += `• *${item.symbol}*: ${item.risk_level}\n> ${item.summary}\n\n`;
        });
        const publicUrl = process.env.PUBLIC_URL || 'https://tingggzhi.github.io/TSLA/';
        report += `══════════════════\n🔗 [查看完整旗艦面板](${publicUrl.replace(/_/g, '\\_')})`;
        await bot.sendMessage(chatId, report, { parse_mode: 'Markdown' });
      } catch (err) {
        await bot.sendMessage(chatId, '❌ 失敗: ' + err.message);
      }
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

module.exports = { triggerTelegramAlert, sendTelegramNotification, formatTelegramMessage, setupBotCommands };
