import UploadForm from "./UploadForm";

export default function MobileDashboard({ onUpload, initialRoomId, uploadSource = "mobile" }) {
  const detectedRoomId = initialRoomId || null;
  const isScannerMode = uploadSource === "scanner";

  return (
    <div className="max-w-md mx-auto px-4 py-6">
      <div className="text-center mb-7">
        <h1 className="font-extrabold text-3xl text-gray-900 mb-2" style={{ fontFamily: "Plus Jakarta Sans, Segoe UI, sans-serif" }}>
          Send to Printer
        </h1>
        <p className="text-gray-500 text-sm">Upload a document directly from your phone</p>
      </div>

      <div className="mt-4 p-4 bg-indigo-50/60 rounded-2xl text-center">
        {detectedRoomId ? (
          <p className="text-sm text-green-700 font-semibold">
            Room detected: {detectedRoomId} (auto-filled below)
          </p>
        ) : (
          <p className="text-sm text-gray-500">
            Use Google Lens QR link to open with a room, or upload now to auto-generate a new Room ID.
          </p>
        )}
        {isScannerMode && (
          <p className="text-xs text-amber-700 mt-2 font-semibold">
            Scanner upload mode: this room will use a 10-minute timer.
          </p>
        )}
      </div>

      <div className="mt-4">
        <UploadForm roomId={detectedRoomId} onUpload={onUpload} uploadSource={uploadSource} />
      </div>
    </div>
  );
}