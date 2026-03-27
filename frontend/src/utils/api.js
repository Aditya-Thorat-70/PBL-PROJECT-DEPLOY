const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:5000";

const ensureOk = async (response) => {
  if (response.ok) return;

  let message = "Request failed";
  try {
    const data = await response.json();
    message = data.message || data.error || message;
  } catch {
    // Ignore JSON parse errors and use default message.
  }

  throw new Error(message);
};

export const mapBackendFile = (file) => ({
  id: file._id,
  name: file.originalName || file.fileName,
  size: file.fileSize || 0,
  uploadedAt: file.uploadedAt ? new Date(file.uploadedAt) : new Date(),
  room: file.roomId,
  downloadUrl: `${API_BASE_URL}/api/files/download/${file._id}`,
  viewUrl: file.fileName ? `${API_BASE_URL}/uploads/${file.fileName}` : null,
});

export const fetchFilesByRoom = async (roomId) => {
  const response = await fetch(`${API_BASE_URL}/api/files/room/${roomId}`);
  await ensureOk(response);

  const data = await response.json();
  return (data.files || []).map(mapBackendFile);
};

export const createRoom = async () => {
  const response = await fetch(`${API_BASE_URL}/api/rooms/create`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({}),
  });

  await ensureOk(response);

  const data = await response.json();
  return data.roomId;
};

export const uploadFileToRoom = async ({ roomId, file, uploadSource = "mobile" }) => {
  const formData = new FormData();
  formData.append("file", file);
  formData.append("roomId", roomId);
  formData.append("uploadSource", uploadSource);

  const response = await fetch(`${API_BASE_URL}/api/files/upload`, {
    method: "POST",
    body: formData,
  });

  await ensureOk(response);

  const data = await response.json();
  return mapBackendFile(data.file);
};

const mapStudentDrive = (drive) => ({
  id: drive.id,
  driveId: drive.driveId,
  name: drive.name,
  createdAt: drive.createdAt,
  folders: (drive.folders || []).map((folder) => ({
    id: folder.id,
    name: folder.name,
    createdAt: folder.createdAt,
    files: (folder.files || []).map((file) => ({
      id: file.id,
      name: file.name,
      size: file.size,
      mimeType: file.mimeType,
      uploadedAt: file.uploadedAt,
      viewUrl: file.viewUrl ? `${API_BASE_URL}${file.viewUrl}` : null,
    })),
    notes: folder.notes || [],
  })),
});

export const createStudentDrive = async ({ name }) => {
  const response = await fetch(`${API_BASE_URL}/api/student-drive/create`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ name }),
  });

  await ensureOk(response);
  const data = await response.json();
  return mapStudentDrive(data.drive);
};

export const getStudentDrive = async (driveId) => {
  const response = await fetch(`${API_BASE_URL}/api/student-drive/${encodeURIComponent(driveId)}`);
  await ensureOk(response);

  const data = await response.json();
  return mapStudentDrive(data.drive);
};

export const createStudentDriveFolder = async ({ driveId, name }) => {
  const response = await fetch(`${API_BASE_URL}/api/student-drive/${encodeURIComponent(driveId)}/folders`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ name }),
  });

  await ensureOk(response);
  const data = await response.json();
  return mapStudentDrive(data.drive);
};

export const createStudentDriveNote = async ({ driveId, folderId, title, content }) => {
  const response = await fetch(`${API_BASE_URL}/api/student-drive/${encodeURIComponent(driveId)}/folders/${encodeURIComponent(folderId)}/notes`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ title, content }),
  });

  await ensureOk(response);
  const data = await response.json();
  return mapStudentDrive(data.drive);
};

export const uploadStudentDriveFile = async ({ driveId, folderId, file }) => {
  const formData = new FormData();
  formData.append("file", file);

  const response = await fetch(`${API_BASE_URL}/api/student-drive/${encodeURIComponent(driveId)}/folders/${encodeURIComponent(folderId)}/files`, {
    method: "POST",
    body: formData,
  });

  await ensureOk(response);
  const data = await response.json();
  return mapStudentDrive(data.drive);
};
