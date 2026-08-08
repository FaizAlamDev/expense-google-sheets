const fs = require("fs");
const path = require("path");
const sqlite3 = require("sqlite3");
const { open } = require("sqlite");
const logger = require("./logger");

const DB_DIR = fs.existsSync("/data") ? "/data" : path.resolve(__dirname, "..");
const DB_PATH = path.join(DB_DIR, "expenses.db");

let db = null;

async function initializeDb() {
  db = await open({
    filename: DB_PATH,
    driver: sqlite3.Database,
  });

  await db.exec("PRAGMA journal_mode = WAL;");
  await db.exec("PRAGMA synchronous = NORMAL;");
  await db.exec("PRAGMA foreign_keys = ON;");

  await db.exec(`
    CREATE TABLE IF NOT EXISTS expenses (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      date TEXT NOT NULL,
      name TEXT NOT NULL,
      amount DECIMAL(10,2) NOT NULL,
      category TEXT,
      notes TEXT,
      created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
    );
  `);

  await db.exec("CREATE INDEX IF NOT EXISTS idx_expenses_date ON expenses (date);");

  logger.info(`SQLite database initialized successfully at: ${DB_PATH}`);
}

async function getAvailableSlots(date) {
  const result = await db.get(
    "SELECT COUNT(*) as count FROM expenses WHERE date = ?",
    [date]
  );
  const count = result ? result.count : 0;
  return Math.max(0, 10 - count);
}

async function insertExpenses(date, expenses) {
  await db.run("BEGIN TRANSACTION");
  try {
    const stmt = await db.prepare(
      "INSERT INTO expenses (date, name, amount) VALUES (?, ?, ?)"
    );
    for (const exp of expenses) {
      await stmt.run(date, exp.name, parseFloat(exp.amount));
    }
    await stmt.finalize();
    await db.run("COMMIT");
    logger.info(`Inserted ${expenses.length} expenses into SQLite for date: ${date}`);
  } catch (err) {
    await db.run("ROLLBACK");
    logger.error(`SQLite insert transaction failed: ${err.message}`);
    throw err;
  }
}

async function getAllExpenses() {
  return await db.all("SELECT date, name, amount FROM expenses ORDER BY date DESC, id ASC");
}

function getDbInstance() {
  return db;
}

module.exports = {
  initializeDb,
  getAvailableSlots,
  insertExpenses,
  getAllExpenses,
  getDbInstance,
  DB_PATH,
};
