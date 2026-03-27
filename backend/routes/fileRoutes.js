const express = require("express");
const router = express.Router();
const { upload, handleUploadErrors } = require("../middleware/uploadMiddleware");
const { uploadFile, getFilesByRoom, downloadFile } = require("../controllers/fileController");

// Single file upload
router.post("/upload", (req, res, next) => {
	upload.single("file")(req, res, (err) => handleUploadErrors(err, req, res, next));
}, uploadFile);

// Get all files for a specific room
router.get("/room/:roomId", getFilesByRoom);

// Download a specific file
router.get("/download/:fileId", downloadFile);

module.exports = router;
