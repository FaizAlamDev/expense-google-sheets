const db = require("../utils/db");
const { syncToGoogleSheets, syncDateGroupToGoogleSheets, syncMonthTotalToGoogleSheets } = require("../utils/sheetsSync");
const logger = require("../utils/logger");

const MAX_DAILY_EXPENSES = 10;
const MONTH_RE = /^\d{4}-\d{2}$/;

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

exports.getMonths = async (req, res) => {
  try {
    let limit = Number(req.query.limit ?? 1);
    let offset = Number(req.query.offset ?? 0);
    if (!Number.isInteger(limit) || limit < 1) limit = 1;
    if (limit > 24) limit = 24;
    if (!Number.isInteger(offset) || offset < 0) offset = 0;

    res.json(await db.getMonthsPage(limit, offset));
  } catch (err) {
    logger.error("Error fetching expense months:", err);
    res.status(500).json({ error: "Failed to fetch expense months" });
  }
};

exports.createAdjustment = async (req, res) => {
  const { month, amount, label } = req.body ?? {};

  if (typeof month !== "string" || !MONTH_RE.test(month)) {
    return res.status(400).json({ error: "month must be YYYY-MM" });
  }
  const parsedAmount = Number(amount);
  if (!Number.isFinite(parsedAmount) || parsedAmount === 0) {
    return res.status(400).json({ error: "Amount must be a non-zero number" });
  }
  if (label !== undefined && (typeof label !== "string" || label.trim() === "")) {
    return res.status(400).json({ error: "Label must be a non-empty string" });
  }

  try {
    const record = await db.createAdjustment(
      month,
      parsedAmount,
      typeof label === "string" ? label.trim() : null
    );
    res.json(record);

    syncMonthTotalToGoogleSheets(record.month).catch((syncErr) => {
      logger.error(`Unhandled exception in background Google Sheets adjustment sync: ${syncErr.message}`);
    });
  } catch (err) {
    logger.error("Error creating adjustment:", err);
    res.status(500).json({ error: "Failed to create adjustment" });
  }
};

exports.updateAdjustment = async (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isInteger(id) || id <= 0) {
    return res.status(400).json({ error: "Invalid adjustment id" });
  }

  const { amount, label } = req.body ?? {};
  const parsedAmount = Number(amount);
  if (!Number.isFinite(parsedAmount) || parsedAmount === 0) {
    return res.status(400).json({ error: "Amount must be a non-zero number" });
  }
  if (label !== undefined && (typeof label !== "string" || label.trim() === "")) {
    return res.status(400).json({ error: "Label must be a non-empty string" });
  }

  try {
    const record = await db.updateAdjustment(
      id,
      parsedAmount,
      typeof label === "string" ? label.trim() : null
    );
    if (!record) {
      return res.status(404).json({ error: "Adjustment not found" });
    }
    res.json(record);

    syncMonthTotalToGoogleSheets(record.month).catch((syncErr) => {
      logger.error(`Unhandled exception in background Google Sheets adjustment sync: ${syncErr.message}`);
    });
  } catch (err) {
    logger.error("Error updating adjustment:", err);
    res.status(500).json({ error: "Failed to update adjustment" });
  }
};

exports.deleteAdjustment = async (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isInteger(id) || id <= 0) {
    return res.status(400).json({ error: "Invalid adjustment id" });
  }

  try {
    const record = await db.getAdjustmentById(id);
    if (!record) {
      return res.status(404).json({ error: "Adjustment not found" });
    }

    const changes = await db.deleteAdjustment(id);
    if (changes === 0) {
      return res.status(404).json({ error: "Adjustment not found" });
    }
    res.json({ success: true });

    syncMonthTotalToGoogleSheets(record.month).catch((syncErr) => {
      logger.error(`Unhandled exception in background Google Sheets adjustment sync: ${syncErr.message}`);
    });
  } catch (err) {
    logger.error("Error deleting adjustment:", err);
    res.status(500).json({ error: "Failed to delete adjustment" });
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

    syncDateGroupToGoogleSheets(record.date).catch((syncErr) => {
      logger.error(`Unhandled exception in background Google Sheets sync: ${syncErr.message}`);
    });
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
    const record = await db.getExpenseById(id);
    if (!record) {
      return res.status(404).json({ error: "Expense not found" });
    }

    const changes = await db.deleteExpense(id);
    if (changes === 0) {
      return res.status(404).json({ error: "Expense not found" });
    }
    res.json({ success: true });

    syncDateGroupToGoogleSheets(record.date).catch((syncErr) => {
      logger.error(`Unhandled exception in background Google Sheets sync: ${syncErr.message}`);
    });
  } catch (err) {
    logger.error("Error deleting expense:", err);
    res.status(500).json({ error: "Failed to delete expense" });
  }
};
