"use client";

import React, { useState, useEffect } from "react";
import { motion } from "motion/react";
import VaultCommandPalette from "@/components/VaultCommandPalette";
import { ProjectItem, NoteItem, LeadItem, CATEGORIES } from "./vault/types";
import VaultKanbanTab from "./vault/VaultKanbanTab";
import VaultNotesTab from "./vault/VaultNotesTab";
import VaultCrmTab from "./vault/VaultCrmTab";
import VaultModals from "./vault/VaultModals";
import { Plus, FolderPlus, StickyNote, ListTodo, Inbox, ShieldAlert } from "lucide-react";

export default function VaultDashboard({
  projects,
  notes,
  leads = [],
}: {
  projects: ProjectItem[];
  notes: NoteItem[];
  leads?: LeadItem[];
}) {
  const [localProjects, setLocalProjects] = useState<ProjectItem[]>(projects);
  useEffect(() => {
    setLocalProjects(projects);
  }, [projects]);

  const [activeCategory, setActiveCategory] = useState<string>("ALL");
  const [activeView, setActiveView] = useState<"KANBAN" | "NOTES" | "CRM">("KANBAN");
  const [focusedProjectId, setFocusedProjectId] = useState<string>(projects[0]?.id || "ALL");
  const [noteFilterProjectId, setNoteFilterProjectId] = useState<string>("ALL");

  const [isNoteModalOpen, setIsNoteModalOpen] = useState(false);
  const [isProjectModalOpen, setIsProjectModalOpen] = useState(false);

  const filteredProjects =
    activeCategory === "ALL"
      ? localProjects
      : localProjects.filter((p) => p.category === activeCategory);

  const filteredNotes = notes.filter((n) => {
    const matchCategory = activeCategory === "ALL" || n.category === activeCategory;
    const matchProject = noteFilterProjectId === "ALL" || n.project?.id === noteFilterProjectId;
    return matchCategory && matchProject;
  });

  const newLeadsCount = leads.filter((l) => l.status === "NEW").length;

  const handleOptimisticStatusChange = (projectId: string, stageId: string, newStatus: string) => {
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

  return (
    <div className="space-y-6">
      {/* ВЕРХНЯЯ ПАНЕЛЬ УПРАВЛЕНИЯ */}
      <div className="flex flex-wrap items-center justify-between gap-4 bg-obsidian-card/90 p-3.5 rounded-2xl border border-obsidian-border backdrop-blur-md">
        {/* УМНЫЙ ЛЕВЫЙ БЛОК: Табы сфер жизни показываются ТОЛЬКО для Канбана и Заметок */}
        {activeView !== "CRM" ? (
          <div className="flex flex-wrap items-center gap-1.5">
            {CATEGORIES.map((cat) => {
              const isActive = activeCategory === cat.id;
              return (
                <button
                  key={cat.id}
                  onClick={() => setActiveCategory(cat.id)}
                  className={`relative px-3.5 py-2 rounded-xl font-mono text-xs font-bold transition-colors duration-200 cursor-pointer outline-none ${
                    isActive
                      ? "text-white"
                      : "text-slate-400 hover:text-slate-200 bg-obsidian/60 border border-obsidian-border"
                  }`}
                >
                  {isActive && (
                    <motion.div
                      layoutId="activeVaultTab"
                      transition={{ type: "spring", stiffness: 380, damping: 30 }}
                      className="absolute inset-0 rounded-xl bg-cyber-purple shadow-[0_0_20px_rgba(139,92,246,0.4)]"
                    />
                  )}
                  <span className="relative z-10">{cat.label}</span>
                </button>
              );
            })}
          </div>
        ) : (
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-cyber-crimson/10 border border-cyber-crimson/30 text-cyber-crimson font-mono text-xs">
            <ShieldAlert className="w-4 h-4" />
            <span>PIPELINE // Входящие заявки с публичной витрины</span>
          </div>
        )}

        {/* ПРАВЫЙ БЛОК: Ctrl+K + Вкладки + Кнопки модалок */}
        <div className="flex flex-wrap items-center gap-2.5">
          <VaultCommandPalette
            projects={localProjects}
            onSelectProject={(id) => setFocusedProjectId(id)}
            onSwitchView={(v) => setActiveView(v)}
            onOpenNewProject={() => setIsProjectModalOpen(true)}
            onOpenNewNote={() => setIsNoteModalOpen(true)}
          />

          <div className="flex items-center bg-obsidian p-1 rounded-xl border border-obsidian-border">
            <button
              onClick={() => setActiveView("KANBAN")}
              className={`px-3 py-1.5 rounded-lg font-mono text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                activeView === "KANBAN"
                  ? "bg-cyber-cyan/20 text-cyber-cyan border border-cyber-cyan/40"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              <ListTodo className="w-3.5 h-3.5" /> Канбан
            </button>
            <button
              onClick={() => setActiveView("NOTES")}
              className={`px-3 py-1.5 rounded-lg font-mono text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                activeView === "NOTES"
                  ? "bg-cyber-purple/20 text-cyber-purple border border-cyber-purple/40"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              <StickyNote className="w-3.5 h-3.5" /> Заметки ({filteredNotes.length})
            </button>
            <button
              onClick={() => setActiveView("CRM")}
              className={`px-3 py-1.5 rounded-lg font-mono text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                activeView === "CRM"
                  ? "bg-cyber-crimson/20 text-cyber-crimson border border-cyber-crimson/40"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              <Inbox className="w-3.5 h-3.5" /> CRM ({leads.length})
              {newLeadsCount > 0 && (
                <span className="px-1.5 py-0.2 rounded-full bg-cyber-crimson text-white text-[10px] animate-pulse">
                  +{newLeadsCount}
                </span>
              )}
            </button>
          </div>

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
        </div>
      </div>

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