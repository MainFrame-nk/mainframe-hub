import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import fs from "node:fs";
import path from "node:path";
import { decryptText } from "@/lib/encryption";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const secret = searchParams.get("secret");

  // Защита вызова секретным ключом
  if (secret !== process.env.VAULT_PASSWORD && secret !== "mainframe-secret-2026") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const action = searchParams.get("action"); // "backup" или "digest"
  const botToken = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_CHAT_ID;

  if (!botToken || !chatId) {
    return NextResponse.json({ error: "No Telegram keys" }, { status: 500 });
  }

  // 1. ЕЖЕНЕДЕЛЬНЫЙ БЭКАП
  if (action === "backup") {
    const dbPath = path.join(process.cwd(), "prisma", "dev.db");
    const fallbackDbPath = path.join(process.cwd(), "dev.db");
    const targetPath = fs.existsSync(dbPath) ? dbPath : fallbackDbPath;

    if (!fs.existsSync(targetPath)) {
      return NextResponse.json({ error: "DB not found" }, { status: 404 });
    }

    const fileBuffer = fs.readFileSync(targetPath);
    const dateStr = new Date().toISOString().slice(0, 10);
    const formData = new FormData();
    formData.append("chat_id", chatId);
    formData.append("document", new Blob([fileBuffer]), `mainframe_auto_backup_${dateStr}.db`);
    formData.append("caption", `📦 *АВТО-БЭКАП НЕДЕЛИ* // ${dateStr}`);
    formData.append("parse_mode", "Markdown");

    await fetch(`https://api.telegram.org/bot${botToken}/sendDocument`, {
      method: "POST",
      body: formData,
    });

    return NextResponse.json({ ok: true, task: "weekly-backup-sent" });
  }

  // 2. УТРЕННИЙ ДАЙДЖЕСТ
  if (action === "digest") {
    const inProgress = await prisma.stage.findMany({
      where: { status: "IN_PROGRESS" },
      include: { project: true },
    });

    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const todayEnd = new Date();
    todayEnd.setHours(23, 59, 59, 999);

    const todayNotes = await prisma.note.findMany({
      where: {
        scheduledFor: { gte: todayStart, lte: todayEnd },
        isArchived: false,
      },
    });

    const newLeads = await prisma.lead.count({ where: { status: "NEW" } });

    const text = [
      `🌅 *MAINFRAME // УТРЕННИЙ ДАЙДЖЕСТ*`,
      `📅 _${new Date().toLocaleDateString("ru-RU")}_`,
      "",
      `🔥 *Новых заявок в CRM:* ${newLeads}`,
      `🕒 *Событий и дедлайнов на день:* ${todayNotes.length}`,
      ...todayNotes.map((n) => `   • ${decryptText(n.title)}`),
      "",
      `⚡ *Задач в активной разработке:* ${inProgress.length}`,
      ...inProgress.map((s) => `   ⚡ ${s.title} (${s.project.title})`),
    ].join("\n");

    await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ chat_id: chatId, text, parse_mode: "Markdown" }),
    });

    return NextResponse.json({ ok: true, task: "daily-digest-sent" });
  }

  return NextResponse.json({ error: "Unknown action" });
}