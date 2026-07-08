# Frontend Flow

This document explains how the React frontend moves through the QuickPrint and Student Drive experiences and how it talks to the backend.

## 1. App Entry

The frontend starts in [frontend/src/main.jsx](frontend/src/main.jsx), which renders the root React app.

The main application logic lives in [frontend/src/App.jsx](frontend/src/App.jsx).

At startup, the app:

- creates an initial room ID for QuickPrint
- sets the default mode to QuickPrint
- decides whether the user is on PC view or mobile view
- connects to the backend through Socket.IO
- restores room and drive state when needed

## 2. Two Frontend Modes

The UI has two major modes:

1. QuickPrint mode for temporary room-based printing.
2. Student Drive mode for permanent login-based storage.

The top navigation switches between these modes, and QuickPrint itself has separate PC and mobile views.

## 3. QuickPrint Frontend Flow

### PC View

When the app is in QuickPrint + PC view, it uses [frontend/src/components/PCDashboard.jsx](frontend/src/components/PCDashboard.jsx).

That screen lets the user:

- generate a new room
- type an existing room ID
- open a room on the PC
- see uploaded files
- view, delete, or print files
- see the room timer

The PC side also joins the Socket.IO room so it can receive live updates.

### Mobile View

When the app is in QuickPrint + mobile view, it uses [frontend/src/components/MobileDashboard.jsx](frontend/src/components/MobileDashboard.jsx) and [frontend/src/components/UploadForm.jsx](frontend/src/components/UploadForm.jsx).

The mobile flow is:

- detect a room ID from the QR link if one exists
- auto-fill that room on the upload form
- allow the user to select one or more files
- send the files to the backend
- show upload progress and success state

If the room does not exist yet, the frontend can upload first and let the backend create the room automatically.

## 4. QuickPrint State Handling

The main app stores room-related state in memory:

- current room ID
- room input value
- files for each room
- room expiry times
- room timer modes
- whether a scanner room is in use

This state is used to keep the PC and mobile screens synchronized without needing a full page reload.

## 5. Socket.IO Behavior

The frontend opens a Socket.IO connection using the URL from [frontend/src/utils/config.js](frontend/src/utils/config.js).

When connected, it:

- joins the active room
- listens for `file-uploaded`
- listens for `file-deleted`

When a file is uploaded from mobile, the PC dashboard refreshes immediately.
When a file is deleted, the file list updates in real time.

## 6. QuickPrint User Actions

### Generate Room

The user can generate a new room from the PC dashboard.

The frontend creates a room ID locally and later confirms or updates the room with the backend when uploads happen.

### Open Room

When the user enters a room ID and clicks open:

- the frontend sends the room ID to the backend
- the backend extends the session timer
- the frontend stores the returned expiry and timer mode
- the file list is loaded for that room

### Upload File

When the user uploads a file:

- the frontend sends the file, room ID, and upload source to the backend
- the backend stores the file and may convert it to PDF
- the frontend updates local state with the returned file data
- toast messages show success or conversion warnings

### View, Print, Delete

- View uses the file preview URL
- Print opens the download URL in a new tab
- Delete calls the backend and removes the file from the UI

## 7. Student Drive Frontend Flow

The Student Drive UI is handled by [frontend/src/components/StudentDriveDashboard.jsx](frontend/src/components/StudentDriveDashboard.jsx).

This screen supports:

- creating an account
- logging in
- restoring a saved session
- creating folders
- creating notes
- uploading files into folders
- deleting files
- previewing files

The token is saved in localStorage and restored on reload.

## 8. API Layer

The frontend does not call the backend directly from components most of the time. It uses [frontend/src/utils/api.js](frontend/src/utils/api.js).

That file centralizes:

- room creation
- room lookup
- room activation
- room file upload
- file delete
- student drive signup and login
- folder, note, file operations for Student Drive

This keeps the UI components cleaner and makes the backend flow easier to maintain.

## 9. Frontend Summary for Viva

If you need to explain the frontend quickly, say this:

“The frontend has one app shell that switches between QuickPrint and Student Drive. QuickPrint has PC and mobile views. The PC view shows rooms, files, and print options, while the mobile view uploads files using a room ID or creates one automatically. Socket.IO keeps both sides synchronized in real time. Student Drive uses login, localStorage token restore, and folder/file management through the same API layer.”
