"use client";

import React, { useState, useEffect } from "react";
import SpotlightCard from "./SpotlightCard";
import { Globe, CheckCircle2, Send } from "lucide-react";
import { submitContactForm } from "@/app/actions";

export default function ContactSection() {
  const [submitted, setSubmitted] = useState(false);
  const [selectedService, setSelectedService] = useState("Цифровой Офис «Под ключ» (от 45 000 ₽)");

  // Если клиент нажал на конкретный пакет выше — автоматически подставляем его в селект
  useEffect(() => {
    const handleSelectPackage = (e: Event) => {
      const customEvent = e as CustomEvent<string>;
      if (customEvent.detail) {
        setSelectedService(customEvent.detail);
      }
    };
    window.addEventListener("select-service-package", handleSelectPackage);
    return () => window.removeEventListener("select-service-package", handleSelectPackage);
  }, []);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const formData = new FormData(form);

    await submitContactForm(formData);
    setSubmitted(true);
    form.reset();
  }

  return (
    <SpotlightCard spotlightColor="crimson" className="md:col-span-3 p-8 md:p-12">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
        {/* Левая часть */}
        <div className="lg:col-span-5">
          <div className="inline-flex items-center gap-2 text-xs font-mono text-cyber-crimson mb-3">
            <Globe className="w-4 h-4" /> NOVA GENESIS // СОТРУДНИЧЕСТВО
          </div>
          <h3 className="text-3xl font-extrabold mb-4 text-white">
            Нужна разработка системы под ключ?
          </h3>
          <p className="text-slate-400 text-base leading-relaxed">
            Выберите подходящий инженерный пакет или опишите нестандартную задачу. Заявка мгновенно попадет в защищенную CRM-систему — свяжусь с вами в MAX, Telegram или по телефону.
          </p>
        </div>

        {/* Правая часть: Форма с выбором пакета услуги */}
        <div className="lg:col-span-7">
          {submitted ? (
            <div className="p-6 rounded-2xl bg-obsidian border border-cyber-cyan/40 text-center py-12">
              <CheckCircle2 className="w-12 h-12 text-cyber-cyan mx-auto mb-4 animate-bounce" />
              <h4 className="text-xl font-bold text-white mb-2">Заявка успешно отправлена!</h4>
              <p className="text-sm text-slate-400 mb-6">
                Данные записаны в защищенное ядро MainFrame. Скоро свяжусь с вами по указанному контакту.
              </p>
              <button
                onClick={() => setSubmitted(false)}
                className="px-4 py-2 rounded-lg bg-obsidian-card border border-obsidian-border text-xs font-mono text-slate-300 hover:border-cyber-cyan"
              >
                Отправить еще одну заявку
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-mono text-slate-400 mb-1.5">
                    ВАШЕ ИМЯ / КОМПАНИЯ
                  </label>
                  <input
                    name="name"
                    placeholder="Иван / ООО «Вектор»"
                    required
                    className="w-full px-4 py-3 rounded-xl bg-obsidian border border-obsidian-border focus:border-cyber-crimson outline-none text-sm text-slate-200"
                  />
                </div>
                <div>
                  <label className="block text-xs font-mono text-slate-400 mb-1.5">
                    ТЕЛЕФОН / MAX / TELEGRAM / EMAIL
                  </label>
                  <input
                    name="contact"
                    placeholder="+7 (999) ... или @username"
                    required
                    className="w-full px-4 py-3 rounded-xl bg-obsidian border border-obsidian-border focus:border-cyber-crimson outline-none text-sm text-slate-200"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-mono text-slate-400 mb-1.5">
                  ИНТЕРЕСУЮЩЕЕ РЕШЕНИЕ / УСЛУГА
                </label>
                <select
                  name="service"
                  value={selectedService}
                  onChange={(e) => setSelectedService(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl bg-obsidian border border-obsidian-border focus:border-cyber-crimson outline-none text-sm text-slate-200"
                >
                  <option value="Цифровой Офис «Под ключ» (от 45 000 ₽)">
                    🌐 Цифровой Офис: Сайт + мини-CRM + Бот (от 45 000 ₽)
                  </option>
                  <option value="Интеграция Битрикс24 & Боты (от 25 000 ₽)">
                    ⚡ Внедрение Битрикс24 & Боты в Telegram / MAX (от 25 000 ₽)
                  </option>
                  <option value="Защищенная IT-Инфраструктура (от 35 000 ₽)">
                    🛡️ Защищенная IT-Инфраструктура и Облако (от 35 000 ₽)
                  </option>
                  <option value="Кастомная Full-Stack разработка / Другое">
                    💻 Индивидуальная разработка по ТЗ / Консультация
                  </option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-mono text-slate-400 mb-1.5">
                  КРАТКОЕ ОПИСАНИЕ ЗАДАЧИ
                </label>
                <textarea
                  name="message"
                  placeholder="Опишите сферу бизнеса или задачу, которую нужно решить..."
                  rows={3}
                  required
                  className="w-full px-4 py-3 rounded-xl bg-obsidian border border-obsidian-border focus:border-cyber-crimson outline-none text-sm text-slate-200 resize-none"
                />
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  className="w-full sm:w-auto px-8 py-4 rounded-xl bg-cyber-crimson hover:bg-cyber-crimson/90 text-white font-medium text-sm transition-all shadow-[0_0_25px_rgba(255,42,95,0.4)] flex items-center justify-center gap-2.5 cursor-pointer"
                >
                  <Send className="w-4 h-4" />
                  ОТПРАВИТЬ ЗАЯВКУ В СИСТЕМУ
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </SpotlightCard>
  );
}