import { prisma } from "@/lib/prisma";
import SpotlightCard from "@/components/SpotlightCard";
import { ShieldCheck, Lock, FileText, Clock, AlertTriangle, Download } from "lucide-react";
import Link from "next/link";

export const dynamic = "force-dynamic";

function formatBytes(bytes: number) {
  if (bytes === 0) return "0 Bytes";
  const k = 1024;
  const sizes = ["Bytes", "KB", "MB", "GB", "TB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
}

export default async function SharedFilePage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;

  const share = await prisma.sharedLink.findUnique({
    where: { token },
    include: { file: true },
  });

  const isExpired = share?.expiresAt && new Date() > share.expiresAt;
  const isLimitReached =
    share?.maxDownloads && share.downloadCount >= share.maxDownloads;

  // Если время вышло или лимит исчерпан — физически удаляем ссылку из БД!
  if (share && (isExpired || isLimitReached)) {
    await prisma.sharedLink.delete({ where: { id: share.id } }).catch(() => {});
  }

  if (!share || isExpired || isLimitReached) {
    return (
      <main className="min-h-screen bg-obsidian text-slate-100 flex items-center justify-center p-6">
        <SpotlightCard spotlightColor="crimson" className="max-w-md w-full p-8 text-center">
          <AlertTriangle className="w-12 h-12 text-cyber-crimson mx-auto mb-4" />
          <h1 className="text-xl font-bold text-white mb-2">
            Ссылка недействительна или сгорела
          </h1>
          <p className="text-xs font-mono text-slate-400 mb-6">
            Срок действия секретной ссылки истек, либо исчерпан лимит скачиваний файла. Ссылка уничтожена.
          </p>
          <Link
            href="/"
            className="inline-block px-5 py-2.5 rounded-xl bg-obsidian border border-obsidian-border text-xs font-mono text-cyber-cyan hover:border-cyber-cyan"
          >
            Перейти в MainFrame Hub
          </Link>
        </SpotlightCard>
      </main>
    );
  }

  const requiresPassword = Boolean(share.passwordHash);

  return (
    <main className="min-h-screen bg-obsidian text-slate-100 flex items-center justify-center p-6">
      <SpotlightCard spotlightColor="purple" className="max-w-md w-full p-8">
        <div className="flex items-center justify-between mb-6 pb-4 border-b border-obsidian-border">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-cyber-cyan" />
            <span className="font-mono text-xs font-bold tracking-wider text-cyber-cyan">
              MAINFRAME // SECURE GATEWAY
            </span>
          </div>
          <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-cyber-purple/15 text-cyber-purple border border-cyber-purple/30">
            AES-256-CTR
          </span>
        </div>

        <div className="p-4 rounded-2xl bg-obsidian border border-obsidian-border mb-6 flex items-center gap-4">
          <div className="p-3 rounded-xl bg-obsidian-card border border-obsidian-border text-cyber-purple shrink-0">
            <FileText className="w-6 h-6" />
          </div>
          <div className="overflow-hidden">
            <div className="text-sm font-bold text-white truncate">{share.file.name}</div>
            <div className="text-xs font-mono text-slate-400 mt-1">
              Размер: <span className="text-cyber-cyan">{formatBytes(share.file.size)}</span>
            </div>
          </div>
        </div>

        <div className="space-y-2 mb-6 text-xs font-mono text-slate-400">
          {share.expiresAt && (
            <div className="flex items-center justify-between px-3 py-2 rounded-lg bg-obsidian/60 border border-obsidian-border">
              <span className="flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-cyber-cyan" /> Ссылка активна до:
              </span>
              <span className="text-white">
                {new Date(share.expiresAt).toLocaleString("ru-RU")}
              </span>
            </div>
          )}
          {share.maxDownloads && (
            <div className="flex items-center justify-between px-3 py-2 rounded-lg bg-obsidian/60 border border-obsidian-border">
              <span>Осталось скачиваний:</span>
              <span className="text-emerald-400 font-bold">
                {share.maxDownloads - share.downloadCount} из {share.maxDownloads}
              </span>
            </div>
          )}
        </div>

        <form
          action={`/api/vault/file/${share.file.id}`}
          method="GET"
          className="space-y-4"
        >
          <input type="hidden" name="token" value={share.token} />

          {requiresPassword && (
            <div>
              <label className="block text-xs font-mono text-slate-300 mb-2 flex items-center gap-1.5">
                <Lock className="w-3.5 h-3.5 text-amber-400" /> Файл защищен паролем:
              </label>
              <input
                type="password"
                name="pass"
                required
                placeholder="Введите пароль доступа..."
                className="w-full px-4 py-3 rounded-xl bg-obsidian border border-obsidian-border text-sm text-white font-mono focus:outline-none focus:border-cyber-purple"
              />
            </div>
          )}

          <button
            type="submit"
            className="w-full py-3.5 rounded-xl bg-gradient-to-r from-cyber-purple to-cyber-cyan text-slate-950 font-mono text-xs font-extrabold tracking-wide flex items-center justify-center gap-2 shadow-lg hover:opacity-95 transition-opacity cursor-pointer"
          >
            <Download className="w-4 h-4" /> РАСШИФРОВАТЬ И СКАЧАТЬ ФАЙЛ
          </button>
        </form>
      </SpotlightCard>
    </main>
  );
}