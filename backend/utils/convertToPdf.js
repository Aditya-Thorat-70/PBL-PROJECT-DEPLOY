const fs = require("fs/promises");
const path = require("path");
const PDFDocument = require("pdfkit");
const officeParser = require("officeparser");

const TEXT_EXTENSIONS = new Set([".txt", ".csv", ".md", ".rtf"]);
const OFFICE_EXTENSIONS = new Set([".docx", ".pptx", ".xlsx", ".odt", ".odp", ".ods"]);
const IMAGE_EXTENSIONS = new Set([".jpg", ".jpeg", ".png"]);

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

/**
 * Converts a supported document/image file to PDF without LibreOffice.
 * @param {string} inputPath
 * @param {string} outputPath
 */
async function convertFileToPdf(inputPath, outputPath) {
  const extension = path.extname(inputPath).toLowerCase();
  await fs.mkdir(path.dirname(outputPath), { recursive: true });

  if (TEXT_EXTENSIONS.has(extension)) {
    const text = await fs.readFile(inputPath, "utf8");
    await writeTextPdf(text, outputPath);
    return;
  }

  if (OFFICE_EXTENSIONS.has(extension)) {
    try {
      const ast = await officeParser.parseOffice(inputPath);
      const extractedText = typeof ast?.toText === "function" ? ast.toText() : "";
      await writeTextPdf(extractedText, outputPath);
      return;
    } catch (error) {
      throw new Error(`Office parsing failed: ${error?.message || "Unknown parser error"}`);
    }
  }

  if (IMAGE_EXTENSIONS.has(extension)) {
    await writeImagePdf(inputPath, outputPath);
    return;
  }

  throw new Error(`Conversion is not supported for ${extension || "this file type"} without LibreOffice.`);
}

module.exports = { convertFileToPdf };
