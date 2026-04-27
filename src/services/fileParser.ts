import mammoth from "mammoth";

export async function parseDocument(fileName: string, buffer: Buffer): Promise<string> {
  const lower = fileName.toLowerCase();
  if (lower.endsWith(".txt")) return buffer.toString("utf8");
  if (lower.endsWith(".docx")) {
    const out = await mammoth.extractRawText({ buffer });
    return out.value;
  }
  if (lower.endsWith(".pdf")) {
    const pdfModule = await import("pdf-parse");
    const parser = (pdfModule as unknown as { default?: (input: Buffer) => Promise<{ text: string }> }).default ?? (pdfModule as unknown as (input: Buffer) => Promise<{ text: string }>);
    const out = await parser(buffer);
    return out.text;
  }
  return buffer.toString("utf8");
}