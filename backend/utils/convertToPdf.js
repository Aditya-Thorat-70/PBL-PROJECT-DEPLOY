const fs = require("fs/promises");
const path = require("path");
const { execFile } = require("child_process");
const { promisify } = require("util");

const execFileAsync = promisify(execFile);

/**
 * Converts a supported document/image file to PDF using LibreOffice.
 * @param {string} inputPath
 * @param {string} outputPath
 */
async function convertFileToPdf(inputPath, outputPath) {
  const binaryPath = process.env.LIBREOFFICE_PATH || "soffice";
  const outputDir = path.dirname(outputPath);
  const generatedPath = path.join(outputDir, `${path.parse(inputPath).name}.pdf`);

  await fs.mkdir(outputDir, { recursive: true });

  try {
    await execFileAsync(
      binaryPath,
      ["--headless", "--convert-to", "pdf", "--outdir", outputDir, inputPath],
      { timeout: 120000 }
    );
  } catch (error) {
    const stderr = error?.stderr ? String(error.stderr).trim() : "";
    const detail = stderr || error?.message || "Unknown conversion error";
    throw new Error(`LibreOffice conversion failed: ${detail}`);
  }

  await fs.access(generatedPath);

  if (generatedPath !== outputPath) {
    await fs.rename(generatedPath, outputPath);
  }
}

module.exports = { convertFileToPdf };
