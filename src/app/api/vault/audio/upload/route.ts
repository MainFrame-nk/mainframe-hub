import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { encryptText, createFileEncryptStream } from "@/lib/encryption";
import { checkVaultAuth } from "@/app/actions";
import fs from "node:fs";
import path from "node:path";
import { Readable } from "node:stream";
import { pipeline } from "node:stream/promises";

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

    // Сохраняем оригинальное расширение в конце зашифрованного имени для определения MIME-типа,
    // а префикс enc_audio_ сигнализирует стримеру, что файл зашифрован AES-256-CTR
    const ext = path.extname(file.name).toLowerCase() || ".mp3";
    const encryptedFilename = `enc_audio_${Date.now()}_${Math.random()
      .toString(36)
      .slice(2, 9)}${ext}`;
    const fullPath = path.join(storageDir, encryptedFilename);

    // Потоковое шифрование трека на лету прямо из браузера на диск (0 нагрузки на RAM!)
    const webStream = file.stream();
    // @ts-expect-error Readable.fromWeb типы в Node 22
    const nodeReadStream = Readable.fromWeb(webStream);
    const encryptStream = createFileEncryptStream(encryptedFilename);
    const writeStream = fs.createWriteStream(fullPath);

    await pipeline(nodeReadStream, encryptStream, writeStream);

    const fallbackTitle = file.name.replace(/\.[^/.]+$/, "");
    const title = rawTitle || fallbackTitle;

    await prisma.audioTrack.create({
      data: {
        title: encryptText(title),
        artist: encryptText(rawArtist),
        genre,
        filename: encryptedFilename,
        fileSize: file.size,
      },
    });

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("Encrypted Audio Upload Error:", err);
    return NextResponse.json({ error: "Upload failed" }, { status: 500 });
  }
}