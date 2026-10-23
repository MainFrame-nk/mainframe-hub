"use server";

import dns from "node:dns";
dns.setDefaultResultOrder("ipv4first"); // Принудительно используем IPv4 для Telegram API

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";

import fs from "node:fs";
import path from "node:path";

import { encryptText } from "@/lib/encryption";

// 1. Проверка авторизации (теперь проверяет куку сессии)
export async function checkVaultAuth() {
  const cookieStore = await cookies();
  const sessionToken = cookieStore.get("mainframe_vault_session")?.value;
  return sessionToken === "authenticated_by_2fa";
}

// 2. Шаг 1: Проверяем пароль и отправляем 6-значный код в Telegram
export async function requestVaultLogin(formData: FormData) {
  const password = formData.get("password") as string;
  const secret = process.env.VAULT_PASSWORD || "mainframe-secret-2026";

  if (password !== secret) {
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

  const title = formData.get("title") as string;
  const rawContent = formData.get("content") as string;
  const category = (formData.get("category") as string) || "DEV";
  const projectId = formData.get("projectId") as string;

  if (!title || !rawContent) return;

  // ШИФРУЕМ ТЕКСТ ПЕРЕД ЗАПИСЬЮ В БД
  const content = encryptText(rawContent);

  await prisma.note.create({
    data: {
      title,
      content, // Сохраняется в зашифрованном виде!
      category,
      projectId: projectId || null,
    },
  });

  revalidatePath("/vault");
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

// 13. Загрузка файла в Google Диск бинарным потоком (Максимальная скорость)
export async function uploadCloudFile(formData: FormData) {
  if (!(await checkVaultAuth())) return;

  const file = formData.get("file") as File;
  if (!file || file.size === 0) return;

  const bytes = await file.arrayBuffer();
  const buffer = Buffer.from(bytes);
  
  const driveWebhookUrl = process.env.GOOGLE_DRIVE_WEB_APP_URL;
  let fileUrl = "";

  if (driveWebhookUrl && !driveWebhookUrl.includes("vstav")) {
    try {
      // Передаем файл как чистый бинарный поток с параметрами в URL
      const uploadUrl = `${driveWebhookUrl}?filename=${encodeURIComponent(file.name)}&mimetype=${encodeURIComponent(file.type || "application/octet-stream")}`;

      const res = await fetch(uploadUrl, {
        method: "POST",
        headers: { "Content-Type": file.type || "application/octet-stream" },
        body: buffer, // Шлем оригинальный бинарный буфер без Base64-раздувания
      });

      const result = await res.json();
      if (result.success) {
        fileUrl = result.fileUrl;
      }
    } catch (e) {
      console.error("Ошибка бинарной загрузки на Google Диск:", e);
    }
  }

  // Фоллбек на локальный диск, если облако недоступно
  if (!fileUrl) {
    const uploadDir = path.join(process.cwd(), "public", "vault-uploads");
    if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });
    const safeName = `${Date.now()}-${file.name.replace(/[^a-zA-Z0-9.-]/g, "_")}`;
    fs.writeFileSync(path.join(uploadDir, safeName), buffer);
    fileUrl = `/vault-uploads/${safeName}`;
  }

  // Сохраняем метаданные в SQLite
  await prisma.cloudFile.create({
    data: {
      name: file.name,
      size: file.size,
      mimeType: file.type || "application/octet-stream",
      fileUrl,
    },
  });

  revalidatePath("/vault");
}

// 14. Удаление файла из хранилища и с Google Диска
export async function deleteCloudFile(fileId: string) {
  if (!(await checkVaultAuth())) return;

  const fileRecord = await prisma.cloudFile.findUnique({ where: { id: fileId } });
  if (!fileRecord) return;

  const driveWebhookUrl = process.env.GOOGLE_DRIVE_WEB_APP_URL;

  // Если у файла есть ID на Google Диске, отправляем команду на удаление туда
  if (fileRecord.driveFileId && driveWebhookUrl && !driveWebhookUrl.includes("vstav")) {
    try {
      await fetch(driveWebhookUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "delete",
          fileId: fileRecord.driveFileId,
        }),
      });
    } catch (e) {
      console.error("Ошибка удаления файла с Google Диска:", e);
    }
  }

  // Удаляем запись из базы данных SQLite
  await prisma.cloudFile.delete({ where: { id: fileId } });
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