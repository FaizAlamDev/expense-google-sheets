const { S3Client, PutObjectCommand } = require("@aws-sdk/client-s3");
const fs = require("fs");
const path = require("path");
const { getDbInstance, DB_PATH } = require("./db");
const logger = require("./logger");

async function uploadDbToS3() {
  const bucketName = process.env.AWS_S3_BUCKET;
  const accessKeyId = process.env.AWS_ACCESS_KEY_ID;
  const secretAccessKey = process.env.AWS_SECRET_ACCESS_KEY;
  const region = process.env.AWS_REGION || "us-east-1";

  if (!bucketName || !accessKeyId || !secretAccessKey) {
    logger.warn("S3 backup skipped: S3 environment variables not configured.");
    return { success: false, reason: "Credentials not configured" };
  }

  const db = getDbInstance();
  if (!db) {
    logger.warn("S3 backup skipped: Database instance is not available.");
    return { success: false, reason: "Database not initialized" };
  }

  const snapshotPath = path.join(path.dirname(DB_PATH), `snapshot_${Date.now()}.db`);
  try {
    logger.info(`Creating database snapshot: ${snapshotPath}`);
    await db.run(`VACUUM INTO ?`, [snapshotPath]);
  } catch (err) {
    logger.error(`Failed to create database snapshot: ${err.message}`);
    throw err;
  }

  try {
    const s3 = new S3Client({
      region,
      credentials: {
        accessKeyId,
        secretAccessKey,
      },
    });

    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, "0");
    const day = String(now.getDate()).padStart(2, "0");
    const hours = String(now.getHours()).padStart(2, "0");
    const minutes = String(now.getMinutes()).padStart(2, "0");
    const seconds = String(now.getSeconds()).padStart(2, "0");
    
    const key = `backups/${year}/${month}/${day}/${hours}-${minutes}-${seconds}.db`;

    logger.info(`Uploading snapshot to S3: s3://${bucketName}/${key}`);
    const fileStream = fs.createReadStream(snapshotPath);
    await s3.send(
      new PutObjectCommand({
        Bucket: bucketName,
        Key: key,
        Body: fileStream,
      })
    );

    logger.info(`S3 backup uploaded successfully: ${key}`);
    return { success: true, key };
  } finally {
    if (fs.existsSync(snapshotPath)) {
      try {
        fs.unlinkSync(snapshotPath);
        logger.debug(`Deleted temporary snapshot: ${snapshotPath}`);
      } catch (cleanupErr) {
        logger.error(`Failed to delete temporary snapshot: ${cleanupErr.message}`);
      }
    }
  }
}

module.exports = { uploadDbToS3 };
