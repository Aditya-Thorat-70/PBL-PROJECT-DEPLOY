const fs = require("fs/promises");
const path = require("path");
const { execFile } = require("child_process");
const { promisify } = require("util");
const PDFDocument = require("pdfkit");

const execFileAsync = promisify(execFile);

const TEXT_EXTENSIONS = new Set([".txt", ".csv", ".md"]);
const IMAGE_EXTENSIONS = new Set([".jpg", ".jpeg", ".png"]);
const STRICT_LIBREOFFICE_EXTENSIONS = new Set([
  ".doc", ".docx", ".ppt", ".pptx", ".xls", ".xlsx", ".odt", ".odp", ".ods", ".rtf", ".txt", ".csv",
]);

const writeTextPdf = (text, outputPath) => new Promise((resolve, reject) => {
  const doc = new PDFDocument({ margin: 48, size: "A4" });
  const stream = require("fs").createWriteStream(outputPath);

  stream.on("finish", resolve);
  stream.on("error", reject);
  doc.on("error", reject);

  doc.pipe(stream);
  doc.font("Helvetica").fontSize(11).text(text || "(No extractable text found in the source file)", {
    width: 500,
    align: "left",
  });
  doc.end();
});

const writeImagePdf = (inputPath, outputPath) => new Promise((resolve, reject) => {
  const doc = new PDFDocument({ margin: 20, size: "A4" });
  const stream = require("fs").createWriteStream(outputPath);

  stream.on("finish", resolve);
  stream.on("error", reject);
  doc.on("error", reject);

  doc.pipe(stream);
  doc.image(inputPath, 20, 20, {
    fit: [555, 802],
    align: "center",
    valign: "center",
  });
  doc.end();
});

const getLibreOfficeCandidates = () => {
  const configuredPath = (process.env.LIBREOFFICE_PATH || "").trim();
  const candidates = [
    configuredPath,
    "soffice",
    "libreoffice",
    "soffice.exe",
    "C:\\Program Files\\LibreOffice\\program\\soffice.exe",
    "C:\\Program Files (x86)\\LibreOffice\\program\\soffice.exe",
  ].filter(Boolean);

  return [...new Set(candidates)];
};

const tryLibreOfficeConversion = async (inputPath, outputPath) => {
  const outputDir = path.dirname(outputPath);
  const generatedPath = path.join(outputDir, `${path.parse(inputPath).name}.pdf`);
  const conversionErrors = [];

  for (const binaryPath of getLibreOfficeCandidates()) {
    try {
      await execFileAsync(
        binaryPath,
        ["--headless", "--convert-to", "pdf", "--outdir", outputDir, inputPath],
        { timeout: 180000 }
      );

      await fs.access(generatedPath);

      if (generatedPath !== outputPath) {
        await fs.rename(generatedPath, outputPath);
      }

      return;
    } catch (error) {
      const detail = error?.stderr || error?.message || "Unknown LibreOffice error";
      conversionErrors.push(`${binaryPath}: ${String(detail).trim()}`);
    }
  }

  throw new Error(`LibreOffice conversion failed (${conversionErrors.join(" | ")})`);
};

/**
 * Converts a supported document/image file to PDF without LibreOffice.
 * @param {string} inputPath
 * @param {string} outputPath
 */
async function convertFileToPdf(inputPath, outputPath) {
  const extension = path.extname(inputPath).toLowerCase();
  await fs.mkdir(path.dirname(outputPath), { recursive: true });

  // Office formats should use LibreOffice only. If it fails, caller will keep original file.
  if (STRICT_LIBREOFFICE_EXTENSIONS.has(extension)) {
    await tryLibreOfficeConversion(inputPath, outputPath);
    return;
  }

  if (TEXT_EXTENSIONS.has(extension)) {
    const text = await fs.readFile(inputPath, "utf8");
    await writeTextPdf(text, outputPath);
    return;
  }

  if (IMAGE_EXTENSIONS.has(extension)) {
    await writeImagePdf(inputPath, outputPath);
    return;
  }

  throw new Error(`Conversion is not supported for ${extension || "this file type"} without LibreOffice.`);
}

module.exports = { convertFileToPdf };
