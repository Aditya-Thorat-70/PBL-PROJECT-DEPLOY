import { useMemo, useState } from "react";
import QRCodeCard from "./QRCodeCard";
import FileList from "./FileList";
import SessionTimer from "./SessionTimer";

export default function PCDashboard({
  files,
  roomId,
  roomExpiresAt,
  roomInput,
  onRoomInputChange,
  onOpenRoom,
  onGenerate,
  onDelete,
  onView,
  onPrint,
}) {
  const [showInputRoomId, setShowInputRoomId] = useState(false);
  const maskedRoomId = useMemo(() => (roomId ? "*".repeat(String(roomId).length) : ""), [roomId]);

  const stats = [
    { label: "Files Ready", val: files.length, icon: "📑" },
    { label: "Room ID", val: maskedRoomId, icon: "🔑" },
    { label: "Status", val: "Online", icon: "🟢" },
  ];

  return (
    <div className="max-w-6xl mx-auto px-4 md:px-6 py-6">
      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4 mb-6">
        {stats.map((s, i) => (
          <div
            key={i}
            className="bg-white rounded-2xl border border-gray-100 p-4 sm:p-5 animate-fadeIn"
            style={{ animationDelay: `${i * 80}ms` }}
          >
            <div className="text-2xl mb-2">{s.icon}</div>
            <div
              className="text-xl sm:text-2xl font-extrabold bg-gradient-to-r from-blue-600 to-violet-600 bg-clip-text text-transparent break-words"
              style={{ fontFamily: "Syne, sans-serif" }}
            >
              {s.val}
            </div>
            <div className="text-xs text-gray-400 mt-0.5 font-medium">{s.label}</div>
          </div>
        ))}
      </div>

      {/* Main grid */}
      <div className="grid grid-cols-1 md:grid-cols-[300px_1fr] gap-5">
        <QRCodeCard roomId={roomId} onGenerate={onGenerate} showRoomId={false} />

        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 sm:p-6">
          <div className="mb-5 flex flex-col gap-3">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
              <h2 className="font-extrabold text-xl text-gray-900" style={{ fontFamily: "Syne, sans-serif" }}>
                Uploaded Files
              </h2>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setShowInputRoomId((prev) => !prev)}
                  className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-gray-100 text-gray-700 hover:bg-gray-200 transition-all"
                  title={showInputRoomId ? "Hide Input ID" : "Show Input ID"}
                  aria-label={showInputRoomId ? "Hide Input ID" : "Show Input ID"}
                >
                  👁 {showInputRoomId ? "Hide ID" : "Show ID"}
                </button>
                {files.length > 0 && (
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-green-100 text-green-700">
                    {files.length} file{files.length !== 1 ? "s" : ""}
                  </span>
                )}
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-2">
              <input
                type={showInputRoomId ? "text" : "password"}
                value={roomInput}
                onChange={(e) => onRoomInputChange(e.target.value.toUpperCase())}
                placeholder="Enter Room ID"
                maxLength={6}
                className="w-full sm:max-w-[220px] px-3 py-2 rounded-xl border border-gray-200 text-sm font-bold tracking-widest text-gray-900 bg-white focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 transition-all"
                style={{ fontFamily: "Syne, sans-serif" }}
                autoComplete="off"
                autoCorrect="off"
                spellCheck={false}
              />
              <button
                onClick={onOpenRoom}
                className="px-4 py-2 rounded-xl text-sm font-semibold text-white bg-gradient-to-r from-blue-600 to-violet-600 hover:shadow-md hover:-translate-y-0.5 transition-all"
              >
                Open Room
              </button>
            </div>

            {roomExpiresAt && (
              <div className="pt-1">
                <SessionTimer expiresAt={roomExpiresAt} roomId={roomId} compact />
              </div>
            )}
          </div>
          <FileList files={files} onDelete={onDelete} onView={onView} onPrint={onPrint} />
        </div>
      </div>
    </div>
  );
}