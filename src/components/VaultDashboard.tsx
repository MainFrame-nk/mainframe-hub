"use client";

import React, { useState, useEffect } from "react";
import { motion } from "motion/react";
import ThemeToggle from "@/components/ThemeToggle";
import VaultCommandPalette from "@/components/VaultCommandPalette";
import {
  ProjectItem,
  NoteItem,
  LeadItem,
  TransactionItem,
  WishlistItemType,
  ContactItem,
  AudioTrackItem,
  CATEGORIES,
} from "./vault/types";
import VaultKanbanTab from "./vault/VaultKanbanTab";
import VaultNotesTab from "./vault/VaultNotesTab";
import VaultCrmTab from "./vault/VaultCrmTab";
import VaultFinanceTab from "./vault/VaultFinanceTab";
import VaultPeopleTab from "./vault/VaultPeopleTab";
import VaultRadioSystem from "./vault/VaultRadioTab";
import VaultModals from "./vault/VaultModals";
import {
  sendDatabaseBackupToTelegram,
  sendDailyDigestToTelegram,
  checkAndSendReminders,
} from "@/app/actions";
import {
  Plus,
  FolderPlus,
  StickyNote,
  ListTodo,
  Inbox,
  Wallet,
  Users,
  Radio,
  Layers,
} from "lucide-react";

export default function VaultDashboard({
  projects,
  notes,
  leads = [],
  transactions = [],
  wishlist = [],
  contacts = [],
  audioTracks = [],
}: {
  projects: ProjectItem[];
  notes: NoteItem[];
  leads?: LeadItem[];
  transactions?: TransactionItem[];
  wishlist?: WishlistItemType[];
  contacts?: ContactItem[];
  audioTracks?: AudioTrackItem[];
}) {
  const [localProjects, setLocalProjects] = useState<ProjectItem[]>(projects);
  useEffect(() => {
    setLocalProjects(projects);
  }, [projects]);

  const [activeCategory, setActiveCategory] = useState<string>("ALL");
  const [activeView, setActiveView] = useState<
    "KANBAN" | "NOTES" | "FINANCE" | "PEOPLE" | "RADIO" | "CRM"
  >("KANBAN");
  const [focusedProjectId, setFocusedProjectId] = useState<string>(
    projects[0]?.id || "ALL"
  );
  const [noteFilterProjectId, setNoteFilterProjectId] = useState<string>("ALL");

  const [isNoteModalOpen, setIsNoteModalOpen] = useState(false);
  const [isProjectModalOpen, setIsProjectModalOpen] = useState(false);

  const [isBackingUp, setIsBackingUp] = useState(false);
  const [isDigestSending, setIsDigestSending] = useState(false);

  useEffect(() => {
    checkAndSendReminders();
    const timer = setInterval(() => {
      checkAndSendReminders();
    }, 20000);
    return () => clearInterval(timer);
  }, []);

  const filteredProjects =
    activeCategory === "ALL"
      ? localProjects
      : localProjects.filter((p) => p.category === activeCategory);

  const filteredNotes = notes.filter((n) => {
    const matchCategory = activeCategory === "ALL" || n.category === activeCategory;
    const matchProject =
      noteFilterProjectId === "ALL" || n.project?.id === noteFilterProjectId;
    return matchCategory && matchProject;
  });

  const newLeadsCount = leads.filter((l) => l.status === "NEW").length;

  const handleOptimisticStatusChange = (
    projectId: string,
    stageId: string,
    newStatus: string
  ) => {
    setLocalProjects((prev) =>
      prev.map((proj) =>
        proj.id !== projectId
          ? proj
          : {
              ...proj,
              stages: proj.stages.map((st) =>
                st.id === stageId ? { ...st, status: newStatus } : st
              ),
            }
      )
    );
  };

  const navModules = [
    {
      id: "KANBAN" as const,
      label: "Проекты",
      icon: ListTodo,
      activeClass: "bg-cyber-cyan/20 text-cyber-cyan border-cyber-cyan/40",
    },
    {
      id: "NOTES" as const,
      label: `Заметки (${filteredNotes.length})`,
      icon: StickyNote,
      activeClass: "bg-cyber-purple/20 text-cyber-purple border-cyber-purple/40",
    },
    {
      id: "FINANCE" as const,
      label: "Финансы",
      icon: Wallet,
      activeClass: "bg-amber-500/20 text-amber-400 border-amber-500/40",
    },
    {
      id: "PEOPLE" as const,
      label: `Люди (${contacts.length})`,
      icon: Users,
      activeClass: "bg-emerald-500/20 text-emerald-400 border-emerald-500/40",
    },
    {
      id: "RADIO" as const,
      label: `Радио (${audioTracks.length})`,
      icon: Radio,
      activeClass: "bg-cyber-cyan/20 text-cyber-cyan border-cyber-cyan/40",
    },
    {
      id: "CRM" as const,
      label: `Заявки (${leads.length})`,
      icon: Inbox,
      activeClass: "bg-cyber-crimson/20 text-cyber-crimson border-cyber-crimson/40",
      badge: newLeadsCount > 0 ? `+${newLeadsCount}` : undefined,
    },
  ];

  // Нужна ли суб-панель фильтрации сфер жизни (ТОЛЬКО для Проектов и Заметок!)
  const showLifeSpheresBar = activeView === "KANBAN" || activeView === "NOTES";

  return (
    <div className="space-y-4">
      {/* УРОВЕНЬ 1: ГЛАВНЫЙ ДОК МОДУЛЕЙ VAULT OS + БЫСТРЫЕ ДЕЙСТВИЯ */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-obsidian-card/95 p-3 rounded-2xl border border-obsidian-border shadow-lg">
        {/* Навигация по 6 независимым модулям */}
        <div className="flex flex-wrap items-center gap-1.5 bg-obsidian p-1.5 rounded-xl border border-obsidian-border">
          {navModules.map((mod) => {
            const Icon = mod.icon;
            const isActive = activeView === mod.id;
            return (
              <button
                key={mod.id}
                onClick={() => setActiveView(mod.id)}
                className={`px-3 py-2 rounded-lg font-mono text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 border ${
                  isActive
                    ? mod.activeClass
                    : "border-transparent text-slate-400 hover:text-white hover:bg-obsidian-card/60"
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{mod.label}</span>
                {mod.badge && (
                  <span className="px-1.5 py-0.2 rounded-full bg-cyber-crimson text-white text-[10px] animate-pulse">
                    {mod.badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Правый системный тулбар */}
        <div className="flex flex-wrap items-center gap-2">
          <VaultCommandPalette
            projects={localProjects}
            notes={notes}
            contacts={contacts}
            onSelectProject={(id) => setFocusedProjectId(id)}
            onSwitchView={(v) => setActiveView(v)}
            onOpenNewProject={() => setIsProjectModalOpen(true)}
            onOpenNewNote={() => setIsNoteModalOpen(true)}
          />

          <ThemeToggle/>

          <button
            onClick={() => setIsNoteModalOpen(true)}
            className="px-3 py-2 rounded-xl bg-cyber-cyan/15 hover:bg-cyber-cyan/25 border border-cyber-cyan/40 text-cyber-cyan font-mono text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" /> Заметка
          </button>

          <button
            onClick={() => setIsProjectModalOpen(true)}
            className="px-3.5 py-2 rounded-xl bg-cyber-purple hover:bg-cyber-purple/90 text-white font-mono text-xs font-bold flex items-center gap-1.5 shadow-[0_0_15px_rgba(139,92,246,0.3)] transition-all cursor-pointer"
          >
            <FolderPlus className="w-3.5 h-3.5" /> Узел
          </button>

          <button
            disabled={isBackingUp}
            onClick={async () => {
              setIsBackingUp(true);
              const res = await sendDatabaseBackupToTelegram();
              setIsBackingUp(false);
              if (res?.success) {
                alert("✅ Свежий бэкап базы данных dev.db отправлен в твой Telegram!");
              } else {
                alert("❌ Ошибка отправки бэкапа: " + (res?.error || "Неизвестная ошибка"));
              }
            }}
            title="Отправить слепок SQLite базы данных в личный Telegram"
            className="px-2.5 py-2 rounded-xl bg-obsidian border border-obsidian-border hover:border-emerald-400 text-slate-300 hover:text-emerald-400 font-mono text-xs flex items-center gap-1 transition-all cursor-pointer disabled:opacity-50"
          >
            <span>💾</span>
            <span className="hidden xl:inline">{isBackingUp ? "..." : "Бэкап"}</span>
          </button>

          <button
            disabled={isDigestSending}
            onClick={async () => {
              setIsDigestSending(true);
              const res = await sendDailyDigestToTelegram();
              setIsDigestSending(false);
              if (res?.success) {
                alert("🌅 Сводка задач и событий дня отправлена в Telegram!");
              } else {
                alert("❌ Ошибка отправки сводки: " + (res?.error || "Неизвестная ошибка"));
              }
            }}
            title="Прислать оперативную сводку дня в Telegram"
            className="px-2.5 py-2 rounded-xl bg-obsidian border border-obsidian-border hover:border-cyber-cyan text-slate-300 hover:text-cyber-cyan font-mono text-xs flex items-center gap-1 transition-all cursor-pointer disabled:opacity-50"
          >
            <span>🌅</span>
            <span className="hidden xl:inline">{isDigestSending ? "..." : "Сводка"}</span>
          </button>
        </div>
      </div>

      {/* УРОВЕНЬ 2: ОТДЕЛЬНАЯ СУБ-ПАНЕЛЬ СФЕР ЖИЗНИ (ПОКАЗЫВАЕТСЯ ТОЛЬКО В ПРОЕКТАХ И ЗАМЕТКАХ!) */}
      {showLifeSpheresBar && (
        <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-2.5 rounded-2xl bg-obsidian/70 border border-obsidian-border">
          <div className="flex items-center gap-2 text-xs font-mono text-slate-400">
            <Layers className="w-3.5 h-3.5 text-cyber-purple" />
            <span>Контур фильтрации:</span>
          </div>

          <div className="flex flex-wrap items-center gap-1.5">
            {CATEGORIES.map((cat) => {
              const isActive = activeCategory === cat.id;
              return (
                <button
                  key={cat.id}
                  onClick={() => setActiveCategory(cat.id)}
                  className={`relative px-3 py-1.5 rounded-xl font-mono text-xs font-bold transition-colors duration-200 cursor-pointer outline-none ${
                    isActive
                      ? "text-white"
                      : "text-slate-400 hover:text-slate-200 bg-obsidian-card/70 border border-obsidian-border"
                  }`}
                >
                  {isActive && (
                    <motion.div
                      layoutId="activeVaultTab"
                      transition={{ type: "spring", stiffness: 380, damping: 30 }}
                      className="absolute inset-0 rounded-xl bg-cyber-purple shadow-[0_0_15px_rgba(139,92,246,0.35)]"
                    />
                  )}
                  <span className="relative z-10">{cat.label}</span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* РЕНДЕР АКТИВНОГО МОДУЛЯ */}
      {activeView === "KANBAN" && (
        <VaultKanbanTab
          projects={filteredProjects}
          focusedProjectId={focusedProjectId}
          setFocusedProjectId={setFocusedProjectId}
          onOptimisticStatusChange={handleOptimisticStatusChange}
        />
      )}

      {activeView === "NOTES" && (
        <VaultNotesTab
          notes={filteredNotes}
          projects={filteredProjects}
          noteFilterProjectId={noteFilterProjectId}
          setNoteFilterProjectId={setNoteFilterProjectId}
        />
      )}

      {activeView === "FINANCE" && (
        <VaultFinanceTab
          transactions={transactions}
          wishlist={wishlist}
          projects={localProjects}
        />
      )}

      {activeView === "PEOPLE" && (
        <VaultPeopleTab contacts={contacts} projects={localProjects} />
      )}

      <VaultRadioSystem isVisibleTab={activeView === "RADIO"} />

      {activeView === "CRM" && (
        <VaultCrmTab
          leads={leads}
          onConvertedToProject={() => setActiveView("KANBAN")}
        />
      )}

      {/* МОДАЛЬНЫЕ ОКНА */}
      <VaultModals
        isNoteModalOpen={isNoteModalOpen}
        setIsNoteModalOpen={setIsNoteModalOpen}
        isProjectModalOpen={isProjectModalOpen}
        setIsProjectModalOpen={setIsProjectModalOpen}
        activeCategory={activeCategory}
        projects={localProjects}
      />
    </div>
  );
}