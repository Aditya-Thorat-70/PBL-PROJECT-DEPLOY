const mongoose = require("mongoose");

const roomSchema = new mongoose.Schema({
  roomId: {
    type: String,
    required: true,
    unique: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  expiresAt: {
    type: Date,
    required: true
  },
  timerMode: {
    type: String,
    enum: ["standard-48h", "scanner-10m", "pc-open-10m"],
    default: "standard-48h"
  },
  isInUse: {
    type: Boolean,
    default: false
  }
});
roomSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

module.exports = mongoose.model("Room", roomSchema);
