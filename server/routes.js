const express = require("express");
const { initiateAuth, authCallback } = require("./controllers/auth");

const router = express.Router();

router.get("/auth", initiateAuth);
router.get("/auth/callback", authCallback);

module.exports = router;
