"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import SpotlightCard from "./SpotlightCard";
import OkaeriStatusWidget from "./OkaeriStatusWidget";
import {
  ArrowUpRight,
  Cpu,
  ShieldCheck,
  X,
  CheckCircle2,
  Clock,
  Layers,
  Gamepad2,
  Trophy,
  Calendar,
  Mic,
  Maximize2,
} from "lucide-react";

interface StageItem {
  id: string;
  title: string;
  status: string;
}

interface PublicProject {
  id: string;
  slug: string;
  title: string;
  tagline: string;
  description: string | null;
  status: string;
  liveUrl: string | null;
  techStack: string;
  accentColor: string;
  stages: StageItem[];
}

export default function ProjectsShowcase({ projects }: { projects: PublicProject[] }) {
  const [selectedProject, setSelectedProject] = useState<PublicProject | null>(null);

  // Быстрые ссылки на модули экосистемы для флагмана Okaeri Gaming
  const okaeriModules = [
    { label: "Киберспортивные турниры", url: "https://okaeri-gaming.ru/tournaments", icon: Trophy },
    { label: "Каталог игр (CS2, GTA 6, Liar's Bar)", url: "https://okaeri-gaming.ru/games", icon: Gamepad2 },
    { label: "Игровые вечера и Ивенты", url: "https://okaeri-gaming.ru/events", icon: Calendar },
    { label: "Мониторинг голосовой активности", url: "https://okaeri-gaming.ru/voice-activity", icon: Mic },
  ];

  return (
    <>
      {projects.map((project, idx) => (
        <SpotlightCard
          key={project.id}
          spotlightColor={(project.accentColor as "purple" | "cyan" | "crimson") || "purple"}
          className={`${idx === 0 ? "md:col-span-2" : "md:col-span-1"} p-8 flex flex-col justify-between group`}
        >
          <div>
            <div className="flex items-center justify-between mb-6">
              <span className="px-3 py-1 rounded-md bg-cyber-purple/15 border border-cyber-purple/40 text-cyber-purple text-xs font-mono">
                {project.status} // PUBLIC NODE
              </span>

              <div className="flex items-center gap-3">
                <button
                  onClick={() => setSelectedProject(project)}
                  className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-obsidian border border-obsidian-border hover:border-cyber-cyan text-xs font-mono text-slate-300 hover:text-cyber-cyan transition-all cursor-pointer outline-none"
                >
                  <Maximize2 className="w-3.5 h-3.5" /> Подробнее
                </button>

                {project.liveUrl && (
                  <a
                    href={project.liveUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center gap-1 text-xs font-mono text-slate-400 hover:text-cyber-cyan transition-colors"
                  >
                    Сайт <ArrowUpRight className="w-4 h-4" />
                  </a>
                )}
              </div>
            </div>

            <div
              onClick={() => setSelectedProject(project)}
              className="cursor-pointer"
            >
              <h2 className="text-2xl md:text-3xl font-bold mb-3 group-hover:text-cyber-cyan transition-colors">
                {project.title}
              </h2>
            </div>

            {project.slug === "okaeri-gaming" && (
              <div className="mb-5">
                <OkaeriStatusWidget />
              </div>
            )}

            <p className="text-slate-400 mb-6 leading-relaxed text-sm md:text-base">
              {project.tagline}
            </p>

            {project.stages && project.stages.length > 0 && (() => {
              const total = project.stages.length;
              const done = project.stages.filter((s: any) => s.status === "DONE").length;
              const percent = Math.round((done / total) * 100);
              return (
                <div className="mb-6 p-4 rounded-xl bg-obsidian border border-obsidian-border">
                  <div className="flex items-center justify-between text-xs font-mono mb-1.5">
                    <span className="text-slate-400">Roadmap / Этапы разработки</span>
                    <span className="text-cyber-cyan font-bold">{percent}% ({done}/{total})</span>
                  </div>
                  <div className="w-full h-1.5 rounded-full bg-obsidian-card overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-cyber-purple to-cyber-cyan transition-all duration-500"
                      style={{ width: `${percent}%` }}
                    />
                  </div>
                </div>
              );
            })()}
          </div>

          <div className="flex flex-wrap items-center justify-between gap-4 pt-6 border-t border-obsidian-border/80">
            <div className="flex flex-wrap gap-2 text-xs font-mono text-slate-300">
              {project.techStack.split(",").map((tech) => (
                <span
                  key={tech}
                  className="px-2.5 py-1 rounded bg-obsidian border border-obsidian-border"
                >
                  {tech.trim()}
                </span>
              ))}
            </div>

            <button
              onClick={() => setSelectedProject(project)}
              className="text-xs font-mono text-cyber-purple hover:text-cyber-cyan transition-colors cursor-pointer outline-none"
            >
              Архитектура и детали →
            </button>
          </div>
        </SpotlightCard>
      ))}

      {/* Карточка: Core Stack */}
      <SpotlightCard spotlightColor="cyan" className="p-7 flex flex-col justify-between">
        <div>
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2.5 rounded-xl bg-obsidian border border-obsidian-border text-cyber-purple">
              <Cpu className="w-5 h-5" />
            </div>
            <h3 className="text-xl font-bold">Core Stack</h3>
          </div>
          <p className="text-sm text-slate-400 mb-6">
            Стек для быстрого развертывания, высокой безопасности и плавной работы.
          </p>
          <div className="grid grid-cols-2 gap-2.5 font-mono text-xs">
            <div className="p-3 rounded-lg bg-obsidian border border-obsidian-border text-cyber-cyan">
              Node.js / TS
            </div>
            <div className="p-3 rounded-lg bg-obsidian border border-obsidian-border text-cyber-purple">
              React / Next 15
            </div>
            <div className="p-3 rounded-lg bg-obsidian border border-obsidian-border text-slate-300">
              Prisma + SQL
            </div>
            <div className="p-3 rounded-lg bg-obsidian border border-obsidian-border text-cyber-crimson">
              Motion 60fps
            </div>
          </div>
        </div>
        <div className="mt-6 pt-4 border-t border-obsidian-border/80 flex items-center gap-2 text-xs font-mono text-slate-400">
          <ShieldCheck className="w-4 h-4 text-cyber-cyan" /> Приватное ядро защищено
        </div>
      </SpotlightCard>

      {/* МОДАЛЬНОЕ ОКНО ДЕТАЛЬНОГО РАЗБОРА ПРОЕКТА (CASE STUDY MODAL) */}
      <AnimatePresence>
        {selectedProject && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setSelectedProject(null)}
            className="fixed inset-0 z-50 bg-obsidian/80 backdrop-blur-md flex items-center justify-center p-4 md:p-6"
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.94, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.94, y: 20 }}
              transition={{ type: "spring", stiffness: 350, damping: 28 }}
              onClick={(e) => e.stopPropagation()}
              className="relative max-w-2xl w-full bg-obsidian-card border border-cyber-cyan/40 rounded-3xl p-6 md:p-8 shadow-[0_0_60px_rgba(0,240,255,0.15)] max-h-[90vh] overflow-y-auto"
            >
              {/* Кнопка закрытия */}
              <button
                onClick={() => setSelectedProject(null)}
                className="absolute top-6 right-6 p-2 rounded-xl bg-obsidian border border-obsidian-border text-slate-400 hover:text-white hover:border-cyber-crimson transition-colors cursor-pointer outline-none"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-md bg-cyber-purple/15 border border-cyber-purple/40 text-cyber-purple text-xs font-mono mb-4">
                PROJECT DOSSIER // {selectedProject.status}
              </div>

              <h3 className="text-3xl font-extrabold text-white mb-3">
                {selectedProject.title}
              </h3>

              <p className="text-slate-300 text-base leading-relaxed mb-6">
                {selectedProject.description || selectedProject.tagline}
              </p>

              {/* Если это Okaeri Gaming — показываем живую телеметрию и модули экосистемы */}
              {selectedProject.slug === "okaeri-gaming" && (
                <div className="mb-6 space-y-4">
                  <OkaeriStatusWidget />

                  <div>
                    <div className="text-xs font-mono text-slate-400 mb-2.5">
                      // МОДУЛИ ПЛАТФОРМЫ OKAERI GAMING:
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                      {okaeriModules.map((mod) => {
                        const IconComp = mod.icon;
                        return (
                          <a
                            key={mod.url}
                            href={mod.url}
                            target="_blank"
                            rel="noreferrer"
                            className="p-3 rounded-xl bg-obsidian border border-obsidian-border hover:border-cyber-cyan/60 flex items-center justify-between group transition-all"
                          >
                            <div className="flex items-center gap-2.5 text-xs font-mono text-slate-200 group-hover:text-cyber-cyan">
                              <IconComp className="w-4 h-4 text-cyber-purple" />
                              <span>{mod.label}</span>
                            </div>
                            <ArrowUpRight className="w-3.5 h-3.5 text-slate-500 group-hover:text-cyber-cyan" />
                          </a>
                        );
                      })}
                    </div>
                  </div>
                </div>
              )}

              {/* Выполненные этапы проекта из БД */}
              {selectedProject.stages && selectedProject.stages.length > 0 && (
                <div className="mb-6">
                  <div className="text-xs font-mono text-slate-400 mb-2.5">
                    // РЕАЛИЗОВАННЫЕ ЭТАПЫ (ROADMAP):
                  </div>
                  <div className="space-y-2">
                    {selectedProject.stages.map((st) => (
                      <div
                        key={st.id}
                        className="flex items-center gap-2.5 p-2.5 rounded-xl bg-obsidian border border-obsidian-border text-xs font-mono"
                      >
                        {st.status === "DONE" ? (
                          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                        ) : (
                          <Clock className="w-4 h-4 text-cyber-cyan shrink-0" />
                        )}
                        <span className={st.status === "DONE" ? "text-slate-200" : "text-slate-400"}>
                          {st.title}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Стек технологий */}
              <div className="mb-8">
                <div className="text-xs font-mono text-slate-400 mb-2 flex items-center gap-1.5">
                  <Layers className="w-3.5 h-3.5 text-cyber-cyan" /> ЗАДЕЙСТВОВАННЫЙ СТЕК:
                </div>
                <div className="flex flex-wrap gap-2">
                  {selectedProject.techStack.split(",").map((tech) => (
                    <span
                      key={tech}
                      className="px-3 py-1 rounded-lg bg-obsidian border border-obsidian-border font-mono text-xs text-cyber-cyan"
                    >
                      {tech.trim()}
                    </span>
                  ))}
                </div>
              </div>

              {/* Нижние кнопки */}
              <div className="flex flex-wrap items-center justify-end gap-3 pt-4 border-t border-obsidian-border">
                <button
                  onClick={() => setSelectedProject(null)}
                  className="px-5 py-2.5 rounded-xl bg-obsidian border border-obsidian-border text-xs font-mono text-slate-300 hover:text-white cursor-pointer outline-none"
                >
                  Закрыть
                </button>
                {selectedProject.liveUrl && (
                  <a
                    href={selectedProject.liveUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="px-6 py-2.5 rounded-xl bg-cyber-purple hover:bg-cyber-purple/90 text-white text-xs font-mono font-bold flex items-center gap-2 shadow-[0_0_20px_rgba(139,92,246,0.4)] transition-all"
                  >
                    Перейти на {selectedProject.title} <ArrowUpRight className="w-4 h-4" />
                  </a>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}