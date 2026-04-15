const express = require("express");
const router = express.Router();
const { upload, handleUploadErrors } = require("../middleware/uploadMiddleware");
const { studentDriveAuth } = require("../middleware/studentDriveAuth");
const {
  createDrive,
  loginDrive,
  getMyDrive,
  getDriveById,
  createFolder,
  addFolderNote,
  uploadFolderFile,
  deleteFolderFile,
} = require("../controllers/studentDriveController");

router.post("/create", createDrive);
router.post("/login", loginDrive);

router.use(studentDriveAuth);

router.get("/me", getMyDrive);
router.get("/:driveId", getDriveById);
router.post("/:driveId/folders", createFolder);
router.post("/:driveId/folders/:folderId/notes", addFolderNote);
router.post(
  "/:driveId/folders/:folderId/files",
  (req, res, next) => {
    upload.single("file")(req, res, (err) => handleUploadErrors(err, req, res, next));
  },
  uploadFolderFile
);
router.delete("/:driveId/folders/:folderId/files/:fileId", deleteFolderFile);

module.exports = router;