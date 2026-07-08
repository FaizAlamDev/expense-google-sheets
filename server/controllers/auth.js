const { getAuthUrl, setTokens } = require("../utils/auth");

exports.initiateAuth = (req, res) => {
  const platform = req.query.platform || "web";
  const redirectUri = req.query.redirect_uri;

  let state = platform;
  if (platform === "mobile" && redirectUri) {
    state = `mobile:${redirectUri}`;
  }

  const url = getAuthUrl(state);
  res.redirect(url);
};

exports.authCallback = async (req, res) => {
  try {
    const { code, state } = req.query;
    await setTokens(code);

    if (state && state.startsWith("mobile:")) {
      const clientRedirectUri = state.slice("mobile:".length);
      res.redirect(clientRedirectUri);
    } else if (state === "mobile") {
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
