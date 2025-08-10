const { google } = require("googleapis");
const express = require("express");
const cors = require("cors");
require("dotenv").config();
const oauth2Client = require("./config/oauth");
const { initializeAuth } = require("./utils/auth");
const routes = require("./routes");
const app = express();

app.use(cors());
app.use(express.json());
app.use("/", routes);

const MAX_DAILY_EXPENSES = 10;
const TOTAL_COLUMN = "L";

app.post("/api/expenses", async (req, res) => {
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

    const dateResponse = await sheets.spreadsheets.values.get({
      spreadsheetId: process.env.SHEET_ID,
      range: "Sheet1!A:A",
    });

    const dates = dateResponse.data.values || [];
    let row = -1;

    for (let i = 0; i < dates.length; i++) {
      if (dates[i][0]?.toLowerCase() === date.toLowerCase()) {
        row = i + 1;
        break;
      }
    }

    if (row > 0) {
      const rowResponse = await sheets.spreadsheets.values.get({
        spreadsheetId: process.env.SHEET_ID,
        range: `Sheet1!A${row}:${TOTAL_COLUMN}${row}`,
      });

      const existingData = rowResponse.data.values[0] || [];

      let nextExpenseCol = 1;
      while (
        nextExpenseCol <= MAX_DAILY_EXPENSES &&
        existingData[nextExpenseCol]
      ) {
        nextExpenseCol++;
      }

      const availableSlots = MAX_DAILY_EXPENSES - (nextExpenseCol - 1);
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
});

initializeAuth()
  .then(() => {
    const PORT = process.env.PORT || 5000;
    app.listen(PORT, () => {
      console.log(`Server listening on PORT ${PORT}`);
    });
  })
  .catch((err) => {
    console.error("Fatal auth initialization error:", err);
    process.exit(1);
  });
