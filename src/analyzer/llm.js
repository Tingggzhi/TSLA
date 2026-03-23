const axios = require('axios');
const config = require('../../config/config');
const { insertAnalysis, getPendingArticles } = require('../db/database');
const { triggerAllAlerts } = require('../notifier/notifier');

const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-pro:generateContent';

/**
 * 建立豪華版分析 Prompt
 */
function buildStockPrompt(article, stock) {
  return `你是一位頂尖美股對沖基金空頭經理兼地緣政治策略家。你擅長從新聞碎片中拼湊出宏觀風險與成長奇點。
  對「${stock.name} (${stock.symbol})」進行深度分析。

  ===== 待分析新聞 =====
  標題：${article.title}
  內容：${(article.content || '').slice(0, 1500)}

  ===== 旗艦報表格式要求 (JSON 格式) =====
  請務必回傳以下 JSON 結構：
  {
    "sentimentScore": -5到5,
    "riskLevel": "Low|Medium|High|Critical",
    "isManipulated": true/false,
    "summary": "嘲諷且精準的 40 字總結",
    "details": {
      "expertView": "對當前情況的 100 字尖銳點評",
      "advice": {
        "alloc": "建議配置百分比 (例如 10%-12%)",
        "logic": "核心配置邏輯",
        "why": ["原因1", "原因2"],
        "prompts": ["測試指令1", "測試指令2"]
      },
      "risk": {
        "ratio": "一週內現金流量比判斷 (如 1.5x)",
        "flow": "現金流與營運動能分析",
        "resc": "一年內抗風險與資產韌性判讀"
      },
      "swot": {
        "pros": ["優勢標籤1", "優勢標籤2"],
        "cons": ["劣勢標籤1", "劣勢標籤2"]
      },
      "potential": ["未來三年成長爆發點1", "重點2"]
    }
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
      console.warn(`[LLM] 頻率限制，等待 60 秒重試...`);
      await new Promise(r => setTimeout(r, 60000));
      return analyzeWithGemini(article, retryCount + 1);
    }
    console.error(`[LLM] 分析失敗: ${err.message}`);
    return null;
  }
}

/**
 * 批次處理文章
 */
async function analyzePending() {
  const pending = await getPendingArticles();
  if (pending.length === 0) return;

  for (const article of pending) {
    const analysis = await analyzeWithGemini(article);
    if (analysis) {
      await insertAnalysis({
        article_id: article.id,
        sentiment_score: analysis.sentimentScore,
        risk_level: analysis.riskLevel,
        is_manipulated: analysis.isManipulated,
        summary: analysis.summary,
        details: JSON.stringify(analysis.details) // 存入 JSON 詳情
      });
      
      if (['Critical', 'High'].includes(analysis.riskLevel)) {
        await triggerAllAlerts({
          symbol: article.symbol,
          riskLevel: analysis.riskLevel,
          summary: analysis.summary
        });
      }
      await new Promise(r => setTimeout(r, 3000));
    }
  }
}

module.exports = { analyzePending };
