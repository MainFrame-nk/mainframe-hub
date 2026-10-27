import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { checkVaultAuth } from "@/app/actions";
import { decryptFileChunk } from "@/lib/encryption";
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

  const filename = track.filename;
  const isEncrypted = filename.startsWith("enc_audio_");

  const filePath = path.join(process.cwd(), "storage", "vault-audio", filename);
  if (!fs.existsSync(filePath)) {
    return new NextResponse("File missing on disk", { status: 404 });
  }

  const stat = fs.statSync(filePath);
  const fileSize = stat.size;
  const range = req.headers.get("range");

  const ext = path.extname(filename).toLowerCase();
  const mimeMap: Record<string, string> = {
    ".mp3": "audio/mpeg",
    ".flac": "audio/flac",
    ".wav": "audio/wav",
    ".ogg": "audio/ogg",
    ".m4a": "audio/mp4",
  };
  const contentType = mimeMap[ext] || "audio/mpeg";

  // 1. Потоковое чтение с любого места песни (перемотка ползунком в плеере)
  if (range) {
    const parts = range.replace(/bytes=/, "").split("-");
    const start = parseInt(parts[0], 10);
    // Отдаем порциями максимум по 2 МБ для мгновенного отклика
    const maxEnd = Math.min(start + 2 * 1024 * 1024 - 1, fileSize - 1);
    const end = parts[1] ? Math.min(parseInt(parts[1], 10), fileSize - 1) : maxEnd;
    const chunkSize = end - start + 1;

    const rawBuffer = Buffer.alloc(chunkSize);
    const fd = fs.openSync(filePath, "r");
    fs.readSync(fd, rawBuffer, 0, chunkSize, start);
    fs.closeSync(fd);

    // Расшифровываем ровно этот кусок со смещением `start` в оперативной памяти (RAM)
    const outputBuffer = isEncrypted
      ? decryptFileChunk(rawBuffer, filename, start)
      : rawBuffer;

    return new NextResponse(new Uint8Array(outputBuffer), {
      status: 206,
      headers: {
        "Content-Range": `bytes ${start}-${end}/${fileSize}`,
        "Accept-Ranges": "bytes",
        "Content-Length": String(chunkSize),
        "Content-Type": contentType,
        "Cache-Control": "private, no-store",
      },
    });
  }

  // 2. Если браузер запросил поток целиком без Range
  const rawBuffer = fs.readFileSync(filePath);
  const outputBuffer = isEncrypted
    ? decryptFileChunk(rawBuffer, filename, 0)
    : rawBuffer;

  return new NextResponse(new Uint8Array(outputBuffer), {
    status: 200,
    headers: {
      "Content-Length": String(fileSize),
      "Content-Type": contentType,
      "Accept-Ranges": "bytes",
      "Cache-Control": "private, no-store",
    },
  });
}