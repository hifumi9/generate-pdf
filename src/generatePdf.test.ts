import { test, expect, describe, beforeEach, afterEach, vi } from "vitest";
import fs from "fs";
import path from "path";
import { generatePdf, runCli } from "./generatePdf";
import { EventEmitter } from "events";

// Increase timeout for all tests
const TEST_TIMEOUT = 30000;

// Test without file size parameter
test(
  "generate PDF without file size",
  async () => {
    const outputFile = path.join(__dirname, "test_output_nosize.pdf");

    // Cleanup before test
    if (fs.existsSync(outputFile)) {
      fs.unlinkSync(outputFile);
    }

    await generatePdf(outputFile, 3);

    // Check that the file exists
    expect(fs.existsSync(outputFile)).toBe(true);

    // Check that the file size is greater than 0
    const stats = fs.statSync(outputFile);
    expect(stats.size).toBeGreaterThan(0);

    // Cleanup
    fs.unlinkSync(outputFile);
  },
  TEST_TIMEOUT
);

// Test with file size parameter
test(
  "generate PDF with file size",
  async () => {
    const outputFile = path.join(__dirname, "test_output_size.pdf");

    // Cleanup before test
    if (fs.existsSync(outputFile)) {
      fs.unlinkSync(outputFile);
    }

    const targetMB = 1; // Target about 1 MB
    await generatePdf(outputFile, 3, targetMB);

    // Check that the file exists
    expect(fs.existsSync(outputFile)).toBe(true);

    const stats = fs.statSync(outputFile);
    const targetSize = targetMB * 1024 * 1024;
    // The file size should be at least targetSize (padded if necessary)
    expect(stats.size).toBeGreaterThanOrEqual(targetSize);

    // Cleanup
    fs.unlinkSync(outputFile);
  },
  TEST_TIMEOUT
);

// Test for correct page count based on argument
test(
  "generate PDF with correct page count",
  async () => {
    const outputFile = path.join(__dirname, "test_output_pagecount.pdf");
    const targetPages = 5;

    // Cleanup before test
    if (fs.existsSync(outputFile)) {
      fs.unlinkSync(outputFile);
    }

    await generatePdf(outputFile, targetPages);

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
  },
  TEST_TIMEOUT
);

// Test for PDF with too small target size (should trigger warning when currentSize > targetSize)
test(
  "generate PDF with too small target size",
  async () => {
    const outputFile = path.join(__dirname, "test_output_too_small.pdf");

    // Cleanup before test
    if (fs.existsSync(outputFile)) {
      fs.unlinkSync(outputFile);
    }

    // Use an extremely small target size so that the generated PDF is larger than the target size
    const verySmallTargetMB = 0.0001; // approx 104.8576 bytes
    const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});

    await generatePdf(outputFile, 3, verySmallTargetMB);

    // Check that the file exists
    expect(fs.existsSync(outputFile)).toBe(true);

    // Expect that the warning for larger than target file size was called
    expect(warnSpy).toHaveBeenCalledWith(
      "Warning: The generated PDF is larger than the target file size."
    );

    // Cleanup
    fs.unlinkSync(outputFile);
    warnSpy.mockRestore();
  },
  TEST_TIMEOUT
);

// Group CLI tests
describe("CLI tests for generatePdf", () => {
  let originalArgv: string[];
  let exitSpy: any;

  beforeEach(() => {
    originalArgv = process.argv.slice();
    exitSpy = vi
      .spyOn(process, "exit")
      .mockImplementation(
        (code?: string | number | null | undefined): never => {
          throw new Error(`process.exit: ${code}`);
        }
      );
  });

  afterEach(() => {
    process.argv = originalArgv;
    exitSpy.mockRestore();
    vi.restoreAllMocks();
  });

  test("runCli with insufficient arguments should exit", async () => {
    process.argv = ["node", "generatePdf.ts"];
    const consoleErrorSpy = vi
      .spyOn(console, "error")
      .mockImplementation(() => {});

    await expect(runCli()).rejects.toThrow("process.exit: 1");
    expect(consoleErrorSpy).toHaveBeenCalledWith(
      "Usage: bun run src/generatePdf.ts <output-filename> <number-of-pages> [file-size-MB]"
    );

    consoleErrorSpy.mockRestore();
  });

  test("runCli with invalid page number should exit", async () => {
    process.argv = ["node", "generatePdf.ts", "dummy.pdf", "abc"];
    const consoleErrorSpy = vi
      .spyOn(console, "error")
      .mockImplementation(() => {});

    await expect(runCli()).rejects.toThrow("process.exit: 1");
    expect(consoleErrorSpy).toHaveBeenCalledWith(
      "Invalid number of pages provided."
    );

    consoleErrorSpy.mockRestore();
  });

  test("runCli with valid arguments should generate PDF", async () => {
    const outputFile = path.join(__dirname, "test_output_cli.pdf");
    process.argv = ["node", "generatePdf.ts", outputFile, "4", "2"];

    // Cleanup before test
    if (fs.existsSync(outputFile)) {
      fs.unlinkSync(outputFile);
    }

    await runCli();

    expect(fs.existsSync(outputFile)).toBe(true);
    const stats = fs.statSync(outputFile);
    expect(stats.size).toBeGreaterThan(0);

    // Cleanup
    fs.unlinkSync(outputFile);
  });
});

// Error handling tests
describe("Error handling in generatePdf", () => {
  test("generatePdf should handle write stream errors", async () => {
    const outputFile = path.join(__dirname, "test_error.pdf");
    const mockStream = new EventEmitter();
    Object.assign(mockStream, {
      write: vi.fn(),
      end: vi.fn(),
    });

    vi.spyOn(fs, "createWriteStream").mockReturnValue(mockStream as any);

    const generatePromise = generatePdf(outputFile, 1);
    mockStream.emit("error", new Error("Write stream error"));

    await expect(generatePromise).rejects.toThrow("Write stream error");
    vi.restoreAllMocks();
  });

  test("generatePdf should handle file system errors", async () => {
    const invalidPath = path.join(__dirname, "nonexistent", "test.pdf");
    await expect(generatePdf(invalidPath, 1)).rejects.toThrow();
  });
});
