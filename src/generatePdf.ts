import PDFDocument from "pdfkit";
import fs from "fs";

export async function generatePdf(
  outputFileName: string,
  pageCount: number,
  targetSizeMB?: number
): Promise<void> {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({
      size: "A4",
      autoFirstPage: false,
    });

    const stream = fs.createWriteStream(outputFileName);
    doc.pipe(stream);

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

    stream.on("error", (error) => {
      reject(error);
    });

    stream.on("finish", () => {
      if (targetSizeMB) {
        const targetSize: number = targetSizeMB * 1024 * 1024;
        const stats = fs.statSync(outputFileName);
        const currentSize: number = stats.size;

        if (currentSize < targetSize) {
          const paddingBytes: number = targetSize - currentSize;
          const fd: number = fs.openSync(outputFileName, "a");
          const buf: Buffer = Buffer.alloc(1024, " ");
          let bytesToWrite: number = paddingBytes;
          while (bytesToWrite > 0) {
            const chunk: number = Math.min(bytesToWrite, 1024);
            fs.writeSync(fd, buf, 0, chunk);
            bytesToWrite -= chunk;
          }
          fs.closeSync(fd);
          console.log(
            `Appended ${paddingBytes} bytes to match target size of ${targetSizeMB} MB.`
          );
        } else if (currentSize > targetSize) {
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
      resolve();
    });
  });
}

export async function runCli(): Promise<void> {
  const rawArgs: string[] = process.argv.slice(2);
  if (rawArgs.length < 2) {
    console.error(
      "Usage: bun run src/generatePdf.ts <output-filename> <number-of-pages> [file-size-MB]"
    );
    process.exit(1);
  }
  const outputFileName: string = rawArgs[0];
  const pageCountStr: string = rawArgs[1];
  const targetSizeMB: string | undefined = rawArgs[2];

  const pageCount: number = parseInt(pageCountStr, 10);
  if (isNaN(pageCount) || pageCount <= 0) {
    console.error("Invalid number of pages provided.");
    process.exit(1);
  }

  await generatePdf(
    outputFileName,
    pageCount,
    targetSizeMB ? parseFloat(targetSizeMB) : undefined
  );
}

// Run CLI if this file is executed directly
if (require.main === module) {
  runCli().catch((error) => {
    console.error("Error:", error);
    process.exit(1);
  });
}
