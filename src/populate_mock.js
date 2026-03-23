const { insertArticle, insertAnalysis } = require('./db/database');

async function populate() {
  console.log('Populating mock data for UI demo...');
  
  const articles = [
    { symbol: 'TSLA', source: 'FinHub', title: 'Tesla price cuts in China continues!', content: '...', url: 'https://example.com/tsla' },
    { symbol: 'ZIM', source: 'FreightWaves', title: 'Red Sea tensions spike shipping rates.', content: '...', url: 'https://example.com/zim' },
    { symbol: 'RACE', source: 'FormulaOne', title: 'Ferrari earnings beat expectations.', content: '...', url: 'https://example.com/race' },
    { symbol: 'PLTR', source: 'Palantir News', title: 'Palantir wins new US Army contract.', content: '...', url: 'https://example.com/pltr' }
  ];

  for (const a of articles) {
    const res = await insertArticle(a);
    const articleId = res.lastID;
    
    let mockAnalysis;
    if (a.symbol === 'TSLA') {
      mockAnalysis = { article_id: articleId, sentiment_score: -3.5, risk_level: 'Critical', is_manipulated: 0, summary: '特斯拉在中國市場面臨激烈競爭，毛利率壓力巨大。' };
    } else if (a.symbol === 'ZIM') {
      mockAnalysis = { article_id: articleId, sentiment_score: 4.2, risk_level: 'High', is_manipulated: 0, summary: '紅海危機導致運費飆升，資產變現能力增強。' };
    } else if (a.symbol === 'RACE') {
      mockAnalysis = { article_id: articleId, sentiment_score: 2.5, risk_level: 'Low', is_manipulated: 0, summary: '奢侈品市場需求穩定，法拉利訂單排到 2026 年後。' };
    } else {
      mockAnalysis = { article_id: articleId, sentiment_score: 1.2, risk_level: 'Medium', is_manipulated: 0, summary: 'Palantir 持續穩定獲取政府大單。' };
    }
    
    await insertAnalysis(mockAnalysis);
  }
  
  console.log('Done.');
  process.exit(0);
}

populate();
