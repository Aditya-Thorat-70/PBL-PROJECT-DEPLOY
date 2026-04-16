const express = require("express");
const router = express.Router();
const { createRoom, getRoomById, activateRoomOnPc } = require("../controllers/roomController");

router.post("/create", createRoom);
router.post("/:roomId/activate-pc", activateRoomOnPc);
router.get("/:roomId", getRoomById);

module.exports = router;
