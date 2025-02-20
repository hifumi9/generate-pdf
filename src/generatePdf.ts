import PDFDocument from "pdfkit";
import fs from "fs";

// Get command line arguments
const args = process.argv.slice(2);
if (args.length < 2) {
  console.error(
    "Usage: bun run src/generatePdf.ts <output-filename> <number-of-pages> [file-size-MB]"
  );
  process.exit(1);
}
const [outputFileName, numPages, targetSizeMB] = args;

const doc = new PDFDocument({
  size: "A4",
  autoFirstPage: false,
});

const stream = fs.createWriteStream(outputFileName);
doc.pipe(stream);

const pageCount = parseInt(numPages);
for (let i = 1; i <= pageCount; i++) {
  doc.addPage();

  const pageWidth = doc.page.width;
  const pageHeight = doc.page.height;

  doc.fontSize(20).text(`${i}`, 0, pageHeight / 2, {
    width: pageWidth,
    align: "center",
  });
}

doc.end();

stream.on("finish", () => {
  const pageCount = parseInt(numPages);
  if (targetSizeMB) {
    const targetSizeBytes = parseFloat(targetSizeMB) * 1024 * 1024;
    const stats = fs.statSync(outputFileName);
    const currentSize = stats.size;
    if (currentSize < targetSizeBytes) {
      const paddingBytes = targetSizeBytes - currentSize;
      const fd = fs.openSync(outputFileName, "a");
      const buf = Buffer.alloc(1024, " ");
      let bytesToWrite = paddingBytes;
      while (bytesToWrite > 0) {
        let chunk = Math.min(bytesToWrite, 1024);
        fs.writeSync(fd, buf, 0, chunk);
        bytesToWrite -= chunk;
      }
      fs.closeSync(fd);
      console.log(
        `Appended ${paddingBytes} bytes to match target size of ${targetSizeMB} MB.`
      );
    } else if (currentSize > targetSizeBytes) {
      console.warn(
        "Warning: The generated PDF is larger than the target file size."
      );
    }
    console.log(
      `PDF file "${outputFileName}" has been generated (${pageCount} pages, approx. ${targetSizeMB} MB).`
    );
  } else {
    console.log(
      `PDF file "${outputFileName}" has been generated (${pageCount} pages).`
    );
  }
});
