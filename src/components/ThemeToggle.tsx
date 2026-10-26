"use client";

import React, { useEffect, useState } from "react";
import { Moon, Sun, Monitor } from "lucide-react";

type ThemeMode = "dark" | "light" | "system";

export default function ThemeToggle() {
  // По умолчанию строго ТЕМНАЯ тема ("dark")
  const [theme, setTheme] = useState<ThemeMode>("dark");

  const applyTheme = (mode: ThemeMode) => {
    const root = document.documentElement;
    root.classList.remove("dark", "light");

    if (mode === "system") {
      const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
      root.classList.add(prefersDark ? "dark" : "light");
    } else {
      root.classList.add(mode);
    }
  };

  useEffect(() => {
    const saved = (localStorage.getItem("mainframe_theme") as ThemeMode) || "dark";
    setTheme(saved);
    applyTheme(saved);

    // Слушаем смену системной темы ОС, если выбран режим "system"
    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
    const handleChange = () => {
      if ((localStorage.getItem("mainframe_theme") as ThemeMode) === "system") {
        applyTheme("system");
      }
    };
    mediaQuery.addEventListener("change", handleChange);
    return () => mediaQuery.removeEventListener("change", handleChange);
  }, []);

  const selectTheme = (mode: ThemeMode) => {
    setTheme(mode);
    localStorage.setItem("mainframe_theme", mode);
    applyTheme(mode);
  };

  return (
    <div
      className="inline-flex items-center p-1 rounded-xl bg-obsidian-card border border-obsidian-border text-xs font-mono"
      title="Переключение темы оформления (Темная по умолчанию / Светлая / Системная)"
    >
      <button
        type="button"
        onClick={() => selectTheme("dark")}
        className={`p-1.5 rounded-lg transition-all cursor-pointer flex items-center gap-1 ${
          theme === "dark"
            ? "bg-cyber-purple text-white shadow-[0_0_12px_rgba(139,92,246,0.4)]"
            : "text-slate-400 hover:text-slate-200"
        }`}
        title="Темная тема (Obsidian Dark — По умолчанию)"
      >
        <Moon className="w-3.5 h-3.5" />
      </button>

      <button
        type="button"
        onClick={() => selectTheme("light")}
        className={`p-1.5 rounded-lg transition-all cursor-pointer flex items-center gap-1 ${
          theme === "light"
            ? "bg-cyber-cyan text-slate-950 font-bold shadow-[0_0_12px_rgba(0,240,255,0.4)]"
            : "text-slate-400 hover:text-slate-200"
        }`}
        title="Светлая тема (Platinum Light)"
      >
        <Sun className="w-3.5 h-3.5" />
      </button>

      <button
        type="button"
        onClick={() => selectTheme("system")}
        className={`p-1.5 rounded-lg transition-all cursor-pointer flex items-center gap-1 ${
          theme === "system"
            ? "bg-obsidian border border-cyber-cyan/50 text-cyber-cyan font-bold"
            : "text-slate-400 hover:text-slate-200"
        }`}
        title="Как в системе (Авто)"
      >
        <Monitor className="w-3.5 h-3.5" />
      </button>
    </div>
  );
}