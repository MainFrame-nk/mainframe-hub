"use client";

import React, { useState } from "react";
import SpotlightCard from "./SpotlightCard";
import { Globe, FolderGit2, CheckCircle2, Send } from "lucide-react";
import { submitContactForm } from "@/app/actions";

export default function ContactSection() {
  const [submitted, setSubmitted] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const formData = new FormData(form);
    
    await submitContactForm(formData);
    setSubmitted(true);
    form.reset();
  }

  return (
    <SpotlightCard
      spotlightColor="crimson"
      className="md:col-span-3 p-8 md:p-12"
    >
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
        {/* Левая часть: Призыв к действию */}
        <div className="lg:col-span-5">
          <div className="inline-flex items-center gap-2 text-xs font-mono text-cyber-crimson mb-3">
            <Globe className="w-4 h-4" /> AVAILABLE FOR PARTNERSHIPS & PROJECTS
          </div>
          <h3 className="text-3xl font-extrabold mb-4 text-white">
            Нужна разработка проекта под ключ?
          </h3>
          <p className="text-slate-400 text-base leading-relaxed">
            От проектирования базы данных (Prisma/SQL) и серверной архитектуры до кастомного интерфейса с премиальными 60 FPS анимациями. Оставьте заявку, и она напрямую попадет в мой защищенный Core Vault.
          </p>
        </div>

        {/* Правая часть: Форма с правильными отступами и балансом кнопки */}
        <div className="lg:col-span-7">
          {submitted ? (
            <div className="p-6 rounded-2xl bg-obsidian border border-cyber-cyan/40 text-center py-12">
              <CheckCircle2 className="w-12 h-12 text-cyber-cyan mx-auto mb-4 animate-bounce" />
              <h4 className="text-xl font-bold text-white mb-2">Заявка успешно отправлена!</h4>
              <p className="text-sm text-slate-400">
                Сообщение записано в защищенную базу данных MainFrame. Скоро свяжусь с вами.
              </p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-mono text-slate-400 mb-1.5">ВАШЕ ИМЯ / КОМПАНИЯ</label>
                  <input
                    name="name"
                    placeholder="Иван / MainFrame Client"
                    required
                    className="w-full px-4 py-3 rounded-xl bg-obsidian border border-obsidian-border focus:border-cyber-crimson outline-none text-sm text-slate-200"
                  />
                </div>
                <div>
                  <label className="block text-xs font-mono text-slate-400 mb-1.5">ТЕЛЕГРАМ ИЛИ EMAIL</label>
                  <input
                    name="contact"
                    placeholder="@username или email@domain.com"
                    required
                    className="w-full px-4 py-3 rounded-xl bg-obsidian border border-obsidian-border focus:border-cyber-crimson outline-none text-sm text-slate-200"
                  />
                </div>
              </div>

              <div>
              <label className="block text-xs font-mono text-slate-400 mb-1.5">ОПИСАНИЕ ЗАДАЧИ ИЛИ ПРОЕКТА</label>
                <textarea
                  name="message"
                  placeholder="Расскажите суть проекта, стек или требования..."
                  rows={3}
                  required
                  className="w-full px-4 py-3 rounded-xl bg-obsidian border border-obsidian-border focus:border-cyber-crimson outline-none text-sm text-slate-200 resize-none"
                />
              </div>

              {/* Кнопка с правильным отступом и гармоничным визуалом */}
              <div className="pt-2">
                <button
                  type="submit"
                  className="w-full sm:w-auto px-8 py-4 rounded-xl bg-cyber-crimson hover:bg-cyber-crimson/90 text-white font-medium text-sm transition-all shadow-[0_0_25px_rgba(255,42,95,0.4)] flex items-center justify-center gap-2.5 cursor-pointer"
                >
                  <Send className="w-4 h-4" />
                  ОТПРАВИТЬ ЗАЯВКУ В MAINFRAME
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </SpotlightCard>
  );
}