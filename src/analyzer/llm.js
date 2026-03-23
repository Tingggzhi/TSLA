const axios = require('axios');
const config = require('../../config/config');
const { insertAnalysis, getPendingArticles } = require('../db/database');
const { triggerAllAlerts } = require('../notifier/notifier');

const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-pro:generateContent';

/**
 * 建立分析 Prompt
 */
function buildStockPrompt(article, stock) {
  return `你是一位頂尖美股對沖基金空頭經理兼地緣政治策略家。對「${stock.name} (${stock.symbol})」的新聞進行分析。
  
  ===== 待分析內容 =====
  來源：${article.source}
  標題：${article.title}
  內容主旨：${(article.content || '').slice(0, 1500)}
  
  ===== 深度分析要求 =====
  1. **核心洞察**：剝離表面利多，指出這篇新聞背後可能隱藏的財務陷阱或機構倒貨跡象。
  2. **戰場局勢**：結合當前宏觀背景（利率、地緣衝突），判定該股未來 3 個月最脆弱的環節。
  3. **風險分析**：Fear (0~-5) 或 Greed (0~+5)。
  4. **毒舌摘要**：請用不超過 40 字的嘲諷、尖銳、但具備極高執行參考價值的內容進行總結。
  
  請回應 JSON 格式：
  {
    "sentimentScore": -5到5,
    "riskLevel": "Low|Medium|High|Critical",
    "isManipulated": true/false,
    "summary": "嘲諷且精準的總結內容"
  }`;
}

/**
 * 使用 Gemini API 分析 (含 429 重試邏輯)
 */
async function analyzeWithGemini(article, retryCount = 0) {
  if (!config.geminiApiKey || config.geminiApiKey === 'your_gemini_api_key_here') {
    return null;
  }

  const stock = config.stocks.find(s => s.symbol === article.symbol) || { symbol: article.symbol, name: article.symbol };
  const prompt = buildStockPrompt(article, stock);

  try {
    const res = await axios.post(GEMINI_API_URL, {
      contents: [{ parts: [{ text: prompt }] }]
    }, {
      params: { key: config.geminiApiKey },
      headers: { 'Content-Type': 'application/json' }
    });

    const textOutput = res.data.candidates[0].content.parts[0].text;
    const cleanJson = textOutput.replace(/```json|```/g, '').trim();
    return JSON.parse(cleanJson);
  } catch (err) {
    if (err.response && err.response.status === 429 && retryCount < 2) {
      console.warn(`[LLM] 觸發頻率限制 (429)，等待 60 秒後進行第 ${retryCount + 1} 次重試...`);
      await new Promise(r => setTimeout(r, 60000));
      return analyzeWithGemini(article, retryCount + 1);
    }
    console.error(`[LLM] Gemini 分析 (${article.symbol}) 失敗: ${err.message}`);
    return null;
  }
}

/**
 * 批次處理待分析文章
 */
async function analyzePending() {
  console.log('[LLM] 準備處理待分析文章...');
  const pending = await getPendingArticles();
  
  if (pending.length === 0) {
    console.log('[LLM] 尚無待處理內容');
    return;
  }

  console.log(`[LLM] 發現 ${pending.length} 篇新內容，開始分析...`);
  
  for (const article of pending) {
    const analysis = await analyzeWithGemini(article);
    
    if (analysis) {
      // 寫入分析結果 (符合 database.js 的 insertAnalysis 結構)
      await insertAnalysis({
        article_id: article.id,
        sentiment_score: analysis.sentimentScore,
        risk_level: analysis.riskLevel,
        is_manipulated: analysis.isManipulated,
        summary: analysis.summary
      });
      
      // 若風險等級達 Critical/High 則觸發即時警報
      if (['Critical', 'High'].includes(analysis.riskLevel)) {
        await triggerAllAlerts({
          symbol: article.symbol,
          riskLevel: analysis.riskLevel,
          summary: analysis.summary
        });
      }
      
      // 成功後延遲 5 秒，減緩 API 壓力
      await new Promise(r => setTimeout(r, 5000));
    }
  }
  console.log('[LLM] 批次分析完成');
}

module.exports = { analyzePending };
