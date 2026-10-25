import NeuralHub from "@/components/NeuralHub";
import ContactSection from "@/components/ContactSection";
import ProjectsShowcase from "@/components/ProjectsShowcase";
import { prisma } from "@/lib/prisma";
import { ensureSeedData } from "@/app/actions";
import Link from "next/link";
import {
  Lock,
  Sparkles,
  Terminal,
  ArrowRight,
  Activity,
  Code2,
  Database,
} from "lucide-react";

export default async function Home() {
  await ensureSeedData();

  const publicProjects = await prisma.project.findMany({
    where: { isPublic: true },
    include: {
      stages: {
        orderBy: { order: "asc" },
      },
    },
    orderBy: { createdAt: "asc" },
  });

  return (
    <main className="relative min-h-screen bg-obsidian text-slate-100 selection:bg-cyber-purple selection:text-white overflow-hidden flex flex-col justify-between">
      {/* Фоновые световые пятна */}
      <div className="pointer-events-none fixed top-0 left-1/4 w-[500px] h-[500px] bg-cyber-purple/10 rounded-full blur-[150px]" />
      <div className="pointer-events-none fixed bottom-0 right-1/4 w-[500px] h-[500px] bg-cyber-cyan/10 rounded-full blur-[150px]" />

      {/* Навигационный бар (HUD) */}
      <header className="sticky top-0 z-40 border-b border-obsidian-border/80 bg-obsidian/80 backdrop-blur-md">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-3 h-3 rounded-full bg-cyber-crimson shadow-[0_0_12px_#FF2A5F]" />
            <span className="font-mono font-bold tracking-wider text-sm">
              MAINFRAME<span className="text-cyber-cyan">.DEV</span>
            </span>
          </div>

          <nav className="hidden md:flex items-center gap-8 text-sm text-slate-400">
            <a href="#neural-hub" className="hover:text-cyber-cyan transition-colors">
              Нейро-узел
            </a>
            <a href="#projects" className="hover:text-cyber-cyan transition-colors">
              Проекты ({publicProjects.length})
            </a>
            <a href="#contact" className="hover:text-cyber-cyan transition-colors">
              Сотрудничество
            </a>
          </nav>

          <Link
            href="/vault"
            className="flex items-center gap-2 px-4 py-1.5 rounded-lg bg-obsidian-card border border-obsidian-border hover:border-cyber-purple/60 text-xs font-mono text-slate-200 transition-all"
          >
            <Lock className="w-3.5 h-3.5 text-cyber-purple" />
            Core Vault
          </Link>
        </div>
      </header>

      <div className="max-w-6xl mx-auto px-6 pt-16 pb-24 w-full">
        {/* HERO СЕКЦИЯ */}
        <section className="mb-14">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-obsidian-card border border-obsidian-border text-xs font-mono text-cyber-cyan mb-6">
            <Sparkles className="w-3.5 h-3.5 text-cyber-crimson" />
            <span>FULL-STACK ARCHITECT</span>
            <span className="text-slate-600">//</span>
            <span className="text-cyber-purple font-bold">MAINFRAME BRAND</span>
          </div>

          <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight mb-6 leading-[1.1]">
            Архитектура цифровых <br />
            <span className="bg-gradient-to-r from-cyber-purple via-cyber-cyan to-cyber-crimson bg-clip-text text-transparent">
              экосистем и проектов
            </span>
          </h1>

          <p className="max-w-2xl text-slate-400 text-lg md:text-xl leading-relaxed mb-8">
            Создаю быстрые веб-платформы, игровые хабы и масштабируемые сервисы с корпоративным качеством кода и современным интерактивным дизайном.
          </p>

          {/* Кнопки быстрого действия + Телеметрия ядра */}
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

          {/* Мини-панель инженерных преимуществ */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-12 pt-8 border-t border-obsidian-border/60 font-mono text-xs">
            <div className="flex items-center gap-3 text-slate-300">
              <Code2 className="w-5 h-5 text-cyber-cyan shrink-0" />
              <div>
                <div className="font-bold text-white">MODERN FULL-STACK</div>
                <div className="text-slate-500">TypeScript, Next.js 15, Node.js</div>
              </div>
            </div>
            <div className="flex items-center gap-3 text-slate-300">
              <Database className="w-5 h-5 text-cyber-purple shrink-0" />
              <div>
                <div className="font-bold text-white">DATA & SECURITY</div>
                <div className="text-slate-500">Prisma ORM, SQL, Multi-Server Relay</div>
              </div>
            </div>
            <div className="flex items-center gap-3 text-slate-300">
              <Activity className="w-5 h-5 text-cyber-crimson shrink-0" />
              <div>
                <div className="font-bold text-white">REAL-TIME TELEMETRY</div>
                <div className="text-slate-500">Живая синхронизация узлов</div>
              </div>
            </div>
          </div>
        </section>

        {/* ИНТЕРАКТИВНАЯ АНИМАЦИЯ СВЯЗЕЙ МЕЖДУ ПРОЕКТАМИ */}
        <section id="neural-hub" className="mb-16">
          <div className="flex items-center justify-between mb-4">
            <span className="text-xs font-mono text-cyber-cyan tracking-wider uppercase">
              // Интерактивная топология проектов
            </span>
            <span className="text-xs font-mono text-slate-500">REAL-TIME TELEMETRY</span>
          </div>
          <NeuralHub projects={publicProjects} />
        </section>

        {/* BENTO GRID С МОДАЛЬНЫМИ ДОСЬЕ ПРОЕКТОВ */}
        <section id="projects" className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <ProjectsShowcase projects={publicProjects} />

          {/* ФОРМА СВЯЗИ ДЛЯ КЛИЕНТОВ */}
          <div id="contact" className="md:col-span-3">
            <ContactSection />
          </div>
        </section>
      </div>

      {/* КОРПОРАТИВНЫЙ ФУТЕР (ПОДВАЛ САЙТА) */}
      <footer className="border-t border-obsidian-border bg-obsidian-card/60 backdrop-blur-md">
        <div className="max-w-6xl mx-auto px-6 py-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs font-mono text-slate-400">
          <div className="flex items-center gap-3">
            <Terminal className="w-4 h-4 text-cyber-cyan" />
            <span className="text-slate-200 font-bold">MAINFRAME HUB</span>
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
            <Link href="/vault" className="text-cyber-crimson hover:underline">
              Vault Login
            </Link>
          </div>
        </div>
      </footer>
    </main>
  );
}