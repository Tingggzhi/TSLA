const { getDashboardData } = require('../src/db/database');
const fs = require('fs');
const path = require('path');
const ejs = require('ejs');
const { execSync } = require('child_process');

async function deployFix() {
  console.log('--- 🚀 啟動強制旗艦同步 (Force Deployment v11.0) ---');
  
  try {
    // 1. 讀取數據
    const stocks = await getDashboardData() || [];
    console.log(`[Data] 從資料庫讀取到 ${stocks.length} 筆資產分析數據。`);

    // 2. 準備範本與路徑
    const templatePath = path.join(__dirname, '../src/reporter/views/dashboard.ejs');
    const indexFile = path.join(__dirname, '../index.html');
    
    if (!fs.existsSync(templatePath)) {
      throw new Error(`範本文件不存在: ${templatePath}`);
    }

    const templateStr = fs.readFileSync(templatePath, 'utf8');
    
    // 3. 執行渲染 (加入錯誤捕捉於渲染層)
    console.log('[Render] 正在將範本轉換為靜態 HTML...');
    let html;
    try {
      html = ejs.render(templateStr, { stocks });
      console.log(`[Render] 渲染成功 (HTML 長度: ${html.length} 字符)`);
    } catch (renderErr) {
      console.error('[Render Error] EJS 渲染失敗，請檢查模板語法:', renderErr.message);
      process.exit(1);
    }

    // 4. 強制寫入文件
    fs.writeFileSync(indexFile, html, { encoding: 'utf8', flag: 'w' });
    console.log(`[FS] 已寫入根目錄: ${indexFile}`);

    // 5. 強制推送 GitHub
    try {
      console.log('[Git] 正在提交並推送到 GitHub...');
      execSync('git add index.html', { cwd: path.join(__dirname, '../') });
      execSync('git commit -m "Deploy: Perfect Port v11.0 Platinum Ultimate"', { cwd: path.join(__dirname, '../') });
      execSync('git push origin main', { cwd: path.join(__dirname, '../') });
      console.log('[GitHub] 部署成功！請檢查: https://tingggzhi.github.io/TSLA/');
    } catch (gitErr) {
      console.warn('[GitHub Warning] 推送可能無變動或失敗，但文件已在本地更新:', gitErr.message);
    }

  } catch (err) {
    console.error(`[Fatal Error] 修復失敗: ${err.message}`);
    process.exit(1);
  }
}

deployFix();
