import { useEffect, useState, useRef } from "react";
import Loader from "./Loader";
import { fileIcon, formatSize } from "../utils/helpers";
import SessionTimer from "./SessionTimer";

const MAX_UPLOAD_MB = Number(import.meta.env.VITE_MAX_UPLOAD_SIZE_MB || 50);

function SuccessScreen({ fileCount, lastFileName, roomId, roomExpiresAt, copied, onCopyRoom, onReset }) {
  return (
    <div className="flex flex-col items-center gap-5 text-center py-10 animate-fadeIn">
      <div className="w-20 h-20 rounded-full bg-gradient-to-br from-emerald-500 to-green-400 flex items-center justify-center text-4xl shadow-lg shadow-emerald-200 animate-fadeIn">
        ✓
      </div>
      <div>
        <h2 className="font-extrabold text-2xl text-gray-900 mb-1" style={{ fontFamily: "Syne, sans-serif" }}>
          {fileCount > 1 ? `${fileCount} Files Sent!` : "File Sent!"}
        </h2>
        <p className="text-sm text-gray-500">
          {fileCount > 1
            ? "All selected documents have been sent to the printer successfully."
            : "Your document has been sent to the printer successfully."}
        </p>
      </div>
      <div className="w-full bg-gray-50 rounded-xl px-5 py-3 text-left border border-gray-100">
        <div className="text-xs text-gray-400 mb-0.5">Last file sent</div>
        <div className="font-semibold text-gray-800 text-sm truncate" style={{ fontFamily: "Syne, sans-serif" }}>
          {lastFileName}
        </div>
      </div>
      {roomId && (
        <div className="w-full bg-indigo-50 rounded-xl px-5 py-3 text-left border border-indigo-100">
          <div className="text-xs text-indigo-500 mb-0.5">Room ID</div>
          <div className="flex items-center justify-between gap-3">
            <div className="font-semibold text-indigo-900 text-sm tracking-widest" style={{ fontFamily: "Syne, sans-serif" }}>
              {roomId}
            </div>
            <button
              onClick={onCopyRoom}
              className="px-3 py-1.5 rounded-lg text-xs font-semibold text-indigo-700 bg-white border border-indigo-200 hover:bg-indigo-100 transition-all"
            >
              {copied ? "Copied" : "Copy"}
            </button>
          </div>
        </div>
      )}
      {roomExpiresAt && <SessionTimer expiresAt={roomExpiresAt} roomId={roomId} />}
      <button
        onClick={onReset}
        className="w-full py-3.5 rounded-2xl text-sm font-semibold text-white bg-gradient-to-r from-blue-600 to-violet-600 hover:shadow-lg hover:-translate-y-0.5 transition-all"
      >
        + Upload Another File
      </button>
    </div>
  );
}

export default function UploadForm({ roomId: defaultRoom, onUpload, onComplete }) {
  const [room, setRoom] = useState(defaultRoom || "");
  const [files, setFiles] = useState([]);
  const [dragging, setDragging] = useState(false);
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [success, setSuccess] = useState(false);
  const [copied, setCopied] = useState(false);
  const [uploadedSummary, setUploadedSummary] = useState({ count: 0, lastFileName: "" });
  const [roomExpiresAt, setRoomExpiresAt] = useState(null);
  const inputRef = useRef();

  useEffect(() => {
    setRoom(defaultRoom || "");
  }, [defaultRoom]);

  const handleFiles = (fileList) => {
    const pickedFiles = Array.from(fileList || []);
    if (!pickedFiles.length) return;

    setFiles((prev) => [...prev, ...pickedFiles]);
  };

  const handleRemoveFile = (indexToRemove) => {
    setFiles((prev) => prev.filter((_, index) => index !== indexToRemove));
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragging(false);
    handleFiles(e.dataTransfer.files);
  };

  const handleSubmit = async () => {
    if (!files.length) return;
    setLoading(true);
    setProgress(0);
    setCopied(false);

    try {
      let lastUploadedName = "";
      let uploadRoom = (room || "").toUpperCase().trim();

      for (let index = 0; index < files.length; index += 1) {
        const currentFile = files[index];
        const uploaded = await onUpload(currentFile, uploadRoom);
        lastUploadedName = uploaded?.name || currentFile.name;

        if (!uploadRoom && uploaded?.room) {
          uploadRoom = uploaded.room;
          setRoom(uploaded.room);
        }

        if (uploaded?.roomExpiresAt) {
          setRoomExpiresAt(uploaded.roomExpiresAt);
        }

        setProgress(Math.round(((index + 1) / files.length) * 100));
      }

      setUploadedSummary({ count: files.length, lastFileName: lastUploadedName });
      setSuccess(true);
    } catch {
      // Parent handles error toasts; keep the form open for retry.
    } finally {
      setLoading(false);
    }
  };

  const reset = () => {
    setFiles([]);
    setSuccess(false);
    setCopied(false);
    setUploadedSummary({ count: 0, lastFileName: "" });
    setRoomExpiresAt(null);
    setRoom(defaultRoom || "");
    setProgress(0);

    if (onComplete) {
      onComplete();
    }
  };

  const copyRoomId = async () => {
    if (!room) return;

    try {
      await navigator.clipboard.writeText(room);
      setCopied(true);
    } catch {
      const textarea = document.createElement("textarea");
      textarea.value = room;
      textarea.setAttribute("readonly", "");
      textarea.style.position = "absolute";
      textarea.style.left = "-9999px";
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand("copy");
      document.body.removeChild(textarea);
      setCopied(true);
    }
  };

  if (loading) {
    return (
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 sm:p-8">
        <Loader text="Sending to printer..." />
        <div className="mt-4 h-1.5 rounded-full bg-gray-100 overflow-hidden">
          <div
            className="h-full rounded-full bg-gradient-to-r from-blue-600 to-violet-600 transition-all duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>
        <p className="text-center text-xs text-gray-400 mt-2">{progress}%</p>
      </div>
    );
  }

  if (success) {
    return (
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 sm:p-8">
        <SuccessScreen
          fileCount={uploadedSummary.count}
          lastFileName={uploadedSummary.lastFileName}
          roomId={room}
          roomExpiresAt={roomExpiresAt}
          copied={copied}
          onCopyRoom={copyRoomId}
          onReset={reset}
        />
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 sm:p-7 animate-fadeIn">
      <h2 className="font-extrabold text-2xl text-gray-900 mb-1" style={{ fontFamily: "Syne, sans-serif" }}>
        Upload Document
      </h2>
      <p className="text-sm text-gray-500 mb-6">Send a file directly to the printer</p>

      <div className="mb-5 rounded-xl border border-indigo-100 bg-indigo-50 px-4 py-2.5 text-xs text-indigo-700">
        Room ID will be generated automatically after upload.
      </div>

      {/* Drop Zone */}
      <div className="mb-6">
        <label className="block text-sm font-semibold text-gray-700 mb-1.5">Documents</label>
        <div
          className={`rounded-2xl border-2 border-dashed p-6 sm:p-10 text-center cursor-pointer transition-all ${
            dragging
              ? "border-indigo-400 bg-indigo-50/50"
              : "border-gray-200 bg-white hover:border-indigo-300 hover:bg-indigo-50/30"
          }`}
          onClick={() => inputRef.current.click()}
          onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
          onDragLeave={() => setDragging(false)}
          onDrop={handleDrop}
        >
          <input
            ref={inputRef}
            type="file"
            multiple
            accept=".pdf,.txt,.doc,.docx,.ppt,.pptx,.xls,.xlsx,.jpg,.jpeg,.png,.webp"
            className="hidden"
            onChange={(e) => handleFiles(e.target.files)}
          />
          {files.length ? (
            <div className="flex flex-col gap-2 max-h-52 overflow-auto">
              {files.map((selectedFile, index) => (
                <div key={`${selectedFile.name}-${selectedFile.size}-${index}`} className="flex items-center gap-2 sm:gap-3 justify-between rounded-xl bg-gray-50 px-2.5 sm:px-3 py-2 border border-gray-100">
                  <div className="flex items-center gap-3 min-w-0">
                    <span className="text-2xl">{fileIcon(selectedFile.name)}</span>
                    <div className="text-left min-w-0">
                      <div className="font-semibold text-gray-900 text-sm truncate" style={{ fontFamily: "Syne, sans-serif" }}>
                        {selectedFile.name}
                      </div>
                      <div className="text-xs text-gray-400 mt-0.5">{formatSize(selectedFile.size)}</div>
                    </div>
                  </div>
                  <button
                    className="ml-1 sm:ml-2 px-2.5 py-1 rounded-lg text-xs font-medium text-gray-400 border border-gray-200 hover:bg-gray-100 transition-all"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleRemoveFile(index);
                    }}
                  >
                    ✕
                  </button>
                </div>
              ))}
              <p className="text-xs text-gray-400 mt-1">{files.length} file{files.length !== 1 ? "s" : ""} selected</p>
            </div>
          ) : (
            <>
              <div className="text-4xl mb-3">📤</div>
              <p className="font-bold text-gray-800 mb-1" style={{ fontFamily: "Syne, sans-serif" }}>
                Drop files here
              </p>
              <p className="text-sm text-gray-400">
                or <span className="text-indigo-600 underline underline-offset-2">browse</span>
              </p>
              <p className="text-xs text-gray-300 mt-3">
                PDF, TXT, DOC, DOCX, PPT, PPTX, XLS, XLSX, PNG, JPG, WEBP (max {MAX_UPLOAD_MB}MB each)
              </p>
            </>
          )}
        </div>
      </div>

      {/* Submit */}
      <button
        onClick={handleSubmit}
        disabled={!files.length}
        className="w-full py-3.5 sm:py-4 rounded-2xl text-sm sm:text-base font-semibold text-white bg-gradient-to-r from-cyan-500 to-indigo-600 hover:shadow-lg hover:-translate-y-0.5 active:translate-y-0 transition-all disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:shadow-none disabled:hover:translate-y-0"
      >
        📤 Upload {files.length > 1 ? `${files.length} Files` : "File"} & Send to Printer
      </button>
    </div>
  );
}