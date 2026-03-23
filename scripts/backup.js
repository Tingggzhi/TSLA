const { runAutoBackup } = require('../src/reporter/exporter');

async function main() {
  await runAutoBackup();
  console.log('[Manual Backup] 已手動強制執行備份與同步程序。');
  process.exit(0);
}

main();
