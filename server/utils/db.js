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
    const inserted = [];
    for (const exp of expenses) {
      const amount = parseFloat(exp.amount);
      const result = await stmt.run(date, exp.name, amount);
      inserted.push({ id: result.lastID, date, name: exp.name, amount });
    }
    await stmt.finalize();
    await db.run("COMMIT");
    logger.info(`Inserted ${expenses.length} expenses into SQLite for date: ${date}`);
    return inserted;
  } catch (err) {
    await db.run("ROLLBACK");
    logger.error(`SQLite insert transaction failed: ${err.message}`);
    throw err;
  }
}

async function getDatesPage(limit, offset) {
  const rows = await db.all(
    "SELECT date FROM expenses GROUP BY date ORDER BY date DESC LIMIT ? OFFSET ?",
    [limit, offset]
  );
  const rowsCount = await db.get(
    "SELECT COUNT(DISTINCT date) AS total FROM expenses"
  );
  return { dates: rows.map((r) => r.date), total: rowsCount.total };
}

async function getExpensesByDate(date) {
  return await db.all(
    "SELECT id, date, name, amount FROM expenses WHERE date = ? ORDER BY id ASC",
    [date]
  );
}

async function getExpenseById(id) {
  return await db.get(
    "SELECT id, date, name, amount FROM expenses WHERE id = ?",
    [id]
  );
}

async function updateExpense(id, name, amount) {
  const result = await db.run(
    "UPDATE expenses SET name = ?, amount = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?",
    [name, amount, id]
  );
  if (result.changes === 0) return null;
  return getExpenseById(id);
}

async function deleteExpense(id) {
  const result = await db.run("DELETE FROM expenses WHERE id = ?", [id]);
  return result.changes;
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
  getDatesPage,
  getExpensesByDate,
  getExpenseById,
  updateExpense,
  deleteExpense,
  getDbInstance,
  DB_PATH,
};
