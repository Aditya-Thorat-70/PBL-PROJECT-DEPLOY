const fs = require("fs/promises");
const libre = require("libreoffice-convert");
const { promisify } = require("util");

const convertAsync = promisify(libre.convert);

/**
 * Converts a supported document/image file to PDF using LibreOffice.
 * @param {string} inputPath
 * @param {string} outputPath
 */
async function convertFileToPdf(inputPath, outputPath) {
  const inputBuffer = await fs.readFile(inputPath);
  const pdfBuffer = await convertAsync(inputBuffer, ".pdf", undefined);
  await fs.writeFile(outputPath, pdfBuffer);
}

module.exports = { convertFileToPdf };
