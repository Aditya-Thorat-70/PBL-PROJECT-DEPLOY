import FileCard from "./FileCard";

function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center py-16 gap-3 text-gray-400">
      <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center text-4xl">
        🗂️
      </div>
      <h3 className="font-bold text-lg text-gray-700" style={{ fontFamily: "Plus Jakarta Sans, Segoe UI, sans-serif" }}>
        No files yet
      </h3>
      <p className="text-sm max-w-xs text-center">
        Scan the QR code on a mobile device to upload documents
      </p>
    </div>
  );
}

export default function FileList({ files, onDelete, onView, onPrint }) {
  if (!files.length) return <EmptyState />;

  return (
    <div className="flex flex-col gap-2.5">
      {files.map((file, i) => (
        <div key={file.id} style={{ animationDelay: `${i * 60}ms` }}>
          <FileCard file={file} onDelete={onDelete} onView={onView} onPrint={onPrint} />
        </div>
      ))}
    </div>
  );
}