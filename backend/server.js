const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const http = require("http");
const path = require("path");
const fs = require("fs");
const { Server } = require("socket.io");
require("dotenv").config();

const isBenignLibreOfficeTmpCleanupError = (error) => {
  if (!error) return false;
  return (
    error.code === "ENOTEMPTY" &&
    error.syscall === "rmdir" &&
    typeof error.path === "string" &&
    error.path.includes("libreofficeConvert_")
  );
};

process.on("uncaughtException", (error) => {
  if (isBenignLibreOfficeTmpCleanupError(error)) {
    console.warn("[Warn] Ignored LibreOffice temp cleanup race on Windows:", error.path);
    return;
  }

  console.error("[Fatal] Uncaught exception:", error);
  process.exit(1);
});

const { startCleanupInterval } = require("./utils/deleteExpiredFiles");

const app = express();
const server = http.createServer(app);

const uploadsDir = path.resolve(__dirname, "uploads");
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

const parseAllowedOrigins = () => {
  const origins = process.env.CORS_ORIGIN || process.env.CORS_ORIGINS || "";
  return origins
    .split(",")
    .map((origin) => origin.trim())
    .filter(Boolean);
};

const allowedOrigins = parseAllowedOrigins();

const isOriginAllowed = (origin) => {
  if (!origin) return true;
  if (allowedOrigins.length === 0) return true;
  if (allowedOrigins.includes("*")) return true;
  return allowedOrigins.includes(origin);
};

const corsOriginHandler = (origin, callback) => {
  if (isOriginAllowed(origin)) {
    return callback(null, true);
  }

  return callback(new Error("Origin not allowed by CORS"));
};

const corsOptions = {
  origin: corsOriginHandler,
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  credentials: false,
};

const io = new Server(server, {
  cors: {
    origin: corsOriginHandler,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    credentials: false,
  }
});

app.set("trust proxy", true);
app.use(cors(corsOptions));
app.use(express.json());
app.use("/uploads", express.static(uploadsDir));

app.get("/api/health", (req, res) => {
  res.status(200).json({
    status: "ok",
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
  });
});

// Make io accessible to routes
app.set('io', io);

app.use("/api/rooms", require("./routes/roomRoutes"));
app.use("/api/files", require("./routes/fileRoutes"));
app.use("/api/student-drive", require("./routes/studentDriveRoutes"));

app.use((err, req, res, next) => {
  if (res.headersSent) {
    return next(err);
  }

  if (err?.name === "MulterError" && err?.code === "LIMIT_FILE_SIZE") {
    const sizeLimitMb = Number(process.env.MAX_UPLOAD_SIZE_MB || 50);
    return res.status(413).json({
      message: `File too large. Maximum allowed size is ${sizeLimitMb}MB.`,
    });
  }

  if (typeof err?.message === "string" && err.message.includes("Unsupported file type")) {
    return res.status(400).json({
      message: err.message,
    });
  }

  console.error("[API Error]", err?.message || err);
  return res.status(500).json({
    message: "Internal server error",
  });
});

// Socket.io connection handling
io.on("connection", (socket) => {
  console.log("Client connected:", socket.id);

  // Join a specific room
  socket.on("join-room", (roomId) => {
    socket.join(roomId);
    console.log(`Client ${socket.id} joined room: ${roomId}`);
    socket.emit("joined-room", { roomId, message: "Successfully joined room" });
  });

  // Leave a room
  socket.on("leave-room", (roomId) => {
    socket.leave(roomId);
    console.log(`Client ${socket.id} left room: ${roomId}`);
  });

  socket.on("disconnect", () => {
    console.log("Client disconnected:", socket.id);
  });
});

const PORT = process.env.PORT || 5000;
const MONGO_URI = process.env.MONGO_URI;

const startServer = async () => {
  if (!MONGO_URI) {
    throw new Error("Missing MONGO_URI. Add it to backend environment variables.");
  }

  await mongoose.connect(MONGO_URI);
  console.log("MongoDB Connected");
  startCleanupInterval();

  server.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
};

startServer().catch((error) => {
  console.error("[Startup Error]", error?.message || error);
  process.exit(1);
});
