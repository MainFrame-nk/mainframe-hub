import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { checkVaultAuth } from "@/app/actions";
import { createFileEncryptStream } from "@/lib/encryption";
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
    const file = formData.get("file") as File;
    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    // Закрытая папка зашифрованного буфера/хранилища (вне public!)
    const vaultDir = path.join(process.cwd(), "storage", "vault-encrypted");
    if (!fs.existsSync(vaultDir)) {
      fs.mkdirSync(vaultDir, { recursive: true });
    }

    // Генерируем обезличенное имя файла (чтобы хостер даже имя файла не видел на диске!)
    const storageKey = `enc_${Date.now()}_${Math.random().toString(36).slice(2, 10)}.bin`;
    const encryptedFilePath = path.join(vaultDir, storageKey);

    // Потоковое шифрование на лету прямо из браузера на диск (0 нагрузки на RAM!)
    const webStream = file.stream();
    // @ts-expect-error Readable.fromWeb типы в Node 22
    const nodeReadStream = Readable.fromWeb(webStream);
    const encryptStream = createFileEncryptStream(storageKey);
    const writeStream = fs.createWriteStream(encryptedFilePath);

    await pipeline(nodeReadStream, encryptStream, writeStream);

    const created = await prisma.cloudFile.create({
      data: {
        name: file.name,
        size: file.size,
        mimeType: file.type || "application/octet-stream",
        storageKey,
        isEncrypted: true,
        syncStatus: "ENCRYPTED_BUFFER",
        fileUrl: `/api/vault/file/`, // Обновим ниже с ID
      },
    });

    // Обновляем внутреннюю ссылку для скачивания владельцем
    await prisma.cloudFile.update({
      where: { id: created.id },
      data: { fileUrl: `/api/vault/file/${created.id}` },
    });

    return NextResponse.json({ success: true, fileId: created.id });
  } catch (error) {
    console.error("Encrypted Upload Error:", error);
    return NextResponse.json({ error: "Server upload error" }, { status: 500 });
  }
}