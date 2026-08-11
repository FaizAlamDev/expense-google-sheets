const express = require("express");
const { initiateAuth, authCallback } = require("./controllers/auth");
const {
  postExpenses,
  getDates,
  getExpensesByDate,
  updateExpense,
  deleteExpense,
} = require("./controllers/expenses");
const { availableSlots } = require("./controllers/availableSlots");
const { checkAuth } = require("./controllers/checkAuth");
const { downloadDatabase, exportCsv, triggerS3Backup } = require("./controllers/backup");
const requireAuth = require("./middleware/auth");

const router = express.Router();

router.get("/auth", initiateAuth);
router.get("/auth/callback", authCallback);
router.get("/api/getAvailableSlots", availableSlots);
router.get("/api/checkAuth", checkAuth);
router.post("/api/expenses", postExpenses);

router.get("/api/expenses/dates", getDates);
router.get("/api/expenses", getExpensesByDate);
router.put("/api/expenses/:id", updateExpense);
router.delete("/api/expenses/:id", deleteExpense);

router.get("/api/backup/download", requireAuth, downloadDatabase);
router.get("/api/backup/export-csv", requireAuth, exportCsv);
router.post("/api/backup/s3", requireAuth, triggerS3Backup);

module.exports = router;
