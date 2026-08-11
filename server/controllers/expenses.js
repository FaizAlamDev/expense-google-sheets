const db = require("../utils/db");
const { syncToGoogleSheets } = require("../utils/sheetsSync");
const logger = require("../utils/logger");

const MAX_DAILY_EXPENSES = 10;

exports.postExpenses = async (req, res) => {
  const { date, expenses } = req.body;

  try {
    if (!date || !expenses?.length) {
      return res.status(400).json({ error: "Missing date or expenses" });
    }

    if (expenses.length > MAX_DAILY_EXPENSES) {
      return res.status(400).json({
        error: `Maximum ${MAX_DAILY_EXPENSES} expenses per day`,
      });
    }

    const availableSlots = await db.getAvailableSlots(date);

    if (expenses.length > availableSlots) {
      return res.status(400).json({
        error: `Only ${availableSlots} slots left for ${date}`,
      });
    }

    const inserted = await db.insertExpenses(date, expenses);

    res.json({ success: true, expenses: inserted });

    syncToGoogleSheets(date, expenses).catch((syncErr) => {
      logger.error(`Unhandled exception in background Google Sheets sync: ${syncErr.message}`);
    });

  } catch (err) {
    logger.error("Failed to save expenses in SQLite transaction:", err);
    res.status(500).json({
      error: "Failed to save expenses",
      details: err.message,
    });
  }
};

exports.getDates = async (req, res) => {
  try {
    let limit = Number(req.query.limit ?? 10);
    let offset = Number(req.query.offset ?? 0);
    if (!Number.isInteger(limit) || limit < 1) limit = 10;
    if (limit > 100) limit = 100;
    if (!Number.isInteger(offset) || offset < 0) offset = 0;

    res.json(await db.getDatesPage(limit, offset));
  } catch (err) {
    logger.error("Error fetching expense dates:", err);
    res.status(500).json({ error: "Failed to fetch expense dates" });
  }
};

exports.getExpensesByDate = async (req, res) => {
  const { date } = req.query;
  if (!date || typeof date !== "string") {
    return res.status(400).json({ error: "date query parameter is required" });
  }

  try {
    const expenses = await db.getExpensesByDate(date);
    const total = expenses.reduce((sum, e) => sum + e.amount, 0);
    res.json({ date, expenses, total });
  } catch (err) {
    logger.error("Error fetching expenses by date:", err);
    res.status(500).json({ error: "Failed to fetch expenses" });
  }
};

exports.updateExpense = async (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isInteger(id) || id <= 0) {
    return res.status(400).json({ error: "Invalid expense id" });
  }

  const { name, amount } = req.body ?? {};
  if (typeof name !== "string" || !name.trim() || !/[A-Za-z]/.test(name)) {
    return res.status(400).json({ error: "Name must contain at least one letter" });
  }
  const parsedAmount = Number(amount);
  if (!Number.isFinite(parsedAmount) || parsedAmount <= 0) {
    return res.status(400).json({ error: "Amount must be greater than 0" });
  }

  try {
    const record = await db.updateExpense(id, name.trim(), parsedAmount);
    if (!record) {
      return res.status(404).json({ error: "Expense not found" });
    }
    res.json(record);
  } catch (err) {
    logger.error("Error updating expense:", err);
    res.status(500).json({ error: "Failed to update expense" });
  }
};

exports.deleteExpense = async (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isInteger(id) || id <= 0) {
    return res.status(400).json({ error: "Invalid expense id" });
  }

  try {
    const changes = await db.deleteExpense(id);
    if (changes === 0) {
      return res.status(404).json({ error: "Expense not found" });
    }
    res.json({ success: true });
  } catch (err) {
    logger.error("Error deleting expense:", err);
    res.status(500).json({ error: "Failed to delete expense" });
  }
};
