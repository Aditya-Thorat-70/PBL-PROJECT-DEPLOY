import UploadForm from "./UploadForm";

export default function MobileDashboard({ onUpload, initialRoomId, uploadSource = "mobile", roomInUse = false }) {
  const detectedRoomId = initialRoomId || null;
  const isScannerMode = uploadSource === "scanner";

  return (
    <div className="max-w-md mx-auto px-4 py-4">
      <div className="mb-3 px-3 py-2.5 bg-indigo-50/60 rounded-2xl text-center">
        {detectedRoomId ? (
          <p className="text-xs sm:text-sm text-green-700 font-semibold leading-snug">
            Room detected: {detectedRoomId} (auto-filled below)
          </p>
        ) : (
          <p className="text-xs sm:text-sm text-gray-500 leading-snug">
            Use Google Lens QR link to open with a room, or upload now to auto-generate a new Room ID.
          </p>
        )}
        {isScannerMode && (
          <p className="text-[11px] sm:text-xs text-amber-700 mt-1 font-semibold leading-snug">
            Scanner upload mode: this room will use a 10-minute timer.
          </p>
        )}
        {roomInUse && isScannerMode && (
          <p className="text-[11px] sm:text-xs text-red-700 mt-1 font-semibold leading-snug">
            ⚠️ This scanner room is currently in use. Please wait or try a different room.
          </p>
        )}
      </div>

      <div className="mt-3">
        <UploadForm roomId={detectedRoomId} onUpload={onUpload} uploadSource={uploadSource} roomInUse={roomInUse} />
      </div>
    </div>
  );
}