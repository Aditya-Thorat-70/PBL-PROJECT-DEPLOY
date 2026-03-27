import QRCodeSVG from "./QRCodeSVG";

export default function QRCodeCard({ roomId, onGenerate }) {
  const mobileBaseUrl = import.meta.env.VITE_MOBILE_URL || window.location.origin;
  const mobileUploadUrl = `${mobileBaseUrl}/?view=mobile&room=${encodeURIComponent(roomId)}`;

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-8 flex flex-col items-center gap-5">
      <div className="text-center">
        <h2 className="font-extrabold text-xl text-gray-900 mb-1" style={{ fontFamily: "Syne, sans-serif" }}>
          Scan to Upload
        </h2>
        <p className="text-sm text-gray-500">Point your phone camera at the QR code</p>
      </div>

      {/* QR Code */}
      <div key={roomId} className="p-4 bg-white rounded-2xl shadow-md border border-gray-100 animate-fadeIn">
        <QRCodeSVG value={mobileUploadUrl} size={180} />
      </div>

      {/* Room ID */}
      <div className="text-center">
        <div className="text-xs text-gray-400 uppercase tracking-widest font-semibold mb-1">Room ID</div>
        <div
          className="text-3xl font-extrabold tracking-[0.18em] bg-gradient-to-r from-blue-600 to-violet-600 bg-clip-text text-transparent"
          style={{ fontFamily: "Syne, sans-serif" }}
        >
          {roomId}
        </div>
      </div>

      <button
        onClick={onGenerate}
        className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-medium text-gray-500 border border-gray-200 hover:bg-gray-50 hover:text-gray-800 transition-all"
      >
        <span>↻</span> Generate New Room
      </button>
    </div>
  );
}