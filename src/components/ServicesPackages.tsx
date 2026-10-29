"use client";

import React from "react";
import SpotlightCard from "@/components/SpotlightCard";
import { Globe, Cpu, ShieldCheck, Check, ArrowRight } from "lucide-react";

const PACKAGES = [
  {
    id: "digital-office",
    badge: "ХИТ ДЛЯ БИЗНЕСА",
    title: "Цифровой Офис «Под ключ»",
    price: "от 45 000 ₽",
    duration: "Срок: 5–10 дней",
    color: "purple" as const,
    icon: Globe,
    description:
      "Премиальный сайт-витрина + закрытая внутренняя мини-CRM система и Telegram-бот / MAX-бот для мгновенного приема и учета заявок без абонентской платы.",
    features: [
      "Разработка ультрабыстрого сайта (Next.js / React)",
      "Закрытая панель управления заявками и задачами (Канбан)",
      "Интеграция с Telegram- и MAX-ботами (уведомления за 1 секунду)",
      "Финансовый дашборд учета доходов и расходов",
      "Развертывание на вашем VPS + SSL-сертификат безопасности",
    ],
  },
  {
    id: "crm-automation",
    badge: "АВТОМАТИЗАЦИЯ ПРОДАЖ",
    title: "Интеграция Битрикс24 & Боты",
    price: "от 25 000 ₽",
    duration: "Срок: 3–7 дней",
    color: "cyan" as const,
    icon: Cpu,
    description:
      "Настройка воронок продаж, автоматизация рутины менеджеров, разработка кастомных ботов для Telegram и MAX со связкой с вашей CRM и базой данных.",
    features: [
      "Внедрение и архитектура воронок продаж в Битрикс24",
      "Боты для Telegram / MAX (запись, оплата, каталог)",
      "Связка сайта, мессенджеров и CRM в единое окно",
      "Автоматическая генерация документов и счетов",
      "Техническое сопровождение и обучение команды",
    ],
  },
  {
    id: "sovereign-cloud",
    badge: "ZERO-KNOWLEDGE SECURITY",
    title: "Защищенная IT-Инфраструктура",
    price: "от 35 000 ₽",
    duration: "Срок: 2–5 дней",
    color: "crimson" as const,
    icon: ShieldCheck,
    description:
      "Проектирование независимых серверов, зашифрованных корпоративных облаков (AES-256) и отказоустойчивых шлюзов для бесперебойной работы бизнеса.",
    features: [
      "Собственное зашифрованное облако файлов (альтернатива Google/Яндекс)",
      "Архитектура распределенных серверов (РФ + Европа)",
      "Защита баз данных, 2FA-авторизация и авто-бэкапы",
      "Обеспечение стабильного доступа к зарубежным ИИ и API-сервисам",
      "Полный контроль над данными с «красной кнопкой» отключения",
    ],
  },
];

export default function ServicesPackages() {
  return (
    <section id="services" className="py-16">
      <div className="mb-10">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-obsidian-card border border-obsidian-border text-xs font-mono text-cyber-cyan mb-3">
          <span>NOVA GENESIS // КОММЕРЧЕСКИЕ РЕШЕНИЯ</span>
        </div>
        <h2 className="text-3xl md:text-4xl font-extrabold tracking-tight text-white">
          Инженерные пакеты для бизнеса
        </h2>
        <p className="text-slate-400 mt-2 max-w-2xl text-sm md:text-base">
          Готовые технологические решения с прозрачной архитектурой, официальным договором (НПД) и поэтапной оплатой.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {PACKAGES.map((pkg) => {
          const Icon = pkg.icon;
          return (
            <SpotlightCard
              key={pkg.id}
              spotlightColor={pkg.color}
              className="p-6 md:p-8 flex flex-col justify-between h-full"
            >
              <div>
                <div className="flex items-center justify-between gap-2 mb-6">
                  <span className="px-2.5 py-1 rounded-md bg-obsidian border border-obsidian-border text-[11px] font-mono text-cyber-cyan">
                    {pkg.badge}
                  </span>
                  <span className="text-xs font-mono text-slate-400">{pkg.duration}</span>
                </div>

                <div className="flex items-center gap-3 mb-3">
                  <div className="p-2.5 rounded-xl bg-obsidian border border-obsidian-border text-cyber-purple">
                    <Icon className="w-6 h-6" />
                  </div>
                  <h3 className="text-xl font-bold text-white">{pkg.title}</h3>
                </div>

                <div className="my-5 pb-5 border-b border-obsidian-border">
                  <span className="text-3xl font-extrabold text-white">{pkg.price}</span>
                  <span className="text-xs font-mono text-slate-400 block mt-1">
                    Оплата 50% аванс / 50% по готовности
                  </span>
                </div>

                <p className="text-slate-300 text-sm leading-relaxed mb-6">
                  {pkg.description}
                </p>

                <ul className="space-y-3 mb-8">
                  {pkg.features.map((feat, idx) => (
                    <li key={idx} className="flex items-start gap-2.5 text-xs md:text-sm text-slate-300">
                      <Check className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                      <span>{feat}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <a
                href="#contact"
                onClick={() =>
                    window.dispatchEvent(
                    new CustomEvent("select-service-package", {
                        detail: `${pkg.title} (${pkg.price})`,
                    })
                    )
                }
                className="w-full py-3 px-4 rounded-xl bg-obsidian hover:bg-cyber-purple/20 border border-obsidian-border hover:border-cyber-purple text-xs font-mono font-bold text-white flex items-center justify-center gap-2 transition-all group"
                >
                <span>Заказать решение</span>
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform text-cyber-cyan" />
              </a>
            </SpotlightCard>
          );
        })}
      </div>
    </section>
  );
}