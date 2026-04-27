import type { NextApiRequest, NextApiResponse } from "next";
import { parseDocument } from "@/services/fileParser";

type ReqBody = {
  fileName: string;
  dataUrl: string;
  mimeType?: string;
};

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });
  try {
    const { fileName, dataUrl } = req.body as ReqBody;
    const base64 = dataUrl.split(",")[1];
    const buffer = Buffer.from(base64, "base64");
    const text = await parseDocument(fileName, buffer);
    return res.status(200).json({ text: text.trim().slice(0, 30000) });
  } catch {
    return res.status(400).json({ error: "Failed to parse file" });
  }
}
