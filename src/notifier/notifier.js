const { triggerAlert: triggerLineAlert, sendLineNotification, formatLineMessage } = require('./line');
const { triggerTelegramAlert, sendTelegramNotification, formatTelegramMessage } = require('./telegram');
require('dotenv').config();

const PUBLIC_URL = process.env.PUBLIC_URL || 'https://tingggzhi.github.io/TSLA/';

/**
 * 統一發送所有平台的警報
 */
async function triggerAllAlerts(alertData) {
  console.log(`[Notifier] 發送統一警報: ${alertData.symbol} (${alertData.riskLevel})`);
  
  // 分別使用各平台的格式化函數，確保 Markdown 正常工作
  const lineMsg = formatLineMessage({
    symbol: alertData.symbol,
    riskLevel: alertData.riskLevel,
    summary: alertData.summary
  });

  const tgMsg = formatTelegramMessage({
    symbol: alertData.symbol,
    riskLevel: alertData.riskLevel,
    summary: alertData.summary
  });

  await Promise.allSettled([
    sendLineNotification(lineMsg),
    sendTelegramNotification(tgMsg)
  ]);
}

/**
 * 發送每日總整日報
 */
async function triggerDailyConsolidatedReport(data) {
  if (!data || data.length === 0) return;

  let reportTitle = `📊 今日戰略中心 - 深度日報\n══════════════════\n`;
  let reportItems = '';
  
  data.forEach(item => {
    const risk = item.risk_level || 'Low';
    const emoji = risk === 'Critical' ? '🔴' : (risk === 'High' ? '🟠' : '🟢');
    reportItems += `${emoji} [${item.symbol}]\n> 分析: ${item.summary}\n\n`;
  });
  
  const footer = `══════════════════\n🔗 點擊查看實時戰術面板: ${PUBLIC_URL}`;
  
  const lineReport = reportTitle + reportItems + footer;
  
  // Telegram 需要轉義以支持 Markdown
  const tgReport = (reportTitle + reportItems + footer).replace(/_/g, '\\_');

  console.log('[Notifier] 發送每日總結日報...');
  await Promise.allSettled([
    sendLineNotification(lineReport),
    sendTelegramNotification(tgReport)
  ]);
}

module.exports = { triggerAllAlerts, triggerDailyConsolidatedReport };
