const axios = require('axios');
const config = require('../../config/config');
const { insertAnalysis, insertAlert, getPendingArticles } = require('../db/database');
const { triggerAllAlerts } = require('../notifier/notifier');

const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-pro:generateContent';

/**
 * 建立分析 Prompt
 * @param {Object} article 
 * @param {Object} stock 
 */
function buildStockPrompt(article, stock) {
  return `你是一位美股資深空頭兼商業策略師。請分析以下關於「${stock.name} (${stock.symbol})」的資訊。
  
  ===== 待分析內容 =====
  來源：${article.source}
  標題：${article.title}
  內容短評：${(article.content || '').slice(0, 1000)}
  
  ===== 分析要求 =====
  1. 拒絕美化，找出該股票未來 3-6 個月的潛在風險點 (ROI 壓力測試)。
  2. 判定情緒強度：Fear (0~-5) 或 Greed (0~+5)。
  3. 識別是否為「割韭菜業配文」或「機構倒貨文」。
  
  請回應 JSON 格式，不要有任何 Markdown 修飾：
  {
    "sentimentScore": -5到5,
    "riskLevel": "Low|Medium|High|Critical",
    "isManipulated": true/false,
    "summary": "30字以內毒舌摘要"
  }`;
}

/**
 * 使用 Gemini API 分析
 * @param {Object} article 
 */
async function analyzeWithGemini(article) {
  if (!config.geminiApiKey || config.geminiApiKey === 'your_gemini_api_key_here') {
    console.warn('[LLM] 未設定有效 Gemini API Key，跳過分析');
    return null;
  }

  //Find stock name from config
  const stock = config.stocks.find(s => s.symbol === article.symbol) || { symbol: article.symbol, name: article.symbol };

  try {
    const prompt = buildStockPrompt(article, stock);
    const res = await axios.post(
      `${GEMINI_API_URL}?key=${config.geminiApiKey}`,
      {
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: {
          temperature: 0.2, // 低溫確保結果穩定
          maxOutputTokens: 300,
          responseMimeType: 'application/json',
        },
      },
      {
        headers: { 'Content-Type': 'application/json' },
        timeout: 30000,
      }
    );

    const responseText = res.data.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!responseText) return null;

    return JSON.parse(responseText.trim());

  } catch (err) {
    console.error(`[LLM] Gemini 分析 (${article.symbol}) 失敗: ${err.message}`);
    return null;
  }
}

/**
 * 處理待分析文章
 */
async function analyzePending() {
  const pending = await getPendingArticles();
  console.log(`[LLM] 準備處理 ${pending.length} 篇待分析文章...`);

  for (const article of pending) {
    const analysis = await analyzeWithGemini(article);
    if (analysis) {
      await insertAnalysis({
        article_id: article.id,
        sentiment_score: analysis.sentimentScore,
        risk_level: analysis.riskLevel,
        is_manipulated: analysis.isManipulated,
        summary: analysis.summary
      });

      // 如果風險等級達到 Critical 或 High，觸發警報
      if (['Critical', 'High'].includes(analysis.riskLevel)) {
        const alertPayload = {
          symbol: article.symbol,
          riskLevel: analysis.riskLevel,
          summary: analysis.summary
        };

        await insertAlert({
          symbol: article.symbol,
          risk_level: analysis.riskLevel,
          message: `🚫 [${analysis.riskLevel}] ${article.symbol}: ${analysis.summary}`
        });

        // 送出即時通知 (LINE & Telegram)
        await triggerAllAlerts(alertPayload);
      }
      console.log(`[LLM] 已分析 [${analysis.riskLevel}] ${article.symbol}`);
    }
    // 限制頻率
    await new Promise(r => setTimeout(r, 1000));
  }
  console.log('[LLM] 批次分析完成');
}

// 測試模式
if (process.argv.includes('--test')) {
  (async () => {
    console.log('--- LLM 測試模式 ---');
    const testArticle = {
      symbol: 'TSLA',
      source: 'X',
      title: 'Tesla Q1 Delivery Numbers Miss Estimates!',
      content: 'Tesla failed to meet delivery expectations this quarter. Competition increases, sentiment is turning bearish.'
    };
    const result = await analyzeWithGemini(testArticle);
    console.log(result);
  })();
}

module.exports = { analyzeWithGemini, analyzePending };
