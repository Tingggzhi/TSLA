const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const DB_PATH = path.join(__dirname, '../../data.db');
const db = new sqlite3.Database(DB_PATH);

// 初始化資料庫
db.serialize(() => {
  db.run(`
    CREATE TABLE IF NOT EXISTS articles (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      symbol TEXT,
      source TEXT,
      title TEXT,
      content TEXT,
      url TEXT,
      timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS analysis (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      article_id INTEGER,
      sentiment_score INTEGER,
      risk_level TEXT,
      is_manipulated BOOLEAN,
      summary TEXT,
      timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY(article_id) REFERENCES articles(id)
    );
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS alerts (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      symbol TEXT,
      risk_level TEXT,
      message TEXT,
      timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `);
});

/**
 * 插入文章
 * @param {Object} article 
 */
function insertArticle(article) {
  return new Promise((resolve, reject) => {
    const stmt = db.prepare('INSERT INTO articles (symbol, source, title, content, url) VALUES (?, ?, ?, ?, ?)');
    stmt.run(article.symbol, article.source, article.title, article.content, article.url, function(err) {
      if (err) reject(err);
      else resolve(this);
    });
    stmt.finalize();
  });
}

/**
 * 獲取待分析文章
 */
function getPendingArticles() {
  return new Promise((resolve, reject) => {
    db.all(`
      SELECT a.* FROM articles a 
      LEFT JOIN analysis an ON a.id = an.article_id 
      WHERE an.id IS NULL
    `, (err, rows) => {
      if (err) reject(err);
      else resolve(rows);
    });
  });
}

/**
 * 插入分析結果
 * @param {Object} result 
 */
function insertAnalysis(result) {
  return new Promise((resolve, reject) => {
    const stmt = db.prepare('INSERT INTO analysis (article_id, sentiment_score, risk_level, is_manipulated, summary) VALUES (?, ?, ?, ?, ?)');
    stmt.run(result.article_id, result.sentiment_score, result.risk_level, result.is_manipulated ? 1 : 0, result.summary, function(err) {
      if (err) reject(err);
      else resolve(this);
    });
    stmt.finalize();
  });
}

/**
 * 插入警報
 * @param {Object} alert 
 */
function insertAlert(alert) {
  return new Promise((resolve, reject) => {
    const stmt = db.prepare('INSERT INTO alerts (symbol, risk_level, message) VALUES (?, ?, ?)');
    stmt.run(alert.symbol, alert.risk_level, alert.message, function(err) {
      if (err) reject(err);
      else resolve(this);
    });
    stmt.finalize();
  });
}

/**
 * 獲取所有最新情況
 */
function getDashboardData() {
  return new Promise((resolve, reject) => {
    db.all(`
      SELECT a.symbol, a.title, an.sentiment_score, an.risk_level, an.summary, an.timestamp
      FROM articles a
      JOIN analysis an ON a.id = an.article_id
      GROUP BY a.symbol
      HAVING MAX(an.timestamp)
      ORDER BY an.timestamp DESC
    `, (err, rows) => {
      if (err) reject(err);
      else resolve(rows);
    });
  });
}

module.exports = {
  insertArticle,
  getPendingArticles,
  insertAnalysis,
  insertAlert,
  getDashboardData
};
