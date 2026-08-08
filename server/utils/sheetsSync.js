const { google } = require("googleapis");
const oauth2Client = require("../config/oauth");
const { MAX_DAILY_EXPENSES, TOTAL_COLUMN } = require("../config/sheetConfig");
const { findRowByDate } = require("./findRowByDate");
const { getAvailableSlots } = require("./getAvailableSlots");
const logger = require("./logger");

async function syncToGoogleSheets(date, newExpenses) {
  if (!oauth2Client.credentials) {
    logger.warn("Google Sheets sync skipped: OAuth not authenticated.");
    return;
  }

  try {
    const sheets = google.sheets({ version: "v4", auth: oauth2Client });
    let { row, dates } = await findRowByDate(sheets, date);

    if (row > 0) {
      let { availableSlots, nextExpenseCol } = await getAvailableSlots(sheets, date);

      if (newExpenses.length > availableSlots) {
        logger.warn(`Google Sheets has only ${availableSlots} slots left for ${date}, but trying to write ${newExpenses.length}`);
      }

      const writeCount = Math.min(newExpenses.length, availableSlots);
      if (writeCount === 0) return;

      const updates = newExpenses.slice(0, writeCount).map((expense, i) => ({
        range: `Sheet1!${String.fromCharCode(65 + nextExpenseCol + i)}${row}`,
        values: [[`${expense.name}: ${expense.amount}`]],
      }));

      await sheets.spreadsheets.values.batchUpdate({
        spreadsheetId: process.env.SHEET_ID,
        resource: {
          valueInputOption: "USER_ENTERED",
          data: updates,
        },
      });
    } else {
      row = dates.length + 1;

      const rowData = new Array(MAX_DAILY_EXPENSES + 2).fill("");
      rowData[0] = date;

      const writeCount = Math.min(newExpenses.length, MAX_DAILY_EXPENSES);
      newExpenses.slice(0, writeCount).forEach((expense, i) => {
        rowData[i + 1] = `${expense.name}: ${expense.amount}`;
      });

      rowData[MAX_DAILY_EXPENSES + 1] =
        `=SUMPRODUCT(ARRAYFORMULA(` +
        `IFERROR(REGEXEXTRACT(B${row}:K${row}, ":\\s(\\d+\\.?\\d*)")*1, 0)` +
        `))`;

      await sheets.spreadsheets.values.update({
        spreadsheetId: process.env.SHEET_ID,
        range: `Sheet1!A${row}:${TOTAL_COLUMN}${row}`,
        valueInputOption: "USER_ENTERED",
        resource: { values: [rowData] },
      });
    }
    logger.info(`Successfully synchronized ${newExpenses.length} expenses to Google Sheets for date: ${date}`);
  } catch (err) {
    logger.error(`Google Sheets synchronization failed for date ${date}: ${err.message}`);
  }
}

module.exports = { syncToGoogleSheets };
