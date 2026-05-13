import { useState } from "react";
import QRCodeCard from "./QRCodeCard";
import FileList from "./FileList";
import SessionTimer from "./SessionTimer";

export default function PCDashboard({
  files,
  roomId,
  roomExpiresAt,
  roomTimerMode,
  roomInput,
  onRoomInputChange,
  onOpenRoom,
  onGenerate,
  onDelete,
  onView,
  onPrint,
}) {
  const timerModeMap = {
    "standard-48h": {
      label: "Standard 48h",
      className: "bg-blue-100 text-blue-700",
    },
    "scanner-10m": {
      label: "Scanner 10m",
      className: "bg-amber-100 text-amber-800",
    },
    "pc-open-10m": {
      label: "PC Active 10m",
      className: "bg-rose-100 text-rose-700",
    },
  };

  const timerModeMeta = roomTimerMode ? timerModeMap[roomTimerMode] || null : null;
  const [showInputRoomId, setShowInputRoomId] = useState(false);

  return (
    <div className="max-w-6xl mx-auto px-4 md:px-6 py-6">
      {/* Main 2-column grid */}
      <div className="grid grid-cols-1 md:grid-cols-[280px_1fr] gap-5 lg:gap-6">
        {/* Left Column: QR Code & Generate */}
        <div className="flex flex-col gap-5">
          <QRCodeCard roomId={roomId} onGenerate={onGenerate} showRoomId={false} />
          
          <button
            onClick={onGenerate}
            className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-2xl text-sm font-semibold text-gray-700 bg-gray-100 hover:bg-gray-200 transition-all"
          >
            ↺ Generate New Room
          </button>
        </div>

        {/* Right Column: Files & Upload */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 sm:p-6">
          {/* Header with stats */}
          <div className="mb-5 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="flex flex-col">
                <div className="text-3xl font-extrabold text-gray-900">
                  {files.length}
                </div>
                <div className="text-xs text-gray-500 font-medium">FILES READY</div>
              </div>
              <div className="w-px h-12 bg-gray-200" />
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-green-100">
                <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                <span className="text-sm font-semibold text-green-700">ONLINE</span>
              </div>
            </div>
            <button
              onClick={() => setShowInputRoomId((prev) => !prev)}
              className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold bg-gray-100 text-gray-700 hover:bg-gray-200 transition-all"
              title={showInputRoomId ? "Hide ID" : "Show ID"}
            >
              👁 {showInputRoomId ? "Hide ID" : "Show ID"}
            </button>
          </div>

          {/* Title */}
          <h2 className="font-extrabold text-xl text-gray-900 mb-4" style={{ fontFamily: "Plus Jakarta Sans, Segoe UI, sans-serif" }}>
            Uploaded Files
          </h2>

          {/* Room ID Input & Open Button */}
          <div className="flex flex-col sm:flex-row gap-2 mb-5">
            <input
              type={showInputRoomId ? "text" : "password"}
              value={roomInput}
              onChange={(e) => onRoomInputChange(e.target.value.toUpperCase())}
              placeholder="Enter Room ID"
              maxLength={6}
              className="font-room-code flex-1 px-3 py-2.5 rounded-xl border border-gray-200 text-sm font-bold tracking-widest text-gray-900 bg-white focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 transition-all"
              autoComplete="off"
              autoCorrect="off"
              spellCheck={false}
            />
            <button
              onClick={onOpenRoom}
              className="px-6 py-2.5 rounded-xl text-sm font-semibold text-white bg-gradient-to-r from-blue-600 to-violet-600 hover:shadow-lg hover:-translate-y-0.5 transition-all whitespace-nowrap"
            >
              Open Room
            </button>
          </div>

          {/* Session Timer */}
          {roomExpiresAt && (
            <div className="mb-4 flex flex-wrap items-center gap-2 pb-4 border-b border-gray-100">
              <SessionTimer expiresAt={roomExpiresAt} roomId={roomId} compact />
              {timerModeMeta && (
                <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold ${timerModeMeta.className}`}>
                  {timerModeMeta.label}
                </span>
              )}
            </div>
          )}

          {/* File List */}
          <FileList files={files} onDelete={onDelete} onView={onView} onPrint={onPrint} />
        </div>
      </div>
    </div>
  );
}