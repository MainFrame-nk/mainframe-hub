import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { checkVaultAuth } from "@/app/actions";
import { decryptFileChunk, hashSharePassword } from "@/lib/encryption";
import fs from "node:fs";
import path from "node:path";

export async function GET(
  req: Request,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;
  const { searchParams } = new URL(req.url);
  const shareToken = searchParams.get("token");
  const sharePass = searchParams.get("pass") || "";

  const fileRecord = await prisma.cloudFile.findUnique({ where: { id } });
  if (!fileRecord) {
    return new NextResponse("File not found", { status: 404 });
  }

  const storageKey = fileRecord.storageKey;
  const isEncrypted = fileRecord.isEncrypted;
  const mimeType = fileRecord.mimeType || "application/octet-stream";
  const fileName = fileRecord.name;

  // ЕСЛИ ЕСТЬ ТОКЕН ССЫЛКИ (?token=...) — ВСЕГДА ПРОВЕРЯЕМ ПРАВИЛА ССЫЛКИ (даже если открыл владелец!)
  if (shareToken) {
    const share = await prisma.sharedLink.findUnique({
      where: { token: shareToken },
    });

    if (!share || share.fileId !== fileRecord.id) {
      return new NextResponse("Ссылка недействительна или уже удалена", { status: 403 });
    }

    // 1. Если время истекло — УДАЛЯЕМ ссылку из базы и блокируем скачивание
    if (share.expiresAt && new Date() > share.expiresAt) {
      await prisma.sharedLink.delete({ where: { id: share.id } }).catch(() => {});
      return new NextResponse("Срок действия ссылки истек (ссылка удалена)", { status: 410 });
    }

    // 2. Если лимит уже был исчерпан — УДАЛЯЕМ ссылку из базы и блокируем
    if (share.maxDownloads && share.downloadCount >= share.maxDownloads) {
      await prisma.sharedLink.delete({ where: { id: share.id } }).catch(() => {});
      return new NextResponse("Лимит скачиваний исчерпан (ссылка удалена)", { status: 410 });
    }

    // 3. Проверяем пароль (ДО того как менять счетчик или удалять ссылку!)
    if (share.passwordHash) {
      const providedHash = hashSharePassword(sharePass);
      if (providedHash !== share.passwordHash) {
        return new NextResponse("Неверный пароль доступа к файлу!", { status: 401 });
      }
    }

    // 4. Увеличиваем счетчик скачиваний (или УДАЛЯЕМ ссылку, если это было последнее скачивание!)
    const rangeHeader = req.headers.get("range");
    if (!rangeHeader || rangeHeader.startsWith("bytes=0-")) {
      const nextCount = share.downloadCount + 1;

      if (share.maxDownloads && nextCount >= share.maxDownloads) {
        // Это последнее разрешенное скачивание! Сразу сжигаем ссылку в БД, но файл сейчас отдадим
        await prisma.sharedLink.delete({ where: { id: share.id } }).catch(() => {});
      } else {
        await prisma.sharedLink.update({
          where: { id: share.id },
          data: { downloadCount: nextCount },
        });
      }
    }
  } else {
    // Если токена нет (прямое скачивание из /vault) — пускаем только владельца
    const isOwner = await checkVaultAuth();
    if (!isOwner) {
      return new NextResponse("Access Denied: Vault Locked", { status: 401 });
    }
  }

  const encryptedPath = path.join(
    process.cwd(),
    "storage",
    "vault-encrypted",
    storageKey
  );

  if (!fs.existsSync(encryptedPath)) {
    return new NextResponse("Encrypted binary not found on storage node", { status: 404 });
  }

  const stat = fs.statSync(encryptedPath);
  const fileSize = stat.size;
  const encodedFilename = encodeURIComponent(fileName);

  const stream = new ReadableStream({
    start(controller) {
      const CHUNK_SIZE = 1024 * 1024; // 1 МБ
      const fd = fs.openSync(encryptedPath, "r");
      let offset = 0;

      function pushNextChunk() {
        try {
          if (offset >= fileSize) {
            fs.closeSync(fd);
            controller.close();
            return;
          }
          const bytesToRead = Math.min(CHUNK_SIZE, fileSize - offset);
          const buffer = Buffer.alloc(bytesToRead);
          fs.readSync(fd, buffer, 0, bytesToRead, offset);

          const decrypted = isEncrypted
            ? decryptFileChunk(buffer, storageKey, offset)
            : buffer;

          offset += bytesToRead;
          controller.enqueue(decrypted);
          setImmediate(pushNextChunk);
        } catch (err) {
          try {
            fs.closeSync(fd);
          } catch {}
          controller.error(err);
        }
      }

      pushNextChunk();
    },
  });

  return new NextResponse(stream, {
    status: 200,
    headers: {
      "Content-Type": mimeType,
      "Content-Length": String(fileSize),
      "Content-Disposition": `attachment; filename*=UTF-8''${encodedFilename}`,
      "Cache-Control": "no-store, max-age=0",
    },
  });
}