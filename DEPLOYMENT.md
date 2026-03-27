# Deployment Guide (Backend First, Then Frontend)

## 1. Deploy Backend First

### Backend environment variables
Create `backend/.env` from `backend/.env.example` and set:

- `PORT` (optional; your host may set this automatically)
- `MONGO_URI` (required)
- `MAX_UPLOAD_SIZE_MB` (optional)
- `FILE_RETENTION_HOURS` (optional)
- `LIBREOFFICE_PATH` (optional): path to `soffice` binary
- `CORS_ORIGINS` (required in production): comma-separated frontend origins

Example:

```env
PORT=5000
MONGO_URI=mongodb+srv://<username>:<password>@<cluster-host>/<db-name>
MAX_UPLOAD_SIZE_MB=50
FILE_RETENTION_HOURS=3
LIBREOFFICE_PATH=/usr/bin/soffice
CORS_ORIGINS=https://your-frontend-domain.com
```

### Important for PDF conversion behavior

Backend conversion now follows this order:

1. Try LibreOffice conversion first (best layout/image preservation, supports `.ppt` and `.doc`).
2. If LibreOffice fails/unavailable, fall back to local Node conversion for supported formats.
3. If both fail, upload original file and return `conversionWarning`.

To maximize conversion success (target 7-8 out of 10+ files), deploy backend with LibreOffice installed (Render Docker using [backend/Dockerfile](backend/Dockerfile)).

If conversion is not possible for a given file, the original file is uploaded instead and the API returns a `conversionWarning`.

### Backend build/start commands

```bash
cd backend
npm install
npm start
```

Use Node.js 20.19+ for backend deployment so conversion dependencies install cleanly.

### Backend readiness checks

- Health endpoint: `GET /api/health`
- Confirm API base URL works, e.g. `GET /api/rooms/<ROOM_ID>` or a POST to create room.

Save your deployed backend URL, for example:

`https://your-backend-domain.com`

## 2. Deploy Frontend Second

### Frontend environment variables
Create `frontend/.env` from `frontend/.env.example` and set:

- `VITE_API_BASE_URL` (required): deployed backend URL
- `VITE_SOCKET_URL` (optional): defaults to `VITE_API_BASE_URL`
- `VITE_MOBILE_URL` (optional): deployed frontend URL for QR links
- `VITE_MAX_UPLOAD_SIZE_MB` (optional)

Example:

```env
VITE_API_BASE_URL=https://your-backend-domain.com
VITE_SOCKET_URL=https://your-backend-domain.com
VITE_MOBILE_URL=https://your-frontend-domain.com
VITE_MAX_UPLOAD_SIZE_MB=50
```

### Frontend build/deploy commands

```bash
cd frontend
npm install
npm run build
```

Deploy the `frontend/dist` output to your static hosting provider.

## 3. Post-Deployment Verification

- Open frontend and create a room.
- Upload a file from mobile and verify it appears in PC dashboard.
- Confirm real-time updates (Socket.IO) work.
- Open uploaded file preview URL and print/download URL.
- Upload `.ppt`, `.pptx`, `.doc`, `.docx` and verify PDF conversion.
- Upload edge-case files and confirm upload still succeeds even if a conversion warning appears.

## Notes

- Backend now enforces origin checks through `CORS_ORIGINS`.
- If you deploy frontend on multiple domains (preview + production), include all in `CORS_ORIGINS`, separated by commas.
- Keep `MONGO_URI` private and rotate credentials if exposed.
