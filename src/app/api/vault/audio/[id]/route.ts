import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { checkVaultAuth } from "@/app/actions";
import fs from "node:fs";
import path from "node:path";

export async function GET(
  req: Request,
  context: { params: Promise<{ id: string }> }
) {
  if (!(await checkVaultAuth())) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  const { id } = await context.params;
  const track = await prisma.audioTrack.findUnique({ where: { id } });
  if (!track) {
    return new NextResponse("Not found", { status: 404 });
  }

  const filePath = path.join(process.cwd(), "storage", "vault-audio", track.filename);
  if (!fs.existsSync(filePath)) {
    return new NextResponse("File missing on disk", { status: 404 });
  }

  const stat = fs.statSync(filePath);
  const fileSize = stat.size;
  const range = req.headers.get("range");

  const ext = path.extname(track.filename).toLowerCase();
  const mimeMap: Record<string, string> = {
    ".mp3": "audio/mpeg",
    ".flac": "audio/flac",
    ".wav": "audio/wav",
    ".ogg": "audio/ogg",
    ".m4a": "audio/mp4",
  };
  const contentType = mimeMap[ext] || "audio/mpeg";

  if (range) {
    const parts = range.replace(/bytes=/, "").split("-");
    const start = parseInt(parts[0], 10);
    const end = parts[1] ? parseInt(parts[1], 10) : fileSize - 1;
    const chunkSize = end - start + 1;

    const fileBuffer = Buffer.alloc(chunkSize);
    const fd = fs.openSync(filePath, "r");
    fs.readSync(fd, fileBuffer, 0, chunkSize, start);
    fs.closeSync(fd);

    return new NextResponse(fileBuffer, {
      status: 206,
      headers: {
        "Content-Range": `bytes ${start}-${end}/${fileSize}`,
        "Accept-Ranges": "bytes",
        "Content-Length": String(chunkSize),
        "Content-Type": contentType,
      },
    });
  }

  const fileBuffer = fs.readFileSync(filePath);
  return new NextResponse(fileBuffer, {
    status: 200,
    headers: {
      "Content-Length": String(fileSize),
      "Content-Type": contentType,
      "Accept-Ranges": "bytes",
    },
  });
}