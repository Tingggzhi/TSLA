const axios = require('axios');
const config = require('../../config/config');

/**
 * 格式化 LINE 消息
 * @param {Object} alert 
 */
function formatLineMessage(alert) {
  let text = `📉 美股雷達 - 深度異動警報\n`;
  text += `══════════════════\n`;
  text += `📍 目標：${alert.symbol} (${alert.name || alert.symbol})\n`;
  text += `⚠️ 風險預判：${alert.riskLevel}\n`;
  text += `💬 毒舌分析：${alert.summary}\n`;
  text += `══════════════════\n`;
  text += `⚡ 戰術策略：\n`;
  text += `1. 對照盤後/盤前股價跳空\n`;
  text += `2. 檢視分批建倉點`;
  return text;
}

/**
 * 發送 LINE 通知 (優先使用 Push 給特定用戶，若無則使用 Broadcast)
 * @param {String} messageText 
 */
async function sendLineNotification(messageText) {
  if (!config.lineChannelAccessToken || config.lineChannelAccessToken === 'your_line_channel_access_token_here') {
    console.warn('[Line] 未設定 Channel Access Token，跳過通知');
    return null;
  }

  // 判斷是使用 Push (指定對象) 還是 Broadcast (廣播給所有跟隨者)
  let endpoint = 'https://api.line.me/v2/bot/message/broadcast';
  let payload = {
    messages: [{ type: 'text', text: messageText }]
  };

  if (config.lineUserId && config.lineUserId !== 'your_line_user_id_here') {
    endpoint = 'https://api.line.me/v2/bot/message/push';
    payload.to = config.lineUserId;
    console.log(`[Line] 準備發送 Push 訊息至: ${config.lineUserId}`);
  } else {
    console.log('[Line] 未偵測到 User ID，改為發送 Broadcast 廣播');
  }

  try {
    const res = await axios.post(
      endpoint,
      payload,
      {
        headers: {
          'Authorization': `Bearer ${config.lineChannelAccessToken}`,
          'Content-Type': 'application/json',
        },
      }
    );
    console.log('[Line] 訊息發送成功');
    return res.data;
  } catch (err) {
    const errorMsg = err.response ? JSON.stringify(err.response.data) : err.message;
    console.error(`[Line] 發送失敗: ${errorMsg}`);
    return null;
  }
}

/**
 * 處理警報
 * @param {Object} alertData 
 */
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

module.exports = { triggerAlert, sendLineNotification };
