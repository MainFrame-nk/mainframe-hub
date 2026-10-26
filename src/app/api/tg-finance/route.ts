import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { encryptText } from "@/lib/encryption";

const CATEGORY_MAP: Record<string, string> = {
  еда: "FOOD",
  продукты: "FOOD",
  кафе: "FOOD",
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

export async function POST(req: Request) {
  try {
    const body = await req.json();

    // Поддержка как стандартного Telegram Webhook, так и проброса с твоего шлюза Okaeri
    const message = body.message || body;
    const chatId = String(message?.chat?.id || body.chatId || "");
    const text = (message?.text || body.text || "").trim();

    const allowedChatId = process.env.TELEGRAM_CHAT_ID;
    if (!allowedChatId || chatId !== String(allowedChatId)) {
      return NextResponse.json({ ok: true }); // Игнорируем чужие сообщения
    }

    // Парсим формат: "- 1500 Еда Кофе" или "+ 50000 Бизнес Аванс" или просто "1500 Еда Кофе"
    const match = text.match(/^([+-])?\s*(\d+(?:[.,]\d+)?)\s+([^\s]+)(?:\s+(.*))?$/i);
    if (!match) {
      return NextResponse.json({ ok: true, skipped: "Not a finance command" });
    }

    const sign = match[1] || "-";
    const amount = parseFloat(match[2].replace(",", "."));
    const rawCat = match[3].toLowerCase();
    const comment = match[4] || rawCat;

    const type = sign === "+" ? "INCOME" : "EXPENSE";
    const category = CATEGORY_MAP[rawCat] || "OTHER";

    await prisma.transaction.create({
      data: {
        type,
        amount,
        category,
        description: encryptText(comment),
        date: new Date(),
      },
    });

    // Считаем баланс за текущий месяц для ответа в ТГ
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const monthTxs = await prisma.transaction.findMany({
      where: { date: { gte: startOfMonth } },
    });

    const monthExpense = monthTxs
      .filter((t) => t.type === "EXPENSE")
      .reduce((acc, t) => acc + t.amount, 0);

    const replyText = [
      type === "INCOME" ? "📈 *ДОХОД ЗАПИСАН В VAULT*" : "📉 *РАСХОД ЗАПИСАН В VAULT*",
      "",
      `💰 *Сумма:* \`${amount.toLocaleString("ru-RU")} ₽\``,
      `🏷 *Категория:* \`${category}\``,
      `💬 *Заметка:* ${comment}`,
      `📊 *Расходы с начала месяца:* \`${monthExpense.toLocaleString("ru-RU")} ₽\``,
    ].join("\n");

    const botToken = process.env.TELEGRAM_BOT_TOKEN;
    const relayUrl = process.env.TELEGRAM_RELAY_URL;

    if (botToken) {
      const targetUrl = relayUrl || `https://api.telegram.org/bot${botToken}/sendMessage`;
      await fetch(targetUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(
          relayUrl
            ? { secret: "mainframe-relay-2026", botToken, chatId, text: replyText }
            : { chat_id: chatId, text: replyText, parse_mode: "Markdown" }
        ),
      });
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("TG Finance Webhook Error:", error);
    return NextResponse.json({ ok: false }, { status: 500 });
  }
}