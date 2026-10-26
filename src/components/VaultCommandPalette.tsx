"use client";

import React, { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import {
  ProjectItem,
  NoteItem,
  ContactItem,
} from "./vault/types";
import { useGlobalRadio } from "./vault/GlobalRadioProvider";
import {
  Search,
  Terminal,
  FolderGit2,
  StickyNote,
  Users,
  Radio,
  Wallet,
  Inbox,
  Plus,
  Play,
  X,
} from "lucide-react";

interface Props {
  projects: ProjectItem[];
  notes?: NoteItem[];
  contacts?: ContactItem[];
  onSelectProject: (id: string) => void;
  onSwitchView: (view: "KANBAN" | "NOTES" | "FINANCE" | "PEOPLE" | "RADIO" | "CRM") => void;
  onOpenNewProject: () => void;
  onOpenNewNote: () => void;
}

export default function VaultCommandPalette({
  projects,
  notes = [],
  contacts = [],
  onSelectProject,
  onSwitchView,
  onOpenNewProject,
  onOpenNewNote,
}: Props) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [mounted, setMounted] = useState(false);

  const { tracks, playTrack, startRadioStream } = useGlobalRadio();

  useEffect(() => {
    setMounted(true);
    const down = (e: KeyboardEvent) => {
      if ((e.key === "k" || e.key === "K" || e.key === "л" || e.key === "Л") && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((prev) => !prev);
      }
      if (e.key === "Escape") {
        setOpen(false);
      }
    };
    window.addEventListener("keydown", down);
    return () => window.removeEventListener("keydown", down);
  }, []);

  const [usageMap, setUsageMap] = useState<Record<string, number>>({});

  useEffect(() => {
    try {
      const saved = JSON.parse(localStorage.getItem("vault_cmd_usage") || "{}");
      setUsageMap(saved);
    } catch {}
  }, [open]);

  const recordUsage = (id: string) => {
    try {
      const next = { ...usageMap, [id]: (usageMap[id] || 0) + 1 };
      setUsageMap(next);
      localStorage.setItem("vault_cmd_usage", JSON.stringify(next));
    } catch {}
  };

  const q = query.toLowerCase().trim();

  const matchedProjects = projects
    .filter((p) => p.title.toLowerCase().includes(q) || p.tagline.toLowerCase().includes(q))
    .sort((a, b) => (usageMap[b.id] || 0) - (usageMap[a.id] || 0));

  const matchedContacts = contacts
    .filter(
      (c) =>
        c.name.toLowerCase().includes(q) ||
        (c.role && c.role.toLowerCase().includes(q)) ||
        (c.telegram && c.telegram.toLowerCase().includes(q))
    )
    .sort((a, b) => (usageMap[b.id] || 0) - (usageMap[a.id] || 0));

  const matchedTracks = tracks
    .filter((t) => t.title.toLowerCase().includes(q) || t.artist.toLowerCase().includes(q))
    .sort((a, b) => {
      // Сначала Избранные (❤️), затем самые часто включаемые, затем новые
      if (a.isFav !== b.isFav) return a.isFav ? -1 : 1;
      return (usageMap[b.id] || 0) - (usageMap[a.id] || 0);
    });
    
  const matchedNotes = notes.filter(
    (n) => n.title.toLowerCase().includes(q) || n.content.toLowerCase().includes(q)
  );

  const modalContent = open ? (
    <div
      className="fixed inset-0 z-[9999] bg-black/80 backdrop-blur-md flex items-start justify-center pt-20 p-4"
      onClick={() => setOpen(false)}
    >
      <div
        className="w-full max-w-2xl rounded-2xl bg-obsidian-card border border-cyber-cyan/50 shadow-[0_0_50px_rgba(0,0,0,0.95)] overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Поле ввода запроса */}
        <div className="flex items-center gap-3 px-4 py-3.5 border-b border-obsidian-border bg-obsidian">
          <Search className="w-4 h-4 text-cyber-cyan shrink-0" />
          <input
            autoFocus
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Поиск по всему Vault: проекты, люди, заметки, треки радио, команды..."
            className="w-full bg-transparent text-sm font-mono text-white outline-none placeholder:text-slate-500"
          />
          {query && (
            <button
              onClick={() => setQuery("")}
              className="text-slate-500 hover:text-white cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          )}
          <span className="px-2 py-0.5 rounded bg-obsidian-card border border-obsidian-border text-[10px] font-mono text-slate-400">
            ESC
          </span>
        </div>

        <div className="max-h-[65vh] overflow-y-auto p-3 space-y-4">
          {/* 1. БЫСТРЫЕ КОМАНДЫ И ПЕРЕХОДЫ ПО РАЗДЕЛАМ */}
          <div>
            <p className="px-2 pb-1.5 text-[10px] font-mono uppercase text-slate-500">
              ⚡ Быстрые действия и навигация
            </p>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5">
              <button
                onClick={() => {
                  onOpenNewNote();
                  setOpen(false);
                }}
                className="p-2.5 rounded-xl bg-obsidian hover:bg-cyber-cyan/15 border border-obsidian-border hover:border-cyber-cyan/40 text-left flex items-center gap-2 text-xs font-mono text-cyber-cyan cursor-pointer transition-all"
              >
                <Plus className="w-3.5 h-3.5" /> + Новая заметка
              </button>
              <button
                onClick={() => {
                  onOpenNewProject();
                  setOpen(false);
                }}
                className="p-2.5 rounded-xl bg-obsidian hover:bg-cyber-purple/15 border border-obsidian-border hover:border-cyber-purple/40 text-left flex items-center gap-2 text-xs font-mono text-cyber-purple cursor-pointer transition-all"
              >
                <Plus className="w-3.5 h-3.5" /> + Новый проект
              </button>
              <button
                onClick={() => {
                  startRadioStream();
                  setOpen(false);
                }}
                className="p-2.5 rounded-xl bg-obsidian hover:bg-emerald-500/15 border border-obsidian-border hover:border-emerald-500/40 text-left flex items-center gap-2 text-xs font-mono text-emerald-400 cursor-pointer transition-all"
              >
                <Radio className="w-3.5 h-3.5" /> Включить Радио
              </button>
              <button
                onClick={() => {
                  onSwitchView("FINANCE");
                  setOpen(false);
                }}
                className="p-2 rounded-xl bg-obsidian hover:bg-obsidian-card border border-obsidian-border text-left flex items-center gap-2 text-xs font-mono text-slate-300 cursor-pointer"
              >
                <Wallet className="w-3.5 h-3.5 text-amber-400" /> Финансы
              </button>
              <button
                onClick={() => {
                  onSwitchView("PEOPLE");
                  setOpen(false);
                }}
                className="p-2 rounded-xl bg-obsidian hover:bg-obsidian-card border border-obsidian-border text-left flex items-center gap-2 text-xs font-mono text-slate-300 cursor-pointer"
              >
                <Users className="w-3.5 h-3.5 text-emerald-400" /> Люди (CRM)
              </button>
              <button
                onClick={() => {
                  onSwitchView("CRM");
                  setOpen(false);
                }}
                className="p-2 rounded-xl bg-obsidian hover:bg-obsidian-card border border-obsidian-border text-left flex items-center gap-2 text-xs font-mono text-slate-300 cursor-pointer"
              >
                <Inbox className="w-3.5 h-3.5 text-cyber-crimson" /> Заявки
              </button>
            </div>
          </div>

          {/* 2. ПРОЕКТЫ */}
          {matchedProjects.length > 0 && (
            <div>
              <p className="px-2 pb-1.5 text-[10px] font-mono uppercase text-slate-500">
                📁 Проекты ({matchedProjects.length})
              </p>
              <div className="space-y-1">
                {matchedProjects.slice(0, 5).map((p) => (
                  <button
                    key={p.id}
                    onClick={() => {
                      onSwitchView("KANBAN");
                      onSelectProject(p.id);
                      setOpen(false);
                    }}
                    className="w-full px-3 py-2 rounded-xl hover:bg-obsidian flex items-center justify-between text-left transition-colors cursor-pointer"
                  >
                    <span className="flex items-center gap-2 text-xs font-bold text-white">
                      <FolderGit2 className="w-3.5 h-3.5 text-cyber-purple" />
                      {p.title}
                    </span>
                    <span className="text-[10px] font-mono text-slate-500">{p.category}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* 3. ЛЮДИ И КОНТАКТЫ */}
          {matchedContacts.length > 0 && (
            <div>
              <p className="px-2 pb-1.5 text-[10px] font-mono uppercase text-slate-500">
                👥 Люди и Контакты ({matchedContacts.length})
              </p>
              <div className="space-y-1">
                {matchedContacts.slice(0, 5).map((c) => (
                  <button
                    key={c.id}
                    onClick={() => {
                      onSwitchView("PEOPLE");
                      setOpen(false);
                    }}
                    className="w-full px-3 py-2 rounded-xl hover:bg-obsidian flex items-center justify-between text-left transition-colors cursor-pointer"
                  >
                    <span className="flex items-center gap-2 text-xs font-bold text-slate-200">
                      <Users className="w-3.5 h-3.5 text-emerald-400" />
                      {c.name}
                      {c.role && <span className="text-cyber-cyan font-mono">({c.role})</span>}
                    </span>
                    {c.telegram && (
                      <span className="text-[11px] font-mono text-slate-400">{c.telegram}</span>
                    )}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* 4. МУЗЫКАЛЬНЫЕ ТРЕКИ (ЗАПУСК ПРЯМО ИЗ CTRL+K!) */}
          {matchedTracks.length > 0 && (
            <div>
              <p className="px-2 pb-1.5 text-[10px] font-mono uppercase text-slate-500">
                🎵 Треки в Радио — нажми для воспроизведения ({matchedTracks.length})
              </p>
              <div className="space-y-1">
                {matchedTracks.slice(0, 5).map((t) => (
                  <button
                    key={t.id}
                    onClick={() => {
                      playTrack(t);
                      setOpen(false);
                    }}
                    className="w-full px-3 py-2 rounded-xl hover:bg-obsidian flex items-center justify-between text-left transition-colors cursor-pointer"
                  >
                    <span className="flex items-center gap-2 text-xs font-bold text-cyber-cyan">
                      <Play className="w-3.5 h-3.5" />
                      {t.artist} — {t.title}
                    </span>
                    <span className="text-[10px] font-mono text-slate-500">{t.genre}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* 5. ЗАМЕТКИ */}
          {q && matchedNotes.length > 0 && (
            <div>
              <p className="px-2 pb-1.5 text-[10px] font-mono uppercase text-slate-500">
                📝 Заметки ({matchedNotes.length})
              </p>
              <div className="space-y-1">
                {matchedNotes.slice(0, 4).map((n) => (
                  <button
                    key={n.id}
                    onClick={() => {
                      onSwitchView("NOTES");
                      setOpen(false);
                    }}
                    className="w-full px-3 py-2 rounded-xl hover:bg-obsidian flex items-center justify-between text-left transition-colors cursor-pointer"
                  >
                    <span className="flex items-center gap-2 text-xs text-slate-200 truncate">
                      <StickyNote className="w-3.5 h-3.5 text-cyber-purple shrink-0" />
                      {n.title}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  ) : null;

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="px-3 py-2 rounded-xl bg-obsidian border border-obsidian-border hover:border-cyber-cyan/50 text-slate-300 hover:text-white font-mono text-xs flex items-center gap-2 transition-all cursor-pointer"
        title="Глобальный поиск и терминал команд (Ctrl + K)"
      >
        <Terminal className="w-3.5 h-3.5 text-cyber-cyan" />
        <span className="hidden md:inline">Команды</span>
        <kbd className="px-1.5 py-0.5 rounded bg-obsidian-card border border-obsidian-border text-[10px] text-cyber-cyan">
          Ctrl+K
        </kbd>
      </button>

      {mounted && modalContent ? createPortal(modalContent, document.body) : null}
    </>
  );
}