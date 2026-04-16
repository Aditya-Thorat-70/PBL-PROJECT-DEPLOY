const mongoose = require("mongoose");

const fileSchema = new mongoose.Schema({
  roomId: {
    type: String,
    required: true
  },
  fileName: String, // Generated unique filename
  originalName: String, // Original filename from upload
  filePath: String,
  fileSize: Number, // File size in bytes
  mimeType: String, // File MIME type
  uploadSource: {
    type: String,
    enum: ['pc', 'mobile', 'scanner', 'unknown'],
    default: 'unknown'
  },
  uploadedAt: {
    type: Date,
    default: Date.now
  },
  expiresAt: {
    type: Date,
    required: true
  }
});

module.exports = mongoose.model("File", fileSchema);
