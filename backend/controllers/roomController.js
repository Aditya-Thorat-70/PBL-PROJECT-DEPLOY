const Room = require("../models/Room");
const crypto = require("crypto");

exports.createRoom = async (req, res) => {
  try {
    const roomId = crypto.randomUUID().replace(/-/g, '').slice(0, 6).toUpperCase();

    const expiresAt = new Date(Date.now() + 3 * 60 * 60 * 1000);

    const room = await Room.create({
      roomId,
      expiresAt
    });

    res.json(room);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.getRoomById = async (req, res) => {
  try {
    const { roomId } = req.params;

    const room = await Room.findOne({ roomId });

    if (!room) {
      return res.status(404).json({ message: "Room not found" });
    }

    // Check if room is expired
    if (new Date() > room.expiresAt) {
      return res.status(410).json({ message: "Room has expired" });
    }

    res.json({
      roomId: room.roomId,
      createdAt: room.createdAt,
      expiresAt: room.expiresAt,
      isActive: true
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
