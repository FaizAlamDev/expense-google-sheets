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

    await db.insertExpenses(date, expenses);

    res.json({ success: true });

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
