const { google } = require("googleapis");
const oauth2Client = require("../config/oauth");
const { MAX_DAILY_EXPENSES, TOTAL_COLUMN } = require("../config/sheetConfig");
const { findRowByDate } = require("../utils/findRowByDate");
const { getAvailableSlots } = require("../utils/getAvailableSlots");

exports.postExpenses = async (req, res) => {
  if (!oauth2Client.credentials) {
    return res.status(401).json({ error: "Not authenticated" });
  }

  const { date, expenses } = req.body;
  const sheets = google.sheets({ version: "v4", auth: oauth2Client });

  try {
    if (!date || !expenses?.length) {
      return res.status(400).json({ error: "Missing date or expenses" });
    }

    if (expenses.length > MAX_DAILY_EXPENSES) {
      return res.status(400).json({
        error: `Maximum ${MAX_DAILY_EXPENSES} expenses per day`,
      });
    }

    let { row, dates } = await findRowByDate(sheets, date);

    if (row > 0) {
      let { availableSlots, nextExpenseCol } = await getAvailableSlots(
        sheets,
        date
      );

      if (expenses.length > availableSlots) {
        return res.status(400).json({
          error: `Only ${availableSlots} slots left for ${date}`,
        });
      }

      const updates = expenses.map((expense, i) => ({
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

      return res.json({ success: true, row });
    }

    row = dates.length + 1;

    const rowData = new Array(MAX_DAILY_EXPENSES + 2).fill("");
    rowData[0] = date;

    expenses.forEach((expense, i) => {
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

    res.json({ success: true, row });
  } catch (err) {
    console.error(
      "Sheets API error:",
      err.response?.data?.error || err.message
    );
    res.status(500).json({
      error: "Failed to save expenses",
      details: err.response?.data?.error,
    });
  }
};
