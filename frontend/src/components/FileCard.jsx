import { fileIcon, fileTagClass, fileIconBg, formatSize, formatTime, getExt } from "../utils/helpers";

export default function FileCard({ file, onDelete, onView, onPrint }) {
  return (
    <div className="flex items-center gap-3 p-3.5 rounded-2xl bg-white border border-gray-100 hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 animate-fadeIn">
      {/* Icon */}
      <div className={`w-11 h-11 rounded-xl flex items-center justify-center text-xl flex-shrink-0 ${fileIconBg(file.name)}`}>
        {fileIcon(file.name)}
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <div
          className="font-semibold text-sm text-gray-900 truncate"
          style={{ fontFamily: "Plus Jakarta Sans, Segoe UI, sans-serif" }}
        >
          {file.name}
        </div>
        <div className="flex items-center gap-2 mt-1 flex-wrap">
          <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold ${fileTagClass(file.name)}`}>
            {getExt(file.name).toUpperCase()}
          </span>
          <span className="text-xs text-gray-400">{formatSize(file.size)}</span>
          <span className="text-xs text-gray-400">· {formatTime(file.uploadedAt)}</span>
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-1.5 flex-shrink-0">
        <button
          onClick={() => onView(file)}
          className="px-3 py-1.5 rounded-lg text-xs font-medium text-gray-500 border border-gray-200 hover:bg-gray-50 hover:text-gray-800 transition-all"
        >
          View
        </button>
        <button
          onClick={() => onPrint(file)}
          className="px-3 py-1.5 rounded-lg text-xs font-medium text-white bg-gradient-to-r from-blue-600 to-violet-600 hover:shadow-md hover:-translate-y-0.5 transition-all"
        >
          🖨️
        </button>
        <button
          onClick={() => onDelete(file.id)}
          className="px-3 py-1.5 rounded-lg text-xs font-medium text-red-500 bg-red-50 border border-red-100 hover:bg-red-100 transition-all"
        >
          ✕
        </button>
      </div>
    </div>
  );
}