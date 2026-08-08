const db = require("../utils/db");
const logger = require("../utils/logger");

exports.availableSlots = async (req, res) => {
  try {
    const { date } = req.query;

    if (!date) {
      return res.status(400).json({
        success: false,
        message: "Date query parameter is required",
      });
    }

    const availableSlots = await db.getAvailableSlots(date);

    return res.json({ success: true, availableSlots });
  } catch (err) {
    logger.error("Error fetching available slots:", err);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch available slots",
    });
  }
};

