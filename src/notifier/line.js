const axios = require('axios');
const config = require('../../config/config');

/**
 * 格式化 LINE 消息
 * @param {Object} alert 
 */
function formatLineMessage(alert) {
  let message = `\n📉 美股雷達 - 深度異動警報`;
  message += `\n══════════════════`;
  message += `\n📍 目標：${alert.symbol} (${alert.name || alert.symbol})`;
  message += `\n⚠️ 風險預判：${alert.riskLevel}`;
  message += `\n💬 毒舌分析：${alert.summary}`;
  message += `\n══════════════════`;
  message += `\n⚡ 戰術策略：`;
  message += `\n1. 立即對照盤後/盤前股價跳空狀況`;
  message += `\n2. 若情緒達 Fear (-4)，檢視分批建倉點`;
  message += `\n3. 排除業配干擾，無視華爾街看多報告`;
  return message;
}

/**
 * 發送 LINE 通知
 * @param {String} message 
 */
async function sendLineNotify(message) {
  if (!config.lineNotifyToken || config.lineNotifyToken === 'your_line_notify_token_here') {
    console.warn('[Line] 未設定 Line Notify Token，跳過通知');
    return null;
  }

  try {
    const res = await axios.post(
      'https://notify-api.line.me/api/notify',
      `message=${encodeURIComponent(message)}`,
      {
        headers: {
          'Authorization': `Bearer ${config.lineNotifyToken}`,
          'Content-Type': 'application/x-www-form-urlencoded',
        },
      }
    );
    return res.data;
  } catch (err) {
    console.error(`[Line] 發送失敗: ${err.message}`);
    return null;
  }
}

/**
 * 處理警報
 * @param {Object} alertData 
 */
async function triggerAlert(alertData) {
  const stock = config.stocks.find(s => s.symbol === alertData.symbol) || { symbol: alertData.symbol, name: alertData.symbol };
  const message = formatLineMessage({
    symbol: stock.symbol,
    name: stock.name,
    riskLevel: alertData.riskLevel,
    summary: alertData.summary
  });
  
  await sendLineNotify(message);
}

module.exports = { triggerAlert, sendLineNotify };
