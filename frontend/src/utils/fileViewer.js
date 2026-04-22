const DIRECT_PREVIEW_EXTENSIONS = new Set(["pdf"]);
const GOOGLE_VIEWER_EXTENSIONS = new Set([
  "doc",
  "docx",
  "ppt",
  "pptx",
  "xls",
  "xlsx",
  "txt",
  "rtf",
  "odt",
  "ods",
  "odp",
]);

const normalizeUrl = (fileUrl) => {
  if (typeof fileUrl !== "string" || !fileUrl.trim()) {
    return null;
  }

  try {
    const parsed = new URL(fileUrl.trim());
    if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
};

export const getFileExtensionFromUrl = (fileUrl) => {
  const parsed = normalizeUrl(fileUrl);
  if (!parsed) return "";

  const pathname = parsed.pathname || "";
  const lastSegment = pathname.split("/").pop() || "";
  const cleanFileName = lastSegment.split("?")[0].split("#")[0];
  const ext = cleanFileName.includes(".") ? cleanFileName.split(".").pop() : "";

  return String(ext || "").toLowerCase().trim();
};

export const getGoogleViewerUrl = (fileUrl) => {
  const parsed = normalizeUrl(fileUrl);
  if (!parsed) return "";

  // Google Docs Viewer can preview only publicly reachable URLs.
  // If your backend file URL is private/auth-protected, the preview will fail.
  // Use full viewer page instead of embedded mode to open directly in the
  // printable Google Viewer tab and avoid extra open steps.
  return `https://docs.google.com/viewerng/viewer?url=${encodeURIComponent(parsed.href)}&hl=en&chrome=true`;
};

export const resolveFileViewerUrl = (fileUrl) => {
  const parsed = normalizeUrl(fileUrl);
  if (!parsed) {
    return { ok: false, error: "Invalid file URL", mode: null, viewerUrl: "" };
  }

  const ext = getFileExtensionFromUrl(parsed.href);
  if (!ext) {
    return { ok: false, error: "Missing file extension", mode: null, viewerUrl: "" };
  }

  if (DIRECT_PREVIEW_EXTENSIONS.has(ext)) {
    return {
      ok: true,
      error: "",
      mode: "direct",
      viewerUrl: parsed.href,
      ext,
    };
  }

  if (GOOGLE_VIEWER_EXTENSIONS.has(ext)) {
    return {
      ok: true,
      error: "",
      mode: "google",
      viewerUrl: getGoogleViewerUrl(parsed.href),
      ext,
    };
  }

  return {
    ok: false,
    error: `Unsupported file type: .${ext}`,
    mode: null,
    viewerUrl: "",
    ext,
  };
};

export const openFileViewer = (fileUrl) => {
  const resolved = resolveFileViewerUrl(fileUrl);
  if (!resolved.ok) {
    return resolved;
  }

  const openedWindow = window.open(resolved.viewerUrl, "_blank", "noopener,noreferrer");
  if (!openedWindow) {
    return {
      ok: false,
      error: "Popup blocked. Allow popups to preview files.",
      mode: resolved.mode,
      viewerUrl: resolved.viewerUrl,
      ext: resolved.ext,
    };
  }

  return resolved;
};
