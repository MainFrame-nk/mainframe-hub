import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { cookies } from "next/headers";

export async function POST(req: Request) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("mainframe_vault_auth")?.value;
    const secret = process.env.VAULT_PASSWORD || "mainframe-secret-2026";
    if (token !== secret) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const formData = await req.formData();
    const file = formData.get("file") as File;
    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    const base64Data = buffer.toString("base64");

    const driveWebhookUrl = process.env.GOOGLE_DRIVE_WEB_APP_URL;
    let fileUrl = "";
    let driveFileId = "";

    // Отправка в облако Google Drive
    if (driveWebhookUrl && !driveWebhookUrl.includes("vstav")) {
      try {
        const res = await fetch(driveWebhookUrl, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            filename: file.name,
            mimeType: file.type || "application/octet-stream",
            fileData: base64Data,
          }),
        });
        const result = await res.json();
        if (result.success) {
          fileUrl = result.fileUrl;
          driveFileId = result.driveFileId;
        }
      } catch (e) {
        console.error("Google Drive API error:", e);
      }
    }

    // Сохраняем в SQLite вместе с driveFileId
    await prisma.cloudFile.create({
      data: {
        name: file.name,
        size: file.size,
        mimeType: file.type || "application/octet-stream",
        fileUrl: fileUrl || "#",
        driveFileId: driveFileId || null,
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Upload route error:", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}