const { getAuthUrl, setTokens } = require("../utils/auth");

exports.initiateAuth = (req, res) => {
  const platform = req.query.platform || "web";
  const url = getAuthUrl(platform);
  res.redirect(url);
};

exports.authCallback = async (req, res) => {
  try {
    const { code, state } = req.query;
    await setTokens(code);

    if (state === "mobile") {
      const MOBILE_URL = "expenseSheetsApp://redirect";
      res.redirect(MOBILE_URL);
    } else {
      const FRONTEND_URL = process.env.FRONTEND_URL || "http://localhost:5173";
      res.redirect(FRONTEND_URL);
    }
  } catch (err) {
    res.status(500).send(`Error: ${err.message}`);
  }
};
