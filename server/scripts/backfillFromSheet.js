/**
 * One-shot backfill of historical expenses from Google Sheets into SQLite
 * (the current source of truth).
 *
 * Safety guarantees:
 * - The Google Sheet is READ-ONLY - never modified.
 * - Idempotent: a (date, name, amount) row already in SQLite is skipped,
 *   so rerunning is harmless.
 * - All inserts run in a single transaction; any failure rolls back fully.
 * - Unparseable dates/expenses are logged and skipped, never guessed.
 *
 * Usage (from server/):
 *   node scripts/backfillFromSheet.js          # real write
 *   node scripts/backfillFromSheet.js --dry-run # show plan, write nothing
 *
 * Requires an authenticated OAuth session on the server (run /auth once via
 * the app, or ensure tokens.json exists).
 */

const path = require("path");
require("dotenv").config({ path: path.join(__dirname, "..", ".env") });

const { google } = require("googleapis");
const { initializeAuth } = require("../utils/auth");
const { initializeDb, getDbInstance } = require("../utils/db");
const oauth2Client = require("../config/oauth");
const logger = require("../utils/logger");

const DRY_RUN = process.argv.includes("--dry-run");
const SHEET_TAB = "Sheet1";
const SLOTS = 10; // columns B..K

// "name: amount" where amount is the trailing number (split on the LAST colon
// so names containing ":" still parse correctly).
const AMOUNT_RE = /^(.*):\s*(\d+(?:\.\d+)?)\s*$/;

// Placeholder/filler cells users put in unused slots ("........", "---", "-")
// - ignore them rather than log them as anomalies.
const FILLER_RE = /^[\s.\-–—~·]+$/;

const pad = (n) => String(n).padStart(2, "0");

function formatIsoDate(date) {
  return `${date.getUTCFullYear()}-${pad(date.getUTCMonth() + 1)}-${pad(
    date.getUTCDate()
  )}`;
}

function toIsoDate(value) {
  if (value == null) return null;

  if (typeof value === "number") {
    // Excel/Google Sheets serial date: days since 1899-12-30.
    return formatIsoDate(new Date(Date.UTC(1899, 11, 30, 12) + value * 86400000));
  }

  const text = String(value).trim();
  let m = text.match(/^(\d{4})[-/.](\d{1,2})[-/.](\d{1,2})$/);
  if (m) {
    const year = +m[1], month = +m[2], day = +m[3];
    if (month >= 1 && month <= 12 && day >= 1 && day <= 31) {
      return `${year}-${pad(month)}-${pad(day)}`;
    }
  }
  m = text.match(/^(\d{1,2})[-/.](\d{1,2})[-/.](\d{4})$/);
  if (m) {
    const month = +m[1], day = +m[2], year = +m[3];
    if (month >= 1 && month <= 12 && day >= 1 && day <= 31) {
      return `${year}-${pad(month)}-${pad(day)}`;
    }
  }
  return null;
}

function parseExpense(cell) {
  if (cell == null) return null;
  const text = String(cell).trim();
  if (FILLER_RE.test(text)) return null;
  const m = text.match(AMOUNT_RE);
  if (!m) return null;
  const amount = parseFloat(m[2]);
  if (!Number.isFinite(amount)) return null;
  return { name: m[1].trim(), amount };
}

async function readSheetRows(sheets) {
  const res = await sheets.spreadsheets.values.get({
    spreadsheetId: process.env.SHEET_ID,
    range: `${SHEET_TAB}!A1:L`,
    valueRenderOption: "FORMATTED_VALUE",
  });
  return res.data.values || [];
}

async function main() {
  if (!oauth2Client.credentials) {
    logger.warn(
      "OAuth is not authenticated. Complete the server /auth flow once (or provide tokens.json) before backfilling."
    );
    process.exit(1);
  }

  await initializeAuth();
  await initializeDb();
  const db = getDbInstance();
  if (!db) {
    logger.error("SQLite database is not available.");
    process.exit(1);
  }

  const sheets = google.sheets({ version: "v4", auth: oauth2Client });
  const rows = await readSheetRows(sheets);
  logger.info(`Read ${rows.length} rows from ${SHEET_TAB}.`);

  const parsed = [];
  const anomalies = [];
  for (let r = 0; r < rows.length; r++) {
    const cells = rows[r];
    const date = toIsoDate(cells[0]);
    if (!date) continue;
    for (let i = 1; i <= SLOTS && i < cells.length; i++) {
      const expense = parseExpense(cells[i]);
      if (expense) {
        parsed.push({ date, ...expense });
      } else if (cells[i] != null && !FILLER_RE.test(String(cells[i]).trim())) {
        // Non-empty cell that isn't a valid "name: amount" and isn't filler.
        anomalies.push({
          row: r + 1,
          col: String.fromCharCode(65 + i),
          value: String(cells[i]),
        });
      }
    }
  }
  logger.info(`Parsed ${parsed.length} historical expenses from the sheet.`);
  if (anomalies.length) {
    logger.warn(
      `Ignored ${anomalies.length} non-empty cells that didn't parse as "name: amount":`
    );
    anomalies.slice(0, 10).forEach((a) =>
      logger.warn(`  Sheet1!${a.col}${a.row}: "${a.value}"`)
    );
    if (anomalies.length > 10) {
      logger.warn(`  ... and ${anomalies.length - 10} more`);
    }
  }

  const existing = await db.all("SELECT date, name, amount FROM expenses");
  const seen = new Set(
    existing.map((r) => `${r.date}\0${r.name}\0${r.amount}`)
  );

  const inserts = [];
  let skipped = 0;
  const writeKey = (r) => `${r.date}\0${r.name}\0${r.amount}`;
  for (const row of parsed) {
    if (seen.has(writeKey(row))) {
      skipped++;
    } else {
      seen.add(writeKey(row));
      inserts.push(row);
    }
  }
  logger.info(`Will insert ${inserts.length}; skip ${skipped} already present.`);

  if (DRY_RUN) {
    logger.info("Dry-run only - no changes written to SQLite.");
    return;
  }

  if (!inserts.length) {
    logger.info("Nothing to insert.");
    return;
  }

  await db.run("BEGIN TRANSACTION");
  try {
    const stmt = await db.prepare(
      "INSERT INTO expenses (date, name, amount) VALUES (?, ?, ?)"
    );
    for (const row of inserts) {
      await stmt.run(row.date, row.name, row.amount);
    }
    await stmt.finalize();
    await db.run("COMMIT");
    logger.info(`Inserted ${inserts.length} expenses into SQLite.`);
  } catch (err) {
    await db.run("ROLLBACK");
    logger.error(`Backfill failed; transaction rolled back: ${err.message}`);
    throw err;
  } finally {
    await db.close();
  }
}

main().catch((err) => {
  logger.error("Backfill script failed:", err);
  process.exit(1);
});
