"use server";

import dns from "node:dns";
dns.setDefaultResultOrder("ipv4first"); // Принудительно используем IPv4 для Telegram API

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";

import fs from "node:fs";
import path from "node:path";

import { encryptText, decryptText, hashSharePassword } from "@/lib/encryption";

// 1. Проверка авторизации (теперь проверяет куку сессии)
export async function checkVaultAuth() {
  const cookieStore = await cookies();
  const sessionToken = cookieStore.get("mainframe_vault_session")?.value;
  return sessionToken === "authenticated_by_2fa";
}

// 2. Шаг 1: Проверяем пароль и отправляем 6-значный код в Telegram
export async function requestVaultLogin(formData: FormData) {
  const password = formData.get("password") as string;
  const secret = process.env.VAULT_PASSWORD;

  if (!secret || password !== secret) {
    revalidatePath("/vault");
    return;
  }

  // Генерируем случайный 6-значный код
  const code = Math.floor(100000 + Math.random() * 900000).toString();
  const expiresAt = new Date(Date.now() + 5 * 60 * 1000); // Действует 5 минут

  // Удаляем старые неиспользованные коды и сохраняем новый
  await prisma.authCode.deleteMany();
  await prisma.authCode.create({
    data: { code, expiresAt },
  });

  // Отправляем код в Telegram через наш европейский шлюз
  const botToken = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_CHAT_ID;
  const relayUrl = process.env.TELEGRAM_RELAY_URL;

  if (botToken && chatId) {
    const text = [
      "🔐 *MAINFRAME HUB // 2FA ЗАПРОС ДОСТУПА*",
      "",
      `Ваш секретный код подтверждения: \`${code}\``,
      "Код действителен в течение 5 минут.",
    ].join("\n");

    try {
      const targetUrl = relayUrl || `https://api.telegram.org/bot${botToken}/sendMessage`;
      await fetch(targetUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(
          relayUrl
            ? { secret: "mainframe-relay-2026", botToken, chatId, text }
            : { chat_id: chatId, text, parse_mode: "Markdown" }
        ),
      });
    } catch (err) {
      console.error("Ошибка отправки 2FA кода в Telegram:", err);
    }
  }

  // Ставим временную куку, что пароль пройден, ждем код
  const cookieStore = await cookies();
  cookieStore.set("mainframe_waiting_2fa", "true", { httpOnly: true, path: "/", maxAge: 300 });
  revalidatePath("/vault");
}

// 3. Шаг 2: Проверяем введенный 6-значный код из Telegram
export async function verifyVaultCode(formData: FormData) {
  const enteredCode = formData.get("code") as string;
  if (!enteredCode) return;

  const validRecord = await prisma.authCode.findFirst({
    where: {
      code: enteredCode,
      used: false,
      expiresAt: { gte: new Date() },
    },
  });

  if (validRecord) {
    // Помечаем код как использованный
    await prisma.authCode.update({
      where: { id: validRecord.id },
      data: { used: true },
    });

    const cookieStore = await cookies();
    // Убираем временный флаг и выдаем полноценную сессию доступа к Vault
    cookieStore.delete("mainframe_waiting_2fa");
    cookieStore.set("mainframe_vault_session", "authenticated_by_2fa", {
      httpOnly: true,
      path: "/",
      maxAge: 60 * 60 * 24 * 30, // 30 дней
    });
  }

  revalidatePath("/vault");
}

// 4. Выход (блокировка Vault)
export async function logoutFromVault() {
  const cookieStore = await cookies();
  cookieStore.delete("mainframe_vault_session");
  cookieStore.delete("mainframe_waiting_2fa");
  revalidatePath("/vault");
}

// Стартовые данные
export async function ensureSeedData() {
  const count = await prisma.project.count();
  if (count > 0) return;

  // 1. Публичный флагманский проект
  await prisma.project.create({
    data: {
      slug: "okaeri-gaming",
      title: "Okaeri Gaming",
      tagline: "Геймерская платформа для организации киберспортивных турниров и игровых вечеров.",
      category: "DEV",
      status: "ACTIVE",
      isPublic: true,
      featured: true,
      liveUrl: "https://okaeri-gaming.ru/",
      techStack: "TypeScript, React, Next.js, Prisma",
      accentColor: "purple",
      notes: {
        create: [
          {
            title: "Интеграция турниров и уведомлений",
            content: "Связать карточки популярных игр (CS2, GTA 6, Liar's Bar) с расписанием ближайших ивентов.",
            category: "DEV",
          },
        ],
      },
    },
  });

  // 2. Приватный узел для примера (Бизнес)
  await prisma.project.create({
    data: {
      slug: "business-strategy",
      title: "Бизнес & Партнерства",
      tagline: "Внутреннее планирование заказов, финансов и развития бренда MainFrame.",
      category: "BUSINESS",
      status: "ACTIVE",
      isPublic: false, // Скрыто от посторонних!
      techStack: "Strategy, Finance, Clients",
      accentColor: "crimson",
    },
  });
}

// Создание заметки (Строго приватно!)
export async function createNote(formData: FormData) {
  if (!(await checkVaultAuth())) return;

  const rawTitle = formData.get("title") as string;
  const rawContent = formData.get("content") as string;
  const category = (formData.get("category") as string) || "DEV";
  const projectId = formData.get("projectId") as string;
  const eventType = (formData.get("eventType") as string) || "NOTE";
  const scheduledForRaw = formData.get("scheduledFor") as string;
  const remindOffsetRaw = formData.get("remindOffset") as string;

  if (!rawTitle || !rawContent) return;

  const scheduledFor = scheduledForRaw ? new Date(scheduledForRaw) : null;
  const remindOffset =
    remindOffsetRaw && remindOffsetRaw !== "NONE" ? parseInt(remindOffsetRaw, 10) : null;

  // ШИФРУЕМ ЗАГОЛОВОК И КОНТЕНТ ПЕРЕД ЗАПИСЬЮ В БД
  const encryptedTitle = encryptText(rawTitle);
  const encryptedContent = encryptText(rawContent);

  await prisma.note.create({
    data: {
      title: encryptedTitle,
      content: encryptedContent,
      category,
      eventType,
      projectId: projectId || null,
      scheduledFor,
      remindOffset,
      reminderSent: false,
      isPinned: true,
    },
  });

  revalidatePath("/");
  revalidatePath("/vault");
}

// Перенос заметки/события в Архив (Выполнено) и обратно — без удаления из БД!
export async function toggleNoteArchive(noteId: string, currentArchived: boolean) {
  if (!(await checkVaultAuth())) return;

  await prisma.note.update({
    where: { id: noteId },
    data: { isArchived: !currentArchived },
  });

  revalidatePath("/vault");
}

// Фоновая проверка событий и отправка РАСШИФРОВАННОГО уведомления в Telegram
export async function checkAndSendReminders() {
  const now = new Date();

  const pendingNotes = await prisma.note.findMany({
    where: {
      scheduledFor: { not: null },
      remindOffset: { not: null },
      reminderSent: false,
      isArchived: false,
    },
    include: { project: true, contact: true },
  });

  const botToken = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_CHAT_ID;
  const relayUrl = process.env.TELEGRAM_RELAY_URL;

  if (!botToken || !chatId) return { sent: 0 };

  let sentCount = 0;

  // Безопасная очистка символов Markdown (*, _, `, [), чтобы Telegram не выдавал ошибку 400
  const safeMd = (str: string) => str.replace(/([_*`\[])/g, "");

  for (const item of pendingNotes) {
    if (!item.scheduledFor || item.remindOffset === null) continue;

    const scheduledTime = new Date(item.scheduledFor);
    const triggerTime = new Date(scheduledTime.getTime() - item.remindOffset * 60 * 1000);

    if (now >= triggerTime) {
      const cleanTitle = safeMd(decryptText(item.title));
      const cleanContent = safeMd(decryptText(item.content));
      const contactName = item.contact ? safeMd(decryptText(item.contact.name)) : null;

      const typeEmoji: Record<string, string> = {
        NOTE: "📝 Заметка",
        MEETING: "🤝 Встреча / Созвон",
        DEADLINE: "🔥 Просьба / Дедлайн",
        EVENT: "🎉 Мероприятие",
      };

      const formattedTime = scheduledTime.toLocaleString("ru-RU", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });

      const offsetText =
        item.remindOffset === 0
          ? "Прямо сейчас!"
          : item.remindOffset >= 60
          ? `За ${Math.round(item.remindOffset / 60)} ч. до времени`
          : `За ${item.remindOffset} мин. до времени`;

      const text = [
        `⏰ MAINFRAME CHRONOS // НАПОМИНАНИЕ (${offsetText})`,
        ``,
        `📌 Тип: ${typeEmoji[item.eventType] || "Событие"}`,
        `🎯 Задача: ${cleanTitle}`,
        contactName ? `👤 Человек: ${contactName}` : null,
        `🕒 Назначено на: ${formattedTime}`,
        item.project ? `🔗 Проект: ${safeMd(item.project.title)}` : null,
        ``,
        `💬 Детали:`,
        `${cleanContent}`,
      ]
        .filter(Boolean)
        .join("\n");

      try {
        const targetUrl = relayUrl || `https://api.telegram.org/bot${botToken}/sendMessage`;
        const res = await fetch(targetUrl, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(
            relayUrl
              ? { secret: "mainframe-relay-2026", botToken, chatId, text }
              : { chat_id: chatId, text }
          ),
        });

        const resData = await res.json();
        console.log("⏰ [CHRONOS REMINDER TG]:", resData);

        if (resData.ok !== false) {
          await prisma.note.update({
            where: { id: item.id },
            data: { reminderSent: true },
          });
          sentCount++;
        }
      } catch (err) {
        console.error("Ошибка отправки напоминания в ТГ:", err);
      }
    }
  }

  if (sentCount > 0) {
    revalidatePath("/vault");
  }

  return { sent: sentCount };
}

// Создание проекта или личного направления
export async function createProject(formData: FormData) {
  if (!(await checkVaultAuth())) return;

  const title = formData.get("title") as string;
  const tagline = formData.get("tagline") as string;
  const category = (formData.get("category") as string) || "DEV";
  const techStack = formData.get("techStack") as string;
  const liveUrl = formData.get("liveUrl") as string;
  const accentColor = (formData.get("accentColor") as string) || "cyan";
  const isPublic = formData.get("isPublic") === "on";

  if (!title || !tagline) return;

  const slug = "node-" + Date.now().toString();

  await prisma.project.create({
    data: {
      slug,
      title,
      tagline,
      category,
      isPublic,
      techStack: techStack || category,
      liveUrl: liveUrl || null,
      accentColor,
      status: "ACTIVE",
    },
  });

  revalidatePath("/");
  revalidatePath("/vault");
}

export async function deleteNote(id: string) {
  if (!(await checkVaultAuth())) return;
  await prisma.note.delete({ where: { id } });
  revalidatePath("/vault");
}

// 5. Обработка заявки на разработку (сохраняем в БД + пушим в Telegram)
export async function submitContactForm(formData: FormData) {
  const name = formData.get("name") as string;
  const contact = formData.get("contact") as string;
  const message = formData.get("message") as string;

  if (!name || !contact || !message) return;

  // 1. Сохраняем в локальную базу SQLite (таблица Lead)
  await prisma.lead.create({
    data: {
      name,
      contact,
      message,
      status: "NEW",
    },
  });

  // 2. Отправляем мгновенное уведомление в Telegram (безопасно, без падения при ошибке) через наш Европейский Шлюз (Relay)
  const botToken = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_CHAT_ID;
  const relayUrl = process.env.TELEGRAM_RELAY_URL;

  if (botToken && chatId) {
    const text = [
      "🚨 MAINFRAME HUB // НОВАЯ ЗАЯВКА",
      "",
      `👤 Клиент: ${name}`,
      `📱 Контакт: ${contact}`,
      `💬 Задача:`,
      `${message}`,
    ].join("\n");

    try {
      const targetUrl = relayUrl || `https://api.telegram.org/bot${botToken}/sendMessage`;

      const res = await fetch(targetUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(
          relayUrl
            ? { secret: "mainframe-relay-2026", botToken, chatId, text }
            : { chat_id: chatId, text }
        ),
      });

      const responseText = await res.text();
      console.log("📡 [TG RELAY STATUS]:", res.status, responseText);
    } catch (err) {
      console.error("❌ Ошибка отправки в Telegram:", err);
    }
  } else {
    console.log("⚠️ Не найдены TELEGRAM_BOT_TOKEN или TELEGRAM_CHAT_ID в .env");
  }

  revalidatePath("/");
  revalidatePath("/vault");
}

// 6. Изменение статуса заявки (NEW -> IN_PROGRESS -> CLOSED)
export async function updateLeadStatus(id: string, status: string) {
  if (!(await checkVaultAuth())) return;

  await prisma.lead.update({
    where: { id },
    data: { status },
  });

  revalidatePath("/vault");
}

// 7. Удаление заявки
export async function deleteLead(id: string) {
  if (!(await checkVaultAuth())) return;

  await prisma.lead.delete({ where: { id } });
  revalidatePath("/vault");
}

// 8. Добавление нового этапа (задачи) внутрь проекта
export async function createStage(formData: FormData) {
  if (!(await checkVaultAuth())) return;

  const projectId = formData.get("projectId") as string;
  const title = formData.get("title") as string;

  if (!projectId || !title) return;

  const count = await prisma.stage.count({ where: { projectId } });

  await prisma.stage.create({
    data: {
      projectId,
      title,
      status: "TODO",
      order: count + 1,
    },
  });

  revalidatePath("/vault");
}

// 9. Переключение статуса этапа по клику (TODO <-> DONE)
export async function toggleStageStatus(stageId: string, currentStatus: string) {
  if (!(await checkVaultAuth())) return;

  const nextStatus = currentStatus === "DONE" ? "TODO" : "DONE";

  await prisma.stage.update({
    where: { id: stageId },
    data: { status: nextStatus },
  });

  revalidatePath("/vault");
}

// 10. Удаление этапа
export async function deleteStage(stageId: string) {
  if (!(await checkVaultAuth())) return;

  await prisma.stage.delete({ where: { id: stageId } });
  revalidatePath("/vault");
}

// 11. Быстрое переключение видимости проекта (Публичный <-> Приватный)
export async function toggleProjectVisibility(projectId: string, currentIsPublic: boolean) {
  if (!(await checkVaultAuth())) return;

  await prisma.project.update({
    where: { id: projectId },
    data: { isPublic: !currentIsPublic },
  });

  revalidatePath("/");
  revalidatePath("/vault");
}

// 12. Удаление проекта/узла
export async function deleteProject(projectId: string) {
  if (!(await checkVaultAuth())) return;

  await prisma.project.delete({ where: { id: projectId } });
  revalidatePath("/");
  revalidatePath("/vault");
}

// 14. Удаление зашифрованного файла из хранилища
export async function deleteCloudFile(fileId: string) {
  if (!(await checkVaultAuth())) return;

  const fileRecord = await prisma.cloudFile.findUnique({ where: { id: fileId } });
  if (!fileRecord) return;

  try {
    const encryptedPath = path.join(
      process.cwd(),
      "storage",
      "vault-encrypted",
      fileRecord.storageKey
    );
    if (fs.existsSync(encryptedPath)) {
      fs.unlinkSync(encryptedPath);
    }
  } catch (e) {
    console.error("Ошибка удаления зашифрованного файла:", e);
  }

  await prisma.cloudFile.delete({ where: { id: fileId } });
  revalidatePath("/vault");
}

// Создание защищенной ссылки с паролем, таймером и лимитом скачиваний
export async function createSharedLink(formData: FormData) {
  if (!(await checkVaultAuth())) return { error: "Unauthorized" };

  const fileId = formData.get("fileId") as string;
  const password = (formData.get("password") as string)?.trim();
  const ttlHours = Number(formData.get("ttlHours") || 0); // 0 = бессрочно
  const maxDownloads = Number(formData.get("maxDownloads") || 0); // 0 = без лимита

  if (!fileId) return { error: "No file ID" };

  // Генерируем красивый кибер-токен (например: mf-8x9k2p)
  const token = Math.random().toString(36).slice(2, 6) + Math.random().toString(36).slice(2, 6);

  const expiresAt =
    ttlHours > 0 ? new Date(Date.now() + ttlHours * 60 * 60 * 1000) : null;

  const created = await prisma.sharedLink.create({
    data: {
      token,
      fileId,
      passwordHash: password ? hashSharePassword(password) : null,
      expiresAt,
      maxDownloads: maxDownloads > 0 ? maxDownloads : null,
    },
  });

  revalidatePath("/vault");
  return { ok: true, token: created.token };
}

// Удаление (отзыв) публичной ссылки
export async function deleteSharedLink(shareId: string) {
  if (!(await checkVaultAuth())) return;
  await prisma.sharedLink.delete({ where: { id: shareId } });
  revalidatePath("/vault");
}

// Обновление точного статуса этапа для Drag-and-Drop Канбана (TODO | IN_PROGRESS | DONE)
export async function updateStageStatus(stageId: string, newStatus: string) {
  if (!(await checkVaultAuth())) return;

  await prisma.stage.update({
    where: { id: stageId },
    data: { status: newStatus },
  });

  revalidatePath("/vault");
  revalidatePath("/");
}

// Конвертация заявки из CRM (Lead) в полноценный Проект (Узел) в 1 клик
export async function convertLeadToProject(leadId: string) {
  if (!(await checkVaultAuth())) return;

  const lead = await prisma.lead.findUnique({ where: { id: leadId } });
  if (!lead) return;

  const slug =
    lead.name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "") +
    "-" +
    Date.now().toString().slice(-3);

  await prisma.project.create({
    data: {
      slug: slug || `client-project-${Date.now()}`,
      title: `Проект: ${lead.name}`,
      tagline: `${lead.message} (Контакт: ${lead.contact})`,
      category: "BUSINESS",
      status: "IN_DEV",
      isPublic: false, // По умолчанию приватный, чтобы не светить клиентский заказ раньше времени
      techStack: "TypeScript, Next.js, Prisma",
      accentColor: "crimson",
      stages: {
        create: [
          { title: `Связаться с клиентом (${lead.contact}) и утвердить ТЗ`, status: "DONE", order: 1 },
          { title: "Проектирование БД и архитектуры", status: "IN_PROGRESS", order: 2 },
          { title: "Разработка MVP и деплой", status: "TODO", order: 3 },
        ],
      },
    },
  });

  // Переводим саму заявку в статус В РАБОТЕ
  await prisma.lead.update({
    where: { id: leadId },
    data: { status: "IN_PROGRESS" },
  });

  revalidatePath("/vault");
}

// ==========================================
// 4.1. БЭКАП БАЗЫ ДАННЫХ В TELEGRAM
// ==========================================
export async function sendDatabaseBackupToTelegram() {
  if (!(await checkVaultAuth())) return { success: false, error: "Unauthorized" };

  const botToken = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_CHAT_ID;
  const relayUrl = process.env.TELEGRAM_RELAY_URL;

  if (!botToken || !chatId) {
    return { success: false, error: "Telegram keys missing in .env" };
  }

  // Путь к файлу SQLite базы
  const dbPath = path.join(process.cwd(), "prisma", "dev.db");
  const fallbackDbPath = path.join(process.cwd(), "dev.db");
  const targetPath = fs.existsSync(dbPath) ? dbPath : fallbackDbPath;

  if (!fs.existsSync(targetPath)) {
    return { success: false, error: "Database file dev.db not found" };
  }

  try {
    const fileBuffer = fs.readFileSync(targetPath);
    const dateStr = new Date().toISOString().replace(/[:.]/g, "-").slice(0, 19);
    const fileName = `mainframe_backup_${dateStr}.db`;
    const caption = `💾 *MAINFRAME HUB // РЕЗЕРВНАЯ КОПИЯ ЯДРА*\n\n📅 Дата: \`${new Date().toLocaleString("ru-RU")}\`\n📦 Файл: \`${fileName}\`\n🔒 Все заметки внутри зашифрованы AES-256.`;

    if (relayUrl) {
      // Отправляем через европейский шлюз Okaeri в формате Base64
      const res = await fetch(relayUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          secret: "mainframe-relay-2026",
          botToken,
          chatId,
          text: caption,
          documentBase64: fileBuffer.toString("base64"),
          filename: fileName,
        }),
      });

      const data = await res.json();
      return { success: data.ok ?? true };
    } else {
      // Прямая отправка (если есть VPN или запуск на зарубежном VPS)
      const formData = new FormData();
      formData.append("chat_id", chatId);
      formData.append("document", new Blob([fileBuffer]), fileName);
      formData.append("caption", caption);
      formData.append("parse_mode", "Markdown");

      const res = await fetch(`https://api.telegram.org/bot${botToken}/sendDocument`, {
        method: "POST",
        body: formData,
      });

      const data = await res.json();
      return { success: data.ok };
    }
  } catch (err: any) {
    console.error("Ошибка отправки бэкапа:", err);
    return { success: false, error: err.message };
  }
}

// ==========================================
// 4.2. УТРЕННИЙ ДАЙДЖЕСТ (DAILY PULSE)
// ==========================================
export async function sendDailyDigestToTelegram() {
  if (!(await checkVaultAuth())) return { success: false, error: "Unauthorized" };

  const botToken = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_CHAT_ID;
  const relayUrl = process.env.TELEGRAM_RELAY_URL;

  if (!botToken || !chatId) return { success: false };

  // 1. Получаем задачи В РАБОТЕ
  const inProgressStages = await prisma.stage.findMany({
    where: { status: "IN_PROGRESS" },
    include: { project: true },
    take: 5,
  });

  // 2. Получаем сегодняшние события из Ежедневника
  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);
  const todayEnd = new Date();
  todayEnd.setHours(23, 59, 59, 999);

  const todayNotes = await prisma.note.findMany({
    where: {
      scheduledFor: { gte: todayStart, lte: todayEnd },
      isArchived: false,
    },
    include: { project: true },
  });

  // 3. Получаем новые заявки из CRM
  const newLeadsCount = await prisma.lead.count({
    where: { status: "NEW" },
  });

  const nowFormatted = new Date().toLocaleDateString("ru-RU", {
    weekday: "long",
    day: "numeric",
    month: "long",
  });

  const lines: string[] = [
    `🌅 *MAINFRAME // УТРЕННИЙ ПУЛЬС СИСТЕМЫ*`,
    `📅 _${nowFormatted}_`,
    "",
  ];

  // Блок новых заявок
  if (newLeadsCount > 0) {
    lines.push(`🔥 *Входящие заявки в CRM:* \`${newLeadsCount} новых\``);
  } else {
    lines.push(`📭 *Входящие заявки:* новых обращений нет`);
  }
  lines.push("");

  // Блок расписания на сегодня
  lines.push(`🕒 *План на сегодня (${todayNotes.length}):*`);
  if (todayNotes.length === 0) {
    lines.push(`   _Событий и дедлайнов на сегодня не запланировано._`);
  } else {
    todayNotes.forEach((n) => {
      const cleanTitle = decryptText(n.title);
      const timeStr = n.scheduledFor
        ? new Date(n.scheduledFor).toLocaleTimeString("ru-RU", {
            hour: "2-digit",
            minute: "2-digit",
          })
        : "Весь день";
      lines.push(`   • \`[${timeStr}]\` *${cleanTitle}*`);
    });
  }
  lines.push("");

  // Блок активных задач в разработке
  lines.push(`⚡ *Активный фокус в Канбане (${inProgressStages.length}):*`);
  if (inProgressStages.length === 0) {
    lines.push(`   _Нет задач со статусом «В работе»._`);
  } else {
    inProgressStages.forEach((s) => {
      lines.push(`   ⚡ ${s.title} _(${s.project.title})_`);
    });
  }

  const text = lines.join("\n");

  try {
    const targetUrl = relayUrl || `https://api.telegram.org/bot${botToken}/sendMessage`;
    await fetch(targetUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(
        relayUrl
          ? { secret: "mainframe-relay-2026", botToken, chatId, text }
          : { chat_id: chatId, text, parse_mode: "Markdown" }
      ),
    });
    return { success: true };
  } catch (err) {
    console.error("Ошибка отправки утреннего дайджеста:", err);
    return { success: false };
  }
}

// ==========================================
// МОДУЛЬ ФИНАНСОВ И ПЛАНОВ ПОКУПОК (WISHLIST)
// ==========================================

// 1. Добавление дохода или расхода
export async function createTransaction(formData: FormData) {
  if (!(await checkVaultAuth())) return;

  const type = (formData.get("type") as string) || "EXPENSE";
  const amount = parseFloat(formData.get("amount") as string);
  const category = (formData.get("category") as string) || "OTHER";
  const rawDesc = (formData.get("description") as string) || "";
  const dateStr = formData.get("date") as string;
  const projectId = formData.get("projectId") as string;

  if (isNaN(amount) || amount <= 0) return;

  const description = rawDesc ? encryptText(rawDesc) : null;
  const date = dateStr ? new Date(dateStr) : new Date();

  await prisma.transaction.create({
    data: {
      type,
      amount,
      category,
      description,
      date,
      projectId: projectId || null,
    },
  });

  revalidatePath("/vault");
}

// 2. Удаление транзакции
export async function deleteTransaction(id: string) {
  if (!(await checkVaultAuth())) return;
  await prisma.transaction.delete({ where: { id } });
  revalidatePath("/vault");
}

// 3. Создание плана покупки (Wishlist)
export async function createWishlistItem(formData: FormData) {
  if (!(await checkVaultAuth())) return;

  const title = formData.get("title") as string;
  const targetPrice = parseFloat(formData.get("targetPrice") as string);
  const savedAmount = parseFloat((formData.get("savedAmount") as string) || "0");
  const priority = (formData.get("priority") as string) || "MEDIUM";
  const category = (formData.get("category") as string) || "SERVERS";

  if (!title || isNaN(targetPrice) || targetPrice <= 0) return;

  await prisma.wishlistItem.create({
    data: {
      title: encryptText(title),
      targetPrice,
      savedAmount: isNaN(savedAmount) ? 0 : savedAmount,
      priority,
      category,
    },
  });

  revalidatePath("/vault");
}

// 4. Пополнение копилки на покупку (+ сумма)
export async function addSavedAmountToWishlist(id: string, addAmount: number) {
  if (!(await checkVaultAuth())) return;

  const item = await prisma.wishlistItem.findUnique({ where: { id } });
  if (!item) return;

  const nextSaved = Math.min(item.targetPrice, Math.max(0, item.savedAmount + addAmount));

  await prisma.wishlistItem.update({
    where: { id },
    data: { savedAmount: nextSaved },
  });

  revalidatePath("/vault");
}

// 5. Исполнение мечты: кнопка «Куплено!» (переводит из плана в реальный расход текущего месяца)
export async function markWishlistAsBought(id: string) {
  if (!(await checkVaultAuth())) return;

  const item = await prisma.wishlistItem.findUnique({ where: { id } });
  if (!item) return;

  await prisma.wishlistItem.update({
    where: { id },
    data: { isBought: true, savedAmount: item.targetPrice },
  });

  // Автоматически создаем транзакцию расхода
  await prisma.transaction.create({
    data: {
      type: "EXPENSE",
      amount: item.targetPrice,
      category: item.category || "FUN",
      description: item.title, // Уже зашифровано
      date: new Date(),
    },
  });

  revalidatePath("/vault");
}

// 6. Удаление из планов покупок
export async function deleteWishlistItem(id: string) {
  if (!(await checkVaultAuth())) return;
  await prisma.wishlistItem.delete({ where: { id } });
  revalidatePath("/vault");
}

// 7. СИНХРОНИЗАЦИЯ ТРАТ И ДОХОДОВ ИЗ TELEGRAM-БОТА (РАБОТАЕТ ДАЖЕ НА LOCALHOST!)
const TG_CATEGORY_MAP: Record<string, string> = {
  еда: "FOOD",
  продукты: "FOOD",
  кафе: "FOOD",
  кофе: "FOOD",
  сервер: "SERVERS",
  серверы: "SERVERS",
  хостинг: "SERVERS",
  ит: "SERVERS",
  бизнес: "BUSINESS",
  проект: "BUSINESS",
  работа: "BUSINESS",
  дом: "HOME",
  семья: "HOME",
  квартира: "HOME",
  развлечения: "FUN",
  игры: "FUN",
  отдых: "FUN",
  транспорт: "TRANSPORT",
  такси: "TRANSPORT",
  авто: "TRANSPORT",
};

// Храним последний обработанный update_id в памяти процесса
let lastProcessedUpdateId = 0;

export async function syncTelegramFinanceMessages() {
  if (!(await checkVaultAuth())) return { added: 0 };

  const botToken = process.env.TELEGRAM_BOT_TOKEN;
  const allowedChatId = process.env.TELEGRAM_CHAT_ID;
  const relayUrl = process.env.TELEGRAM_RELAY_URL;

  if (!botToken || !allowedChatId) return { added: 0, error: "Нет ключей ТГ" };

  try {
    // Запрашиваем новые сообщения через европейский шлюз Okaeri (или напрямую)
    const res = await fetch(
      relayUrl || `https://api.telegram.org/bot${botToken}/getUpdates`,
      {
        method: relayUrl ? "POST" : "GET",
        headers: { "Content-Type": "application/json" },
        body: relayUrl
          ? JSON.stringify({
              secret: "mainframe-relay-2026",
              action: "getUpdates",
              botToken,
              offset: lastProcessedUpdateId ? lastProcessedUpdateId + 1 : undefined,
            })
          : undefined,
      }
    );

    const data = await res.json();
    if (!data?.ok || !Array.isArray(data.result)) return { added: 0 };

    let addedCount = 0;
    let highestUpdateId = lastProcessedUpdateId;

    for (const update of data.result) {
      if (update.update_id > highestUpdateId) {
        highestUpdateId = update.update_id;
      }

      const msg = update.message;
      if (!msg || !msg.text) continue;
      if (String(msg.chat?.id) !== String(allowedChatId)) continue;

      const text = msg.text.trim();
      // Понимает: "- 1500 Еда Бизнес-ланч и кофе", "+ 50000 Бизнес Аванс", "1500 Еда Кофе"
      const match = text.match(/^([+-])?\s*(\d+(?:[.,]\d+)?)\s+([^\s]+)(?:\s+(.*))?$/i);
      if (!match) continue;

      const sign = match[1] || "-";
      const amount = parseFloat(match[2].replace(",", "."));
      const rawCat = match[3].toLowerCase();
      const comment = (match[4] || rawCat).trim();

      const type = sign === "+" ? "INCOME" : "EXPENSE";
      const category = TG_CATEGORY_MAP[rawCat] || "OTHER";

      // Защита от дублей (проверяем по тексту и дате сообщения из ТГ)
      const msgDate = new Date(msg.date * 1000);
      const exists = await prisma.transaction.findFirst({
        where: {
          amount,
          category,
          date: msgDate,
        },
      });

      if (!exists) {
        await prisma.transaction.create({
          data: {
            type,
            amount,
            category,
            description: encryptText(comment),
            date: msgDate,
          },
        });
        addedCount++;

        // Отправляем ответ в Telegram об успешной записи
        const replyText = [
          type === "INCOME" ? "📈 *ДОХОД ЗАПИСАН В VAULT*" : "📉 *РАСХОД ЗАПИСАН В VAULT*",
          `💰 Сумма: \`${amount.toLocaleString("ru-RU")} ₽\``,
          `🏷 Категория: \`${category}\``,
          `💬 Заметка: ${comment}`,
        ].join("\n");

        if (relayUrl) {
          await fetch(relayUrl, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              secret: "mainframe-relay-2026",
              botToken,
              chatId: allowedChatId,
              text: replyText,
            }),
          });
        }
      }
    }

    if (highestUpdateId > 0) {
      lastProcessedUpdateId = highestUpdateId;
      // Подтверждаем Telegram-серверу, что сообщения прочитаны, чтобы они больше не висели в очереди
      if (relayUrl) {
        await fetch(relayUrl, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            secret: "mainframe-relay-2026",
            action: "getUpdates",
            botToken,
            offset: highestUpdateId + 1,
          }),
        });
      }
    }

    if (addedCount > 0) {
      revalidatePath("/vault");
    }

    return { added: addedCount };
  } catch (err) {
    console.error("Ошибка синхронизации финансов с ТГ:", err);
    return { added: 0 };
  }
}

// ==========================================
// МОДУЛЬ ЛЮДЕЙ И СВЯЗЕЙ (ENCRYPTED PERSONAL CRM)
// ==========================================

// 1. Создание карточки человека (все личные поля шифруются AES-256)
export async function createContact(formData: FormData) {
  if (!(await checkVaultAuth())) return;

  const name = (formData.get("name") as string)?.trim();
  const tag = (formData.get("tag") as string) || "PARTNER";
  const role = (formData.get("role") as string)?.trim() || "";
  const telegram = (formData.get("telegram") as string)?.trim() || "";
  const phone = (formData.get("phone") as string)?.trim() || "";
  const birthday = (formData.get("birthday") as string)?.trim() || "";
  const avatarUrl = (formData.get("avatarUrl") as string)?.trim() || "";
  const bio = (formData.get("bio") as string)?.trim() || "";
  const projectId = (formData.get("projectId") as string) || null;

  if (!name) return;

  await prisma.contact.create({
    data: {
      name: encryptText(name),
      tag,
      role: role ? encryptText(role) : null,
      telegram: telegram ? encryptText(telegram) : null,
      phone: phone ? encryptText(phone) : null,
      birthday: birthday ? encryptText(birthday) : null,
      avatarUrl: avatarUrl ? encryptText(avatarUrl) : null,
      bio: bio ? encryptText(bio) : null,
      projectId: projectId || null,
    },
  });

  revalidatePath("/vault");
}

// 2. Обновление проекта/команды или досье контакта
export async function updateContactProject(contactId: string, projectId: string | null) {
  if (!(await checkVaultAuth())) return;

  await prisma.contact.update({
    where: { id: contactId },
    data: { projectId: projectId || null },
  });

  revalidatePath("/vault");
}

// 3. Добавление заметки / встречи / задачи в досье человека (с датой и пушем в ТГ!)
export async function createContactNote(formData: FormData) {
  if (!(await checkVaultAuth())) return;

  const contactId = formData.get("contactId") as string;
  const contactName = (formData.get("contactName") as string)?.trim() || "";
  const projectId = formData.get("projectId") as string;
  const rawTitle = (formData.get("title") as string)?.trim();
  const rawContent = (formData.get("content") as string)?.trim();
  const eventType = (formData.get("eventType") as string) || "MEETING";
  const scheduledForRaw = formData.get("scheduledFor") as string;
  const remindOffsetRaw = formData.get("remindOffset") as string;

  if (!contactId || !rawTitle) return;

  const scheduledFor = scheduledForRaw ? new Date(scheduledForRaw) : null;
  const remindOffset =
    remindOffsetRaw && remindOffsetRaw !== "NONE" ? parseInt(remindOffsetRaw, 10) : null;

  // Добавляем имя человека в заголовок для понятности в Календаре и Telegram-уведомлении
  const fullTitle = contactName ? `[${contactName}] ${rawTitle}` : rawTitle;

  await prisma.note.create({
    data: {
      title: encryptText(fullTitle),
      content: encryptText(rawContent || rawTitle),
      category: "WORK",
      eventType,
      contactId,
      projectId: projectId || null,
      scheduledFor,
      remindOffset,
      reminderSent: false,
      isArchived: false,
    },
  });

  revalidatePath("/vault");
}

// 4. Удаление карточки человека
export async function deleteContact(id: string) {
  if (!(await checkVaultAuth())) return;
  await prisma.contact.delete({ where: { id } });
  revalidatePath("/vault");
}

// 5. Проверка ближайших Дней Рождения и отправка уведомления в Telegram
export async function checkAndNotifyBirthdays() {
  if (!(await checkVaultAuth())) return { sent: 0 };

  const rawContacts = await prisma.contact.findMany();
  const now = new Date();
  const todayMD = `${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;

  const in3Days = new Date(now);
  in3Days.setDate(now.getDate() + 3);
  const in3DaysMD = `${String(in3Days.getMonth() + 1).padStart(2, "0")}-${String(in3Days.getDate()).padStart(2, "0")}`;

  const alerts: string[] = [];

  for (const c of rawContacts) {
    if (!c.birthday) continue;
    const bday = decryptText(c.birthday); // YYYY-MM-DD
    const md = bday.slice(5, 10);
    const name = decryptText(c.name);
    const tg = c.telegram ? decryptText(c.telegram) : "";

    if (md === todayMD) {
      alerts.push(`🎂 *СЕГОДНЯ ДЕНЬ РОЖДЕНИЯ:* ${name} ${tg ? `(${tg})` : ""}`);
    } else if (md === in3DaysMD) {
      alerts.push(`⏳ *Через 3 дня ДР:* ${name} (${bday}) ${tg ? `— ${tg}` : ""}`);
    }
  }

  if (alerts.length > 0) {
    const botToken = process.env.TELEGRAM_BOT_TOKEN;
    const chatId = process.env.TELEGRAM_CHAT_ID;
    const relayUrl = process.env.TELEGRAM_RELAY_URL;

    if (botToken && chatId) {
      const text = ["🎉 *MAINFRAME CRM // НАПОМИНАНИЕ О ДНЯХ РОЖДЕНИЯ*", "", ...alerts].join("\n");
      const targetUrl = relayUrl || `https://api.telegram.org/bot${botToken}/sendMessage`;
      await fetch(targetUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(
          relayUrl
            ? { secret: "mainframe-relay-2026", botToken, chatId, text }
            : { chat_id: chatId, text, parse_mode: "Markdown" }
        ),
      });
    }
  }

  return { sent: alerts.length };
}

// ==========================================
// МОДУЛЬ ЛИЧНОГО РАДИО (MAINFRAME AUDIO)
// ==========================================

export async function toggleAudioFavorite(id: string, currentFav: boolean) {
  if (!(await checkVaultAuth())) return;

  await prisma.audioTrack.update({
    where: { id },
    data: { isFav: !currentFav },
  });

  revalidatePath("/vault");
}

export async function deleteAudioTrack(id: string) {
  if (!(await checkVaultAuth())) return;

  const track = await prisma.audioTrack.findUnique({ where: { id } });
  if (!track) return;

  const filePath = path.join(process.cwd(), "storage", "vault-audio", track.filename);
  if (fs.existsSync(filePath)) {
    try {
      fs.unlinkSync(filePath);
    } catch (e) {
      console.error("Ошибка удаления аудиофайла:", e);
    }
  }

  await prisma.audioTrack.delete({ where: { id } });
  revalidatePath("/vault");
}