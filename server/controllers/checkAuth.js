const isAuthenticated = require("../utils/isAuthenticated");

exports.checkAuth = async (req, res) => {
  try {
    const ok = await isAuthenticated();

    return res.json({
      authenticated: ok,
    });
  } catch (err) {
    console.error("Error checking authentication status:", err);
    return res.status(500).json({
      success: false,
      message: "Failed to check authentication status",
    });
  }
};
