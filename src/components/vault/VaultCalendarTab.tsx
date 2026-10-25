"use client";

import React, { useState, useEffect } from "react";
import { NoteItem, ProjectItem, CATEGORY_LABELS, EVENT_TYPES } from "./types";
import { deleteNote, toggleNoteArchive, checkAndSendReminders } from "@/app/actions";
import {
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  Clock,
  Bell,
  Plus,
  Trash2,
  History,
  CalendarDays,
  CheckCircle2,
  RotateCcw,
} from "lucide-react";

interface VaultCalendarTabProps {
  notes: NoteItem[];
  projects: ProjectItem[];
  onOpenNewEventForDate: (isoDateTime: string) => void;
}

const WEEKDAYS = ["Пн", "Вт", "Ср", "Чт", "Пт", "Сб", "Вс"];
const MONTHS = [
  "Январь", "Февраль", "Март", "Апрель", "Май", "Июнь",
  "Июль", "Август", "Сентябрь", "Октябрь", "Ноябрь", "Декабрь",
];

export default function VaultCalendarTab({
  notes,
  onOpenNewEventForDate,
}: VaultCalendarTabProps) {
  const [currentMonth, setCurrentMonth] = useState(() => new Date());
  const [selectedDate, setSelectedDate] = useState(() => new Date());
  const [horizonMode, setHorizonMode] = useState<"DAY" | "WEEK" | "MONTH">("DAY");
  const [daySubTab, setDaySubTab] = useState<"SCHEDULED" | "CREATED_ANALYTICS">("SCHEDULED");

  // Автоматический фоновый пингер уведомлений в Telegram (каждые 30 сек)
  useEffect(() => {
    checkAndSendReminders();
    const timer = setInterval(() => {
      checkAndSendReminders();
    }, 30000);
    return () => clearInterval(timer);
  }, []);

  const isSameDay = (d1: Date, d2: Date) =>
    d1.getFullYear() === d2.getFullYear() &&
    d1.getMonth() === d2.getMonth() &&
    d1.getDate() === d2.getDate();

  // Генерация дней сетки месяца
  const year = currentMonth.getFullYear();
  const month = currentMonth.getMonth();
  const firstDayOfMonth = new Date(year, month, 1);
  const lastDayOfMonth = new Date(year, month + 1, 0);

  const startOffset = (firstDayOfMonth.getDay() + 6) % 7;
  const daysInMonth = lastDayOfMonth.getDate();

  const calendarCells: (Date | null)[] = [];
  for (let i = 0; i < startOffset; i++) calendarCells.push(null);
  for (let d = 1; d <= daysInMonth; d++) calendarCells.push(new Date(year, month, d));

  // 1. События, запланированные на выбранный день (включая выполненные, чтобы видеть историю дня)
  const scheduledForSelectedDay = notes
    .filter((n) => n.scheduledFor && isSameDay(new Date(n.scheduledFor), selectedDate))
    .sort((a, b) => new Date(a.scheduledFor!).getTime() - new Date(b.scheduledFor!).getTime());

  // 2. Аналитика: заметки, физически СОЗДАННЫЕ в выбранный день
  const createdOnSelectedDay = notes.filter((n) =>
    isSameDay(new Date(n.createdAt), selectedDate)
  );

  // 3. План на БЛИЖАЙШИЕ 7 ДНЕЙ ОТ СЕГОДНЯ (только активные неархивные задачи!)
  const now = new Date();
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0);
  const next7DaysEnd = new Date(todayStart);
  next7DaysEnd.setDate(next7DaysEnd.getDate() + 7);
  next7DaysEnd.setHours(23, 59, 59, 999);

  const scheduledForNext7Days = notes
    .filter((n) => {
      if (!n.scheduledFor || n.isArchived) return false;
      const d = new Date(n.scheduledFor);
      return d >= todayStart && d <= next7DaysEnd;
    })
    .sort((a, b) => new Date(a.scheduledFor!).getTime() - new Date(b.scheduledFor!).getTime());

  // 4. План на МЕСЯЦ (все события выбранного месяца)
  const scheduledForMonth = notes
    .filter((n) => {
      if (!n.scheduledFor) return false;
      const d = new Date(n.scheduledFor);
      return d.getFullYear() === year && d.getMonth() === month;
    })
    .sort((a, b) => new Date(a.scheduledFor!).getTime() - new Date(b.scheduledFor!).getTime());

  const handleCreateOnSelectedDate = () => {
    const pad = (num: number) => String(num).padStart(2, "0");
    const isoLocal = `${selectedDate.getFullYear()}-${pad(selectedDate.getMonth() + 1)}-${pad(
      selectedDate.getDate()
    )}T12:00`;
    onOpenNewEventForDate(isoLocal);
  };

  return (
    <div className="space-y-6">
      {/* ЧИСТАЯ ВЕРХНЯЯ ПАНЕЛЬ КАЛЕНДАРЯ */}
      <div className="flex flex-wrap items-center justify-between gap-4 p-4 rounded-2xl bg-obsidian-card border border-obsidian-border">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-cyber-purple/15 border border-cyber-purple/40 text-cyber-purple">
            <CalendarDays className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-lg font-extrabold text-white">
              MainFrame Chronos // Ежедневник и Аналитика
            </h2>
            <p className="text-xs font-mono text-slate-400">
              Расписание встреч, контроль дедлайнов с уведомлениями в Telegram и история заметок
            </p>
          </div>
        </div>

        {/* Переключатель режима: Выбранный день / Ближайшие 7 дней / Месяц */}
        <div className="flex items-center bg-obsidian p-1 rounded-xl border border-obsidian-border">
          {[
            { id: "DAY", label: "Выбранный день" },
            { id: "WEEK", label: `Ближайшие 7 дней (${scheduledForNext7Days.length})` },
            { id: "MONTH", label: `Весь ${MONTHS[month]} (${scheduledForMonth.length})` },
          ].map((mode) => (
            <button
              key={mode.id}
              onClick={() => setHorizonMode(mode.id as any)}
              className={`px-3.5 py-1.5 rounded-lg font-mono text-xs font-bold transition-all cursor-pointer ${
                horizonMode === mode.id
                  ? "bg-cyber-purple text-white shadow-[0_0_15px_rgba(139,92,246,0.4)]"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              {mode.label}
            </button>
          ))}
        </div>
      </div>

      {/* ОСНОВНАЯ СЕТКА: СЛЕВА КАЛЕНДАРЬ, СПРАВА ТАЙМЛАЙН */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* ЛЕВАЯ КОЛОНКА (5 из 12): КАЛЕНДАРЬ */}
        <div className="lg:col-span-5 p-6 rounded-3xl bg-obsidian-card border border-obsidian-border flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-6">
              <button
                onClick={() => setCurrentMonth(new Date(year, month - 1, 1))}
                className="p-2 rounded-xl bg-obsidian border border-obsidian-border hover:border-cyber-cyan text-slate-300 cursor-pointer"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>

              <div className="text-center">
                <div className="font-extrabold text-base text-white">
                  {MONTHS[month]} {year}
                </div>
                <button
                  onClick={() => {
                    const today = new Date();
                    setCurrentMonth(today);
                    setSelectedDate(today);
                    setHorizonMode("DAY");
                  }}
                  className="text-[10px] font-mono text-cyber-cyan hover:underline cursor-pointer"
                >
                  Вернуться к сегодня
                </button>
              </div>

              <button
                onClick={() => setCurrentMonth(new Date(year, month + 1, 1))}
                className="p-2 rounded-xl bg-obsidian border border-obsidian-border hover:border-cyber-cyan text-slate-300 cursor-pointer"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>

            <div className="grid grid-cols-7 gap-1.5 text-center mb-2">
              {WEEKDAYS.map((w) => (
                <div key={w} className="text-[11px] font-mono text-slate-500 py-1">
                  {w}
                </div>
              ))}
            </div>

            <div className="grid grid-cols-7 gap-1.5">
              {calendarCells.map((cellDate, idx) => {
                if (!cellDate) {
                  return <div key={`empty-${idx}`} className="h-12 rounded-xl bg-obsidian/20" />;
                }

                const isToday = isSameDay(cellDate, new Date());
                const isSelected = isSameDay(cellDate, selectedDate);

                const dayEvents = notes.filter(
                  (n) => n.scheduledFor && isSameDay(new Date(n.scheduledFor), cellDate)
                );
                const dayCreatedCount = notes.filter((n) =>
                  isSameDay(new Date(n.createdAt), cellDate)
                ).length;

                return (
                  <button
                    key={cellDate.toISOString()}
                    onClick={() => {
                      setSelectedDate(cellDate);
                      setHorizonMode("DAY");
                    }}
                    className={`h-12 rounded-xl border flex flex-col items-center justify-between p-1.5 transition-all cursor-pointer relative ${
                      isSelected
                        ? "bg-cyber-purple/25 border-cyber-cyan shadow-[0_0_15px_rgba(0,240,255,0.25)] text-white font-bold"
                        : isToday
                        ? "bg-obsidian border-cyber-purple/80 text-cyber-cyan font-bold"
                        : "bg-obsidian/70 border-obsidian-border hover:border-slate-600 text-slate-300"
                    }`}
                  >
                    <span className="text-xs font-mono leading-none">{cellDate.getDate()}</span>

                    <div className="flex items-center gap-1">
                      {dayEvents.slice(0, 3).map((ev) => {
                        const evMeta = EVENT_TYPES[ev.eventType || "NOTE"] || EVENT_TYPES.NOTE;
                        return (
                          <span
                            key={ev.id}
                            className={`w-1.5 h-1.5 rounded-full ${
                              ev.isArchived ? "bg-slate-600" : evMeta.dot
                            }`}
                          />
                        );
                      })}
                      {dayCreatedCount > 0 && dayEvents.length === 0 && (
                        <span className="w-1 h-1 rounded-full bg-slate-500" title="Созданы заметки" />
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="mt-6 pt-4 border-t border-obsidian-border space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-2 text-[10px] font-mono text-slate-400">
              <span className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-cyber-crimson" /> Дедлайн
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-cyber-purple" /> Встреча
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-400" /> Мероприятие
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-cyber-cyan" /> Заметка
              </span>
            </div>

            <button
              onClick={handleCreateOnSelectedDate}
              className="w-full py-3 rounded-xl bg-cyber-cyan/15 hover:bg-cyber-cyan/25 border border-cyber-cyan/40 text-cyber-cyan font-mono text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-pointer"
            >
              <Plus className="w-4 h-4" /> Запланировать на{" "}
              {selectedDate.toLocaleDateString("ru-RU", { day: "2-digit", month: "long" })}
            </button>
          </div>
        </div>

        {/* ПРАВАЯ КОЛОНКА (7 из 12): ДЕТАЛИ ДНЯ / БЛИЖАЙШИЕ 7 ДНЕЙ / МЕСЯЦ */}
        <div className="lg:col-span-7 p-6 rounded-3xl bg-obsidian-card border border-obsidian-border flex flex-col justify-between">
          {horizonMode === "DAY" && (
            <div className="space-y-5">
              <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-obsidian-border">
                <div>
                  <span className="text-[11px] font-mono text-cyber-cyan uppercase">
                    // Выбранная дата
                  </span>
                  <h3 className="text-xl font-extrabold text-white">
                    {selectedDate.toLocaleDateString("ru-RU", {
                      weekday: "long",
                      day: "numeric",
                      month: "long",
                      year: "numeric",
                    })}
                  </h3>
                </div>

                <div className="flex items-center bg-obsidian p-1 rounded-xl border border-obsidian-border">
                  <button
                    onClick={() => setDaySubTab("SCHEDULED")}
                    className={`px-3 py-1.5 rounded-lg font-mono text-xs font-bold flex items-center gap-1.5 cursor-pointer transition-all ${
                      daySubTab === "SCHEDULED"
                        ? "bg-cyber-cyan/20 text-cyber-cyan border border-cyber-cyan/40"
                        : "text-slate-400 hover:text-white"
                    }`}
                  >
                    <Clock className="w-3.5 h-3.5" /> План дня ({scheduledForSelectedDay.length})
                  </button>
                  <button
                    onClick={() => setDaySubTab("CREATED_ANALYTICS")}
                    className={`px-3 py-1.5 rounded-lg font-mono text-xs font-bold flex items-center gap-1.5 cursor-pointer transition-all ${
                      daySubTab === "CREATED_ANALYTICS"
                        ? "bg-cyber-purple/20 text-cyber-purple border border-cyber-purple/40"
                        : "text-slate-400 hover:text-white"
                    }`}
                  >
                    <History className="w-3.5 h-3.5" /> Написано в этот день ({createdOnSelectedDay.length})
                  </button>
                </div>
              </div>

              <div className="space-y-3 max-h-[420px] overflow-y-auto pr-1">
                {daySubTab === "SCHEDULED" ? (
                  scheduledForSelectedDay.length === 0 ? (
                    <div className="py-16 text-center space-y-3 border border-dashed border-obsidian-border rounded-2xl">
                      <CalendarIcon className="w-8 h-8 text-slate-600 mx-auto" />
                      <p className="text-xs font-mono text-slate-500">
                        На этот день нет запланированных событий или дедлайнов.
                      </p>
                    </div>
                  ) : (
                    scheduledForSelectedDay.map((item) => (
                      <EventCard key={item.id} item={item} showDate={false} />
                    ))
                  )
                ) : createdOnSelectedDay.length === 0 ? (
                  <div className="py-16 text-center space-y-2 border border-dashed border-obsidian-border rounded-2xl">
                    <p className="text-xs font-mono text-slate-500">
                      В эту дату ты не создавал новых заметок.
                    </p>
                  </div>
                ) : (
                  createdOnSelectedDay.map((item) => (
                    <EventCard key={item.id} item={item} showDate={true} isAnalyticsView />
                  ))
                )}
              </div>
            </div>
          )}

          {/* БЛИЖАЙШИЕ 7 ДНЕЙ ОТ СЕГОДНЯ */}
          {horizonMode === "WEEK" && (
            <div className="space-y-4">
              <div className="pb-4 border-b border-obsidian-border flex flex-wrap items-center justify-between gap-2">
                <div>
                  <span className="text-[11px] font-mono text-cyber-purple uppercase">
                    // Оперативный радар (от сегодня)
                  </span>
                  <h3 className="text-xl font-extrabold text-white">
                    Активные задачи на ближайшие 7 дней ({scheduledForNext7Days.length})
                  </h3>
                </div>
                <span className="text-xs font-mono text-cyber-cyan">
                  Сегодня ({todayStart.toLocaleDateString("ru-RU")}) → {next7DaysEnd.toLocaleDateString("ru-RU")}
                </span>
              </div>

              <div className="space-y-3 max-h-[420px] overflow-y-auto pr-1">
                {scheduledForNext7Days.length === 0 ? (
                  <div className="py-16 text-center text-xs font-mono text-slate-500 border border-dashed border-obsidian-border rounded-2xl">
                    На ближайшие 7 дней от сегодняшнего дня невыполненных событий нет.
                  </div>
                ) : (
                  scheduledForNext7Days.map((item) => (
                    <EventCard key={item.id} item={item} showDate={true} />
                  ))
                )}
              </div>
            </div>
          )}

          {/* РЕЖИМ ОБЗОРА НА ВЕСЬ ОТКРЫТЫЙ МЕСЯЦ */}
          {horizonMode === "MONTH" && (
            <div className="space-y-4">
              <div className="pb-4 border-b border-obsidian-border flex items-center justify-between">
                <div>
                  <span className="text-[11px] font-mono text-cyber-crimson uppercase">
                    // Месячный роадмап
                  </span>
                  <h3 className="text-xl font-extrabold text-white">
                    Все события за {MONTHS[month]} {year} ({scheduledForMonth.length})
                  </h3>
                </div>
              </div>

              <div className="space-y-3 max-h-[420px] overflow-y-auto pr-1">
                {scheduledForMonth.length === 0 ? (
                  <div className="py-16 text-center text-xs font-mono text-slate-500 border border-dashed border-obsidian-border rounded-2xl">
                    В этом месяце пока нет запланированных событий.
                  </div>
                ) : (
                  scheduledForMonth.map((item) => (
                    <EventCard key={item.id} item={item} showDate={true} />
                  ))
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// Карточка события с поддержкой кнопки «Выполнено / В архив»
function EventCard({
  item,
  showDate,
  isAnalyticsView = false,
}: {
  item: NoteItem;
  showDate: boolean;
  isAnalyticsView?: boolean;
}) {
  const cat = CATEGORY_LABELS[item.category] || CATEGORY_LABELS.DEV;
  const evType = EVENT_TYPES[item.eventType || "NOTE"] || EVENT_TYPES.NOTE;

  const scheduledTimeStr = item.scheduledFor
    ? new Date(item.scheduledFor).toLocaleTimeString("ru-RU", {
        hour: "2-digit",
        minute: "2-digit",
      })
    : null;

  const scheduledDateStr = item.scheduledFor
    ? new Date(item.scheduledFor).toLocaleDateString("ru-RU", {
        day: "2-digit",
        month: "short",
      })
    : null;

  const createdStr = new Date(item.createdAt).toLocaleString("ru-RU", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

  return (
    <div
      className={`p-4 rounded-2xl bg-obsidian border transition-all flex items-start justify-between gap-4 ${
        item.isArchived
          ? "border-emerald-500/30 opacity-70"
          : "border-obsidian-border hover:border-cyber-cyan/40"
      }`}
    >
      <div className="space-y-2 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          {scheduledTimeStr && (
            <span className="px-2.5 py-0.5 rounded-lg bg-cyber-cyan/15 border border-cyber-cyan/40 text-cyber-cyan font-mono text-xs font-bold flex items-center gap-1">
              <Clock className="w-3 h-3" />
              {showDate && `${scheduledDateStr}, `}
              {scheduledTimeStr}
            </span>
          )}

          <span className={`px-2 py-0.5 rounded border text-[10px] font-mono ${evType.color}`}>
            {evType.label}
          </span>

          <span className={`px-2 py-0.5 rounded border text-[10px] font-mono ${cat.color}`}>
            {cat.label}
          </span>

          {item.isArchived && (
            <span className="px-2 py-0.5 rounded bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 text-[10px] font-mono font-bold">
              ✓ ВЫПОЛНЕНО / АРХИВ
            </span>
          )}

          {item.project && (
            <span className="text-[11px] font-mono text-cyber-purple">
              // Узел: {item.project.title}
            </span>
          )}

          {!item.isArchived && item.remindOffset !== null && item.remindOffset !== undefined && (
            <span
              className={`px-2 py-0.5 rounded text-[10px] font-mono flex items-center gap-1 ${
                item.reminderSent
                  ? "bg-emerald-500/15 text-emerald-400 border border-emerald-500/30"
                  : "bg-cyber-purple/15 text-cyber-purple border border-cyber-purple/30"
              }`}
            >
              {item.reminderSent ? (
                <>
                  <CheckCircle2 className="w-3 h-3" /> Отправлено в ТГ
                </>
              ) : (
                <>
                  <Bell className="w-3 h-3" /> ТГ за{" "}
                  {item.remindOffset === 0
                    ? "0 мин"
                    : item.remindOffset >= 60
                    ? `${Math.round(item.remindOffset / 60)}ч`
                    : `${item.remindOffset}м`}
                </>
              )}
            </span>
          )}
        </div>

        <h4
          className={`font-bold text-sm ${
            item.isArchived ? "line-through text-slate-400" : "text-white"
          }`}
        >
          {item.title}
        </h4>
        <p className="text-xs text-slate-300 font-mono whitespace-pre-wrap">{item.content}</p>

        <div className="pt-1 text-[10px] font-mono text-slate-500 flex items-center gap-2">
          <span>📊 Создано: {createdStr}</span>
          {isAnalyticsView && item.scheduledFor && (
            <span className="text-cyber-cyan">
              → Назначено на: {new Date(item.scheduledFor).toLocaleString("ru-RU")}
            </span>
          )}
        </div>
      </div>

      {/* Кнопки: Отметить выполненным (В архив) ИЛИ Удалить */}
      <div className="flex items-center gap-1.5 shrink-0">
        <form action={toggleNoteArchive.bind(null, item.id, !!item.isArchived)}>
          <button
            title={item.isArchived ? "Вернуть в активные" : "Отметить как выполненное (В архив)"}
            className={`p-1.5 rounded-lg border transition-colors cursor-pointer ${
              item.isArchived
                ? "bg-obsidian border-obsidian-border text-slate-400 hover:text-cyber-cyan"
                : "bg-emerald-500/10 border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/20"
            }`}
          >
            {item.isArchived ? (
              <RotateCcw className="w-4 h-4" />
            ) : (
              <CheckCircle2 className="w-4 h-4" />
            )}
          </button>
        </form>

        <form action={deleteNote.bind(null, item.id)}>
          <button
            title="Удалить навсегда"
            className="p-1.5 text-slate-500 hover:text-cyber-crimson cursor-pointer transition-colors"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </form>
      </div>
    </div>
  );
}