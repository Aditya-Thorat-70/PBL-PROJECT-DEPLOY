const multer = require("multer");
const path = require("path");
const fs = require("fs");

// Ensure uploads folder exists
const uploadDir = "uploads/";
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir);
}

// Storage configuration
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    const uniqueName =
      Date.now() + "-" + Math.round(Math.random() * 1e9) +
      path.extname(file.originalname);

    cb(null, uniqueName);
  }
});

// File filter (allowed types)
const fileFilter = (req, file, cb) => {
  const allowedTypes = [
    "application/pdf",
    "image/jpeg",
    "image/png",
    "image/webp",
    "application/msword",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    "application/vnd.ms-powerpoint",
    "application/vnd.openxmlformats-officedocument.presentationml.presentation",
    "application/vnd.ms-excel",
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    "text/plain"
  ];

  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error("Unsupported file type. Upload PDF, images, Office docs, or text files."), false);
  }
};

// Multer configuration
const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: Number(process.env.MAX_UPLOAD_SIZE_MB || 50) * 1024 * 1024
  }
});

const handleUploadErrors = (err, req, res, next) => {
  if (!err) {
    return next();
  }

  if (err instanceof multer.MulterError && err.code === "LIMIT_FILE_SIZE") {
    const sizeLimitMb = Number(process.env.MAX_UPLOAD_SIZE_MB || 50);
    return res.status(413).json({
      message: `File too large. Maximum allowed size is ${sizeLimitMb}MB.`,
    });
  }

  if (err.message && err.message.includes("Unsupported file type")) {
    return res.status(400).json({
      message: err.message,
    });
  }

  return next(err);
};

module.exports = { upload, handleUploadErrors };
