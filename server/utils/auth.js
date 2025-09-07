const fs = require("fs");
const path = require("path");
const oauth2Client = require("../config/oauth");

const TOKEN_PATH = path.resolve("/data/tokens.json");

const getAuthUrl = (platform) => {
  return oauth2Client.generateAuthUrl({
    access_type: "offline",
    scope: ["https://www.googleapis.com/auth/spreadsheets"],
    prompt: "consent",
    state: platform,
  });
};

const setTokens = async (code) => {
  try {
    const { tokens } = await oauth2Client.getToken(code);
    fs.writeFileSync(
      TOKEN_PATH,
      JSON.stringify({ ...tokens, refresh_token: tokens.refresh_token })
    );
    oauth2Client.setCredentials(tokens);
  } catch (err) {
    err.message = `Token set failed: ${err.message}`;
    throw err;
  }
};

const initializeAuth = async () => {
  try {
    if (fs.existsSync(TOKEN_PATH)) {
      const tokens = JSON.parse(fs.readFileSync(TOKEN_PATH));
      oauth2Client.setCredentials(tokens);
      console.log("Loaded existing tokens");
    }

    oauth2Client.on("tokens", (newTokens) => {
      let current = {};
      if (fs.existsSync(TOKEN_PATH)) {
        current = JSON.parse(fs.readFileSync(TOKEN_PATH));
      }

      const updatedTokens = {
        ...current,
        ...newTokens,
        refresh_token: newTokens.refresh_token || current.refresh_token,
      };

      fs.writeFileSync(TOKEN_PATH, JSON.stringify(updatedTokens));
      console.log("Tokens updated");
    });
  } catch (err) {
    console.error("Auth error:", err);
    throw err;
  }
};

exports.getAuthUrl = getAuthUrl;
exports.setTokens = setTokens;
exports.initializeAuth = initializeAuth;
