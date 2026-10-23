"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Cpu, ArrowUpRight, Layers, Shield, Sparkles } from "lucide-react";

interface ProjectNode {
  id: string;
  title: string;
  tagline: string;
  category: string;
  status: string;
  techStack: string;
  liveUrl: string | null;
  accentColor: string;
}

export default function NeuralHub({ projects }: { projects: ProjectNode[] }) {
  const [activeId, setActiveId] = useState<string>(projects[0]?.id || "core");

  const displayNodes: ProjectNode[] = [
    ...projects,
    ...(projects.length < 3
      ? [
          {
            id: "sys-arch",
            title: "System Architecture",
            tagline: "Проектирование баз данных (Prisma/SQL), микросервисов и отказоустойчивого бэкенда на Node.js.",
            category: "CORE MODULE",
            status: "ONLINE",
            techStack: "Node.js, TypeScript, Prisma, SQLite/Postgres",
            liveUrl: null,
            accentColor: "cyan",
          },
          {
            id: "sys-ui",
            title: "Interactive Motion UI",
            tagline: "Разработка интерфейсов корпоративного уровня с 60 FPS анимациями и геймерской эстетикой.",
            category: "FRONTEND ENGINE",
            status: "ONLINE",
            techStack: "React 19, Next.js 15, Tailwind, Motion",
            liveUrl: null,
            accentColor: "crimson",
          },
        ]
      : []),
  ];

  const activeNode = displayNodes.find((n) => n.id === activeId) || displayNodes[0];

  // Безопасные координаты узлов внутри сетки (в процентах, исключающие выход за края)
  const positions = [
    { x: 22, y: 28 },
    { x: 78, y: 30 },
    { x: 25, y: 72 },
    { x: 75, y: 70 },
    { x: 50, y: 16 },
  ];

  const colorHex: Record<string, string> = {
    purple: "#8B5CF6",
    cyan: "#00F0FF",
    crimson: "#FF2A5F",
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center bg-obsidian-card/60 backdrop-blur-xl border border-obsidian-border rounded-3xl p-6 md:p-8 shadow-2xl relative overflow-hidden">
      {/* Левая часть: Интерактивная карта связей (7 колонок) */}
      <div className="lg:col-span-7 relative h-[380px] md:h-[420px] w-full rounded-2xl bg-obsidian/90 border border-obsidian-border overflow-hidden flex items-center justify-center">
        {/* Фоновая кибер-сетка */}
        <div
          className="absolute inset-0 opacity-20 pointer-events-none"
          style={{
            backgroundImage:
              "radial-gradient(#00F0FF 1px, transparent 1px), radial-gradient(#8B5CF6 1px, #090A0F 1px)",
            backgroundSize: "32px 32px",
          }}
        />

        {/* SVG Линии связи и бегущие импульсы */}
        <svg className="absolute inset-0 w-full h-full pointer-events-none">
          {displayNodes.slice(0, 5).map((node, index) => {
            const pos = positions[index % positions.length];
            const isSelected = activeNode?.id === node.id;
            const strokeColor = colorHex[node.accentColor] || "#00F0FF";

            return (
              <g key={node.id}>
                <line
                  x1="50%"
                  y1="50%"
                  x2={`${pos.x}%`}
                  y2={`${pos.y}%`}
                  stroke={isSelected ? strokeColor : "#1E202B"}
                  strokeWidth={isSelected ? "2.5" : "1.5"}
                  strokeDasharray={isSelected ? "none" : "6 6"}
                  className="transition-all duration-300"
                />
                <motion.circle
                  r={isSelected ? 4 : 2.5}
                  fill={strokeColor}
                  initial={{ cx: "50%", cy: "50%", opacity: 0 }}
                  animate={{
                    cx: ["50%", `${pos.x}%`],
                    cy: ["50%", `${pos.y}%`],
                    opacity: [0, 1, 0],
                  }}
                  transition={{
                    duration: isSelected ? 1.5 : 3,
                    repeat: Infinity,
                    ease: "linear",
                    delay: index * 0.3,
                  }}
                />
              </g>
            );
          })}
        </svg>

        {/* ЦЕНТРАЛЬНОЕ ЯДРО: MAINFRAME CORE */}
        <div className="relative z-20 w-28 h-28 rounded-full bg-obsidian border-2 border-cyber-cyan flex flex-col items-center justify-center text-center p-2 shadow-[0_0_30px_rgba(0,240,255,0.2)] select-none pointer-events-none">
          <Cpu className="w-6 h-6 text-cyber-cyan mb-1 animate-pulse" />
          <span className="font-mono text-[10px] font-bold tracking-widest text-white">
            MAINFRAME
          </span>
          <span className="font-mono text-[9px] text-cyber-purple">CORE HUB</span>
        </div>

        {/* ИНТЕРАКТИВНЫЕ УЗЛЫ ПРОЕКТОВ (без дергания при клике) */}
        {displayNodes.slice(0, 5).map((node, index) => {
          const pos = positions[index % positions.length];
          const isSelected = activeNode?.id === node.id;

          return (
            <div
              key={node.id}
              style={{ left: `${pos.x}%`, top: `${pos.y}%` }}
              className="absolute -translate-x-1/2 -translate-y-1/2 z-30"
            >
              <button
                onClick={() => setActiveId(node.id)}
                onMouseEnter={() => setActiveId(node.id)}
                className={`px-3.5 py-2 rounded-xl border backdrop-blur-md transition-all duration-200 flex items-center gap-2 cursor-pointer ${
                  isSelected
                    ? "bg-obsidian-card border-cyber-cyan shadow-[0_0_25px_rgba(0,240,255,0.35)] text-white scale-105"
                    : "bg-obsidian/90 border-obsidian-border text-slate-400 hover:text-slate-200 hover:border-slate-700"
                }`}
              >
                <span
                  className={`w-2 h-2 rounded-full shrink-0 ${
                    node.accentColor === "crimson"
                      ? "bg-cyber-crimson"
                      : node.accentColor === "purple"
                      ? "bg-cyber-purple"
                      : "bg-cyber-cyan"
                  }`}
                />
                <span className="font-mono text-xs font-semibold whitespace-nowrap">
                  {node.title}
                </span>
              </button>
            </div>
          );
        })}

        <div className="absolute bottom-3 left-4 text-[11px] font-mono text-slate-500 flex items-center gap-2 pointer-events-none">
          <Sparkles className="w-3.5 h-3.5 text-cyber-cyan" />
          Кликните на узел для инспекции
        </div>
      </div>

      {/* Правая часть: Инспектор выбранного узла (5 колонок) */}
      <div className="lg:col-span-5 flex flex-col justify-between h-full">
        <AnimatePresence mode="wait">
          {activeNode && (
            <motion.div
              key={activeNode.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
              className="p-6 rounded-2xl bg-obsidian/70 border border-obsidian-border flex flex-col justify-between h-full"
            >
              <div>
                <div className="flex items-center justify-between gap-2 mb-4">
                  <span className="px-2.5 py-1 rounded bg-cyber-purple/15 border border-cyber-purple/40 text-cyber-purple font-mono text-xs">
                    NODE // {activeNode.category}
                  </span>
                  <span className="font-mono text-xs text-cyber-cyan flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-cyber-cyan animate-ping" />
                    {activeNode.status}
                  </span>
                </div>

                <h3 className="text-2xl font-bold mb-3 text-white">{activeNode.title}</h3>
                <p className="text-slate-400 text-sm leading-relaxed mb-6">
                  {activeNode.tagline}
                </p>

                <div className="mb-6">
                  <div className="text-xs font-mono text-slate-500 mb-2 flex items-center gap-1.5">
                    <Layers className="w-3.5 h-3.5 text-cyber-purple" /> ТЕХНОЛОГИЧЕСКИЙ СТЕК:
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {activeNode.techStack.split(",").map((tech) => (
                      <span
                        key={tech}
                        className="px-2.5 py-1 rounded-md bg-obsidian-card border border-obsidian-border font-mono text-xs text-slate-300"
                      >
                        {tech.trim()}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              {activeNode.liveUrl ? (
                <a
                  href={activeNode.liveUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="w-full py-3 rounded-xl bg-cyber-purple hover:bg-cyber-purple/90 text-white font-mono text-xs font-bold transition-all flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(139,92,246,0.3)]"
                >
                  ПЕРЕЙТИ В ПРОЕКТ <ArrowUpRight className="w-4 h-4" />
                </a>
              ) : (
                <div className="w-full py-3 rounded-xl bg-obsidian-card border border-obsidian-border text-slate-400 font-mono text-xs flex items-center justify-center gap-2">
                  <Shield className="w-4 h-4 text-cyber-cyan" /> ВНУТРЕННИЙ МОДУЛЬ ЯДРА
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}