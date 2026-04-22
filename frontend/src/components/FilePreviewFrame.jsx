import { resolveFileViewerUrl } from "../utils/fileViewer";

export default function FilePreviewFrame({ fileUrl, title = "File preview", className = "" }) {
  const resolved = resolveFileViewerUrl(fileUrl);

  if (!resolved.ok) {
    return (
      <div className={`rounded-xl border border-red-200 bg-red-50 text-red-700 text-sm p-3 ${className}`}>
        {resolved.error}
      </div>
    );
  }

  // Embedded Google Viewer works only when the file URL is publicly accessible.
  // Private URLs, expiring signed links, or CORS/permission blocks can prevent preview.
  return (
    <iframe
      title={title}
      src={resolved.viewerUrl}
      className={`w-full min-h-[480px] rounded-xl border border-gray-200 bg-white ${className}`}
      loading="lazy"
      referrerPolicy="no-referrer"
      allow="fullscreen"
    />
  );
}
