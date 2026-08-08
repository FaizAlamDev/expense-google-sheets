const isAuthenticated = require("../utils/isAuthenticated");
const logger = require("../utils/logger");

async function requireAuth(req, res, next) {
  try {
    const authorized = await isAuthenticated();
    if (!authorized) {
      logger.warn("Rejected unauthorized backup endpoint request");
      return res.status(401).json({ error: "Unauthorized" });
    }
    next();
  } catch (err) {
    logger.error(`Auth middleware error: ${err.message}`);
    res.status(500).json({ error: "Internal server error during authentication" });
  }
}

module.exports = requireAuth;
