"use client";

import React, { useState } from "react";
import Link from "next/link";
import ThemeToggle from "@/components/ThemeToggle";
import { Lock } from "lucide-react";

export default function PublicHeader() {
  const [vaultUnlocked, setVaultUnlocked] = useState(false);
  const [, setClickCount] = useState(0);

  const handleSecretClick = () => {
    setClickCount((prev) => {
      const next = prev + 1;
      if (next >= 5) {
        setVaultUnlocked(true);
      }
      return next;
    });
  };

  return (
    <header className="sticky top-0 z-40 border-b border-obsidian-border/80 bg-obsidian/85 backdrop-blur-md">
      <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
        {/* Секретная зона: 5 кликов сюда без каких-либо видимых счетчиков открывают кнопку Core Vault */}
        <div
          onClick={handleSecretClick}
          className="flex items-center gap-3 cursor-pointer select-none group"
        >
          <div className="w-3 h-3 rounded-full bg-cyber-crimson shadow-[0_0_12px_#FF2A5F] group-hover:scale-125 transition-transform" />
          <span className="font-mono font-bold tracking-wider text-sm">
            MAINFRAME 
            <span className="text-cyber-cyan">.DEV</span>
          </span>
        </div>

        <nav className="hidden md:flex items-center gap-7 text-sm text-slate-400">
          <a href="#neural-hub" className="hover:text-cyber-cyan transition-colors">
            Топология
          </a>
          <a href="#projects" className="hover:text-cyber-cyan transition-colors">
            Проекты
          </a>
          <a href="#services" className="hover:text-cyber-cyan transition-colors">
            Разработка
          </a>
          <a href="#contact" className="hover:text-cyber-cyan transition-colors">
            Сотрудничество
          </a>
        </nav>

        <div className="flex items-center gap-3">
          <ThemeToggle />
          {vaultUnlocked && (
            <Link
              href="/vault"
              className="flex items-center gap-2 px-4 py-1.5 rounded-lg bg-obsidian-card border border-cyber-purple text-xs font-mono text-slate-200 hover:border-cyber-cyan transition-all shadow-[0_0_15px_rgba(139,92,246,0.3)]"
            >
              <Lock className="w-3.5 h-3.5 text-cyber-purple animate-pulse" />
              Core Vault
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}