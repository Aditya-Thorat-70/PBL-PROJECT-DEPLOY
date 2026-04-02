const jwt = require("jsonwebtoken");

const getJwtSecret = () => process.env.STUDENT_DRIVE_JWT_SECRET || "change-this-student-drive-secret";

exports.studentDriveAuth = (req, res, next) => {
  const authorization = req.headers.authorization || "";
  const [scheme, token] = authorization.split(" ");

  if (scheme !== "Bearer" || !token) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  try {
    const payload = jwt.verify(token, getJwtSecret());
    req.studentDriveAuth = {
      driveId: payload.driveId,
      username: payload.username,
    };
    return next();
  } catch {
    return res.status(401).json({ message: "Session expired. Please login again." });
  }
};
