const StudentDrive = require("../models/StudentDrive");

const formatDriveResponse = (drive) => ({
  id: drive._id,
  driveId: drive.driveId,
  name: drive.name,
  createdAt: drive.createdAt,
  folders: (drive.folders || []).map((folder) => ({
    id: folder._id,
    name: folder.name,
    createdAt: folder.createdAt,
    files: (folder.files || []).map((file) => ({
      id: file._id,
      name: file.originalName,
      size: file.fileSize,
      mimeType: file.mimeType,
      uploadedAt: file.uploadedAt,
      viewUrl: `/uploads/${file.fileName}`,
    })),
    notes: (folder.notes || []).map((note) => ({
      id: note._id,
      title: note.title,
      content: note.content,
      createdAt: note.createdAt,
    })),
  })),
});

const normalizeDriveId = (value = "") => value.trim().toUpperCase();

const generateDriveId = async () => {
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

  for (let attempt = 0; attempt < 10; attempt += 1) {
    let id = "";
    for (let index = 0; index < 8; index += 1) {
      id += alphabet[Math.floor(Math.random() * alphabet.length)];
    }

    // eslint-disable-next-line no-await-in-loop
    const exists = await StudentDrive.exists({ driveId: id });
    if (!exists) return id;
  }

  throw new Error("Could not generate unique drive ID");
};

exports.createDrive = async (req, res) => {
  try {
    const requestedName = typeof req.body?.name === "string" ? req.body.name.trim() : "";
    const name = requestedName || "My Student Drive";
    const driveId = await generateDriveId();

    const drive = await StudentDrive.create({
      driveId,
      name,
      folders: [],
    });

    return res.status(201).json({ drive: formatDriveResponse(drive) });
  } catch (error) {
    return res.status(500).json({ message: error.message || "Unable to create drive" });
  }
};

exports.getDriveById = async (req, res) => {
  try {
    const driveId = normalizeDriveId(req.params.driveId);
    const drive = await StudentDrive.findOne({ driveId });

    if (!drive) {
      return res.status(404).json({ message: "Drive not found" });
    }

    return res.json({ drive: formatDriveResponse(drive) });
  } catch (error) {
    return res.status(500).json({ message: error.message || "Unable to load drive" });
  }
};

exports.createFolder = async (req, res) => {
  try {
    const driveId = normalizeDriveId(req.params.driveId);
    const folderName = typeof req.body?.name === "string" ? req.body.name.trim() : "";

    if (!folderName) {
      return res.status(400).json({ message: "Folder name is required" });
    }

    const drive = await StudentDrive.findOne({ driveId });
    if (!drive) {
      return res.status(404).json({ message: "Drive not found" });
    }

    drive.folders.push({ name: folderName, files: [], notes: [] });
    await drive.save();

    return res.status(201).json({ drive: formatDriveResponse(drive) });
  } catch (error) {
    return res.status(500).json({ message: error.message || "Unable to create folder" });
  }
};

exports.addFolderNote = async (req, res) => {
  try {
    const driveId = normalizeDriveId(req.params.driveId);
    const folderId = req.params.folderId;
    const title = typeof req.body?.title === "string" ? req.body.title.trim() : "";
    const content = typeof req.body?.content === "string" ? req.body.content.trim() : "";

    if (!title || !content) {
      return res.status(400).json({ message: "Note title and content are required" });
    }

    const drive = await StudentDrive.findOne({ driveId });
    if (!drive) {
      return res.status(404).json({ message: "Drive not found" });
    }

    const folder = drive.folders.id(folderId);
    if (!folder) {
      return res.status(404).json({ message: "Folder not found" });
    }

    folder.notes.push({ title, content });
    await drive.save();

    return res.status(201).json({ drive: formatDriveResponse(drive) });
  } catch (error) {
    return res.status(500).json({ message: error.message || "Unable to add note" });
  }
};

exports.uploadFolderFile = async (req, res) => {
  try {
    const driveId = normalizeDriveId(req.params.driveId);
    const folderId = req.params.folderId;

    if (!req.file) {
      return res.status(400).json({ message: "No file uploaded" });
    }

    const drive = await StudentDrive.findOne({ driveId });
    if (!drive) {
      return res.status(404).json({ message: "Drive not found" });
    }

    const folder = drive.folders.id(folderId);
    if (!folder) {
      return res.status(404).json({ message: "Folder not found" });
    }

    folder.files.push({
      fileName: req.file.filename,
      originalName: req.file.originalname,
      filePath: req.file.path,
      fileSize: req.file.size,
      mimeType: req.file.mimetype,
    });

    await drive.save();

    return res.status(201).json({ drive: formatDriveResponse(drive) });
  } catch (error) {
    return res.status(500).json({ message: error.message || "Unable to upload file" });
  }
};
