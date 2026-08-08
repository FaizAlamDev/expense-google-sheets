const fs = require("fs");
const path = require("path");
const oauth2Client = require("../config/oauth");
const logger = require("./logger");

const TOKEN_PATH = fs.existsSync("/data")
  ? "/data/tokens.json"
  : path.resolve(__dirname, "../tokens.json");

const getAuthUrl = (state) => {
  return oauth2Client.generateAuthUrl({
    access_type: "offline",
    scope: ["https://www.googleapis.com/auth/spreadsheets"],
    prompt: "consent",
    state: state,
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
      logger.info("Loaded existing OAuth tokens");
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
      logger.info("OAuth tokens updated");
    });
  } catch (err) {
    logger.error("OAuth initialization error:", err);
    throw err;
  }
};

exports.getAuthUrl = getAuthUrl;
exports.setTokens = setTokens;
exports.initializeAuth = initializeAuth;

