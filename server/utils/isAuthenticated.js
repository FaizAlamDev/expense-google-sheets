const oauth2Client = require("../config/oauth");

async function isAuthenticated() {
  try {
    const tokenRes = await oauth2Client.getAccessToken();

    if (!tokenRes || !tokenRes.token) {
      return false;
    }

    return true;
  } catch (err) {
    console.error("Auth check failed:", err.message);
    return false;
  }
}

module.exports = isAuthenticated;
