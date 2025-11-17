import { TextDecoder } from "util";
import { PdfReader } from "pdfreader";

const textDecoder = new TextDecoder("utf-8");

async function extractFromPdf(data: Uint8Array) {
  return new Promise<string>((resolve, reject) => {
    const rows: Record<number, string[]> = {};
    new PdfReader().parseBuffer(Buffer.from(data), (err, item) => {
      if (err) {
        reject(err);
      } else if (!item) {
        const text = Object.keys(rows)
          .sort((a, b) => Number(a) - Number(b))
          .map((y) => rows[Number(y)].join(" "))
          .join("\n");
        resolve(text);
      } else if (item.text) {
        rows[item.y] = rows[item.y] || [];
        rows[item.y].push(item.text);
      }
    });
  });
}

async function extractFromDocx(buffer: Buffer) {
  const mammoth = await import("mammoth");
  const result = await mammoth.extractRawText({ buffer });
  return result.value ?? "";
}

function extractFromPlainText(uint8: Uint8Array) {
  return textDecoder.decode(uint8);
}

const supportedMime: Record<
  string,
  (data: Uint8Array, buffer: Buffer) => Promise<string> | string
> = {
  "application/pdf": (uint8) => extractFromPdf(uint8),
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document": (
    _uint8,
    buffer
  ) => extractFromDocx(buffer),
  "text/plain": (uint8) => extractFromPlainText(uint8),
  "text/markdown": (uint8) => extractFromPlainText(uint8),
};

const extensionFallback: Record<
  string,
  (data: Uint8Array, buffer: Buffer) => Promise<string> | string
> = {
  pdf: (uint8) => extractFromPdf(uint8),
  docx: (_uint8, buffer) => extractFromDocx(buffer),
  txt: (uint8) => extractFromPlainText(uint8),
  md: (uint8) => extractFromPlainText(uint8),
};

export async function extractTextFromFile(
  file: File
): Promise<{
  text: string;
  mimeType: string;
  originalFilename?: string;
}> {
  const arrayBuffer = await file.arrayBuffer();
  const uint8 = new Uint8Array(arrayBuffer);
  const buffer = Buffer.from(uint8);
  const mimeType = file.type || "application/octet-stream";
  const handler = supportedMime[mimeType];

  if (handler) {
    const text = await handler(uint8, buffer);
    return { text: text.trim(), mimeType, originalFilename: file.name };
  }

  const extension = file.name?.split(".").pop()?.toLowerCase();
  if (extension && extensionFallback[extension]) {
    const text = await extensionFallback[extension](uint8, buffer);
    return {
      text: typeof text === "string" ? text.trim() : text.toString().trim(),
      mimeType: mimeType || `application/${extension}`,
      originalFilename: file.name,
    };
  }

  throw new Error(
    "Unsupported file type. Upload PDF, DOCX, TXT, or Markdown resumes."
  );
}

