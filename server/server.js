const { google } = require("googleapis");
const express = require("express");
const fs = require("fs");
const cors = require("cors");
require("dotenv").config();
const app = express();

app.use(cors());
app.use(express.json());

const oauth2Client = new google.auth.OAuth2(
  process.env.CLIENT_ID,
  process.env.CLIENT_SECRET,
  process.env.REDIRECT_URI
);

const TOKEN_PATH = "tokens.json";

async function initializeAuth() {
  try {
    if (fs.existsSync(TOKEN_PATH)) {
      const tokens = JSON.parse(fs.readFileSync(TOKEN_PATH));
      oauth2Client.setCredentials(tokens);
      console.log("Loaded existing tokens");
    }

    oauth2Client.on("tokens", (tokens) => {
      const current = fs.existsSync(TOKEN_PATH)
        ? JSON.parse(fs.readFileSync(TOKEN_PATH))
        : {};
      fs.writeFileSync(TOKEN_PATH, JSON.stringify({ ...current, ...tokens }));
      console.log("Tokens updated");
    });
  } catch (err) {
    console.error("Auth error:", err);
  }
}

app.get("/auth", (req, res) => {
  const url = oauth2Client.generateAuthUrl({
    access_type: "offline",
    scope: ["https://www.googleapis.com/auth/spreadsheets"],
  });
  res.redirect(url);
});

app.get("/auth/callback", async (req, res) => {
  const { code } = req.query;
  const { tokens } = await oauth2Client.getToken(code);

  fs.writeFileSync(TOKEN_PATH, JSON.stringify(tokens));
  oauth2Client.setCredentials(tokens);

  res.send("Authentication successful! You can now post data");
});

const MAX_DAILY_EXPENSES = 10;
const TOTAL_COLUMN = "L";

app.post("/api/expenses", async (req, res) => {
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
    res.status(500).send(`Error: ${err.message}`);
  }
});

initializeAuth().then(() => {
  const PORT = process.env.PORT || 5000;
  app.listen(PORT, () => {
    console.log(`App running listening on PORT ${PORT}`);
  });
});
