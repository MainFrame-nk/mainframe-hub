"use client";

import React from "react";
import { motion, AnimatePresence } from "motion/react";
import { ProjectItem } from "./types";
import { createNote, createProject } from "@/app/actions";
import { StickyNote, FolderPlus, X } from "lucide-react";

interface VaultModalsProps {
  isNoteModalOpen: boolean;
  setIsNoteModalOpen: (v: boolean) => void;
  isProjectModalOpen: boolean;
  setIsProjectModalOpen: (v: boolean) => void;
  activeCategory: string;
  projects: ProjectItem[];
}

export default function VaultModals({
  isNoteModalOpen,
  setIsNoteModalOpen,
  isProjectModalOpen,
  setIsProjectModalOpen,
  activeCategory,
  projects,
}: VaultModalsProps) {
  return (
    <>
      <AnimatePresence>
        {isNoteModalOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsNoteModalOpen(false)}
            className="fixed inset-0 z-50 bg-obsidian/80 backdrop-blur-md flex items-center justify-center p-4"
          >
            <motion.div
              initial={{ scale: 0.94, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.94, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="max-w-lg w-full bg-obsidian-card border border-cyber-cyan/40 rounded-3xl p-7 shadow-2xl relative"
            >
              <button
                onClick={() => setIsNoteModalOpen(false)}
                className="absolute top-5 right-5 p-2 rounded-xl bg-obsidian border border-obsidian-border text-slate-400 hover:text-white cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
              <h2 className="text-lg font-bold mb-1 flex items-center gap-2">
                <StickyNote className="w-5 h-5 text-cyber-cyan" /> Новая зашифрованная заметка
              </h2>
              <p className="text-xs font-mono text-slate-400 mb-5">
                Обрамляй команды в `обратные кавычки` для подсветки кода.
              </p>
              <form
                action={async (formData) => {
                  await createNote(formData);
                  setIsNoteModalOpen(false);
                }}
                className="space-y-4"
              >
                <div className="grid grid-cols-2 gap-3">
                  <input
                    name="title"
                    placeholder="Заголовок..."
                    required
                    className="w-full px-4 py-2.5 rounded-xl bg-obsidian border border-obsidian-border focus:border-cyber-cyan outline-none text-sm text-white"
                  />
                  <select
                    name="category"
                    defaultValue={activeCategory === "ALL" ? "DEV" : activeCategory}
                    className="w-full px-4 py-2.5 rounded-xl bg-obsidian border border-obsidian-border focus:border-cyber-cyan outline-none text-sm text-slate-200"
                  >
                    <option value="DEV">💻 Разработка</option>
                    <option value="BUSINESS">💼 Бизнес</option>
                    <option value="WORK">🛠️ Работа</option>
                    <option value="FAMILY">🏠 Семья</option>
                  </select>
                </div>
                <select
                  name="projectId"
                  className="w-full px-4 py-2.5 rounded-xl bg-obsidian border border-obsidian-border focus:border-cyber-cyan outline-none text-sm text-slate-300"
                >
                  <option value="">Без привязки к узлу</option>
                  {projects.map((p) => (
                    <option key={p.id} value={p.id}>
                      Узел: {p.title}
                    </option>
                  ))}
                </select>
                <textarea
                  name="content"
                  placeholder="Текст заметки или `команда`..."
                  rows={4}
                  required
                  className="w-full px-4 py-2.5 rounded-xl bg-obsidian border border-obsidian-border focus:border-cyber-cyan outline-none text-sm text-white font-mono"
                />
                <button
                  type="submit"
                  className="w-full py-3 rounded-xl bg-cyber-cyan text-obsidian font-mono text-xs font-bold hover:bg-cyber-cyan/90 cursor-pointer"
                >
                  СОХРАНИТЬ В VAULT
                </button>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {isProjectModalOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsProjectModalOpen(false)}
            className="fixed inset-0 z-50 bg-obsidian/80 backdrop-blur-md flex items-center justify-center p-4"
          >
            <motion.div
              initial={{ scale: 0.94, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.94, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="max-w-lg w-full bg-obsidian-card border border-cyber-purple/50 rounded-3xl p-7 shadow-2xl relative"
            >
              <button
                onClick={() => setIsProjectModalOpen(false)}
                className="absolute top-5 right-5 p-2 rounded-xl bg-obsidian border border-obsidian-border text-slate-400 hover:text-white cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
              <h2 className="text-lg font-bold mb-5 flex items-center gap-2">
                <FolderPlus className="w-5 h-5 text-cyber-purple" /> Новый проект / системный узел
              </h2>
              <form
                action={async (formData) => {
                  await createProject(formData);
                  setIsProjectModalOpen(false);
                }}
                className="space-y-4"
              >
                <div className="grid grid-cols-2 gap-3">
                  <input
                    name="title"
                    placeholder="Название проекта..."
                    required
                    className="w-full px-4 py-2.5 rounded-xl bg-obsidian border border-obsidian-border focus:border-cyber-purple outline-none text-sm text-white"
                  />
                  <select
                    name="category"
                    defaultValue={activeCategory === "ALL" ? "DEV" : activeCategory}
                    className="w-full px-4 py-2.5 rounded-xl bg-obsidian border border-obsidian-border focus:border-cyber-purple outline-none text-sm text-slate-200"
                  >
                    <option value="DEV">💻 Разработка</option>
                    <option value="BUSINESS">💼 Бизнес</option>
                    <option value="WORK">🛠️ Работа</option>
                    <option value="FAMILY">🏠 Семья</option>
                  </select>
                </div>
                <input
                  name="tagline"
                  placeholder="Краткое описание сути проекта..."
                  required
                  className="w-full px-4 py-2.5 rounded-xl bg-obsidian border border-obsidian-border focus:border-cyber-purple outline-none text-sm text-white"
                />
                <div className="grid grid-cols-2 gap-3">
                  <input
                    name="techStack"
                    placeholder="Теги (Next.js, Prisma...)"
                    className="w-full px-4 py-2.5 rounded-xl bg-obsidian border border-obsidian-border focus:border-cyber-purple outline-none text-sm text-white"
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
                  className="w-full py-3 rounded-xl bg-cyber-purple hover:bg-cyber-purple/90 text-white font-mono text-xs font-bold cursor-pointer"
                >
                  СОЗДАТЬ УЗЕЛ
                </button>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}