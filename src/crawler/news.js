const axios = require('axios');
const config = require('../../config/config');

/**
 * 使用 Tavily API 搜索實時個股新聞
 * @param {string} symbol 
 */
async function fetchRealStockNews(symbol) {
  if (!config.tavilyApiKey || config.tavilyApiKey.includes('your_')) {
    console.warn(`[Crawler] 跳過 ${symbol} 實時搜尋，未設定 Tavily API Key`);
    return [];
  }

  try {
    const response = await axios.post('https://api.tavily.com/search', {
      api_key: config.tavilyApiKey,
      query: `${symbol} stock latest financial news and analysis 2026`,
      search_depth: "advanced",
      include_domains: ["cnbc.com", "bloomberg.com", "reuters.com", "seekingalpha.com", "wsj.com", "finance.yahoo.com"],
      max_results: 3
    });

    return response.data.results.map(r => ({
      symbol: symbol,
      source: r.url.includes('cnbc') ? 'CNBC' : (r.url.includes('bloomberg') ? 'Bloomberg' : 'Global News'),
      title: r.title,
      content: r.content,
      url: r.url
    }));
  } catch (err) {
    console.error(`[Crawler] Tavily 搜尋 ${symbol} 失敗: ${err.message}`);
    return [];
  }
}

module.exports = { fetchRealStockNews };
