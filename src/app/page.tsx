import React from "react";
import { prisma } from "@/lib/prisma";
import { ensureSeedData } from "@/app/actions";
import PublicHeader from "@/components/PublicHeader";
import NeuralHub from "@/components/NeuralHub";
import ContactSection from "@/components/ContactSection";
import ProjectsShowcase from "@/components/ProjectsShowcase";
import SpotlightCard from "@/components/SpotlightCard";
import {
  Sparkles,
  Terminal,
  ArrowRight,
  Activity,
  Code2,
  Database,
  HardDrive,
  Users,
  Radio,
  Cpu,
  Layers,
  ShieldCheck,
} from "lucide-react";

export default async function Home() {
  await ensureSeedData();

  // Загружаем публичные проекты вместе с их этапами из БД
  const publicProjects = await prisma.project.findMany({
    where: { isPublic: true },
    include: {
      stages: {
        orderBy: { order: "asc" },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  return (
    <main className="relative min-h-screen bg-obsidian text-slate-100 selection:bg-cyber-purple selection:text-white overflow-hidden flex flex-col justify-between">
      {/* Фоновые световые пятна */}
      <div className="pointer-events-none fixed top-0 left-1/4 w-[500px] h-[500px] bg-cyber-purple/10 rounded-full blur-[150px]" />
      <div className="pointer-events-none fixed bottom-0 right-1/4 w-[500px] h-[500px] bg-cyber-cyan/10 rounded-full blur-[150px]" />

      {/* Шапка со скрытой пасхалкой (5 кликов по логотипу без отображения счетчика) */}
      <PublicHeader />

      <div className="max-w-6xl mx-auto px-6 pt-16 pb-24 w-full">
        {/* 1. HERO СЕКЦИЯ */}
        <section className="mb-16">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-obsidian-card border border-obsidian-border text-xs font-mono text-cyber-cyan mb-6">
            <Sparkles className="w-3.5 h-3.5 text-cyber-crimson" />
            <span>MAINFRAME</span>
            <span className="text-slate-600">//</span>
            <span className="text-cyber-purple font-bold">NEXT-GEN DIGITAL HUB</span>
          </div>

          <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight mb-6 leading-[1.1]">
            Архитектура цифровых <br />
            <span className="bg-gradient-to-r from-cyber-purple via-cyber-cyan to-cyber-crimson bg-clip-text text-transparent">
              экосистем и проектов
            </span>
          </h1>

          <p className="max-w-2xl text-slate-400 text-lg md:text-xl leading-relaxed mb-8">
            Я MainFrame — Full-stack разработчик и создатель цифровых сервисов. Переношу
            передовые практики и визуальные технологии крупных корпораций в кастомные
            продукты: от сложных веб-платформ и работы с данными до интерактивных
            интерфейсов нового поколения.
          </p>

          <div className="flex flex-wrap items-center gap-4">
            <a
              href="#contact"
              className="px-6 py-3.5 rounded-xl bg-cyber-purple hover:bg-cyber-purple/90 text-white font-medium text-sm transition-all shadow-[0_0_25px_rgba(139,92,246,0.4)] flex items-center gap-2"
            >
              Заказать разработку <ArrowRight className="w-4 h-4" />
            </a>
            <a
              href="#projects"
              className="px-6 py-3.5 rounded-xl bg-obsidian-card border border-obsidian-border hover:border-cyber-cyan/50 text-slate-200 font-medium text-sm transition-all"
            >
              Исследовать экосистему
            </a>
          </div>

          {/* Мини-панель инженерных преимуществ с подсветкой курсора */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-12 pt-8 border-t border-obsidian-border/60 font-mono text-xs">
            <SpotlightCard spotlightColor="cyan" className="p-4">
              <div className="flex items-center gap-3 text-slate-300">
                <Code2 className="w-5 h-5 text-cyber-cyan shrink-0" />
                <div>
                  <div className="font-bold text-white">MODERN FULL-STACK</div>
                  <div className="text-slate-500">TypeScript, Next.js 15, Node.js</div>
                </div>
              </div>
            </SpotlightCard>

            <SpotlightCard spotlightColor="purple" className="p-4">
              <div className="flex items-center gap-3 text-slate-300">
                <Database className="w-5 h-5 text-cyber-purple shrink-0" />
                <div>
                  <div className="font-bold text-white">DATA & SECURITY</div>
                  <div className="text-slate-500">Prisma ORM, SQL, Secure Relay</div>
                </div>
              </div>
            </SpotlightCard>

            <SpotlightCard spotlightColor="crimson" className="p-4">
              <div className="flex items-center gap-3 text-slate-300">
                <Activity className="w-5 h-5 text-cyber-crimson shrink-0" />
                <div>
                  <div className="font-bold text-white">REAL-TIME TELEMETRY</div>
                  <div className="text-slate-500">Живая синхронизация узлов</div>
                </div>
              </div>
            </SpotlightCard>
          </div>
        </section>

        {/* 2. ТОПОЛОГИЯ ПРОЕКТОВ */}
        <section id="neural-hub" className="mb-20 scroll-mt-24">
          <div className="flex items-center justify-between mb-4">
            <span className="text-xs font-mono text-cyber-cyan tracking-wider uppercase">
              // Интерактивная топология экосистемы
            </span>
            <span className="text-xs font-mono text-slate-500">REAL-TIME TELEMETRY</span>
          </div>
          <NeuralHub projects={publicProjects} />
        </section>

        {/* 3. ВИТРИНА ФЛАГМАНСКИХ ПРОЕКТОВ */}
        <section id="projects" className="mb-20 scroll-mt-24">
          <div className="flex flex-col md:flex-row md:items-end justify-between mb-8 gap-4">
            <div>
              <div className="text-xs font-mono text-cyber-cyan uppercase tracking-widest mb-2">
                // PRODUCTION SHOWCASE
              </div>
              <h2 className="text-3xl md:text-4xl font-bold tracking-tight">
                Запущенные проекты и экосистемы
              </h2>
            </div>
            <p className="text-slate-400 text-sm max-w-md">
              Действующие коммерческие и инфраструктурные продукты. Нажмите на досье
              проекта, чтобы изучить архитектуру и этапы реализации.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <ProjectsShowcase projects={publicProjects} />
          </div>
        </section>

        {/* 4. ВНУТРЕННИЕ МОДУЛИ ХАБА (С фирменной подсветкой SpotlightCard) */}
        <section id="core-modules" className="mb-20 scroll-mt-24">
          <div className="flex flex-col md:flex-row md:items-end justify-between mb-8 gap-4">
            <div>
              <div className="text-xs font-mono text-cyber-purple uppercase tracking-widest mb-2">
                // INTERNAL CORE CAPABILITIES
              </div>
              <h2 className="text-3xl md:text-4xl font-bold tracking-tight">
                Внутренние микросервисы MainFrame Hub
              </h2>
            </div>
            <p className="text-slate-400 text-sm max-w-md">
              Собственные прикладные инструменты, развернутые внутри платформы для
              работы с шифрованием, бизнес-логикой и медиапотоками.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Карточка 1 */}
            <SpotlightCard
              spotlightColor="crimson"
              className="group p-6 flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between mb-5">
                  <div className="p-3 rounded-xl bg-cyber-crimson/10 border border-cyber-crimson/30 text-cyber-crimson">
                    <HardDrive className="w-5 h-5" />
                  </div>
                  <span className="text-[11px] font-mono px-2.5 py-0.5 rounded-full bg-black/50 border border-obsidian-border text-slate-400">
                    SECURE STORAGE
                  </span>
                </div>
                <h3 className="text-xl font-bold text-white mb-2 group-hover:text-cyber-crimson transition-colors">
                  Зашифрованное облако
                </h3>
                <p className="text-sm text-slate-400 leading-relaxed mb-6">
                  Приватное файловое хранилище с криптографическим шифрованием на лету,
                  изоляцией данных и безопасной передачей пакетов.
                </p>
              </div>
              <div className="pt-4 border-t border-obsidian-border/60 flex items-center justify-between text-xs font-mono">
                <span className="text-slate-500">AES-256 / Streams</span>
                <span className="text-cyber-crimson">Internal Module</span>
              </div>
            </SpotlightCard>

            {/* Карточка 2 */}
            <SpotlightCard
              spotlightColor="cyan"
              className="group p-6 flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between mb-5">
                  <div className="p-3 rounded-xl bg-cyber-cyan/10 border border-cyber-cyan/30 text-cyber-cyan">
                    <Users className="w-5 h-5" />
                  </div>
                  <span className="text-[11px] font-mono px-2.5 py-0.5 rounded-full bg-black/50 border border-obsidian-border text-slate-400">
                    BUSINESS LOGIC
                  </span>
                </div>
                <h3 className="text-xl font-bold text-white mb-2 group-hover:text-cyber-cyan transition-colors">
                  Mini CRM & Контроль этапов
                </h3>
                <p className="text-sm text-slate-400 leading-relaxed mb-6">
                  Внутренняя система трекинга заявок, управления стадиями разработки и
                  синхронизации статусов проектов в реальном времени.
                </p>
              </div>
              <div className="pt-4 border-t border-obsidian-border/60 flex items-center justify-between text-xs font-mono">
                <span className="text-slate-500">Prisma ORM / Next.js</span>
                <span className="text-cyber-cyan">Active Engine</span>
              </div>
            </SpotlightCard>

            {/* Карточка 3 */}
            <SpotlightCard
              spotlightColor="purple"
              className="group p-6 flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between mb-5">
                  <div className="p-3 rounded-xl bg-cyber-purple/10 border border-cyber-purple/30 text-cyber-purple">
                    <Radio className="w-5 h-5" />
                  </div>
                  <span className="text-[11px] font-mono px-2.5 py-0.5 rounded-full bg-black/50 border border-obsidian-border text-slate-400">
                    AUDIO & UI ENGINE
                  </span>
                </div>
                <h3 className="text-xl font-bold text-white mb-2 group-hover:text-cyber-purple transition-colors">
                  Аудио-поток & Кастомные темы
                </h3>
                <p className="text-sm text-slate-400 leading-relaxed mb-6">
                  Встроенный потоковый аудио-модуль для рабочего фокуса и движок
                  мгновенного переключения визуальных палитр интерфейса.
                </p>
              </div>
              <div className="pt-4 border-t border-obsidian-border/60 flex items-center justify-between text-xs font-mono">
                <span className="text-slate-500">Web Audio API / CSS</span>
                <span className="text-emerald-400">ACTIVE HUD</span>
              </div>
            </SpotlightCard>
          </div>
        </section>

        {/* 5. НАПРАВЛЕНИЯ РАЗРАБОТКИ (С подсветкой SpotlightCard) */}
        <section id="services" className="mb-20 scroll-mt-24">
          <div className="text-xs font-mono text-cyber-crimson uppercase tracking-widest mb-2">
            // ARCHITECTURE & SERVICES
          </div>
          <h2 className="text-3xl md:text-4xl font-bold tracking-tight mb-8">
            Направления разработки и инженерный стандарт
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
            <SpotlightCard spotlightColor="purple" className="p-6">
              <Cpu className="w-6 h-6 text-cyber-purple mb-4" />
              <h3 className="text-lg font-bold text-white mb-2">
                Full-Stack и SaaS под ключ
              </h3>
              <p className="text-sm text-slate-400 leading-relaxed">
                Проектирование и запуск сложных веб-приложений, личных кабинетов,
                дашбордов и клиентских порталов с продуманной базой данных и API.
              </p>
            </SpotlightCard>

            <SpotlightCard spotlightColor="cyan" className="p-6">
              <Layers className="w-6 h-6 text-cyber-cyan mb-4" />
              <h3 className="text-lg font-bold text-white mb-2">
                Интерактивный UI и Анимации
              </h3>
              <p className="text-sm text-slate-400 leading-relaxed">
                Создание имиджевых сайтов и интерфейсов уровня топовых техно-корпораций:
                глубокая темная эстетика, плавная динамика и мгновенный отклик.
              </p>
            </SpotlightCard>

            <SpotlightCard spotlightColor="crimson" className="p-6">
              <ShieldCheck className="w-6 h-6 text-cyber-crimson mb-4" />
              <h3 className="text-lg font-bold text-white mb-2">
                Инфраструктура и Безопасность
              </h3>
              <p className="text-sm text-slate-400 leading-relaxed">
                Настройка сетевой маршрутизации, защита данных, интеграция ботов,
                платежных шлюзов и прямое сопровождение проекта без посредников.
              </p>
            </SpotlightCard>
          </div>
        </section>

        {/* 6. ФОРМА СВЯЗИ ДЛЯ КЛИЕНТОВ */}
        <section id="contact" className="scroll-mt-24">
          <ContactSection />
        </section>
      </div>

      {/* КОРПОРАТИВНЫЙ ФУТЕР */}
      <footer className="border-t border-obsidian-border bg-obsidian-card/60 backdrop-blur-md">
        <div className="max-w-6xl mx-auto px-6 py-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs font-mono text-slate-400">
          <div className="flex items-center gap-3">
            <Terminal className="w-4 h-4 text-cyber-cyan" />
            <span className="text-slate-200 font-bold">MAINFRAME // NG-HUB</span>
            <span>© {new Date().getFullYear()} // ALL SYSTEMS OPERATIONAL</span>
          </div>

          <div className="flex items-center gap-6">
            <a
              href="https://okaeri-gaming.ru/"
              target="_blank"
              rel="noreferrer"
              className="hover:text-cyber-cyan transition-colors"
            >
              Okaeri Gaming
            </a>
            <a
              href="https://github.com/MainFrame-nk"
              target="_blank"
              rel="noreferrer"
              className="hover:text-cyber-cyan transition-colors"
            >
              GitHub
            </a>
            <a
              href="https://t.me/mainframe_division"
              target="_blank"
              rel="noreferrer"
              className="hover:text-cyber-cyan transition-colors"
            >
              Telegram
            </a>
            <a
              href="https://discord.gg/Q4BNTQANcH"
              target="_blank"
              rel="noreferrer"
              className="hover:text-cyber-purple transition-colors"
            >
              Discord
            </a>
          </div>
        </div>
      </footer>
    </main>
  );
}