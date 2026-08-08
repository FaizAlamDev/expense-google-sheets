const { DB_PATH, getAllExpenses } = require("../utils/db");
const { uploadDbToS3 } = require("../utils/s3Backup");
const fs = require("fs");
const logger = require("../utils/logger");

exports.downloadDatabase = (req, res) => {
  if (!fs.existsSync(DB_PATH)) {
    logger.warn("Backup download failed: database file not found");
    return res.status(404).json({ error: "Database file not found" });
  }
  logger.info("Database backup file downloaded");
  res.download(DB_PATH, "expenses_backup.db");
};

exports.exportCsv = async (req, res) => {
  try {
    const rows = await getAllExpenses();
    let csv = "Date,Expense Name,Amount\n";
    for (const row of rows) {
      const escapedName = row.name.replace(/"/g, '""');
      csv += `${row.date},"${escapedName}",${row.amount}\n`;
    }
    logger.info("CSV backup exported");
    res.setHeader("Content-Type", "text/csv");
    res.setHeader("Content-Disposition", 'attachment; filename="expenses_export.csv"');
    res.send(csv);
  } catch (err) {
    logger.error(`CSV Export failed: ${err.message}`);
    res.status(500).json({ error: "Failed to export data" });
  }
};

exports.triggerS3Backup = async (req, res) => {
  try {
    const result = await uploadDbToS3();
    if (result.success) {
      res.json({ success: true, message: `Database backed up to AWS S3 successfully as ${result.key}` });
    } else {
      res.status(400).json({ success: false, error: result.reason });
    }
  } catch (err) {
    logger.error(`Manual S3 backup trigger failed: ${err.message}`);
    res.status(500).json({ success: false, error: err.message });
  }
};
