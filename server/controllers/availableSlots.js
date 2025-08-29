const { google } = require("googleapis");
const { getAvailableSlots } = require("../utils/getAvailableSlots");
const oauth2Client = require("../config/oauth");

exports.availableSlots = async (req, res) => {
  try {
    const { date } = req.query;

    if (!date) {
      return res.status(400).json({
        success: false,
        message: "Date query parameter is required",
      });
    }

    const sheets = google.sheets({ version: "v4", auth: oauth2Client });

    const { availableSlots } = await getAvailableSlots(sheets, date);

    return res.json({ success: true, availableSlots });
  } catch (err) {
    console.error("Error fetching available slots:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch available slots",
    });
  }
};
