"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { ProjectItem, CATEGORY_LABELS } from "./types";
import {
  createStage,
  updateStageStatus,
  deleteStage,
  toggleProjectVisibility,
  deleteProject,
} from "@/app/actions";
import {
  Circle,
  Clock,
  CheckCircle2,
  ExternalLink,
  Eye,
  EyeOff,
  Trash2,
  GripVertical,
  LayoutGrid,
} from "lucide-react";

const KANBAN_COLUMNS = [
  {
    id: "TODO",
    title: "В планах",
    icon: Circle,
    color: "text-slate-400",
    border: "border-obsidian-border",
    activeGlow: "border-slate-400/60 bg-slate-500/5",
    badge: "bg-obsidian text-slate-400 border-obsidian-border",
  },
  {
    id: "IN_PROGRESS",
    title: "В работе",
    icon: Clock,
    color: "text-cyber-cyan",
    border: "border-cyber-cyan/30",
    activeGlow: "border-cyber-cyan bg-cyber-cyan/10 shadow-[0_0_25px_rgba(0,240,255,0.15)]",
    badge: "bg-cyber-cyan/15 text-cyber-cyan border-cyber-cyan/40",
  },
  {
    id: "DONE",
    title: "Готово",
    icon: CheckCircle2,
    color: "text-emerald-400",
    border: "border-emerald-500/30",
    activeGlow: "border-emerald-400 bg-emerald-500/10 shadow-[0_0_25px_rgba(52,211,153,0.15)]",
    badge: "bg-emerald-500/15 text-emerald-400 border-emerald-500/40",
  },
];

interface VaultKanbanTabProps {
  projects: ProjectItem[];
  focusedProjectId: string;
  setFocusedProjectId: (id: string) => void;
  onOptimisticStatusChange: (projectId: string, stageId: string, newStatus: string) => void;
}

export default function VaultKanbanTab({
  projects,
  focusedProjectId,
  setFocusedProjectId,
  onOptimisticStatusChange,
}: VaultKanbanTabProps) {
  const [draggedStage, setDraggedStage] = useState<{ stageId: string; projectId: string } | null>(null);
  const [dragOverCol, setDragOverCol] = useState<string | null>(null);

  const displayedProjects =
    focusedProjectId === "ALL"
      ? projects
      : projects.filter((p) => p.id === focusedProjectId);

  const activeList =
    displayedProjects.length > 0 ? displayedProjects : projects.slice(0, 1);

  const handleDropStage = async (projectId: string, targetStatus: string) => {
    if (!draggedStage || draggedStage.projectId !== projectId) {
      setDraggedStage(null);
      setDragOverCol(null);
      return;
    }
    const { stageId } = draggedStage;
    setDraggedStage(null);
    setDragOverCol(null);

    onOptimisticStatusChange(projectId, stageId, targetStatus);
    await updateStageStatus(stageId, targetStatus);
  };

  return (
    <div className="space-y-6">
      {/* КОМПАКТНЫЙ PROJECT DOCK */}
      <div className="flex items-center gap-2.5 overflow-x-auto pb-2 scrollbar-thin">
        {projects.map((p) => {
          const total = p.stages.length;
          const done = p.stages.filter((s) => s.status === "DONE").length;
          const pct = total === 0 ? 0 : Math.round((done / total) * 100);
          const isSelected =
            focusedProjectId === p.id ||
            (focusedProjectId !== "ALL" && activeList[0]?.id === p.id);

          return (
            <button
              key={p.id}
              onClick={() => setFocusedProjectId(p.id)}
              className={`shrink-0 px-4 py-3 rounded-2xl border text-left transition-all cursor-pointer flex items-center gap-3.5 ${
                isSelected
                  ? "bg-obsidian-card border-cyber-cyan shadow-[0_0_20px_rgba(0,240,255,0.18)]"
                  : "bg-obsidian-card/50 border-obsidian-border hover:border-slate-700 opacity-75 hover:opacity-100"
              }`}
            >
              <div>
                <div className="font-bold text-sm text-white flex items-center gap-2">
                  <span
                    className={`w-2 h-2 rounded-full ${
                      pct === 100 ? "bg-emerald-400" : "bg-cyber-cyan animate-pulse"
                    }`}
                  />
                  {p.title}
                </div>
                <div className="text-[10px] font-mono text-slate-400 mt-0.5">
                  Этапов: {done}/{total} ({pct}%)
                </div>
              </div>
            </button>
          );
        })}

        {projects.length > 1 && (
          <button
            onClick={() =>
              setFocusedProjectId(focusedProjectId === "ALL" ? projects[0]?.id : "ALL")
            }
            className={`shrink-0 px-3.5 py-3 rounded-2xl border font-mono text-xs flex items-center gap-2 cursor-pointer transition-all ${
              focusedProjectId === "ALL"
                ? "bg-cyber-purple/20 border-cyber-purple text-cyber-purple font-bold"
                : "bg-obsidian border-obsidian-border text-slate-400 hover:text-white"
            }`}
          >
            <LayoutGrid className="w-4 h-4" />
            {focusedProjectId === "ALL" ? "Свернуть в 1 фокус" : `Показать все (${projects.length})`}
          </button>
        )}
      </div>

      {/* КАРТОЧКИ И КАНБАН-ДОСКА */}
      <AnimatePresence mode="popLayout">
        {activeList.map((p) => {
          const cat = CATEGORY_LABELS[p.category] || CATEGORY_LABELS.DEV;
          const totalStages = p.stages.length;
          const doneStages = p.stages.filter((s) => s.status === "DONE").length;
          const inProgressStages = p.stages.filter((s) => s.status === "IN_PROGRESS").length;
          const progress =
            totalStages === 0
              ? 0
              : Math.round(((doneStages + inProgressStages * 0.5) / totalStages) * 100);

          return (
            <motion.div
              key={p.id}
              layout
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.97 }}
              className="p-6 rounded-3xl bg-obsidian-card border border-obsidian-border shadow-xl"
            >
              <div className="flex flex-wrap items-center justify-between gap-4 pb-5 mb-6 border-b border-obsidian-border">
                <div className="space-y-1">
                  <div className="flex items-center gap-2.5 flex-wrap">
                    <span className={`px-2.5 py-0.5 rounded-lg border text-[11px] font-mono ${cat.color}`}>
                      {cat.label}
                    </span>
                    <h3 className="font-extrabold text-xl text-white">{p.title}</h3>
                    {p.liveUrl && (
                      <a
                        href={p.liveUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="text-slate-400 hover:text-cyber-cyan transition-colors"
                      >
                        <ExternalLink className="w-4 h-4" />
                      </a>
                    )}
                  </div>
                  <p className="text-xs text-slate-400 max-w-2xl">{p.tagline}</p>
                </div>

                <div className="flex items-center gap-4">
                  <div className="w-44 bg-obsidian p-2.5 rounded-xl border border-obsidian-border">
                    <div className="flex items-center justify-between text-[11px] font-mono mb-1">
                      <span className="text-slate-400">Готовность</span>
                      <span className="text-cyber-cyan font-bold">{progress}%</span>
                    </div>
                    <div className="w-full h-1.5 rounded-full bg-obsidian-card overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${progress}%` }}
                        className="h-full bg-gradient-to-r from-cyber-purple via-cyber-cyan to-emerald-400"
                      />
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5">
                    <form action={toggleProjectVisibility.bind(null, p.id, p.isPublic)}>
                      <button
                        title="Переключить видимость на главной"
                        className="px-2.5 py-2 rounded-xl bg-obsidian border border-obsidian-border hover:border-cyber-cyan text-xs font-mono flex items-center gap-1.5 text-slate-300 cursor-pointer"
                      >
                        {p.isPublic ? (
                          <>
                            <Eye className="w-3.5 h-3.5 text-cyber-cyan" /> Public
                          </>
                        ) : (
                          <>
                            <EyeOff className="w-3.5 h-3.5 text-cyber-crimson" /> Private
                          </>
                        )}
                      </button>
                    </form>

                    <form action={deleteProject.bind(null, p.id)}>
                      <button
                        title="Удалить узел"
                        className="p-2 rounded-xl bg-obsidian border border-obsidian-border hover:border-cyber-crimson text-slate-500 hover:text-cyber-crimson cursor-pointer"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </form>
                  </div>
                </div>
              </div>

              {/* 3 КОЛОНКИ КАНБАНА */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-5">
                {KANBAN_COLUMNS.map((col) => {
                  const ColIcon = col.icon;
                  const columnStages = p.stages.filter((s) => s.status === col.id);
                  const isDragTarget =
                    draggedStage?.projectId === p.id && dragOverCol === `${p.id}-${col.id}`;

                  return (
                    <div
                      key={col.id}
                      onDragOver={(e) => {
                        e.preventDefault();
                        if (draggedStage?.projectId === p.id) {
                          setDragOverCol(`${p.id}-${col.id}`);
                        }
                      }}
                      onDragLeave={() => setDragOverCol(null)}
                      onDrop={() => handleDropStage(p.id, col.id)}
                      className={`p-3.5 rounded-2xl bg-obsidian/70 border transition-all duration-200 min-h-[180px] flex flex-col justify-between ${
                        isDragTarget ? col.activeGlow : col.border
                      }`}
                    >
                      <div>
                        <div className="flex items-center justify-between mb-3 pb-2 border-b border-obsidian-border/60">
                          <div className="flex items-center gap-2">
                            <ColIcon className={`w-4 h-4 ${col.color}`} />
                            <span className="font-mono text-xs font-bold text-slate-200">
                              {col.title}
                            </span>
                          </div>
                          <span className={`px-2 py-0.5 rounded-md text-[10px] font-mono border ${col.badge}`}>
                            {columnStages.length}
                          </span>
                        </div>

                        <div className="space-y-2">
                          <AnimatePresence mode="popLayout">
                            {columnStages.length === 0 ? (
                              <div className="py-8 text-center text-[11px] font-mono text-slate-600 border border-dashed border-obsidian-border/50 rounded-xl">
                                Перетащи задачу сюда
                              </div>
                            ) : (
                              columnStages.map((stage) => (
                                <motion.div
                                  key={stage.id}
                                  layout
                                  initial={{ opacity: 0, scale: 0.95 }}
                                  animate={{ opacity: 1, scale: 1 }}
                                  exit={{ opacity: 0, scale: 0.95 }}
                                  draggable
                                  onDragStart={() =>
                                    setDraggedStage({ stageId: stage.id, projectId: p.id })
                                  }
                                  onDragEnd={() => {
                                    setDraggedStage(null);
                                    setDragOverCol(null);
                                  }}
                                  className={`p-3 rounded-xl bg-obsidian-card border border-obsidian-border hover:border-cyber-purple/50 cursor-grab active:cursor-grabbing flex items-center justify-between gap-2 group/card shadow-sm transition-all ${
                                    draggedStage?.stageId === stage.id ? "opacity-40 scale-95" : ""
                                  }`}
                                >
                                  <div className="flex items-center gap-2 min-w-0">
                                    <GripVertical className="w-3.5 h-3.5 text-slate-600 group-hover/card:text-cyber-purple shrink-0" />
                                    <span
                                      className={`text-xs font-mono break-words ${
                                        stage.status === "DONE"
                                          ? "line-through text-slate-500"
                                          : "text-slate-200"
                                      }`}
                                    >
                                      {stage.title}
                                    </span>
                                  </div>

                                  <div className="flex items-center gap-1 shrink-0 opacity-0 group-hover/card:opacity-100 transition-opacity">
                                    {col.id !== "DONE" && (
                                      <button
                                        type="button"
                                        title="Дальше"
                                        onClick={async () => {
                                          const next = col.id === "TODO" ? "IN_PROGRESS" : "DONE";
                                          onOptimisticStatusChange(p.id, stage.id, next);
                                          await updateStageStatus(stage.id, next);
                                        }}
                                        className="p-1 rounded bg-obsidian hover:text-cyber-cyan text-slate-400 cursor-pointer"
                                      >
                                        →
                                      </button>
                                    )}
                                    <form action={deleteStage.bind(null, stage.id)}>
                                      <button
                                        type="submit"
                                        className="p-1 text-slate-500 hover:text-cyber-crimson cursor-pointer"
                                      >
                                        <Trash2 className="w-3.5 h-3.5" />
                                      </button>
                                    </form>
                                  </div>
                                </motion.div>
                              ))
                            )}
                          </AnimatePresence>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              <form action={createStage} className="flex items-center gap-2">
                <input type="hidden" name="projectId" value={p.id} />
                <input
                  name="title"
                  placeholder="+ Новая стадия / задача в «В планах» (Enter)..."
                  required
                  className="flex-1 px-4 py-2.5 rounded-xl bg-obsidian border border-obsidian-border focus:border-cyber-cyan outline-none text-xs font-mono text-slate-200"
                />
                <button
                  type="submit"
                  className="px-4 py-2.5 rounded-xl bg-cyber-cyan/15 hover:bg-cyber-cyan/25 border border-cyber-cyan/40 text-cyber-cyan text-xs font-mono font-bold cursor-pointer"
                >
                  Добавить шаг
                </button>
              </form>
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
}