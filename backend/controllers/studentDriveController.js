const StudentDrive = require("../models/StudentDrive");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const fs = require("fs");
const fsPromises = require("fs/promises");
const mongoose = require("mongoose");
const { GridFSBucket, ObjectId } = require("mongodb");

let studentDriveBucket = null;

const getStudentDriveBucket = () => {
  if (!mongoose.connection?.db) {
    throw new Error("Database connection is not ready");
  }

  if (!studentDriveBucket) {
    studentDriveBucket = new GridFSBucket(mongoose.connection.db, {
      bucketName: "studentDriveFiles",
    });
  }

  return studentDriveBucket;
};

const uploadToGridFs = (localPath, filename, contentType) =>
  new Promise((resolve, reject) => {
    const bucket = getStudentDriveBucket();
    const readStream = fs.createReadStream(localPath);
    const writeStream = bucket.openUploadStream(filename, {
      contentType,
      metadata: { source: "student-drive" },
    });

    readStream.on("error", reject);
    writeStream.on("error", reject);
    writeStream.on("finish", () => resolve(writeStream.id));

    readStream.pipe(writeStream);
  });

const findDriveFileById = (drive, fileId) => {
  for (const folder of drive.folders || []) {
    const fileSubdoc = (folder.files || []).id(fileId);
    if (fileSubdoc) {
      return { folder, fileSubdoc };
    }
  }

  return null;
};

const formatDriveResponse = (drive) => ({
  id: drive._id,
  driveId: drive.driveId,
  name: drive.name,
  username: drive.username,
  createdAt: drive.createdAt,
  folders: (drive.folders || []).map((folder) => ({
    id: folder._id,
    name: folder.name,
    parentFolderId: folder.parentFolderId || null,
    createdAt: folder.createdAt,
    files: (folder.files || []).map((file) => ({
      id: file._id,
      name: file.originalName,
      size: file.fileSize,
      mimeType: file.mimeType,
      uploadedAt: file.uploadedAt,
      viewUrl: `/api/student-drive/files/${file._id}/view`,
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
const normalizeUsername = (value = "") => value.trim();
const normalizeUsernameLower = (value = "") => normalizeUsername(value).toLowerCase();
const getJwtSecret = () => process.env.STUDENT_DRIVE_JWT_SECRET || "change-this-student-drive-secret";

const createAuthToken = (drive) =>
  jwt.sign(
    {
      driveId: drive.driveId,
      username: drive.username,
    },
    getJwtSecret(),
    { expiresIn: "7d" }
  );

const getAuthenticatedDrive = async (req) => {
  const driveId = normalizeDriveId(req.studentDriveAuth?.driveId || "");
  if (!driveId) {
    return null;
  }

  return StudentDrive.findOne({ driveId });
};

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
    const username = normalizeUsername(req.body?.username || "");
    const usernameLower = normalizeUsernameLower(req.body?.username || "");
    const password = typeof req.body?.password === "string" ? req.body.password : "";

    if (!username || username.length < 3) {
      return res.status(400).json({ message: "Username must be at least 3 characters" });
    }

    if (!password || password.length < 6) {
      return res.status(400).json({ message: "Password must be at least 6 characters" });
    }

    const existingUser = await StudentDrive.findOne({ usernameLower });
    if (existingUser) {
      return res.status(409).json({ message: "Username already exists" });
    }

    const name = requestedName || "My Student Drive";
    const driveId = await generateDriveId();
    const passwordHash = await bcrypt.hash(password, 10);

    const drive = await StudentDrive.create({
      driveId,
      name,
      username,
      usernameLower,
      passwordHash,
      folders: [],
    });

    const token = createAuthToken(drive);
    return res.status(201).json({ drive: formatDriveResponse(drive), token });
  } catch (error) {
    return res.status(500).json({ message: error.message || "Unable to create drive" });
  }
};

exports.loginDrive = async (req, res) => {
  try {
    const usernameLower = normalizeUsernameLower(req.body?.username || "");
    const password = typeof req.body?.password === "string" ? req.body.password : "";

    if (!usernameLower || !password) {
      return res.status(400).json({ message: "Username and password are required" });
    }

    const drive = await StudentDrive.findOne({ usernameLower });
    if (!drive?.passwordHash) {
      return res.status(401).json({ message: "Invalid username or password" });
    }

    const passwordMatches = await bcrypt.compare(password, drive.passwordHash);
    if (!passwordMatches) {
      return res.status(401).json({ message: "Invalid username or password" });
    }

    const token = createAuthToken(drive);
    return res.json({ drive: formatDriveResponse(drive), token });
  } catch (error) {
    return res.status(500).json({ message: error.message || "Unable to login" });
  }
};

exports.getMyDrive = async (req, res) => {
  try {
    const drive = await getAuthenticatedDrive(req);
    if (!drive) {
      return res.status(404).json({ message: "Drive not found" });
    }

    return res.json({ drive: formatDriveResponse(drive) });
  } catch (error) {
    return res.status(500).json({ message: error.message || "Unable to load drive" });
  }
};

exports.getDriveById = async (req, res) => {
  try {
    const authDriveId = normalizeDriveId(req.studentDriveAuth?.driveId || "");
    const driveId = normalizeDriveId(req.params.driveId);

    if (!authDriveId || authDriveId !== driveId) {
      return res.status(403).json({ message: "Access denied" });
    }

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
    const authDriveId = normalizeDriveId(req.studentDriveAuth?.driveId || "");
    const folderName = typeof req.body?.name === "string" ? req.body.name.trim() : "";
    const requestedParentFolderId = typeof req.body?.parentFolderId === "string" ? req.body.parentFolderId.trim() : "";

    if (!authDriveId || authDriveId !== driveId) {
      return res.status(403).json({ message: "Access denied" });
    }

    if (!folderName) {
      return res.status(400).json({ message: "Folder name is required" });
    }

    const drive = await StudentDrive.findOne({ driveId });
    if (!drive) {
      return res.status(404).json({ message: "Drive not found" });
    }

    if (requestedParentFolderId && !drive.folders.id(requestedParentFolderId)) {
      return res.status(404).json({ message: "Parent folder not found" });
    }

    drive.folders.push({
      name: folderName,
      parentFolderId: requestedParentFolderId || null,
      files: [],
      notes: [],
    });
    await drive.save();

    return res.status(201).json({ drive: formatDriveResponse(drive) });
  } catch (error) {
    return res.status(500).json({ message: error.message || "Unable to create folder" });
  }
};

exports.addFolderNote = async (req, res) => {
  try {
    const driveId = normalizeDriveId(req.params.driveId);
    const authDriveId = normalizeDriveId(req.studentDriveAuth?.driveId || "");
    const folderId = req.params.folderId;
    const title = typeof req.body?.title === "string" ? req.body.title.trim() : "";
    const content = typeof req.body?.content === "string" ? req.body.content.trim() : "";

    if (!title || !content) {
      return res.status(400).json({ message: "Note title and content are required" });
    }

    if (!authDriveId || authDriveId !== driveId) {
      return res.status(403).json({ message: "Access denied" });
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
    const authDriveId = normalizeDriveId(req.studentDriveAuth?.driveId || "");
    const folderId = req.params.folderId;

    if (!req.file) {
      return res.status(400).json({ message: "No file uploaded" });
    }

    if (!authDriveId || authDriveId !== driveId) {
      return res.status(403).json({ message: "Access denied" });
    }

    const drive = await StudentDrive.findOne({ driveId });
    if (!drive) {
      return res.status(404).json({ message: "Drive not found" });
    }

    const folder = drive.folders.id(folderId);
    if (!folder) {
      return res.status(404).json({ message: "Folder not found" });
    }

    let gridFsId = null;
    try {
      gridFsId = await uploadToGridFs(req.file.path, req.file.filename, req.file.mimetype);
    } finally {
      try {
        await fsPromises.unlink(req.file.path);
      } catch {
        // Best-effort local temp cleanup.
      }
    }

    folder.files.push({
      storageType: "gridfs",
      gridFsId,
      fileName: req.file.filename,
      originalName: req.file.originalname,
      filePath: `gridfs:${gridFsId}`,
      fileSize: req.file.size,
      mimeType: req.file.mimetype,
    });

    await drive.save();

    return res.status(201).json({ drive: formatDriveResponse(drive) });
  } catch (error) {
    return res.status(500).json({ message: error.message || "Unable to upload file" });
  }
};

exports.viewFolderFile = async (req, res) => {
  try {
    const fileId = req.params.fileId;
    if (!ObjectId.isValid(String(fileId))) {
      return res.status(400).json({ message: "Invalid file ID" });
    }

    const drive = await StudentDrive.findOne({ "folders.files._id": fileId });
    if (!drive) {
      return res.status(404).json({ message: "File not found" });
    }

    const located = findDriveFileById(drive, fileId);
    if (!located?.fileSubdoc) {
      return res.status(404).json({ message: "File not found" });
    }

    const fileSubdoc = located.fileSubdoc;
    const fileName = fileSubdoc.originalName || "document";
    const mimeType = fileSubdoc.mimeType || "application/octet-stream";

    if (String(fileSubdoc.storageType || "") === "gridfs" && fileSubdoc.gridFsId) {
      const bucket = getStudentDriveBucket();

      res.setHeader("Content-Type", mimeType);
      res.setHeader("Content-Disposition", `inline; filename=\"${fileName}\"`);

      const downloadStream = bucket.openDownloadStream(new ObjectId(fileSubdoc.gridFsId));
      downloadStream.on("error", () => {
        if (!res.headersSent) {
          res.status(404).json({ message: "File not found" });
        }
      });

      return downloadStream.pipe(res);
    }

    // Backward compatibility for legacy disk-stored Student Drive files.
    const diskPath = fileSubdoc.filePath;
    if (diskPath && fs.existsSync(diskPath)) {
      return res.sendFile(diskPath);
    }

    return res.status(404).json({ message: "File not found" });
  } catch (error) {
    return res.status(500).json({ message: error.message || "Unable to open file" });
  }
};

exports.deleteFolderFile = async (req, res) => {
  try {
    const driveId = normalizeDriveId(req.params.driveId);
    const authDriveId = normalizeDriveId(req.studentDriveAuth?.driveId || "");
    const folderId = req.params.folderId;
    const fileId = req.params.fileId;

    if (!authDriveId || authDriveId !== driveId) {
      return res.status(403).json({ message: "Access denied" });
    }

    const drive = await StudentDrive.findOne({ driveId });
    if (!drive) {
      return res.status(404).json({ message: "Drive not found" });
    }

    const folder = drive.folders.id(folderId);
    if (!folder) {
      return res.status(404).json({ message: "Folder not found" });
    }

    const fileSubdoc = folder.files.id(fileId);
    if (!fileSubdoc) {
      return res.status(404).json({ message: "File not found" });
    }

    if (String(fileSubdoc.storageType || "") === "gridfs" && fileSubdoc.gridFsId) {
      try {
        const bucket = getStudentDriveBucket();
        await bucket.delete(new ObjectId(fileSubdoc.gridFsId));
      } catch (deleteErr) {
        console.error("[StudentDrive Delete Warn] Failed to remove GridFS file:", deleteErr.message);
      }
    }

    const diskPath = fileSubdoc.filePath;
    if (diskPath && !String(diskPath).startsWith("gridfs:") && fs.existsSync(diskPath)) {
      try {
        fs.unlinkSync(diskPath);
      } catch (unlinkError) {
        console.error("[StudentDrive Delete Warn] Failed to remove file from disk:", unlinkError.message);
      }
    }

    folder.files.pull({ _id: fileId });
    await drive.save();

    return res.json({ drive: formatDriveResponse(drive) });
  } catch (error) {
    return res.status(500).json({ message: error.message || "Unable to delete file" });
  }
};
