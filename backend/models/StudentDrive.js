const mongoose = require("mongoose");

const driveFileSchema = new mongoose.Schema(
  {
    fileName: { type: String, required: true },
    originalName: { type: String, required: true },
    filePath: { type: String, required: true },
    fileSize: { type: Number, required: true },
    mimeType: { type: String, required: true },
    uploadedAt: { type: Date, default: Date.now },
  },
  { _id: true }
);

const driveNoteSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    content: { type: String, required: true, trim: true },
    createdAt: { type: Date, default: Date.now },
  },
  { _id: true }
);

const driveFolderSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    createdAt: { type: Date, default: Date.now },
    files: { type: [driveFileSchema], default: [] },
    notes: { type: [driveNoteSchema], default: [] },
  },
  { _id: true }
);

const studentDriveSchema = new mongoose.Schema({
  driveId: {
    type: String,
    required: true,
    unique: true,
    uppercase: true,
    trim: true,
  },
  name: {
    type: String,
    required: true,
    trim: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  folders: {
    type: [driveFolderSchema],
    default: [],
  },
});

module.exports = mongoose.model("StudentDrive", studentDriveSchema);