import { prisma } from "@/lib/prisma";
import { cookies } from "next/headers";
import {
  ensureSeedData,
  checkVaultAuth,
  requestVaultLogin,
  verifyVaultCode,
  logoutFromVault,
  updateLeadStatus,
  deleteLead,
} from "@/app/actions";
import SpotlightCard from "@/components/SpotlightCard";
import VaultDashboard from "@/components/VaultDashboard";
import CloudVaultWidget from "@/components/CloudVaultWidget";
import { decryptText } from "@/lib/encryption";
import Link from "next/link";
import {
  ArrowLeft,
  Trash2,
  Lock,
  LogOut,
  Inbox,
  CheckCircle,
  Clock,
} from "lucide-react";

export default async function VaultPage() {
  await ensureSeedData();
  const isAuthenticated = await checkVaultAuth();

  if (!isAuthenticated) {
    const cookieStore = await cookies();
    const waiting2FA = cookieStore.get("mainframe_waiting_2fa")?.value === "true";

    return (
      <main className="min-h-screen bg-obsidian text-slate-100 flex items-center justify-center p-6">
        <SpotlightCard spotlightColor="crimson" className="max-w-md w-full p-8">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-3 rounded-xl bg-cyber-crimson/15 border border-cyber-crimson/40 text-cyber-crimson">
              <Lock className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-xl font-bold">
                {waiting2FA ? "Двухфакторная защита" : "Доступ ограничен"}
              </h1>
              <p className="text-xs font-mono text-slate-400">MAINFRAME CORE // 2FA SECURE</p>
            </div>
          </div>

          {!waiting2FA ? (
            /* ШАГ 1: ВВОД ПАРОЛЯ */
            <form action={requestVaultLogin} className="space-y-4">
              <div>
                <label className="block text-xs font-mono text-slate-400 mb-2">
                  МАСТЕР-КЛЮЧ (.env VAULT_PASSWORD):
                </label>
                <input
                  type="password"
                  name="password"
                  placeholder="••••••••••••••••"
                  required
                  className="w-full px-4 py-3 rounded-xl bg-obsidian border border-obsidian-border focus:border-cyber-crimson outline-none font-mono text-sm"
                />
              </div>
              <button
                type="submit"
                className="w-full py-3 rounded-xl bg-cyber-crimson hover:bg-cyber-crimson/90 text-white font-mono text-xs font-bold transition-all shadow-[0_0_20px_rgba(255,42,95,0.3)] cursor-pointer"
              >
                ЗАПРОСИТЬ КОД В TELEGRAM
              </button>
            </form>
          ) : (
            /* ШАГ 2: ВВОД 6-ЗНАЧНОГО КОДА ИЗ TELEGRAM */
            <form action={verifyVaultCode} className="space-y-4">
              <div className="p-3 rounded-xl bg-obsidian border border-cyber-cyan/30 text-xs font-mono text-cyber-cyan mb-2">
                💬 Код подтверждения отправлен в ваш Telegram. Проверьте сообщения.
              </div>
              <div>
                <label className="block text-xs font-mono text-slate-400 mb-2">
                  ВВЕДИТЕ 6-ЗНАЧНЫЙ КОД:
                </label>
                <input
                  type="text"
                  name="code"
                  placeholder="123456"
                  maxLength={6}
                  required
                  autoFocus
                  className="w-full px-4 py-3 rounded-xl bg-obsidian border border-obsidian-border focus:border-cyber-cyan outline-none font-mono text-lg text-center tracking-widest text-white"
                />
              </div>
              <button
                type="submit"
                className="w-full py-3 rounded-xl bg-cyber-cyan hover:bg-cyber-cyan/90 text-obsidian font-mono text-xs font-bold transition-all shadow-[0_0_20px_rgba(0,240,255,0.3)] cursor-pointer"
              >
                ПОДТВЕРДИТЬ И ВОИТИ
              </button>
            </form>
          )}

          <div className="mt-6 pt-4 border-t border-obsidian-border text-center">
            <Link href="/" className="text-xs font-mono text-slate-500 hover:text-cyber-cyan">
              ← На главную витрину
            </Link>
          </div>
        </SpotlightCard>
      </main>

    );
  }

  // Загружаем проекты вместе с их этапами (stages)
  const projects = await prisma.project.findMany({
    include: {
      stages: {
        orderBy: { order: "asc" },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  const leads = await prisma.lead.findMany({
    orderBy: { createdAt: "desc" },
  });

  const cloudFiles = await prisma.cloudFile.findMany({
    orderBy: { createdAt: "desc" },
  });

  const rawNotes = await prisma.note.findMany({
    include: { project: true },
    orderBy: { createdAt: "desc" },
  });

  const notes = rawNotes.map((note) => ({
    ...note,
    content: decryptText(note.content),
    title: decryptText(note.title), // Можно зашифровать и заголовки тоже
  }));

  return (
    <main className="min-h-screen bg-obsidian text-slate-100 p-6 md:p-12">
      <div className="max-w-6xl mx-auto">
        {/* Верхняя панель */}
        <div className="flex flex-wrap items-center justify-between gap-4 mb-10 pb-6 border-b border-obsidian-border">
          <div>
            <Link
              href="/"
              className="inline-flex items-center gap-2 text-xs font-mono text-cyber-cyan hover:underline mb-2"
            >
              <ArrowLeft className="w-4 h-4" /> НА ПУБЛИЧНУЮ ВИТРИНУ
            </Link>
            <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight">
              MainFrame <span className="text-cyber-purple">Life & Dev OS</span>
            </h1>
          </div>

          <div className="flex items-center gap-3">
            <span className="px-3 py-1.5 rounded-lg bg-obsidian-card border border-obsidian-border text-xs font-mono text-cyber-cyan">
              PRIVATE SQLITE VAULT
            </span>
            <form action={logoutFromVault}>
              <button className="px-3 py-1.5 rounded-lg bg-obsidian-card border border-obsidian-border hover:border-cyber-crimson text-xs font-mono text-slate-300 flex items-center gap-1.5 transition-colors cursor-pointer">
                <LogOut className="w-3.5 h-3.5 text-cyber-crimson" /> Заблокировать
              </button>
            </form>
          </div>
        </div>

        {/* МОДУЛЬ ОБЛАЧНОГО ХРАНИЛИЩА */}
        <CloudVaultWidget files={cloudFiles} />

        {/* ИНТЕРАКТИВНЫЙ ДАШБОРД СФЕР ЖИЗНИ, РОАДМАПОВ, ЗАМЕТОК И ЗАЯВОК*/}
        <VaultDashboard projects={projects} notes={notes} leads={leads} />
      </div>
    </main>
  );
}