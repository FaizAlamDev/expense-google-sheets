const { uploadDbToS3 } = require("./s3Backup");
const logger = require("./logger");

function startBackupScheduler() {
  const TWELVE_HOURS_MS = 12 * 60 * 60 * 1000;

  const runScheduledBackup = async () => {
    logger.info("Executing scheduled S3 database backup...");
    try {
      await uploadDbToS3();
    } catch (err) {
      logger.error(`Scheduled S3 backup failed: ${err.message}`);
    }
  };

  // Run 10 seconds after server starts, then repeat every 12 hours
  setTimeout(() => {
    runScheduledBackup();
    setInterval(runScheduledBackup, TWELVE_HOURS_MS);
  }, 10000);

  logger.info("S3 backup scheduler initialized (every 12 hours).");
}

module.exports = { startBackupScheduler };
