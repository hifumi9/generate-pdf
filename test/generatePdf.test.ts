import { test, expect } from "vitest";
import { exec } from "child_process";
import fs from "fs";
import path from "path";
import util from "util";

const execPromise = util.promisify(exec);

// Test without file size parameter
test("generate PDF without file size", async () => {
  const outputFile = path.join(__dirname, "test_output_nosize.pdf");

  // Cleanup before test
  if (fs.existsSync(outputFile)) {
    fs.unlinkSync(outputFile);
  }

  // Run the generatePdf script with 3 pages
  await execPromise(`bun run src/generatePdf.ts ${outputFile} 3`);

  // Check that the file exists
  expect(fs.existsSync(outputFile)).toBe(true);

  // Check that the file size is greater than 0
  const stats = fs.statSync(outputFile);
  expect(stats.size).toBeGreaterThan(0);

  // Cleanup
  fs.unlinkSync(outputFile);
});

// Test with file size parameter
test("generate PDF with file size", async () => {
  const outputFile = path.join(__dirname, "test_output_size.pdf");

  // Cleanup before test
  if (fs.existsSync(outputFile)) {
    fs.unlinkSync(outputFile);
  }

  const targetMB = 1; // Target about 1 MB
  await execPromise(`bun run src/generatePdf.ts ${outputFile} 3 ${targetMB}`);

  // Check that the file exists
  expect(fs.existsSync(outputFile)).toBe(true);

  const stats = fs.statSync(outputFile);
  const targetSize = targetMB * 1024 * 1024;
  // The file size should be at least targetSize (padded if necessary)
  expect(stats.size).toBeGreaterThanOrEqual(targetSize);

  // Cleanup
  fs.unlinkSync(outputFile);
});

// Test for correct page count based on argument
test("generate PDF with correct page count", async () => {
  const outputFile = path.join(__dirname, "test_output_pagecount.pdf");
  const targetPages = 5;

  // Cleanup before test
  if (fs.existsSync(outputFile)) {
    fs.unlinkSync(outputFile);
  }

  // Run the generatePdf script with targetPages pages
  await execPromise(`bun run src/generatePdf.ts ${outputFile} ${targetPages}`);

  // Check that the file exists
  expect(fs.existsSync(outputFile)).toBe(true);

  // Read the PDF file content as a string
  const pdfContent = fs.readFileSync(outputFile).toString();

  // Count occurrences of "/Type /Page" in PDF content
  const matches = pdfContent.match(/\/Type\s*\/Page/g) || [];
  const pageCountFound = matches.length;

  expect(pageCountFound - 1).toBe(targetPages);

  // Cleanup
  fs.unlinkSync(outputFile);
});
