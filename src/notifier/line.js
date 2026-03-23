const axios = require('axios');
const config = require('../../config/config');

/**
 * 格式化 LINE 消息
 */
function formatLineMessage(alert) {
  const publicUrl = process.env.PUBLIC_URL || 'https://tingggzhi.github.io/TSLA/';
  let text = `📉 美股雷達 - 深度異動警報\n`;
  text += `══════════════════\n`;
  text += `📍 目標：${alert.symbol} (${alert.name || alert.symbol})\n`;
  text += `⚠️ 風險預判：${alert.riskLevel}\n`;
  text += `💬 毒舌分析：${alert.summary}\n`;
  text += `══════════════════\n`;
  text += `🔗 查看實時戰術面板: ${publicUrl}`;
  return text;
}

/**
 * 發送 LINE 通知
 */
async function sendLineNotification(messageText) {
  if (!config.lineChannelAccessToken || config.lineChannelAccessToken === 'your_line_channel_access_token_here') {
    return null;
  }

  let endpoint = 'https://api.line.me/v2/bot/message/broadcast';
  let payload = {
    messages: [{ type: 'text', text: messageText }]
  };

  if (config.lineUserId && config.lineUserId !== 'your_line_user_id_here') {
    endpoint = 'https://api.line.me/v2/bot/message/push';
    payload.to = config.lineUserId;
  }

  try {
    await axios.post(endpoint, payload, {
      headers: {
        'Authorization': `Bearer ${config.lineChannelAccessToken}`,
        'Content-Type': 'application/json',
      },
    });
    console.log('[Line] 訊息發送成功');
  } catch (err) {
    console.error(`[Line] 發送失敗: ${err.message}`);
  }
}

async function triggerAlert(alertData) {
  const stock = config.stocks.find(s => s.symbol === alertData.symbol) || { symbol: alertData.symbol, name: alertData.symbol };
  const text = formatLineMessage({
    symbol: stock.symbol,
    name: stock.name,
    riskLevel: alertData.riskLevel,
    summary: alertData.summary
  });
  await sendLineNotification(text);
}

module.exports = { triggerAlert, sendLineNotification, formatLineMessage };
