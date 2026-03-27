export const generateRoomId = () =>
  Math.random().toString(36).substring(2, 8).toUpperCase();

export const formatTime = (d) =>
  d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

export const formatSize = (b) =>
  b < 1024
    ? b + " B"
    : b < 1048576
    ? (b / 1024).toFixed(1) + " KB"
    : (b / 1048576).toFixed(1) + " MB";

export const getExt = (name) => name.split(".").pop().toLowerCase();

const FILE_ICONS = {
  pdf: "📄", png: "🖼️", jpg: "🖼️", jpeg: "🖼️",
  doc: "📝", docx: "📝", txt: "📃", xlsx: "📊", default: "📎",
};

const FILE_TAG_CLASSES = {
  pdf: "bg-red-100 text-red-600",
  png: "bg-blue-100 text-blue-700",
  jpg: "bg-blue-100 text-blue-700",
  jpeg: "bg-blue-100 text-blue-700",
  doc: "bg-violet-100 text-violet-700",
  docx: "bg-violet-100 text-violet-700",
  default: "bg-violet-100 text-violet-700",
};

const FILE_ICON_BG = {
  pdf: "bg-red-100",
  png: "bg-blue-100",
  jpg: "bg-blue-100",
  jpeg: "bg-blue-100",
  default: "bg-violet-100",
};

export const fileIcon = (name) => FILE_ICONS[getExt(name)] || FILE_ICONS.default;
export const fileTagClass = (name) => FILE_TAG_CLASSES[getExt(name)] || FILE_TAG_CLASSES.default;
export const fileIconBg = (name) => FILE_ICON_BG[getExt(name)] || FILE_ICON_BG.default;