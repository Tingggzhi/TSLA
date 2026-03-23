const { triggerAlert: triggerLineAlert } = require('./line');
const { triggerTelegramAlert } = require('./telegram');

/**
 * 統一發送所有平台的警報
 * @param {Object} alertData 
 */
async function triggerAllAlerts(alertData) {
  console.log(`[Notifier] 觸發統一警報: ${alertData.symbol} (${alertData.riskLevel})`);
  
  // 同步執行，各自內部會處理 Token 是否存在的邏輯
  await Promise.allSettled([
    triggerLineAlert(alertData),
    triggerTelegramAlert(alertData)
  ]);
}

module.exports = { triggerAllAlerts };
