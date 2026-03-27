# Deployment Guide (Backend First, Then Frontend)

## 1. Deploy Backend First

### Backend environment variables
Create `backend/.env` from `backend/.env.example` and set:

- `PORT` (optional; your host may set this automatically)
- `MONGO_URI` (required)
- `MAX_UPLOAD_SIZE_MB` (optional)
- `FILE_RETENTION_HOURS` (optional)
- `LIBREOFFICE_PATH` (optional but recommended): path to `soffice` binary
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

### Important for PDF conversion on Render

If you need DOC/DOCX/PPT/PPTX/TXT/image to PDF conversion in production, deploy backend as a **Docker service** so LibreOffice is installed.

- Use [backend/Dockerfile](backend/Dockerfile) for Render backend deployment.
- In Render service settings:
	- Environment: Docker
	- Dockerfile path: `backend/Dockerfile`
	- Auto deploy: enabled
- Keep `LIBREOFFICE_PATH=/usr/bin/soffice` in backend env vars.

Without LibreOffice on the server, non-PDF uploads will fail conversion by design.

### Backend build/start commands

```bash
cd backend
npm install
npm start
```

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
- Upload `.docx`, `.pptx`, or `.txt` and verify the stored file is converted to `.pdf`.

## Notes

- Backend now enforces origin checks through `CORS_ORIGINS`.
- If you deploy frontend on multiple domains (preview + production), include all in `CORS_ORIGINS`, separated by commas.
- Keep `MONGO_URI` private and rotate credentials if exposed.
