# Database Flow

This document explains how data is stored, updated, expired, and cleaned up in the project.

## 1. Database Overview

The project uses MongoDB through Mongoose.

There are two different storage patterns:

- temporary room data for QuickPrint
- permanent Student Drive data for accounts and folders

Some files are stored on disk in the backend uploads folder, while Student Drive files are stored in GridFS.

## 2. Room Collection

The room schema is defined in [backend/models/Room.js](backend/models/Room.js).

Room documents contain:

- `roomId`
- `createdAt`
- `expiresAt`
- `timerMode`
- `isInUse`

### Room Purpose

Rooms represent temporary QuickPrint sessions.

The database stores them so the backend can:

- validate a room ID
- keep track of the expiry time
- know whether the room was opened on PC
- mark scanner rooms as in use

### Room Expiration

The Room collection has a TTL index on `expiresAt`.

That means MongoDB can automatically remove expired room documents after the expiry time passes.

## 3. File Collection

The file schema is defined in [backend/models/File.js](backend/models/File.js).

File documents contain:

- `roomId`
- `fileName`
- `originalName`
- `filePath`
- `fileSize`
- `mimeType`
- `uploadSource`
- `uploadedAt`
- `expiresAt`

### File Purpose

This collection stores metadata for QuickPrint uploads.

The actual file is saved on disk in the backend uploads folder, while MongoDB stores the reference and expiry information.

### How File Records Are Used

- when a file is uploaded, a File document is created
- when a room timer changes, all files in that room are updated to match the same expiry
- when a file is downloaded, the backend uses the stored path
- when a file is deleted, both the disk file and DB record are removed

## 4. Student Drive Collection

The Student Drive schema is defined in [backend/models/StudentDrive.js](backend/models/StudentDrive.js).

This document contains:

- `driveId`
- `name`
- `username`
- `usernameLower`
- `passwordHash`
- `createdAt`
- `folders`

### Nested Structure

Each drive contains folders, and each folder contains:

- subfolder reference through `parentFolderId`
- files
- notes

Each file subdocument contains:

- `storageType`
- `gridFsId`
- `fileName`
- `originalName`
- `filePath`
- `fileSize`
- `mimeType`
- `uploadedAt`

Each note subdocument contains:

- `title`
- `content`
- `createdAt`

## 5. GridFS Storage

Student Drive files are not stored in the normal uploads folder.

Instead, the backend uploads them to MongoDB GridFS.

The process is:

- Multer saves the uploaded file temporarily on disk
- the backend streams it into GridFS
- the local temp file is removed
- the folder file subdocument stores the GridFS ObjectId

This design keeps Student Drive storage permanent and tied to the user account.

## 6. Authentication and Database

Student Drive login does not create a separate session table.

Instead:

- the password is hashed with bcrypt and stored in the StudentDrive document
- login verifies the hash
- the backend creates a JWT containing the `driveId` and `username`
- later requests use the token to authorize database access

So the database stores the account, while the token controls access.

## 7. Cleanup Flow

The cleanup job is implemented in [backend/utils/deleteExpiredFiles.js](backend/utils/deleteExpiredFiles.js).

It performs two kinds of cleanup:

### Expired QuickPrint files

Files whose `expiresAt` is in the past are removed from:

- MongoDB File collection
- physical disk storage

### Orphan uploads

Files left on disk without a valid DB reference can also be removed after a retention period.

### Student Drive protection

Student Drive files are intentionally protected from this cleanup.

That means the cleanup job must not delete permanent Student Drive content, even if the disk scan finds matching file names.

If the Student Drive file scan fails, orphan cleanup is skipped rather than risking accidental deletion.

## 8. Database Flow by Action

### Room creation

1. Backend creates a Room document.
2. MongoDB stores the room ID and expiry.
3. The frontend uses the room ID for uploads and session display.

### File upload in QuickPrint

1. Backend saves the physical file.
2. Backend creates a File document.
3. Backend updates the Room expiry and timer mode.
4. Socket.IO notifies connected clients.

### Student Drive signup

1. Backend checks whether the username already exists.
2. Password is hashed.
3. A StudentDrive document is created.
4. JWT is returned to the frontend.

### Student Drive folder/file actions

1. The frontend sends a JWT in the Authorization header.
2. Middleware verifies the token.
3. The backend finds the correct StudentDrive document.
4. Folders, notes, or files are updated in that document.

### Student Drive file preview

1. The backend finds the file subdocument.
2. If the file is stored in GridFS, it streams directly from MongoDB.
3. The frontend opens the returned view URL.

## 9. Database Summary for Viva

If you need to explain the database in simple terms, say this:

“MongoDB stores two types of data. QuickPrint uses Room and File collections for temporary printing sessions, and those records expire automatically. Student Drive uses one nested StudentDrive collection for permanent user data, with folders, notes, and files. Temporary files are stored on disk, while Student Drive files are stored in GridFS. Cleanup removes only expired QuickPrint data and never deletes Student Drive files unless the user explicitly deletes them.”