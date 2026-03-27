const express = require("express");
const router = express.Router();
const { createRoom, getRoomById } = require("../controllers/roomController");

router.post("/create", createRoom);
router.get("/:roomId", getRoomById);

module.exports = router;
