const File = require("../models/File");
const fs = require("fs");
const path = require("path");

const uploadsDir = path.resolve("uploads");
const fileRetentionHours = Number(process.env.FILE_RETENTION_HOURS || process.env.ROOM_EXPIRY_HOURS || 3);
const staleThresholdMs = fileRetentionHours * 60 * 60 * 1000;

/**
 * Cleanup expired files: removes both DB records and physical files from disk
 */
const cleanupExpiredFiles = async () => {
  try {
    let expiredFiles = [];
    let activeFiles = [];

    try {
      const now = new Date();
      expiredFiles = await File.find({ expiresAt: { $lte: now } });
      activeFiles = await File.find({}, { fileName: 1, filePath: 1 }).lean();
    } catch (dbError) {
      console.error("[Cleanup Warn] DB query failed; continuing with orphan disk cleanup:", dbError.message);
    }

    const deletedEntries = [];
    const activeFileNames = new Set(activeFiles.map((f) => f.fileName).filter(Boolean));

    for (const file of expiredFiles) {
      try {
        // Delete physical file from disk if it exists
        if (file.filePath && fs.existsSync(file.filePath)) {
          fs.unlinkSync(file.filePath);
          console.log(`[Cleanup] Deleted file from disk: ${file.filePath}`);
        }

        // Delete DB record
        await File.deleteOne({ _id: file._id });
        console.log(`[Cleanup] Removed DB record: ${file.originalName} (Room: ${file.roomId})`);
        deletedEntries.push(`${file.originalName} (Room: ${file.roomId})`);
      } catch (err) {
        console.error(`[Cleanup Error] Failed to cleanup file ${file._id}:`, err.message);
      }
    }

    // Also remove orphan disk files older than retention threshold that no longer exist in DB.
    let orphanDeletedCount = 0;
    if (fs.existsSync(uploadsDir)) {
      const diskFiles = fs.readdirSync(uploadsDir, { withFileTypes: true });

      for (const entry of diskFiles) {
        if (!entry.isFile()) continue;

        const absolutePath = path.join(uploadsDir, entry.name);
        const stats = fs.statSync(absolutePath);
        const ageMs = Date.now() - stats.mtimeMs;

        // Skip fresh files and files still tracked in DB.
        if (ageMs < staleThresholdMs || activeFileNames.has(entry.name)) {
          continue;
        }

        try {
          fs.unlinkSync(absolutePath);
          orphanDeletedCount += 1;
          console.log(`[Cleanup] Deleted orphan disk file: ${entry.name}`);
        } catch (err) {
          console.error(`[Cleanup Error] Failed to delete orphan file ${entry.name}:`, err.message);
        }
      }
    }

    if (deletedEntries.length === 0 && orphanDeletedCount === 0) {
      console.log("[Cleanup] No expired files to remove");
      return;
    }

    console.log(`[Cleanup] Completed: removed ${deletedEntries.length} expired DB file(s), ${orphanDeletedCount} orphan disk file(s)`);
    if (deletedEntries.length > 0) {
      console.log("[Cleanup] Deleted files this run:");
      deletedEntries.forEach((entry) => console.log(`  - ${entry}`));
    }
  } catch (error) {
    console.error("[Cleanup Error] Failed to cleanup expired files:", error.message);
  }
};

const formatSeconds = (totalSeconds) => {
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
};

/**
 * Start cleanup interval: runs every 30 minutes
 */
const startCleanupInterval = () => {
  const cleanupIntervalMinutes = 5;
  const cleanupIntervalMs = cleanupIntervalMinutes * 60 * 1000;
  const cleanupIntervalSeconds = Math.floor(cleanupIntervalMs / 1000);

  let secondsRemaining = cleanupIntervalSeconds;

  setInterval(cleanupExpiredFiles, cleanupIntervalMs);
  console.log(`[Cleanup] Started cleanup interval (every ${cleanupIntervalMinutes} minutes)`);

  setInterval(() => {
    secondsRemaining -= 1;

    if (secondsRemaining <= 0) {
      console.log("[Cleanup] Countdown reached 00:00. Running cleanup now...");
      secondsRemaining = cleanupIntervalSeconds;
      return;
    }

    // Log every 30 seconds, and every second in the final 10 seconds.
    if (secondsRemaining % 30 === 0 || secondsRemaining <= 10) {
      console.log(`[Cleanup] Next cleanup in ${formatSeconds(secondsRemaining)}`);
    }
  }, 1000);

  // Run once immediately on startup
  cleanupExpiredFiles();
};

module.exports = { cleanupExpiredFiles, startCleanupInterval };
