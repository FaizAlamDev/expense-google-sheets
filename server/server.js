require("dotenv").config();
const express = require("express");
const cors = require("cors");
const { initializeAuth } = require("./utils/auth");
const { initializeDb } = require("./utils/db");
const { startBackupScheduler } = require("./utils/scheduler");
const logger = require("./utils/logger");
const routes = require("./routes");

const app = express();

app.use(cors());
app.use(express.json());
app.use("/", routes);

initializeAuth()
  .then(() => initializeDb())
  .then(() => {
    startBackupScheduler();

    const PORT = process.env.PORT || 3000;
    app.listen(PORT, "0.0.0.0", () => {
      logger.info(`Server listening on PORT ${PORT}`);
    });
  })
  .catch((err) => {
    logger.error("Fatal initialization error:", err);
    process.exit(1);
  });
