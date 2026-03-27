const express = require("express");
const router = express.Router();
const { upload, handleUploadErrors } = require("../middleware/uploadMiddleware");
const {
  createDrive,
  getDriveById,
  createFolder,
  addFolderNote,
  uploadFolderFile,
} = require("../controllers/studentDriveController");

router.post("/create", createDrive);
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

module.exports = router;