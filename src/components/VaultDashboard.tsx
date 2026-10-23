"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import SpotlightCard from "@/components/SpotlightCard";
import {
  createNote,
  createProject,
  deleteNote,
  createStage,
  toggleStageStatus,
  deleteStage,
  toggleProjectVisibility,
  deleteProject,
} from "@/app/actions";
import {
  Plus,
  Trash2,
  FolderPlus,
  StickyNote,
  Layers,
  Eye,
  EyeOff,
  CheckCircle2,
  Circle,
  ListTodo,
  Filter,
} from "lucide-react";

interface StageItem {
  id: string;
  title: string;
  status: string;
}

interface ProjectItem {
  id: string;
  title: string;
  tagline: string;
  category: string;
  isPublic: boolean;
  techStack: string;
  accentColor: string;
  stages: StageItem[];
}

interface NoteItem {
  id: string;
  title: string;
  content: string;
  category: string;
  createdAt: Date;
  project: { id: string; title: string } | null;
}

export default function VaultDashboard({
  projects,
  notes,
}: {
  projects: ProjectItem[];
  notes: NoteItem[];
}) {
  const [activeCategory, setActiveCategory] = useState<string>("ALL");
  const [selectedProjectId, setSelectedProjectId] = useState<string>("ALL");

  const categories = [
    { id: "ALL", label: "⚡ Все сферы" },
    { id: "DEV", label: "💻 Разработка" },
    { id: "BUSINESS", label: "💼 Бизнес" },
    { id: "WORK", label: "🛠️ Работа" },
    { id: "FAMILY", label: "🏠 Семья и Личное" },
  ];

  const categoryLabels: Record<string, { label: string; color: string }> = {
    DEV: { label: "💻 Разработка", color: "text-cyber-cyan border-cyber-cyan/40 bg-cyber-cyan/10" },
    BUSINESS: { label: "💼 Бизнес", color: "text-cyber-crimson border-cyber-crimson/40 bg-cyber-crimson/10" },
    WORK: { label: "🛠️ Работа", color: "text-cyber-purple border-cyber-purple/40 bg-cyber-purple/10" },
    FAMILY: { label: "🏠 Семья и Личное", color: "text-emerald-400 border-emerald-400/40 bg-emerald-400/10" },
  };

  // Фильтрация проектов по выбранной сфере жизни
  const filteredProjects =
    activeCategory === "ALL"
      ? projects
      : projects.filter((p) => p.category === activeCategory);

  // Фильтрация заметок по сфере жизни И по выбранному проекту
  const filteredNotes = notes.filter((n) => {
    const matchCategory = activeCategory === "ALL" || n.category === activeCategory;
    const matchProject = selectedProjectId === "ALL" || n.project?.id === selectedProjectId;
    return matchCategory && matchProject;
  });

  return (
    <div>
      {/* 1. ПЕРЕКЛЮЧАТЕЛЬ СФЕР ЖИЗНИ (ТАБЫ) */}
      <div className="flex flex-wrap items-center justify-between gap-4 mb-8 bg-obsidian-card/90 p-3 rounded-2xl border border-obsidian-border">
        <div className="flex flex-wrap items-center gap-2">
          {categories.map((cat) => {
            const isActive = activeCategory === cat.id;
            return (
              <button
                key={cat.id}
                onClick={() => {
                  setActiveCategory(cat.id);
                  setSelectedProjectId("ALL");
                }}
                className={`relative px-4 py-2 rounded-xl font-mono text-xs font-bold transition-colors duration-200 cursor-pointer outline-none focus:outline-none border border-transparent ${
                  isActive ? "text-white" : "text-slate-400 hover:text-slate-200 bg-obsidian/60 border-obsidian-border"
                }`}
              >
                {/* Плавная перетекающая неоновая капсула */}
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

        {/* Быстрый фильтр заметок по конкретному узлу */}
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-cyber-cyan" />
          <select
            value={selectedProjectId}
            onChange={(e) => setSelectedProjectId(e.target.value)}
            className="px-3 py-1.5 rounded-xl bg-obsidian border border-obsidian-border text-xs font-mono text-slate-300 outline-none focus:border-cyber-cyan"
          >
            <option value="ALL">Все узлы ({projects.length})</option>
            {filteredProjects.map((p) => (
              <option key={p.id} value={p.id}>
                Фильтр: {p.title}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* 2. ПРОЕКТЫ / ЖИЗНЕННЫЕ УЗЛЫ С ИНТЕРАКТИВНЫМИ ЭТАПАМИ (ROADMAP) */}
      <div className="mb-12">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold flex items-center gap-2">
            <ListTodo className="w-5 h-5 text-cyber-purple" /> Проекты и Роадмапы этапов ({filteredProjects.length})
          </h2>
          <span className="text-xs font-mono text-slate-500">
            Кликай по этапам для выполнения
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <AnimatePresence mode="popLayout">
            {filteredProjects.map((p) => {
              const cat = categoryLabels[p.category] || categoryLabels.DEV;
              const totalStages = p.stages.length;
              const doneStages = p.stages.filter((s) => s.status === "DONE").length;
              const progress = totalStages === 0 ? 0 : Math.round((doneStages / totalStages) * 100);

              return (
                <motion.div
                  key={p.id}
                  layout
                  initial={{ opacity: 0, scale: 0.96 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.96 }}
                  transition={{ duration: 0.2 }}
                  className="p-6 rounded-2xl bg-obsidian-card border border-obsidian-border flex flex-col justify-between"
                >
                  <div>
                    {/* Шапка карточки проекта */}
                    <div className="flex items-center justify-between gap-2 mb-3">
                      <span className={`px-2.5 py-0.5 rounded border text-[11px] font-mono ${cat.color}`}>
                        {cat.label}
                      </span>

                      <div className="flex items-center gap-2">
                        {/* Кнопка переключения Публичный / Приватный */}
                        <form action={toggleProjectVisibility.bind(null, p.id, p.isPublic)}>
                          <button
                            title="Изменить видимость на главной странице"
                            className="px-2.5 py-1 rounded bg-obsidian border border-obsidian-border hover:border-cyber-cyan text-[11px] font-mono flex items-center gap-1 text-slate-300 cursor-pointer transition-colors"
                          >
                            {p.isPublic ? (
                              <>
                                <Eye className="w-3.5 h-3.5 text-cyber-cyan" /> Виден всем
                              </>
                            ) : (
                              <>
                                <EyeOff className="w-3.5 h-3.5 text-cyber-crimson" /> Приватный
                              </>
                            )}
                          </button>
                        </form>

                        {/* Удаление проекта */}
                        <form action={deleteProject.bind(null, p.id)}>
                          <button
                            title="Удалить узел"
                            className="p-1 text-slate-500 hover:text-cyber-crimson transition-colors cursor-pointer"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </form>
                      </div>
                    </div>

                    <h3 className="font-bold text-xl text-white mb-1">{p.title}</h3>
                    <p className="text-xs text-slate-400 mb-5">{p.tagline}</p>

                    {/* ПРОГРЕСС-БАР ЭТАПОВ */}
                    <div className="mb-4">
                      <div className="flex items-center justify-between text-xs font-mono mb-1.5">
                        <span className="text-slate-400">
                          Этапы: {doneStages} из {totalStages}
                        </span>
                        <span className="text-cyber-cyan font-bold">{progress}%</span>
                      </div>
                      <div className="w-full h-2 rounded-full bg-obsidian overflow-hidden border border-obsidian-border">
                        <div
                          className="h-full bg-gradient-to-r from-cyber-purple to-cyber-cyan transition-all duration-500"
                          style={{ width: `${progress}%` }}
                        />
                      </div>
                    </div>

                    {/* СПИСОК ЭТАПОВ (ЧЕК-ЛИСТ) */}
                    <div className="space-y-2 mb-4 max-h-48 overflow-y-auto pr-1">
                      {p.stages.length === 0 ? (
                        <div className="text-xs font-mono text-slate-500 py-2">
                          Нет активных этапов. Добавь первый шаг ниже ↓
                        </div>
                      ) : (
                        p.stages.map((stage) => {
                          const isDone = stage.status === "DONE";
                          return (
                            <div
                              key={stage.id}
                              className="flex items-center justify-between gap-2 p-2.5 rounded-xl bg-obsidian border border-obsidian-border group"
                            >
                              <form
                                action={toggleStageStatus.bind(null, stage.id, stage.status)}
                                className="flex-1"
                              >
                                <button
                                  type="submit"
                                  className="flex items-center gap-2.5 text-left w-full cursor-pointer"
                                >
                                  {isDone ? (
                                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                                  ) : (
                                    <Circle className="w-4 h-4 text-cyber-cyan shrink-0" />
                                  )}
                                  <span
                                    className={`text-xs font-mono transition-all ${
                                      isDone ? "line-through text-slate-500" : "text-slate-200"
                                    }`}
                                  >
                                    {stage.title}
                                  </span>
                                </button>
                              </form>

                              <form action={deleteStage.bind(null, stage.id)}>
                                <button className="opacity-0 group-hover:opacity-100 text-slate-500 hover:text-cyber-crimson transition-opacity p-1 cursor-pointer">
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </form>
                            </div>
                          );
                        })
                      )}
                    </div>
                  </div>

                  {/* Мини-форма быстрого добавления нового этапа */}
                  <form action={createStage} className="flex items-center gap-2 pt-3 border-t border-obsidian-border/80">
                    <input type="hidden" name="projectId" value={p.id} />
                    <input
                      name="title"
                      placeholder="+ Новый этап или задача..."
                      required
                      className="flex-1 px-3 py-2 rounded-xl bg-obsidian border border-obsidian-border focus:border-cyber-cyan outline-none text-xs font-mono text-slate-200"
                    />
                    <button
                      type="submit"
                      className="px-3 py-2 rounded-xl bg-cyber-cyan/15 hover:bg-cyber-cyan/25 border border-cyber-cyan/40 text-cyber-cyan text-xs font-mono font-bold cursor-pointer transition-all"
                    >
                      Добавить
                    </button>
                  </form>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      </div>

      {/* 3. СПИСОК ЗАМЕТОК И РАЗМЫШЛЕНИЙ (С УЧЕТОМ ФИЛЬТРА) */}
      <div className="mb-12">
        <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
          <Layers className="w-5 h-5 text-cyber-crimson" /> Заметки выбранной сферы ({filteredNotes.length})
        </h2>

        {filteredNotes.length === 0 ? (
          <div className="p-6 rounded-2xl bg-obsidian-card border border-obsidian-border text-center text-slate-500 font-mono text-xs">
            В этой категории пока нет заметок.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {filteredNotes.map((note) => {
              const cat = categoryLabels[note.category] || categoryLabels.DEV;
              return (
                <div
                  key={note.id}
                  className="p-5 rounded-xl bg-obsidian-card border border-obsidian-border flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-center justify-between gap-2 mb-3">
                      <span className={`px-2 py-0.5 rounded border text-[10px] font-mono ${cat.color}`}>
                        {cat.label}
                      </span>
                      <form action={deleteNote.bind(null, note.id)}>
                        <button className="text-slate-500 hover:text-cyber-crimson transition-colors cursor-pointer">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </form>
                    </div>
                    {note.project && (
                      <div className="text-[11px] font-mono text-cyber-cyan mb-1">
                        // Узел: {note.project.title}
                      </div>
                    )}
                    <h3 className="font-bold text-base mb-2 text-white">{note.title}</h3>
                    <p className="text-sm text-slate-400 whitespace-pre-wrap">{note.content}</p>
                  </div>
                  <div className="mt-4 pt-3 border-t border-obsidian-border/60 text-[11px] font-mono text-slate-500">
                    {new Date(note.createdAt).toLocaleDateString("ru-RU")}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* 4. ФОРМЫ СОЗДАНИЯ НОВОЙ ЗАМЕТКИ И НОВОГО ПРОЕКТА */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <SpotlightCard spotlightColor="cyan" className="p-6">
          <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
            <StickyNote className="w-5 h-5 text-cyber-cyan" /> Записать мысль / заметку
          </h2>
          <form action={createNote} className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <input
                name="title"
                placeholder="Заголовок..."
                required
                className="w-full px-4 py-2.5 rounded-xl bg-obsidian border border-obsidian-border focus:border-cyber-cyan outline-none text-sm"
              />
              <select
                name="category"
                defaultValue={activeCategory === "ALL" ? "DEV" : activeCategory}
                className="w-full px-4 py-2.5 rounded-xl bg-obsidian border border-obsidian-border focus:border-cyber-cyan outline-none text-sm text-slate-200"
              >
                <option value="DEV">💻 Разработка</option>
                <option value="BUSINESS">💼 Бизнес</option>
                <option value="WORK">🛠️ Работа</option>
                <option value="FAMILY">🏠 Семья / Личное</option>
              </select>
            </div>

            <select
              name="projectId"
              className="w-full px-4 py-2.5 rounded-xl bg-obsidian border border-obsidian-border focus:border-cyber-cyan outline-none text-sm text-slate-300"
            >
              <option value="">Без привязки к конкретному узлу</option>
              {projects.map((p) => (
                <option key={p.id} value={p.id}>
                  Узел: {p.title} ({p.category})
                </option>
              ))}
            </select>

            <textarea
              name="content"
              placeholder="Твои мысли, архитектура, списки..."
              rows={3}
              required
              className="w-full px-4 py-2.5 rounded-xl bg-obsidian border border-obsidian-border focus:border-cyber-cyan outline-none text-sm"
            />
            <button
              type="submit"
              className="w-full py-2.5 rounded-xl bg-cyber-cyan/20 hover:bg-cyber-cyan/30 border border-cyber-cyan/50 text-cyber-cyan font-mono text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              <Plus className="w-4 h-4" /> СОХРАНИТЬ ЗАМЕТКУ
            </button>
          </form>
        </SpotlightCard>

        <SpotlightCard spotlightColor="purple" className="p-6">
          <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
            <FolderPlus className="w-5 h-5 text-cyber-purple" /> Создать новый проект / узел
          </h2>
          <form action={createProject} className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <input
                name="title"
                placeholder="Название проекта или сферы..."
                required
                className="w-full px-4 py-2.5 rounded-xl bg-obsidian border border-obsidian-border focus:border-cyber-purple outline-none text-sm"
              />
              <select
                name="category"
                defaultValue={activeCategory === "ALL" ? "DEV" : activeCategory}
                className="w-full px-4 py-2.5 rounded-xl bg-obsidian border border-obsidian-border focus:border-cyber-purple outline-none text-sm text-slate-200"
              >
                <option value="DEV">💻 Разработка</option>
                <option value="BUSINESS">💼 Бизнес</option>
                <option value="WORK">🛠️ Работа</option>
                <option value="FAMILY">🏠 Семья / Личное</option>
              </select>
            </div>

            <input
              name="tagline"
              placeholder="Краткое описание цели или сути проекта..."
              required
              className="w-full px-4 py-2.5 rounded-xl bg-obsidian border border-obsidian-border focus:border-cyber-purple outline-none text-sm"
            />

            <div className="grid grid-cols-2 gap-3">
              <input
                name="techStack"
                placeholder="Теги (Next.js, Finance...)"
                className="w-full px-4 py-2.5 rounded-xl bg-obsidian border border-obsidian-border focus:border-cyber-purple outline-none text-sm"
              />
              <select
                name="accentColor"
                className="w-full px-4 py-2.5 rounded-xl bg-obsidian border border-obsidian-border focus:border-cyber-purple outline-none text-sm text-slate-200"
              >
                <option value="purple">Фиолетовый неон</option>
                <option value="cyan">Бирюзовый кибер</option>
                <option value="crimson">Алый акцент</option>
              </select>
            </div>

            <label className="flex items-center gap-2.5 text-xs font-mono text-slate-300 cursor-pointer select-none pt-1">
              <input
                type="checkbox"
                name="isPublic"
                className="w-4 h-4 accent-cyber-purple rounded"
              />
              Показывать этот проект на публичной витрине
            </label>

            <button
              type="submit"
              className="w-full py-2.5 rounded-xl bg-cyber-purple hover:bg-cyber-purple/90 text-white font-mono text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              <Plus className="w-4 h-4" /> СОЗДАТЬ УЗЕЛ
            </button>
          </form>
        </SpotlightCard>
      </div>
    </div>
  );
}