import { useState, useEffect } from "react";
import { io } from "socket.io-client";
import Navbar from "./components/Navbar";
import PCDashboard from "./components/PCDashboard";
import MobileDashboard from "./components/MobileDashboard";
import StudentDriveDashboard from "./components/StudentDriveDashboard";
import ToastContainer from "./components/Toast";
import { useToast } from "./hooks/useToast";
import { generateRoomId } from "./utils/helpers";
import { activateRoomOnPc, createRoom, fetchFilesByRoom, fetchRoomById, uploadFileToRoom } from "./utils/api";
import { SOCKET_URL } from "./utils/config";

export default function App() {
  const initialRoomId = generateRoomId();
  const [appMode, setAppMode] = useState("quickprint");
  const [view, setView] = useState("pc");
  const [roomId, setRoomId] = useState(initialRoomId);
  const [roomInput, setRoomInput] = useState(initialRoomId);
  const [mobilePrefillRoomId, setMobilePrefillRoomId] = useState(null);
  const [roomFiles, setRoomFiles] = useState({ [initialRoomId]: [] });
  const [roomExpiryById, setRoomExpiryById] = useState({});
  const [roomTimerModeById, setRoomTimerModeById] = useState({});
  const [socket, setSocket] = useState(null);
  const { toasts, toast, removeToast } = useToast();

  const files = roomFiles[roomId] || [];

  // Setup Socket.io connection
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const requestedView = params.get("view");
    const requestedMode = params.get("mode");
    const requestedRoom = (params.get("room") || "").toUpperCase().trim();

    if (requestedView === "mobile") {
      setView("mobile");
    }

    if (requestedMode === "drive") {
      setAppMode("student-drive");
    }

    if (/^[A-Z0-9]{6}$/.test(requestedRoom)) {
      setMobilePrefillRoomId(requestedRoom);
    }
  }, []);

  // Setup Socket.io connection
  useEffect(() => {
    const newSocket = io(SOCKET_URL, {
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      reconnectionAttempts: 5,
    });

    newSocket.on("connect", () => {
      console.log("Connected to backend:", newSocket.id);
      newSocket.emit("join-room", roomId);
    });

    newSocket.on("file-uploaded", (data) => {
      console.log("File uploaded event received:", data);
      const uploadedRoom = data.file?.roomId;
      if (uploadedRoom) {
        // Refresh files for that room
        loadRoomFiles(uploadedRoom);
        // Refresh timer + mode so scanner-triggered 10m window appears instantly on PC.
        loadRoomSession(uploadedRoom).catch((error) => {
          console.warn("Failed to refresh room session after socket upload:", error?.message || error);
        });
      }
    });

    newSocket.on("disconnect", () => {
      console.log("Disconnected from backend");
    });

    setSocket(newSocket);

    return () => {
      newSocket.disconnect();
    };
  }, []);

  // Re-join room when roomId or socket changes
  useEffect(() => {
    if (socket && roomId) {
      socket.emit("join-room", roomId);
    }
  }, [socket, roomId]);

  // Auto-reset the current PC room as soon as its timer expires.
  useEffect(() => {
    if (appMode !== "quickprint" || view !== "pc") {
      return () => {};
    }

    const currentExpiry = roomExpiryById[roomId];
    if (!currentExpiry) {
      return () => {};
    }

    const expiryMs = new Date(currentExpiry).getTime();
    if (!Number.isFinite(expiryMs)) {
      return () => {};
    }

    const resetRoomOnExpiry = () => {
      const nextRoomId = generateRoomId();

      setRoomFiles((prev) => ({
        ...prev,
        [roomId]: [],
        [nextRoomId]: prev[nextRoomId] || [],
      }));
      setRoomExpiryById((prev) => {
        const next = { ...prev };
        delete next[roomId];
        return next;
      });
      setRoomTimerModeById((prev) => {
        const next = { ...prev };
        delete next[roomId];
        return next;
      });
      setRoomId(nextRoomId);
      setRoomInput(nextRoomId);
      toast("Room expired. Session reset.", "info");
    };

    const delayMs = expiryMs - Date.now();
    if (delayMs <= 0) {
      resetRoomOnExpiry();
      return () => {};
    }

    const timeoutId = window.setTimeout(resetRoomOnExpiry, delayMs + 50);
    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [appMode, view, roomId, roomExpiryById, toast]);

  const loadRoomFiles = async (nextRoomId) => {
    try {
      const fetchedFiles = await fetchFilesByRoom(nextRoomId);
      setRoomFiles((prev) => ({ ...prev, [nextRoomId]: fetchedFiles }));
      return fetchedFiles;
    } catch (error) {
      console.error("Failed to load room files:", error);
      throw error;
    }
  };

  const loadRoomSession = async (nextRoomId) => {
    const roomData = await fetchRoomById(nextRoomId);
    setRoomExpiryById((prev) => ({
      ...prev,
      [nextRoomId]: roomData.expiresAt,
    }));
    if (roomData.timerMode) {
      setRoomTimerModeById((prev) => ({
        ...prev,
        [nextRoomId]: roomData.timerMode,
      }));
    }
    return roomData;
  };

  const getExpiryFromFiles = (fileList) => {
    const expiryCandidates = (fileList || [])
      .map((file) => (file?.expiresAt ? new Date(file.expiresAt).getTime() : null))
      .filter((value) => Number.isFinite(value));

    if (!expiryCandidates.length) {
      return null;
    }

    return new Date(Math.max(...expiryCandidates)).toISOString();
  };

  const handleGenerate = () => {
    const newRoomId = generateRoomId();
    setRoomId(newRoomId);
    setRoomInput(newRoomId);
    setRoomFiles((prev) => ({ ...prev, [newRoomId]: prev[newRoomId] || [] }));
    toast("New room generated", "info");
  };

  const handleOpenRoom = async () => {
    const nextRoomId = roomInput.trim().toUpperCase();

    if (nextRoomId.length !== 6) {
      toast("Enter a valid 6-character Room ID", "error");
      return;
    }

    try {
      const activatedRoom = await activateRoomOnPc(nextRoomId);
      setRoomExpiryById((prev) => ({
        ...prev,
        [nextRoomId]: activatedRoom.expiresAt,
      }));
      setRoomTimerModeById((prev) => ({
        ...prev,
        [nextRoomId]: activatedRoom.timerMode || "pc-open-10m",
      }));

      const fetchedFiles = await loadRoomFiles(nextRoomId);
      if (!fetchedFiles.length) {
        toast("Invalid Room ID. No documents found in this room.", "error");
        return;
      }

      setRoomId(nextRoomId);
      toast(`Opened room ${nextRoomId}`, "info");
    } catch (error) {
      toast(error.message || "Unable to open room", "error");
    }
  };

  const handleDelete = (id) => {
    setRoomFiles((prev) => ({
      ...prev,
      [roomId]: (prev[roomId] || []).filter((x) => x.id !== id),
    }));
    toast("File deleted", "success");
  };

  const handleView = (file) => {
    if (!file.viewUrl) {
      toast("Preview is not available for this file", "error");
      return;
    }

    window.open(file.viewUrl, "_blank", "noopener,noreferrer");
  };

  const handlePrint = (file) => {
    if (!file.downloadUrl) {
      toast("Print link is not available for this file", "error");
      return;
    }

    window.open(file.downloadUrl, "_blank", "noopener,noreferrer");
    toast(`Ready to print: ${file.name}`, "success");
  };

  const handleUpload = async (selectedFile, selectedRoomId) => {
    try {
      let targetRoomId = (selectedRoomId || "").toUpperCase().trim();
      const hasExplicitRoom = Boolean(targetRoomId);

      if (!targetRoomId) {
        targetRoomId = await createRoom();
        toast(`Room created: ${targetRoomId}`, "info");
      }

      const uploadSource = hasExplicitRoom ? "scanner" : "mobile";

      const uploadedFile = await uploadFileToRoom({ roomId: targetRoomId, file: selectedFile, uploadSource });

      if (uploadedFile?.roomTimerMode) {
        setRoomTimerModeById((prev) => ({
          ...prev,
          [targetRoomId]: uploadedFile.roomTimerMode,
        }));
      }

      let roomSession = null;
      try {
        roomSession = await loadRoomSession(targetRoomId);
      } catch {
        const fallbackExpiry = uploadedFile?.expiresAt ? new Date(uploadedFile.expiresAt).toISOString() : null;
        if (fallbackExpiry) {
          setRoomExpiryById((prev) => ({ ...prev, [targetRoomId]: fallbackExpiry }));
        }
      }

      setRoomFiles((prev) => ({
        ...prev,
        [targetRoomId]: [uploadedFile, ...(prev[targetRoomId] || [])],
      }));

      if (roomId === targetRoomId) {
        await loadRoomFiles(targetRoomId);
      }

      toast(`${uploadedFile.name} uploaded to room ${targetRoomId}`, "success");
      if (uploadedFile?.conversionWarning) {
        toast(uploadedFile.conversionWarning, "info");
      }
      return {
        ...uploadedFile,
        roomTimerMode: roomSession?.timerMode || uploadedFile?.roomTimerMode || null,
        roomExpiresAt: roomSession?.expiresAt || uploadedFile?.expiresAt || null,
      };
    } catch (error) {
      toast(error?.message || "Upload failed. Please try again.", "error");
      throw error;
    }
  };

  const status = appMode === "student-drive" ? "Active" : files.length > 0 ? "Active" : "Waiting";

  return (
    <div className="min-h-screen bg-[#f7f6f3] font-sans">
      <Navbar
        appMode={appMode}
        setAppMode={setAppMode}
        view={view}
        setView={setView}
        status={status}
        onReset={handleGenerate}
      />
      <div className="pt-2">
        {appMode === "student-drive" ? (
          <StudentDriveDashboard toast={toast} />
        ) : (
          <>
            {view === "pc" ? (
              <PCDashboard
                files={files}
                roomId={roomId}
                roomExpiresAt={roomExpiryById[roomId] || null}
                roomTimerMode={roomTimerModeById[roomId] || null}
                roomInput={roomInput}
                onRoomInputChange={setRoomInput}
                onOpenRoom={handleOpenRoom}
                onGenerate={handleGenerate}
                onDelete={handleDelete}
                onView={handleView}
                onPrint={handlePrint}
              />
            ) : (
              <MobileDashboard onUpload={handleUpload} initialRoomId={mobilePrefillRoomId} />
            )}
          </>
        )}
      </div>
      <ToastContainer toasts={toasts} onClose={removeToast} />
    </div>
  );
}