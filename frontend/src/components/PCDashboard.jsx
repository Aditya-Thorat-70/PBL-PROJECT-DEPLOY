import QRCodeCard from "./QRCodeCard";
import FileList from "./FileList";

export default function PCDashboard({
  files,
  roomId,
  roomInput,
  onRoomInputChange,
  onOpenRoom,
  onGenerate,
  onDelete,
  onView,
  onPrint,
}) {
  const stats = [
    { label: "Files Ready", val: files.length, icon: "📑" },
    { label: "Room ID", val: roomId, icon: "🔑" },
    { label: "Status", val: "Online", icon: "🟢" },
  ];

  return (
    <div className="max-w-6xl mx-auto px-4 md:px-6 py-6">
      {/* Stats */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        {stats.map((s, i) => (
          <div
            key={i}
            className="bg-white rounded-2xl border border-gray-100 p-5 animate-fadeIn"
            style={{ animationDelay: `${i * 80}ms` }}
          >
            <div className="text-2xl mb-2">{s.icon}</div>
            <div
              className="text-2xl font-extrabold bg-gradient-to-r from-blue-600 to-violet-600 bg-clip-text text-transparent"
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
        <QRCodeCard roomId={roomId} onGenerate={onGenerate} />

        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
          <div className="mb-5 flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <h2 className="font-extrabold text-xl text-gray-900" style={{ fontFamily: "Syne, sans-serif" }}>
                Uploaded Files
              </h2>
              {files.length > 0 && (
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-green-100 text-green-700">
                  {files.length} file{files.length !== 1 ? "s" : ""}
                </span>
              )}
            </div>

            <div className="flex flex-col sm:flex-row gap-2">
              <input
                type="text"
                value={roomInput}
                onChange={(e) => onRoomInputChange(e.target.value.toUpperCase())}
                placeholder="Enter Room ID"
                maxLength={6}
                className="w-full sm:max-w-[220px] px-3 py-2 rounded-xl border border-gray-200 text-sm font-bold tracking-widest text-gray-900 bg-white focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 transition-all"
                style={{ fontFamily: "Syne, sans-serif" }}
              />
              <button
                onClick={onOpenRoom}
                className="px-4 py-2 rounded-xl text-sm font-semibold text-white bg-gradient-to-r from-blue-600 to-violet-600 hover:shadow-md hover:-translate-y-0.5 transition-all"
              >
                Open Room
              </button>
            </div>
          </div>
          <FileList files={files} onDelete={onDelete} onView={onView} onPrint={onPrint} />
        </div>
      </div>
    </div>
  );
}