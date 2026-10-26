"use client";

import React, { useState, useMemo } from "react";
import { ContactItem, ProjectItem, CONTACT_TAGS, EVENT_TYPES } from "./types";
import {
  createContact,
  deleteContact,
  updateContactProject,
  createContactNote,
  checkAndNotifyBirthdays,
  toggleNoteArchive,
  deleteNote,
} from "@/app/actions";
import {
  Users,
  UserPlus,
  Search,
  Send,
  Phone,
  Cake,
  FolderGit2,
  StickyNote,
  Trash2,
  ShieldCheck,
  BellRing,
  Plus,
  X,
  Upload,
  Clock,
  Bell,
  CheckCircle2,
} from "lucide-react";

interface Props {
  contacts: ContactItem[];
  projects: ProjectItem[];
}

export default function VaultPeopleTab({ contacts, projects }: Props) {
  const [selectedTag, setSelectedTag] = useState<string>("ALL");
  const [selectedProjectId, setSelectedProjectId] = useState<string>("ALL");
  const [search, setSearch] = useState<string>("");
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [expandedContactId, setExpandedContactId] = useState<string | null>(null);
  const [isCheckingBdays, setIsCheckingBdays] = useState(false);

  // Стейт для загруженной фотографии контакта (сжатый Base64, шифруется в БД)
  const [avatarPreview, setAvatarPreview] = useState<string>("");

  // Сжатие выбранной фотографии на клиенте до 256x256 JPEG, чтобы она мгновенно шифровалась в БД
  const handleAvatarFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement("canvas");
        const MAX_SIZE = 256;
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > MAX_SIZE) {
            height = Math.round((height * MAX_SIZE) / width);
            width = MAX_SIZE;
          }
        } else {
          if (height > MAX_SIZE) {
            width = Math.round((width * MAX_SIZE) / height);
            height = MAX_SIZE;
          }
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d");
        ctx?.drawImage(img, 0, 0, width, height);

        const compressedDataUrl = canvas.toDataURL("image/jpeg", 0.82);
        setAvatarPreview(compressedDataUrl);
      };
      img.src = event.target?.result as string;
    };
    reader.readAsDataURL(file);
  };

  // Расчет дней до следующего Дня Рождения
  const getDaysUntilBirthday = (birthdayStr: string | null) => {
    if (!birthdayStr) return null;
    const parts = birthdayStr.split("-");
    if (parts.length < 3) return null;

    const month = parseInt(parts[1], 10);
    const day = parseInt(parts[2], 10);
    if (isNaN(month) || isNaN(day)) return null;

    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    let nextBday = new Date(today.getFullYear(), month - 1, day);

    if (nextBday < today) {
      nextBday = new Date(today.getFullYear() + 1, month - 1, day);
    }

    const diffTime = nextBday.getTime() - today.getTime();
    return Math.round(diffTime / (1000 * 60 * 60 * 24));
  };

  // ИСПРАВЛЕННЫЙ УМНЫЙ ПОИСК ПО ИМЕНИ, РОЛИ, ПРОЕКТУ, ТГ И ЗАМЕТКАМ
  const filteredContacts = useMemo(() => {
    const norm = (str: string | null | undefined) =>
      (str || "").toString().normalize("NFKC").toLowerCase().trim();

    const q = norm(search);

    return contacts.filter((c) => {
      const matchTag = selectedTag === "ALL" || c.tag === selectedTag;
      const matchProj = selectedProjectId === "ALL" || c.projectId === selectedProjectId;

      if (!q) return matchTag && matchProj;

      const haystack = [
        c.name,
        c.role,
        c.telegram,
        c.phone,
        c.bio,
        c.project?.title,
        ...(c.notes?.map((n) => `${n.title} ${n.content}`) || []),
      ]
        .map(norm)
        .join(" ");

      const matchSearch = haystack.includes(q);
      return matchTag && matchProj && matchSearch;
    });
  }, [contacts, selectedTag, selectedProjectId, search]);

  const handleBirthdayPing = async () => {
    setIsCheckingBdays(true);
    const res = await checkAndNotifyBirthdays();
    setIsCheckingBdays(false);
    if (res?.sent && res.sent > 0) {
      alert(`🎂 Отправлено уведомлений о ближайших ДР в Telegram: ${res.sent}`);
    } else {
      alert("✅ Сегодня и в ближайшие 3 дня именинников нет.");
    }
  };

  return (
    <div className="space-y-6">
      {/* 1. ВЕРХНЯЯ ПАНЕЛЬ: ПОИСК, ФИЛЬТР ПО КОМАНДАМ ПРОЕКТОВ И КНОПКА ДОБАВЛЕНИЯ */}
      <div className="p-4 rounded-2xl bg-obsidian-card/90 border border-obsidian-border space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-cyber-cyan/10 border border-cyber-cyan/30 text-cyber-cyan">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-sm font-mono font-bold uppercase text-white">
                  Люди, Команды & Связи ({filteredContacts.length} из {contacts.length})
                </h2>
                <span className="px-2 py-0.5 rounded bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-[10px] font-mono flex items-center gap-1">
                  <ShieldCheck className="w-3 h-3" /> AES-256 Protected
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Зашифрованная картотека контактов, фото, команд проектов и встреч с пушами в ТГ
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <button
              onClick={handleBirthdayPing}
              disabled={isCheckingBdays}
              className="px-3 py-2 rounded-xl bg-obsidian border border-obsidian-border hover:border-amber-400 text-slate-300 hover:text-amber-400 font-mono text-xs flex items-center gap-1.5 transition-all cursor-pointer"
              title="Проверить дни рождения и прислать напоминание в Telegram"
            >
              <BellRing className="w-3.5 h-3.5 text-amber-400" />
              <span>{isCheckingBdays ? "Проверка..." : "Проверка ДР в ТГ"}</span>
            </button>

            <button
              onClick={() => {
                setAvatarPreview("");
                setIsAddModalOpen(true);
              }}
              className="px-4 py-2 rounded-xl bg-cyber-cyan hover:bg-cyber-cyan/90 text-obsidian font-mono text-xs font-bold flex items-center gap-1.5 shadow-[0_0_15px_rgba(0,240,255,0.3)] transition-all cursor-pointer"
            >
              <UserPlus className="w-4 h-4" /> Добавить человека
            </button>
          </div>
        </div>

        {/* Фильтры по тегам + поиск + фильтр по проекту */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-obsidian-border">
          <div className="flex flex-wrap items-center gap-1.5">
            <button
              onClick={() => setSelectedTag("ALL")}
              className={`px-3 py-1.5 rounded-lg font-mono text-xs transition-all cursor-pointer ${
                selectedTag === "ALL"
                  ? "bg-cyber-purple text-white font-bold"
                  : "bg-obsidian text-slate-400 hover:text-white border border-obsidian-border"
              }`}
            >
              Все люди ({contacts.length})
            </button>
            {Object.entries(CONTACT_TAGS).map(([key, cfg]) => (
              <button
                key={key}
                onClick={() => setSelectedTag(key)}
                className={`px-3 py-1.5 rounded-lg font-mono text-xs transition-all cursor-pointer ${
                  selectedTag === key
                    ? "bg-cyber-cyan/20 text-cyber-cyan border border-cyber-cyan/40 font-bold"
                    : "bg-obsidian text-slate-400 hover:text-white border border-obsidian-border"
                }`}
              >
                {cfg.label}
              </button>
            ))}
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <select
              value={selectedProjectId}
              onChange={(e) => setSelectedProjectId(e.target.value)}
              className="px-3 py-1.5 rounded-xl bg-obsidian border border-obsidian-border text-xs font-mono text-slate-200 outline-none focus:border-cyber-purple"
            >
              <option value="ALL">📁 Все проекты / Без проекта</option>
              {projects.map((p) => (
                <option key={p.id} value={p.id}>
                  Команда: {p.title}
                </option>
              ))}
            </select>

            {/* Поле живого поиска с кнопкой сброса */}
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-cyber-cyan absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  // Если начали искать, но выбран узкий фильтр тега — можно искать по всем
                }}
                placeholder="Имя, роль, ТГ, заметка..."
                className="pl-8 pr-7 py-1.5 rounded-xl bg-obsidian border border-obsidian-border text-xs font-mono text-white outline-none focus:border-cyber-cyan w-60"
              />
              {search && (
                <button
                  type="button"
                  onClick={() => setSearch("")}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white cursor-pointer"
                  title="Очистить поиск"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* 2. СЕТКА КАРТОЧЕК ЛЮДЕЙ */}
      {filteredContacts.length === 0 ? (
        <div className="p-12 rounded-2xl bg-obsidian-card/50 border border-obsidian-border text-center space-y-3">
          <Users className="w-10 h-10 text-slate-600 mx-auto" />
          <p className="text-sm font-mono text-slate-400">
            {search || selectedTag !== "ALL" || selectedProjectId !== "ALL"
              ? "По заданному фильтру или поисковому запросу никого не найдено."
              : "В картотеке пока нет сохраненных людей."}
          </p>
          {(search || selectedTag !== "ALL" || selectedProjectId !== "ALL") && (
            <button
              onClick={() => {
                setSearch("");
                setSelectedTag("ALL");
                setSelectedProjectId("ALL");
              }}
              className="px-4 py-2 rounded-xl bg-obsidian border border-cyber-cyan/40 text-cyber-cyan font-mono text-xs cursor-pointer"
            >
              Сбросить все фильтры
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
          {filteredContacts.map((person) => {
            const tagCfg = CONTACT_TAGS[person.tag] || CONTACT_TAGS.PARTNER;
            const daysToBday = getDaysUntilBirthday(person.birthday);
            const isBdaySoon = daysToBday !== null && daysToBday <= 14;
            const isExpanded = expandedContactId === person.id;
            const personNotes = person.notes || [];

            return (
              <div
                key={person.id}
                className="p-5 rounded-2xl bg-obsidian-card/90 border border-obsidian-border hover:border-slate-700 transition-all flex flex-col justify-between space-y-4"
              >
                <div className="space-y-3.5">
                  {/* Шапка карточки: Фото + Имя + Роль + Удаление */}
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3.5">
                      <div className="w-14 h-14 rounded-2xl bg-obsidian border border-obsidian-border flex items-center justify-center overflow-hidden shrink-0 text-cyber-cyan font-mono font-bold text-lg shadow-inner">
                        {person.avatarUrl ? (
                          <img
                            src={person.avatarUrl}
                            alt={person.name}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          person.name.slice(0, 2).toUpperCase()
                        )}
                      </div>

                      <div>
                        <h3 className="text-base font-bold text-white leading-tight">
                          {person.name}
                        </h3>
                        {person.role && (
                          <p className="text-xs font-mono text-cyber-cyan mt-0.5">{person.role}</p>
                        )}
                        <div className="flex items-center gap-1.5 mt-1.5 flex-wrap">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-mono border ${tagCfg.badge}`}>
                            {tagCfg.label}
                          </span>

                          {daysToBday !== null && (
                            <span
                              className={`px-2 py-0.5 rounded text-[10px] font-mono flex items-center gap-1 ${
                                daysToBday === 0
                                  ? "bg-cyber-crimson text-white font-bold animate-pulse"
                                  : isBdaySoon
                                  ? "bg-amber-500/20 text-amber-400 border border-amber-500/40"
                                  : "bg-obsidian text-slate-400 border border-obsidian-border"
                              }`}
                            >
                              <Cake className="w-3 h-3" />
                              {daysToBday === 0 ? "СЕГОДНЯ ДР!" : `ДР через ${daysToBday} дн.`}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    <form action={deleteContact.bind(null, person.id)}>
                      <button
                        type="submit"
                        className="p-1.5 rounded-lg text-slate-500 hover:text-cyber-crimson transition-colors cursor-pointer"
                        title="Удалить карточку"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </form>
                  </div>

                  {/* Личное досье */}
                  {person.bio && (
                    <p className="text-xs text-slate-300 bg-obsidian/70 p-3 rounded-xl border border-obsidian-border leading-relaxed">
                      {person.bio}
                    </p>
                  )}

                  {/* Контакты: Telegram & Телефон */}
                  <div className="grid grid-cols-2 gap-2 text-xs font-mono">
                    {person.telegram ? (
                      <a
                        href={`https://t.me/${person.telegram.replace("@", "")}`}
                        target="_blank"
                        rel="noreferrer"
                        className="p-2 rounded-xl bg-obsidian border border-obsidian-border hover:border-cyber-cyan text-cyber-cyan flex items-center gap-2 truncate transition-all"
                      >
                        <Send className="w-3.5 h-3.5 shrink-0" />
                        <span className="truncate">{person.telegram}</span>
                      </a>
                    ) : (
                      <div className="p-2 rounded-xl bg-obsidian/40 border border-obsidian-border text-slate-600 flex items-center gap-2">
                        <Send className="w-3.5 h-3.5 shrink-0" /> Нет ТГ
                      </div>
                    )}

                    {person.phone ? (
                      <a
                        href={`tel:${person.phone}`}
                        className="p-2 rounded-xl bg-obsidian border border-obsidian-border hover:border-emerald-400 text-emerald-400 flex items-center gap-2 truncate transition-all"
                      >
                        <Phone className="w-3.5 h-3.5 shrink-0" />
                        <span className="truncate">{person.phone}</span>
                      </a>
                    ) : (
                      <div className="p-2 rounded-xl bg-obsidian/40 border border-obsidian-border text-slate-600 flex items-center gap-2">
                        <Phone className="w-3.5 h-3.5 shrink-0" /> Нет тел.
                      </div>
                    )}
                  </div>

                  {/* Привязка к команде Проекта */}
                  <div className="pt-1">
                    <label className="block text-[10px] font-mono text-slate-500 uppercase mb-1 flex items-center gap-1">
                      <FolderGit2 className="w-3 h-3 text-cyber-purple" /> Команда проекта:
                    </label>
                    <select
                      value={person.projectId || ""}
                      onChange={(e) => updateContactProject(person.id, e.target.value || null)}
                      className="w-full px-3 py-1.5 rounded-xl bg-obsidian border border-obsidian-border hover:border-cyber-purple/50 text-xs font-mono text-slate-200 outline-none cursor-pointer"
                    >
                      <option value="">— Не привязан к проекту —</option>
                      {projects.map((p) => (
                        <option key={p.id} value={p.id}>
                          📁 {p.title}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* НИЖНИЙ БЛОК: ЗАМЕТКИ, ВСТРЕЧИ И ПРОСЬБЫ С ДАТОЙ И ВРЕМЕНЕМ */}
                <div className="pt-3 border-t border-obsidian-border">
                  <button
                    type="button"
                    onClick={() => setExpandedContactId(isExpanded ? null : person.id)}
                    className="w-full flex items-center justify-between text-xs font-mono text-slate-300 hover:text-cyber-cyan transition-colors cursor-pointer"
                  >
                    <span className="flex items-center gap-1.5">
                      <StickyNote className="w-3.5 h-3.5 text-cyber-purple" />
                      Встречи и заметки ({personNotes.length})
                    </span>
                    <span className="text-[11px] text-cyber-cyan">
                      {isExpanded ? "Скрыть ▲" : "Открыть досье ▼"}
                    </span>
                  </button>

                  {isExpanded && (
                    <div className="mt-3 space-y-3 pt-3 border-t border-obsidian-border/60">
                      {/* Расширенная форма: текст + дата/время встречи + уведомление в ТГ */}
                      <form
                        action={createContactNote}
                        className="p-3 rounded-xl bg-obsidian border border-obsidian-border space-y-2.5"
                      >
                        <input type="hidden" name="contactId" value={person.id} />
                        <input type="hidden" name="contactName" value={person.name} />
                        <input type="hidden" name="projectId" value={person.projectId || ""} />

                        <p className="text-[10px] font-mono text-cyber-cyan uppercase">
                          + Назначить встречу / задачу / заметку
                        </p>

                        <input
                          type="text"
                          name="title"
                          required
                          placeholder="Что сделать / тема встречи..."
                          className="w-full px-2.5 py-1.5 rounded-lg bg-obsidian-card border border-obsidian-border text-xs text-white outline-none focus:border-cyber-cyan"
                        />

                        <div className="grid grid-cols-2 gap-2">
                          <div>
                            <label className="block text-[9px] font-mono text-slate-400 mb-0.5">
                              Тип записи
                            </label>
                            <select
                              name="eventType"
                              defaultValue="MEETING"
                              className="w-full px-2 py-1.5 rounded-lg bg-obsidian-card border border-obsidian-border text-[11px] font-mono text-slate-200 outline-none"
                            >
                              <option value="MEETING">🤝 Встреча / Созвон</option>
                              <option value="DEADLINE">🔥 Просьба / Сделать к дате</option>
                              <option value="NOTE">📝 Обычная заметка</option>
                            </select>
                          </div>

                          <div>
                            <label className="block text-[9px] font-mono text-slate-400 mb-0.5">
                              Пуш в Telegram
                            </label>
                            <select
                              name="remindOffset"
                              defaultValue="30"
                              className="w-full px-2 py-1.5 rounded-lg bg-obsidian-card border border-obsidian-border text-[11px] font-mono text-cyber-cyan outline-none"
                            >
                              <option value="NONE">Без уведомления</option>
                              <option value="0">В момент времени</option>
                              <option value="15">За 15 минут</option>
                              <option value="30">За 30 минут</option>
                              <option value="60">За 1 час</option>
                              <option value="1440">За 1 день</option>
                            </select>
                          </div>
                        </div>

                        <div>
                          <label className="block text-[9px] font-mono text-slate-400 mb-0.5">
                            Дата и время (также появится в 📅 Календаре)
                          </label>
                          <input
                            type="datetime-local"
                            name="scheduledFor"
                            className="w-full px-2.5 py-1.5 rounded-lg bg-obsidian-card border border-obsidian-border text-[11px] font-mono text-white outline-none focus:border-cyber-cyan"
                          />
                        </div>

                        <button
                          type="submit"
                          className="w-full py-1.5 rounded-lg bg-cyber-purple hover:bg-cyber-purple/90 text-white font-mono text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer transition-all"
                        >
                          <Plus className="w-3.5 h-3.5" /> Сохранить в досье и календарь
                        </button>
                      </form>

                      {/* Список заметок и встреч по человеку */}
                      {personNotes.length === 0 ? (
                        <p className="text-[11px] font-mono text-slate-500 text-center py-2">
                          Заметок и встреч с этим человеком пока нет.
                        </p>
                      ) : (
                        <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                          {personNotes.map((n) => {
                            const evCfg = EVENT_TYPES[n.eventType || "NOTE"] || EVENT_TYPES.NOTE;
                            return (
                              <div
                                key={n.id}
                                className={`p-2.5 rounded-xl border text-xs space-y-1.5 transition-all ${
                                  n.isArchived
                                    ? "bg-obsidian/40 border-emerald-500/30 opacity-60"
                                    : "bg-obsidian border-obsidian-border"
                                }`}
                              >
                                <div className="flex items-start justify-between gap-2">
                                  <div className="space-y-1">
                                    <div className="flex items-center gap-1.5 flex-wrap">
                                      <span className={`px-1.5 py-0.5 rounded text-[9px] font-mono border ${evCfg.color}`}>
                                        {evCfg.label}
                                      </span>
                                      {n.scheduledFor && (
                                        <span className="px-1.5 py-0.5 rounded bg-cyber-cyan/15 border border-cyber-cyan/40 text-cyber-cyan font-mono text-[10px] flex items-center gap-1">
                                          <Clock className="w-2.5 h-2.5" />
                                          {new Date(n.scheduledFor).toLocaleString("ru-RU", {
                                            day: "2-digit",
                                            month: "2-digit",
                                            hour: "2-digit",
                                            minute: "2-digit",
                                          })}
                                        </span>
                                      )}
                                      {n.remindOffset !== null && n.remindOffset !== undefined && (
                                        <span title="Включено уведомление в ТГ">
                                            <Bell className="w-3 h-3 text-cyber-purple" />
                                        </span>
                                      )}
                                    </div>
                                    <div className={`font-bold text-slate-100 ${n.isArchived ? "line-through" : ""}`}>
                                      {n.title.replace(`[${person.name}] `, "")}
                                    </div>
                                  </div>

                                  <div className="flex items-center gap-1 shrink-0">
                                    <button
                                      type="button"
                                      onClick={() => toggleNoteArchive(n.id, Boolean(n.isArchived))}
                                      className={`p-1 rounded cursor-pointer ${
                                        n.isArchived
                                          ? "text-emerald-400"
                                          : "text-slate-500 hover:text-emerald-400"
                                      }`}
                                      title="Отметить выполненным"
                                    >
                                      <CheckCircle2 className="w-3.5 h-3.5" />
                                    </button>
                                    <form action={deleteNote.bind(null, n.id)}>
                                      <button
                                        type="submit"
                                        className="p-1 text-slate-500 hover:text-cyber-crimson cursor-pointer"
                                        title="Удалить запись"
                                      >
                                        <Trash2 className="w-3.5 h-3.5" />
                                      </button>
                                    </form>
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* 3. МОДАЛЬНОЕ ОКНО СОЗДАНИЯ ЧЕЛОВЕКА (С ЗАГРУЗКОЙ ФОТО С УСТРОЙСТВА) */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="max-w-lg w-full rounded-2xl bg-obsidian-card border border-obsidian-border p-6 space-y-4 shadow-2xl max-h-[92vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-obsidian-border pb-3">
              <div className="flex items-center gap-2">
                <UserPlus className="w-5 h-5 text-cyber-cyan" />
                <h3 className="text-base font-bold font-mono uppercase text-white">
                  Новая карточка человека (AES-256)
                </h3>
              </div>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="text-slate-400 hover:text-white cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form
              action={async (fd) => {
                await createContact(fd);
                setAvatarPreview("");
                setIsAddModalOpen(false);
              }}
              className="space-y-3.5"
            >
              {/* Скрытое поле, куда передается сжатое фото для шифрования AES-256 в БД */}
              <input type="hidden" name="avatarUrl" value={avatarPreview} />

              {/* Блок выбора фотографии с компьютера/телефона */}
              <div className="flex items-center gap-4 p-3 rounded-xl bg-obsidian border border-obsidian-border">
                <div className="w-16 h-16 rounded-2xl bg-obsidian-card border border-obsidian-border flex items-center justify-center overflow-hidden shrink-0">
                  {avatarPreview ? (
                    <img src={avatarPreview} alt="Preview" className="w-full h-full object-cover" />
                  ) : (
                    <Users className="w-6 h-6 text-slate-600" />
                  )}
                </div>

                <div className="flex-1 space-y-1.5">
                  <label className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-cyber-purple/20 hover:bg-cyber-purple/30 border border-cyber-purple/40 text-cyber-purple font-mono text-xs font-bold cursor-pointer transition-all">
                    <Upload className="w-3.5 h-3.5" />
                    <span>{avatarPreview ? "Заменить фото" : "Прикрепить фотографию"}</span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleAvatarFileChange}
                      className="hidden"
                    />
                  </label>
                  <p className="text-[10px] font-mono text-slate-500">
                    Фото автоматически сжимается и шифруется AES-256 внутри базы данных (без открытых файлов на диске)
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-mono text-slate-400 mb-1">
                    Имя / Позывной *
                  </label>
                  <input
                    type="text"
                    name="name"
                    required
                    placeholder="Александр / Alex"
                    className="w-full px-3 py-2 rounded-xl bg-obsidian border border-obsidian-border text-sm outline-none focus:border-cyber-cyan"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-mono text-slate-400 mb-1">
                    Роль / Специализация
                  </label>
                  <input
                    type="text"
                    name="role"
                    placeholder="Full-Stack / Дизайнер / Заказчик"
                    className="w-full px-3 py-2 rounded-xl bg-obsidian border border-obsidian-border text-sm outline-none focus:border-cyber-cyan"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-mono text-slate-400 mb-1">
                    Круг / Сфера
                  </label>
                  <select
                    name="tag"
                    className="w-full px-3 py-2 rounded-xl bg-obsidian border border-obsidian-border text-xs font-mono outline-none focus:border-cyber-cyan"
                  >
                    {Object.entries(CONTACT_TAGS).map(([k, v]) => (
                      <option key={k} value={k}>
                        {v.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-mono text-slate-400 mb-1">
                    Команда проекта (опц.)
                  </label>
                  <select
                    name="projectId"
                    className="w-full px-3 py-2 rounded-xl bg-obsidian border border-obsidian-border text-xs font-mono outline-none focus:border-cyber-cyan"
                  >
                    <option value="">— Без проекта —</option>
                    {projects.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.title}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-mono text-slate-400 mb-1">
                    Telegram (@username)
                  </label>
                  <input
                    type="text"
                    name="telegram"
                    placeholder="@username"
                    className="w-full px-3 py-2 rounded-xl bg-obsidian border border-obsidian-border text-xs font-mono outline-none focus:border-cyber-cyan"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-mono text-slate-400 mb-1">
                    Телефон
                  </label>
                  <input
                    type="text"
                    name="phone"
                    placeholder="+7 999 000-00-00"
                    className="w-full px-3 py-2 rounded-xl bg-obsidian border border-obsidian-border text-xs font-mono outline-none focus:border-cyber-cyan"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-mono text-slate-400 mb-1">
                  День рождения (для напоминаний в ТГ)
                </label>
                <input
                  type="date"
                  name="birthday"
                  className="w-full px-3 py-2 rounded-xl bg-obsidian border border-obsidian-border text-xs font-mono outline-none focus:border-cyber-cyan"
                />
              </div>

              <div>
                <label className="block text-[11px] font-mono text-slate-400 mb-1">
                  Личное досье / Заметка о человеке (шифруется)
                </label>
                <textarea
                  name="bio"
                  rows={3}
                  placeholder="Где познакомились, сильные стороны, договоренности..."
                  className="w-full px-3 py-2 rounded-xl bg-obsidian border border-obsidian-border text-xs outline-none focus:border-cyber-cyan resize-none"
                />
              </div>

              <button
                type="submit"
                className="w-full py-3 rounded-xl bg-cyber-cyan hover:bg-cyber-cyan/90 text-obsidian font-mono text-xs font-bold transition-all cursor-pointer"
              >
                ЗАШИФРОВАТЬ И СОХРАНИТЬ КОНТАКТ
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}