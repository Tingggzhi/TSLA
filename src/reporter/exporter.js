const { getDashboardData } = require('../db/database');
const fs = require('fs');
const path = require('path');
const ejs = require('ejs');
const { execSync } = require('child_process');

/**
 * 執行核心備份邏輯 (GitHub + Obsidian + GitHub Pages Static Export)
 */
async function runAutoBackup() {
  console.log('--- 🛡️ 啟動自動化備份流程 (GitHub + Obsidian + Static Snapshot) ---');
  
  try {
    const stocks = await getDashboardData();
    if (stocks.length === 0) {
      console.warn('[Backup] 尚無可用數據，跳過本次備份。');
      return;
    }

    const now = new Date();
    const dateStr = now.toISOString().split('T')[0].replace(/-/g, '');
    const fileName = `Report_${dateStr}.md`;

    // 1. 生成 Markdown 內容
    let mdContent = `# 📊 TSLA 戰略資產日報 - ${now.toLocaleDateString()}\n\n`;
    mdContent += `*備份時間：${now.toLocaleString()}*\n\n`;
    mdContent += `| 標的 | 深度摘要 | 風險等級 | 心情 |\n| :--- | :--- | :--- | :--- |\n`;
    
    stocks.forEach(s => {
      const emoji = s.risk_level === 'Critical' ? '🔴' : (s.risk_level === 'High' ? '🟠' : '🟢');
      mdContent += `| **${s.symbol}** | ${s.summary || 'N/A'} | ${emoji} ${s.risk_level} | ${s.sentiment_score} |\n`;
    });

    // 2. 生成靜態 HTML 快照 (用於 GitHub Pages)
    // 渲染 EJS 模板成 index.html 文件
    const templatePath = path.join(__dirname, 'views/dashboard.ejs');
    const templateStr = fs.readFileSync(templatePath, 'utf8');
    const staticHtmlContent = ejs.render(templateStr, { stocks });
    
    // 寫入根目錄的 index.html
    const rootPath = path.join(__dirname, '../../');
    fs.writeFileSync(path.join(rootPath, 'index.html'), staticHtmlContent);
    console.log('[GitHub Pages] 已生成動態快照: index.html');

    // 3. 備份到本地專案 backups/
    const localBackupDir = path.join(__dirname, '../../backups');
    if (!fs.existsSync(localBackupDir)) fs.mkdirSync(localBackupDir);
    fs.writeFileSync(path.join(localBackupDir, fileName), mdContent);

    // 4. 備份到 Obsidian
    const obsidianPath = 'D:\\coding\\Obsidian\\TSLA';
    if (!fs.existsSync(obsidianPath)) {
      try {
        fs.mkdirSync(obsidianPath, { recursive: true });
        const obsidianFile = path.join(obsidianPath, fileName);
        fs.writeFileSync(obsidianFile, mdContent);
        console.log(`[Obsidian] 同步成功: ${obsidianPath}`);
      } catch (e) {
        console.warn('[Obsidian] 路徑可能不存在，略過: ', e.message);
      }
    } else {
        const obsidianFile = path.join(obsidianPath, fileName);
        fs.writeFileSync(obsidianFile, mdContent);
        console.log(`[Obsidian] 同步成功: ${obsidianPath}`);
    }

    // 5. GitHub Push (包含 index.html)
    try {
      execSync('git add .', { cwd: rootPath });
      execSync(`git commit -m "Auto-backup & Pages update: ${dateStr}"`, { cwd: rootPath });
      execSync('git push origin main', { cwd: rootPath });
      console.log('[GitHub] 推送成功，Pages 已在背景更新中');
    } catch (gitErr) {
      console.warn('[GitHub] 推送失敗 (可能無變動):', gitErr.message);
    }

  } catch (err) {
    console.error(`[Backup] 備份失敗: ${err.message}`);
  }
}

module.exports = { runAutoBackup };
