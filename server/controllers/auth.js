const { getAuthUrl, setTokens } = require("../utils/auth");

exports.initiateAuth = (req, res) => {
  const url = getAuthUrl();
  res.redirect(url);
};

exports.authCallback = async (req, res) => {
  try {
    const { code } = req.query;
    await setTokens(code);
    res.send("Authentication successful! You can now post data");
  } catch (err) {
    res.status(500).send(`Error: ${err.message}`);
  }
};
