import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { encryptText } from "@/lib/encryption";
import { checkVaultAuth } from "@/app/actions";
import fs from "node:fs";
import path from "node:path";

export async function POST(req: Request) {
  try {
    if (!(await checkVaultAuth())) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const formData = await req.formData();
    const file = formData.get("file") as File | null;
    const rawTitle = (formData.get("title") as string)?.trim();
    const rawArtist = (formData.get("artist") as string)?.trim() || "Unknown Artist";
    const genre = (formData.get("genre") as string) || "CYBERPUNK";

    if (!file) {
      return NextResponse.json({ error: "Файл не выбран" }, { status: 400 });
    }

    const storageDir = path.join(process.cwd(), "storage", "vault-audio");
    if (!fs.existsSync(storageDir)) {
      fs.mkdirSync(storageDir, { recursive: true });
    }

    const ext = path.extname(file.name) || ".mp3";
    const safeFilename = `track_${Date.now()}_${Math.random().toString(36).slice(2, 7)}${ext}`;
    const fullPath = path.join(storageDir, safeFilename);

    const arrayBuffer = await file.arrayBuffer();
    fs.writeFileSync(fullPath, Buffer.from(arrayBuffer));

    // Если название не ввели вручную — берем из имени файла (например "Artist - Song.mp3")
    const fallbackTitle = file.name.replace(/\.[^/.]+$/, "");
    const title = rawTitle || fallbackTitle;

    await prisma.audioTrack.create({
      data: {
        title: encryptText(title),
        artist: encryptText(rawArtist),
        genre,
        filename: safeFilename,
        fileSize: file.size,
      },
    });

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("Audio Upload Error:", err);
    return NextResponse.json({ error: "Upload failed" }, { status: 500 });
  }
}