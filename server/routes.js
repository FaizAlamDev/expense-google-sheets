const express = require("express");
const { initiateAuth, authCallback } = require("./controllers/auth");
const { postExpenses } = require("./controllers/expenses");
const { availableSlots } = require("./controllers/availableSlots");

const router = express.Router();

router.get("/auth", initiateAuth);
router.get("/auth/callback", authCallback);
router.get("/api/getAvailableSlots", availableSlots);
router.post("/api/expenses", postExpenses);

module.exports = router;
