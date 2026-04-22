const File = require("../models/File");
const Room = require("../models/Room");
const path = require("path");
const fs = require("fs");
const fsPromises = require("fs/promises");
const { convertFileToPdf } = require("../utils/convertToPdf");

const ROOM_EXPIRY_48_HOURS_MS = 48 * 60 * 60 * 1000;
const ROOM_EXPIRY_10_MINUTES_MS = 10 * 60 * 1000;
const VALID_UPLOAD_SOURCES = new Set(["pc", "mobile", "scanner"]);

exports.uploadFile = async (req, res) => {
  try {
    const { roomId, uploadSource } = req.body;
    const normalizedRoomId = String(roomId || "").toUpperCase().trim();
    const normalizedUploadSource = String(uploadSource || "unknown").toLowerCase().trim();
    const resolvedUploadSource = VALID_UPLOAD_SOURCES.has(normalizedUploadSource)
      ? normalizedUploadSource
      : "unknown";
    const isScannerUpload = resolvedUploadSource === "scanner";

    if (!normalizedRoomId) {
      return res.status(400).json({ message: "Room ID is required" });
    }

    if (!req.file) {
      return res.status(400).json({ message: "No file uploaded" });
    }

    if (isScannerUpload) {
      const existingRoom = await Room.findOne({ roomId: normalizedRoomId });

      // Scanner links may point to a room id that is not yet persisted in DB.
      // Allow first upload to create it, but block reuse of an already-expired room.
      if (existingRoom && new Date() > existingRoom.expiresAt) {
        return res.status(410).json({ message: "Room has expired" });
      }
    }

    let fileName = req.file.filename;
    let filePath = req.file.path;
    let originalName = req.file.originalname;
    let mimeType = req.file.mimetype;
    let fileSize = req.file.size;
    let conversionWarning = null;

    // Convert non-PDF uploads to PDF so dashboard consistently handles a single print format.
    if (mimeType !== "application/pdf") {
      const baseName = path.parse(req.file.filename).name;
      const convertedFileName = `${baseName}.pdf`;
      const convertedFilePath = path.join(path.dirname(req.file.path), convertedFileName);

      try {
        await convertFileToPdf(req.file.path, convertedFilePath);
        await fsPromises.unlink(req.file.path);

        const convertedStats = await fsPromises.stat(convertedFilePath);
        fileName = convertedFileName;
        filePath = convertedFilePath;
        originalName = `${path.parse(req.file.originalname).name}.pdf`;
        mimeType = "application/pdf";
        fileSize = convertedStats.size;
      } catch (convertError) {
        // Keep original upload when conversion isn't possible on this host.
        conversionWarning = "Uploaded original file. PDF conversion is currently unavailable for this file.";
        console.warn("[Upload Warn] PDF conversion failed, original file kept:", convertError.message);
      }
    }

    const roomTimerMode = isScannerUpload ? "scanner-10m" : "standard-48h";
    const expiresAt = new Date(
      Date.now() + (isScannerUpload ? ROOM_EXPIRY_10_MINUTES_MS : ROOM_EXPIRY_48_HOURS_MS)
    );

    await Room.updateOne(
      { roomId: normalizedRoomId },
      {
        $set: {
          expiresAt,
          timerMode: roomTimerMode,
        },
        $setOnInsert: {
          roomId: normalizedRoomId,
        },
      },
      { upsert: true }
    );

    const newFile = await File.create({
      roomId: normalizedRoomId,
      fileName,
      originalName,
      filePath,
      fileSize,
      mimeType,
      uploadSource: resolvedUploadSource,
      expiresAt
    });

    // Keep all files in the same room aligned with the current room timer.
    await File.updateMany({ roomId: normalizedRoomId }, { $set: { expiresAt } });

    // Emit real-time event to all clients in the room
    const io = req.app.get('io');
    io.to(normalizedRoomId).emit('file-uploaded', {
      file: newFile,
      message: 'New file uploaded'
    });

    res.status(200).json({
      message: "File uploaded successfully",
      file: newFile,
      roomTimerMode,
      conversionWarning,
    });

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.getFilesByRoom = async (req, res) => {
  try {
    const roomId = String(req.params.roomId || "").toUpperCase().trim();

    const room = await Room.findOne({ roomId });
    if (!room) {
      return res.status(404).json({ message: "Room not found" });
    }

    if (new Date() > room.expiresAt) {
      return res.status(410).json({ message: "Room has expired" });
    }

    const files = await File.find({ roomId }).sort({ uploadedAt: -1 });

    res.json({
      roomId,
      count: files.length,
      files
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.downloadFile = async (req, res) => {
  try {
    const { fileId } = req.params;

    const file = await File.findById(fileId);

    if (!file) {
      return res.status(404).json({ message: "File not found" });
    }

    const filePath = path.resolve(file.filePath);

    // Check if file exists
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ message: "File not found on server" });
    }

    res.download(filePath, file.originalName);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
