"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  Search,
  Terminal,
  FolderPlus,
  StickyNote,
  Inbox,
  ListTodo,
  ArrowRight,
  CornerDownLeft,
  Sparkles,
} from "lucide-react";

interface CommandPaletteProps {
  projects: { id: string; title: string; category: string }[];
  onSelectProject: (projectId: string) => void;
  onSwitchView: (view: "KANBAN" | "NOTES" | "CRM") => void;
  onOpenNewProject: () => void;
  onOpenNewNote: () => void;
}

export default function VaultCommandPalette({
  projects,
  onSelectProject,
  onSwitchView,
  onOpenNewProject,
  onOpenNewNote,
}: CommandPaletteProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState("");

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setIsOpen((prev) => !prev);
      }
      if (e.key === "Escape") {
        setIsOpen(false);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  const quickActions = [
    {
      id: "act-new-proj",
      label: "Создать новый проект / узел",
      shortcut: "Action",
      icon: FolderPlus,
      color: "text-cyber-purple",
      run: () => {
        onOpenNewProject();
        setIsOpen(false);
      },
    },
    {
      id: "act-new-note",
      label: "Записать зашифрованную заметку / сниппет",
      shortcut: "Action",
      icon: StickyNote,
      color: "text-cyber-cyan",
      run: () => {
        onOpenNewNote();
        setIsOpen(false);
      },
    },
    {
      id: "act-view-kanban",
      label: "Открыть Канбан-доску проектов",
      shortcut: "View",
      icon: ListTodo,
      color: "text-emerald-400",
      run: () => {
        onSwitchView("KANBAN");
        setIsOpen(false);
      },
    },
    {
      id: "act-view-crm",
      label: "Открыть Мини-CRM входящих заявок",
      shortcut: "CRM",
      icon: Inbox,
      color: "text-cyber-crimson",
      run: () => {
        onSwitchView("CRM");
        setIsOpen(false);
      },
    },
  ];

  const filteredActions = quickActions.filter((a) =>
    a.label.toLowerCase().includes(query.toLowerCase())
  );

  const filteredProjects = projects.filter((p) =>
    p.title.toLowerCase().includes(query.toLowerCase())
  );

  return (
    <>
      {/* Кнопка-триггер для шапки дашборда */}
      <button
        onClick={() => setIsOpen(true)}
        className="px-3 py-2 rounded-xl bg-obsidian border border-obsidian-border hover:border-cyber-cyan text-xs font-mono text-slate-400 hover:text-white flex items-center gap-2.5 transition-all cursor-pointer"
      >
        <Search className="w-3.5 h-3.5 text-cyber-cyan" />
        <span>Быстрый терминал...</span>
        <kbd className="px-1.5 py-0.5 text-[10px] rounded bg-obsidian-card border border-obsidian-border text-cyber-cyan">
          Ctrl+K
        </kbd>
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsOpen(false)}
            className="fixed inset-0 z-50 bg-obsidian/80 backdrop-blur-md flex items-start justify-center pt-24 p-4"
          >
            <motion.div
              initial={{ scale: 0.95, y: -15, opacity: 0 }}
              animate={{ scale: 1, y: 0, opacity: 1 }}
              exit={{ scale: 0.95, y: -15, opacity: 0 }}
              transition={{ duration: 0.15 }}
              onClick={(e) => e.stopPropagation()}
              className="max-w-xl w-full bg-obsidian-card border border-cyber-cyan/50 rounded-2xl shadow-[0_0_60px_rgba(0,240,255,0.2)] overflow-hidden"
            >
              {/* Поле поиска */}
              <div className="flex items-center gap-3 px-4 py-3.5 border-b border-obsidian-border bg-obsidian/60">
                <Terminal className="w-4 h-4 text-cyber-cyan shrink-0" />
                <input
                  autoFocus
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Введи команду или название проекта (Esc — закрыть)..."
                  className="w-full bg-transparent text-sm font-mono text-white outline-none placeholder:text-slate-500"
                />
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-obsidian border border-obsidian-border text-slate-400">
                  ESC
                </span>
              </div>

              <div className="max-h-96 overflow-y-auto p-3 space-y-4">
                {/* Секция 1: Быстрые команды */}
                {filteredActions.length > 0 && (
                  <div>
                    <div className="px-2 pb-1.5 text-[10px] font-mono text-slate-500 uppercase tracking-wider">
                      Системные действия
                    </div>
                    <div className="space-y-1">
                      {filteredActions.map((act) => {
                        const Icon = act.icon;
                        return (
                          <button
                            key={act.id}
                            onClick={act.run}
                            className="w-full px-3 py-2.5 rounded-xl hover:bg-obsidian flex items-center justify-between text-left group transition-colors cursor-pointer"
                          >
                            <div className="flex items-center gap-3">
                              <Icon className={`w-4 h-4 ${act.color}`} />
                              <span className="text-xs font-mono text-slate-200 group-hover:text-white">
                                {act.label}
                              </span>
                            </div>
                            <span className="text-[10px] font-mono text-slate-500 group-hover:text-cyber-cyan flex items-center gap-1">
                              {act.shortcut} <CornerDownLeft className="w-3 h-3" />
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Секция 2: Мгновенный переход к Канбану узла */}
                {filteredProjects.length > 0 && (
                  <div>
                    <div className="px-2 pb-1.5 text-[10px] font-mono text-slate-500 uppercase tracking-wider">
                      Быстрый фокус на проекте (Project Dock)
                    </div>
                    <div className="space-y-1">
                      {filteredProjects.map((proj) => (
                        <button
                          key={proj.id}
                          onClick={() => {
                            onSwitchView("KANBAN");
                            onSelectProject(proj.id);
                            setIsOpen(false);
                          }}
                          className="w-full px-3 py-2.5 rounded-xl hover:bg-obsidian flex items-center justify-between text-left group transition-colors cursor-pointer"
                        >
                          <div className="flex items-center gap-2.5">
                            <Sparkles className="w-3.5 h-3.5 text-cyber-purple" />
                            <span className="text-xs font-mono text-slate-200 group-hover:text-cyber-cyan font-bold">
                              {proj.title}
                            </span>
                          </div>
                          <span className="text-[10px] font-mono text-slate-500 flex items-center gap-1">
                            Открыть Канбан <ArrowRight className="w-3 h-3" />
                          </span>
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}