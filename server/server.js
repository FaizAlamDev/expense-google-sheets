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

let tokens;
try {
  tokens = JSON.parse(fs.readFileSync("tokens.json"));
  oauth2Client.setCredentials(tokens);
  console.log("Loaded existing tokens");
} catch (err) {
  console.log("No saved tokens found");
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

  fs.writeFileSync("tokens.json", JSON.stringify(tokens));
  oauth2Client.setCredentials(tokens);

  res.send("Authentication successful! You can now post data");
  res.redirect("/");
});

app.get("/post-data", async (req, res) => {
  const sheets = google.sheets({ version: "v4", auth: oauth2Client });

  try {
    await sheets.spreadsheets.values.append({
      spreadsheetId: process.env.SHEET_ID,
      range: "Sheet1!A1",
      valueInputOption: "USER_ENTERED",
      resource: { values: [["Data", new Date().toISOString()]] },
    });
    res.send("Data posted to Google Sheets!");
  } catch (err) {
    res.status(500).send(`Error: ${err.message}`);
  }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`App running listening on PORT ${PORT}`);
});
