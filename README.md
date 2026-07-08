# QuickPrint / Student Drive

This project is a full-stack file sharing and printing system with two modes:

- QuickPrint room-based printing for temporary, QR-driven uploads
- Student Drive for persistent, login-protected storage

The backend is built with Express, MongoDB, Socket.IO, Multer, JWT, GridFS, and PDF conversion utilities.

## Project Overview

The app is split into two major flows:

1. QuickPrint creates a temporary room, lets a mobile user upload files, and shows those files instantly on the PC dashboard.
2. Student Drive lets a user create an account, log in, and manage permanent folders, notes, and files.

The frontend is a Vite + React app that talks to the backend through the API wrapper in `frontend/src/utils/api.js`.

## Backend Flow

### 1. Server startup

The backend entry point is `backend/server.js`.

When the server starts, it:

- loads environment variables
- creates the Express app and HTTP server
- connects Socket.IO to the HTTP server
- creates the uploads directory if it does not exist
- configures CORS
- serves the `/uploads` folder as static files
- mounts the API routes
- connects to MongoDB
- starts the cleanup interval
- listens on the configured port

The health check endpoint is `GET /api/health`.

### 2. Room-based printing flow

This flow is for temporary printing sessions.

#### Room creation

`POST /api/rooms/create` creates a new room.

The room controller:

- generates a 6-character uppercase room ID
- sets the initial expiry time
- saves the room in MongoDB

The room schema is defined in `backend/models/Room.js`.

#### Room open / activate on PC

`POST /api/rooms/:roomId/activate-pc` is used when the PC opens the room.

This action:

- verifies that the room exists
- checks that it has not expired
- extends the room timer to 10 minutes
- changes the timer mode to `pc-open-10m`
- updates all files in that room to the same expiry time

#### Uploading files to a room

`POST /api/files/upload` handles file uploads.

The upload flow is:

- Multer receives the file and stores it in the backend uploads folder
- the controller reads `roomId` and `uploadSource`
- if the file is not PDF, the backend tries to convert it to PDF first
- a `Room` record is created or updated
- a `File` record is stored in MongoDB
- all files in the room are kept aligned to the latest room expiry
- Socket.IO emits `file-uploaded` to clients in that room

The file schema is defined in `backend/models/File.js`.

#### Fetching files in a room

`GET /api/files/room/:roomId` returns all files for a room, ordered newest first.

#### Downloading and deleting files

- `GET /api/files/download/:fileId` downloads the physical file from disk
- `DELETE /api/files/:fileId` removes the file from disk and MongoDB, then emits `file-deleted`

### 3. Student Drive flow

This flow is for permanent file storage with authentication.

#### Account creation

`POST /api/student-drive/create` creates a new Student Drive account.

This process:

- validates username and password length
- checks for duplicate usernames
- hashes the password with bcrypt
- generates a unique `driveId`
- creates the Student Drive document in MongoDB
- returns a JWT token plus the drive data

#### Login

`POST /api/student-drive/login` logs in with username and password.

If the password matches, the backend returns:

- the drive data
- a JWT token valid for 7 days

#### Authentication middleware

Protected Student Drive routes use `backend/middleware/studentDriveAuth.js`.

It:

- reads the `Authorization: Bearer <token>` header
- verifies the JWT
- attaches the authenticated drive info to the request

#### Drive operations

After login, the user can:

- get their own drive with `GET /api/student-drive/me`
- get a drive by ID with `GET /api/student-drive/:driveId`
- create folders with `POST /api/student-drive/:driveId/folders`
- add notes with `POST /api/student-drive/:driveId/folders/:folderId/notes`
- upload files into a folder with `POST /api/student-drive/:driveId/folders/:folderId/files`
- delete a file with `DELETE /api/student-drive/:driveId/folders/:folderId/files/:fileId`
- preview a file with `GET /api/student-drive/files/:fileId/view`

Student Drive files are stored in GridFS, not the regular uploads folder.

The Student Drive schema is defined in `backend/models/StudentDrive.js`.

## Important Backend Components

### Routes

- `backend/routes/roomRoutes.js` handles room creation, room lookup, and PC activation
- `backend/routes/fileRoutes.js` handles upload, listing, download, and delete for room files
- `backend/routes/studentDriveRoutes.js` handles authentication and drive management

### Middleware

- `backend/middleware/uploadMiddleware.js` configures Multer, allowed file types, and file size limits
- `backend/middleware/studentDriveAuth.js` protects Student Drive routes with JWT

### Utilities

- `backend/utils/convertToPdf.js` converts supported files to PDF
- `backend/utils/deleteExpiredFiles.js` cleans up expired room files and orphaned upload files
- `backend/utils/deleteExpiredRooms.js` is currently empty

## Cleanup Behavior

The cleanup job runs from `backend/utils/deleteExpiredFiles.js`.

It does three things:

1. Finds expired room files in MongoDB
2. Deletes their physical files from disk and removes the DB records
3. Removes old orphaned files from the uploads folder

Important detail:

- Student Drive files are protected from this cleanup because they are permanent until the user deletes them manually
- If the Student Drive file scan fails, orphan cleanup is skipped so permanent files are not accidentally removed

The cleanup runs immediately at startup and then repeats every 5 minutes.

## Data Model Summary

### Room

`backend/models/Room.js`

- `roomId`
- `createdAt`
- `expiresAt`
- `timerMode`
- `isInUse`

### File

`backend/models/File.js`

- `roomId`
- `fileName`
- `originalName`
- `filePath`
- `fileSize`
- `mimeType`
- `uploadSource`
- `uploadedAt`
- `expiresAt`

### StudentDrive

`backend/models/StudentDrive.js`

- `driveId`
- `name`
- `username`
- `usernameLower`
- `passwordHash`
- `createdAt`
- `folders`

Each folder can contain:

- subfolders through `parentFolderId`
- notes
- files

## Frontend Connection

The frontend calls the backend through `frontend/src/utils/api.js`.

The key requests are:

- `createRoom()` for room creation
- `fetchRoomById()` for room status
- `activateRoomOnPc()` for extending room time on the PC
- `uploadFileToRoom()` for QuickPrint uploads
- `createStudentDriveAccount()` for registration
- `loginStudentDrive()` for login
- `getStudentDriveMe()` for restoring a saved session
- `createStudentDriveFolder()` for folder creation
- `createStudentDriveNote()` for notes
- `uploadStudentDriveFile()` for drive uploads
- `deleteStudentDriveFile()` for deletion

The frontend also stores the Student Drive JWT in `localStorage` and restores the session on reload.

## Environment Variables

### Backend

- `PORT` optional
- `MONGO_URI` required
- `MAX_UPLOAD_SIZE_MB` optional
- `FILE_RETENTION_HOURS` optional
- `ORPHAN_FILE_RETENTION_HOURS` optional
- `LIBREOFFICE_PATH` optional
- `CORS_ORIGINS` required in production
- `STUDENT_DRIVE_JWT_SECRET` optional but recommended

### Frontend

- `VITE_API_BASE_URL` required
- `VITE_SOCKET_URL` optional
- `VITE_MOBILE_URL` optional
- `VITE_MAX_UPLOAD_SIZE_MB` optional

## Deployment Notes

The project is designed to deploy backend first, then frontend.

Backend deployment should:

- install dependencies
- connect to MongoDB
- expose the API base URL
- allow the frontend origin in `CORS_ORIGINS`
- install LibreOffice if you want best PDF conversion for Office files

Frontend deployment should:

- point to the deployed backend API
- use the built `frontend/dist` output

## Viva Quick Answer

If you need to explain the backend in simple terms, say this:

“The backend has two flows. The first is QuickPrint, where a room is created, files are uploaded into that room, converted to PDF if needed, stored on disk, saved in MongoDB, and shared in real time through Socket.IO. The second is Student Drive, where users register and log in with JWT, then manage permanent folders, notes, and files stored in MongoDB and GridFS. A cleanup job removes only expired room files and orphan uploads, while Student Drive files remain until the user deletes them.”

## Folder Structure

```text
backend/
  config/
  controllers/
  middleware/
  models/
  routes/
  utils/
  uploads/
frontend/
  src/
    components/
    hooks/
    utils/
```

## Notes

- Room uploads are temporary and expire automatically.
- Student Drive uploads are permanent and protected by login.
- Socket.IO is used for live room updates.
- Multer handles file upload parsing.
- MongoDB stores metadata; uploaded files are stored on disk or in GridFS depending on the flow.