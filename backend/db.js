const path = require('path');
const fs = require('fs');

let SQL = null;
let db = null;
let dbPath = '';

async function initDatabase() {
  const { app } = require('electron');
  const userDataPath = app.getPath('userData');
  dbPath = path.join(userDataPath, 'deepseek-monitor.db');

  const initSqlJs = require('sql.js');
  SQL = await initSqlJs();

  // 尝试从文件加载已有数据库
  if (fs.existsSync(dbPath)) {
    const buffer = fs.readFileSync(dbPath);
    db = new SQL.Database(buffer);
  } else {
    db = new SQL.Database();
  }

  db.run('PRAGMA journal_mode = WAL');

  db.run(`
    CREATE TABLE IF NOT EXISTS daily_usage (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      date TEXT NOT NULL,
      model TEXT NOT NULL,
      tokens_in INTEGER DEFAULT 0,
      tokens_out INTEGER DEFAULT 0,
      cost REAL DEFAULT 0,
      created_at TEXT DEFAULT (datetime('now')),
      UNIQUE(date, model)
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS balance_snapshot (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      total_balance REAL,
      granted_balance REAL,
      topped_up_balance REAL,
      fetched_at TEXT DEFAULT (datetime('now'))
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS settings (
      key TEXT PRIMARY KEY,
      value TEXT
    )
  `);

  saveDb();
  return db;
}

function saveDb() {
  if (!db || !dbPath) return;
  const data = db.export();
  const buffer = Buffer.from(data);
  fs.writeFileSync(dbPath, buffer);
}

function getDb() {
  if (!db) throw new Error('Database not initialized. Call initDatabase() first.');
  return db;
}

// ---- daily_usage ----

function upsertDailyUsage(date, model, tokensIn, tokensOut, cost) {
  const d = getDb();
  const existing = d.exec(`SELECT id, tokens_in, tokens_out, cost FROM daily_usage WHERE date = ? AND model = ?`, [date, model]);
  // sql.js exec returns an array of result objects; each result has columns and values
  let existingData = null;
  if (existing.length > 0 && existing[0].values.length > 0) {
    const row = existing[0];
    existingData = {
      id: row.values[0][0],
      tokens_in: row.values[0][1],
      tokens_out: row.values[0][2],
      cost: row.values[0][3],
    };
  }

  if (existingData) {
    d.run(`UPDATE daily_usage SET tokens_in = tokens_in + ?, tokens_out = tokens_out + ?, cost = cost + ? WHERE id = ?`,
      [tokensIn, tokensOut, cost, existingData.id]);
  } else {
    d.run(`INSERT INTO daily_usage (date, model, tokens_in, tokens_out, cost) VALUES (?, ?, ?, ?, ?)`,
      [date, model, tokensIn, tokensOut, cost]);
  }
  saveDb();
}

function getDailyUsage(days = 7) {
  const d = getDb();
  const result = d.exec(`
    SELECT date, model, tokens_in, tokens_out, cost
    FROM daily_usage
    WHERE date >= date('now', '-' || ? || ' days')
    ORDER BY date DESC, model
  `, [days]);
  return mapResults(result, ['date', 'model', 'tokens_in', 'tokens_out', 'cost']);
}

function getDailyUsageGrouped(days = 7) {
  const d = getDb();
  const result = d.exec(`
    SELECT date,
      SUM(CASE WHEN model = 'v4-flash' THEN cost ELSE 0 END) AS flash_cost,
      SUM(CASE WHEN model = 'v4-flash' THEN tokens_in + tokens_out ELSE 0 END) AS flash_tokens,
      SUM(CASE WHEN model = 'v4-pro' THEN cost ELSE 0 END) AS pro_cost,
      SUM(CASE WHEN model = 'v4-pro' THEN tokens_in + tokens_out ELSE 0 END) AS pro_tokens,
      SUM(cost) AS total_cost
    FROM daily_usage
    WHERE date >= date('now', '-' || ? || ' days')
    GROUP BY date
    ORDER BY date ASC
  `, [days]);
  return mapResults(result, ['date', 'flash_cost', 'flash_tokens', 'pro_cost', 'pro_tokens', 'total_cost']);
}

// ---- balance_snapshot ----

function insertBalance(totalBalance, grantedBalance, toppedUpBalance) {
  const d = getDb();
  d.run(`INSERT INTO balance_snapshot (total_balance, granted_balance, topped_up_balance) VALUES (?, ?, ?)`,
    [totalBalance, grantedBalance, toppedUpBalance]);
  saveDb();
}

function getLatestBalance() {
  const d = getDb();
  const result = d.exec(`SELECT total_balance, granted_balance, topped_up_balance, fetched_at FROM balance_snapshot ORDER BY id DESC LIMIT 1`);
  const mapped = mapResults(result, ['total_balance', 'granted_balance', 'topped_up_balance', 'fetched_at']);
  return mapped.length > 0 ? mapped[0] : null;
}

// ---- settings ----

function setSetting(key, value) {
  const d = getDb();
  d.run(`INSERT INTO settings (key, value) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value`,
    [key, value]);
  saveDb();
}

function getSetting(key, defaultValue = null) {
  const d = getDb();
  const result = d.exec(`SELECT value FROM settings WHERE key = ?`, [key]);
  const mapped = mapResults(result, ['value']);
  return mapped.length > 0 ? mapped[0].value : defaultValue;
}

// ---- helpers ----

function mapResults(result, columns) {
  if (!result || result.length === 0) return [];
  const rows = result[0].values;
  return rows.map(row => {
    const obj = {};
    columns.forEach((col, i) => {
      obj[col] = row[i];
    });
    return obj;
  });
}

module.exports = {
  initDatabase,
  upsertDailyUsage,
  getDailyUsage,
  getDailyUsageGrouped,
  insertBalance,
  getLatestBalance,
  setSetting,
  getSetting,
};
