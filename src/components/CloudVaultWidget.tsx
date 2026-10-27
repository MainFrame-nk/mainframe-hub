"use client";

import React, { useState } from "react";
import { deleteCloudFile, createSharedLink, deleteSharedLink } from "@/app/actions";
import {
  Cloud,
  Upload,
  FileText,
  Download,
  Trash2,
  HardDrive,
  Share2,
  Lock,
  Clock,
  ShieldCheck,
  Copy,
  Check,
  X,
  KeyRound,
} from "lucide-react";

interface SharedLinkItem {
  id: string;
  token: string;
  passwordHash: string | null;
  expiresAt: Date | null;
  maxDownloads: number | null;
  downloadCount: number;
}

interface CloudFileItem {
  id: string;
  name: string;
  size: number;
  mimeType: string;
  fileUrl: string;
  isEncrypted?: boolean;
  shares?: SharedLinkItem[];
  createdAt: Date;
}

export default function CloudVaultWidget({ files }: { files: CloudFileItem[] }) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [statusText, setStatusText] = useState("");

  // Состояние модалки шеринга
  const [shareModalFile, setShareModalFile] = useState<CloudFileItem | null>(null);
  const [sharePassword, setSharePassword] = useState("");
  const [shareTtl, setShareTtl] = useState("24"); // По умолчанию 24 часа
  const [shareMaxDownloads, setShareMaxDownloads] = useState("0");
  const [createdToken, setCreatedToken] = useState<string | null>(null);
  const [copiedToken, setCopiedToken] = useState<string | null>(null);

  const totalBytesUsed = files.reduce((acc, f) => acc + f.size, 0);
  const totalGBUsed = (totalBytesUsed / (1024 * 1024 * 1024)).toFixed(2);
  const maxStorageGB = 1000; // Например 1 ТБ VPS Storage
  const usagePercent = Math.min(100, Math.max(1, (Number(totalGBUsed) / maxStorageGB) * 100));

  function formatBytes(bytes: number) {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB", "TB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    if (e.target.files && e.target.files[0]) {
      setSelectedFile(e.target.files[0]);
    }
  }

  function handleUploadSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!selectedFile) return;

    setUploading(true);
    setProgress(0);
    setStatusText("Потоковое шифрование AES-256-CTR...");

    const formData = new FormData();
    formData.append("file", selectedFile);

    const xhr = new XMLHttpRequest();

    xhr.upload.addEventListener("progress", (event) => {
      if (event.lengthComputable) {
        const percentComplete = Math.round((event.loaded / event.total) * 100);
        setProgress(percentComplete);
        setStatusText(`Шифрование и передача: ${percentComplete}%`);
      }
    });

    xhr.addEventListener("load", () => {
      if (xhr.status === 200) {
        setStatusText("Зашифровано и сохранено в хранилище!");
        setProgress(100);
        setSelectedFile(null);
        setTimeout(() => {
          setUploading(false);
          setProgress(0);
          setStatusText("");
          window.location.reload();
        }, 700);
      } else {
        setStatusText("Ошибка загрузки!");
        setUploading(false);
      }
    });

    xhr.addEventListener("error", () => {
      setStatusText("Ошибка сети!");
      setUploading(false);
    });

    xhr.open("POST", "/api/upload", true);
    xhr.send(formData);
  }

  async function handleCreateShare(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!shareModalFile) return;

    const fd = new FormData();
    fd.append("fileId", shareModalFile.id);
    fd.append("password", sharePassword);
    fd.append("ttlHours", shareTtl);
    fd.append("maxDownloads", shareMaxDownloads);

    const res = await createSharedLink(fd);
    if (res?.token) {
      setCreatedToken(res.token);
      setSharePassword("");
    }
  }

  function copyShareUrl(token: string) {
    const url = `${window.location.origin}/s/${token}`;
    navigator.clipboard.writeText(url);
    setCopiedToken(token);
    setTimeout(() => setCopiedToken(null), 2000);
  }

  return (
    <div className="mb-12 p-6 md:p-8 rounded-3xl bg-obsidian-card border border-obsidian-border shadow-2xl relative">
      {/* Шапка Хранилища */}
      <div className="flex flex-wrap items-center justify-between gap-4 mb-6 pb-4 border-b border-obsidian-border">
        <div>
          <h2 className="text-xl font-bold flex items-center gap-2 text-white">
            <Cloud className="w-5 h-5 text-cyber-cyan" /> MainFrame Zero-Knowledge Vault
            <span className="px-2 py-0.5 text-[10px] font-mono rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 flex items-center gap-1">
              <ShieldCheck className="w-3 h-3" /> AES-256-CTR STREAM
            </span>
          </h2>
          <p className="text-xs font-mono text-slate-400 mt-1">
            Потоковое шифрование на лету. На диске хостера хранится только зашифрованный бинарный шум.
          </p>
        </div>

        <div className="bg-obsidian px-4 py-2.5 rounded-2xl border border-obsidian-border min-w-[230px]">
          <div className="flex items-center justify-between text-xs font-mono mb-1.5">
            <span className="text-slate-400 flex items-center gap-1.5">
              <HardDrive className="w-3.5 h-3.5 text-cyber-purple" /> Encrypted Node
            </span>
            <span className="text-cyber-cyan font-bold">{totalGBUsed} GB / 1 TB</span>
          </div>
          <div className="w-full h-1.5 rounded-full bg-obsidian-card overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-cyber-purple to-cyber-cyan transition-all duration-500"
              style={{ width: `${usagePercent}%` }}
            />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Левая колонка: Загрузка */}
        <div className="lg:col-span-4 p-6 rounded-2xl bg-obsidian border border-obsidian-border">
          <h3 className="text-sm font-bold text-white mb-3 flex items-center gap-2">
            <Upload className="w-4 h-4 text-cyber-cyan" /> Зашифровать и загрузить файл
          </h3>

          <form onSubmit={handleUploadSubmit} className="space-y-4">
            <div className="border-2 border-dashed border-obsidian-border hover:border-cyber-cyan/60 rounded-xl p-6 text-center transition-colors relative cursor-pointer">
              <input
                type="file"
                name="file"
                required
                onChange={handleFileChange}
                className="absolute inset-0 opacity-0 cursor-pointer w-full h-full z-10"
              />
              <Upload className="w-8 h-8 text-slate-500 mx-auto mb-2" />
              <div className="text-xs font-mono text-slate-300">
                {selectedFile ? (
                  <span className="text-cyber-cyan font-bold block truncate">
                    🔒 {selectedFile.name}
                  </span>
                ) : (
                  "Перетащите файл или кликните"
                )}
              </div>
              <div className="text-[10px] font-mono text-slate-500 mt-1">
                {selectedFile
                  ? `${formatBytes(selectedFile.size)} • Готов к шифрованию`
                  : "Любой размер (до 5–10 ГБ без Base64)"}
              </div>
            </div>

            {uploading && (
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs font-mono">
                  <span className="text-slate-400 truncate max-w-[190px]">{statusText}</span>
                  <span className="text-cyber-cyan font-bold">{progress}%</span>
                </div>
                <div className="w-full h-2 rounded-full bg-obsidian-card overflow-hidden border border-obsidian-border">
                  <div
                    className="h-full bg-gradient-to-r from-cyber-purple to-cyber-cyan transition-all duration-150"
                    style={{ width: `${progress}%` }}
                  />
                </div>
              </div>
            )}

            <button
              type="submit"
              disabled={uploading || !selectedFile}
              className="w-full py-3 rounded-xl bg-cyber-cyan/20 hover:bg-cyber-cyan/30 border border-cyber-cyan/50 text-cyber-cyan font-mono text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-40"
            >
              {uploading ? `ШИФРОВАНИЕ (${progress}%)...` : "ЗАШИФРОВАТЬ В ХРАНИЛИЩЕ"}
            </button>
          </form>
        </div>

        {/* Правая колонка: Список зашифрованных файлов */}
        <div className="lg:col-span-8">
          <h3 className="text-sm font-bold text-white mb-3 flex items-center gap-2">
            <FileText className="w-4 h-4 text-cyber-purple" /> Зашифрованные объекты ({files.length})
          </h3>

          {files.length === 0 ? (
            <div className="p-8 rounded-2xl bg-obsidian border border-obsidian-border text-center text-slate-500 font-mono text-xs">
              Хранилище пусто. Загрузите первый файл для потокового шифрования.
            </div>
          ) : (
            <div className="space-y-3 max-h-[380px] overflow-y-auto pr-2">
              {files.map((file) => (
                <div
                  key={file.id}
                  className="p-4 rounded-xl bg-obsidian border border-obsidian-border hover:border-obsidian-border/80 transition-colors"
                >
                  <div className="flex items-center justify-between gap-4">
                    <div className="flex items-center gap-3 overflow-hidden">
                      <div className="p-2.5 rounded-lg bg-obsidian-card border border-obsidian-border text-cyber-cyan shrink-0">
                        <Lock className="w-4 h-4" />
                      </div>
                      <div className="overflow-hidden">
                        <div className="text-sm font-medium text-white truncate flex items-center gap-2">
                          <span className="truncate">{file.name}</span>
                          <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-cyber-purple/15 text-cyber-purple border border-cyber-purple/30 shrink-0">
                            AES-256
                          </span>
                        </div>
                        <div className="text-[11px] font-mono text-slate-500 flex items-center gap-2 mt-0.5">
                          <span>{formatBytes(file.size)}</span>
                          <span>•</span>
                          <span>{new Date(file.createdAt).toLocaleDateString("ru-RU")}</span>
                          {file.shares && file.shares.length > 0 && (
                            <>
                              <span>•</span>
                              <span className="text-cyber-cyan">
                                🔗 Активных ссылок: {file.shares.length}
                              </span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      {/* Кнопка создания защищенной ссылки с паролем и таймером */}
                      <button
                        onClick={() => {
                          setShareModalFile(file);
                          setCreatedToken(null);
                        }}
                        className="px-3 py-2 rounded-lg bg-cyber-purple/15 hover:bg-cyber-purple/25 border border-cyber-purple/40 text-cyber-purple font-mono text-xs flex items-center gap-1.5 transition-colors cursor-pointer"
                        title="Поделиться файлом (Пароль / Таймер)"
                      >
                        <Share2 className="w-3.5 h-3.5" />
                        <span className="hidden sm:inline">Поделиться</span>
                      </button>

                      {/* Скачать себе (расшифровка на лету) */}
                      <a
                        href={`/api/vault/file/${file.id}`}
                        download
                        className="p-2 rounded-lg bg-obsidian-card border border-obsidian-border hover:border-cyber-cyan text-slate-300 hover:text-cyber-cyan transition-colors"
                        title="Расшифровать и скачать"
                      >
                        <Download className="w-4 h-4" />
                      </a>

                      <form action={deleteCloudFile.bind(null, file.id)}>
                        <button
                          title="Уничтожить файл"
                          className="p-2 rounded-lg bg-obsidian-card border border-obsidian-border hover:border-cyber-crimson text-slate-400 hover:text-cyber-crimson transition-colors cursor-pointer"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </form>
                    </div>
                  </div>

                  {/* Список активных публичных ссылок этого файла */}
                  {file.shares && file.shares.length > 0 && (
                    <div className="mt-3 pt-3 border-t border-obsidian-border/60 flex flex-wrap gap-2">
                      {file.shares.map((s) => (
                        <div
                          key={s.id}
                          className="flex items-center gap-2 px-2.5 py-1 rounded-lg bg-obsidian-card border border-obsidian-border text-[11px] font-mono text-slate-300"
                        >
                          <span className="text-cyber-cyan">/s/{s.token}</span>
                          {s.passwordHash && (
                            <span title="Защищено паролем" className="text-amber-400">
                              🔑
                            </span>
                          )}
                          <span className="text-slate-500">
                            ({s.downloadCount}
                            {s.maxDownloads ? `/${s.maxDownloads}` : ""} скач.)
                          </span>
                          <button
                            onClick={() => copyShareUrl(s.token)}
                            className="text-slate-400 hover:text-white cursor-pointer"
                            title="Скопировать ссылку"
                          >
                            {copiedToken === s.token ? (
                              <Check className="w-3.5 h-3.5 text-emerald-400" />
                            ) : (
                              <Copy className="w-3.5 h-3.5" />
                            )}
                          </button>
                          <form action={deleteSharedLink.bind(null, s.id)}>
                            <button
                              className="text-slate-500 hover:text-cyber-crimson cursor-pointer"
                              title="Отозвать ссылку"
                            >
                              <X className="w-3.5 h-3.5" />
                            </button>
                          </form>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* МОДАЛЬНОЕ ОКНО СОЗДАНИЯ ЗАЩИЩЕННОЙ ССЫЛКИ */}
      {shareModalFile && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-obsidian-card border border-obsidian-border rounded-3xl max-w-md w-full p-6 shadow-2xl">
            <div className="flex items-center justify-between pb-4 mb-4 border-b border-obsidian-border">
              <div className="flex items-center gap-2">
                <Share2 className="w-5 h-5 text-cyber-purple" />
                <h3 className="font-bold text-white text-base">Секретная ссылка на файл</h3>
              </div>
              <button
                onClick={() => setShareModalFile(null)}
                className="text-slate-400 hover:text-white cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="mb-4 p-3 rounded-xl bg-obsidian border border-obsidian-border text-xs font-mono">
              <div className="text-white font-bold truncate">{shareModalFile.name}</div>
              <div className="text-slate-500 mt-0.5">{formatBytes(shareModalFile.size)}</div>
            </div>

            {createdToken ? (
              <div className="space-y-4">
                <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-center">
                  <div className="text-xs font-mono text-emerald-400 mb-2">
                    ✅ ЗАЩИЩЕННАЯ ССЫЛКА ГОТОВА
                  </div>
                  <div className="p-2.5 rounded-xl bg-obsidian border border-obsidian-border font-mono text-xs text-cyber-cyan break-all">
                    {typeof window !== "undefined"
                      ? `${window.location.origin}/s/${createdToken}`
                      : `/s/${createdToken}`}
                  </div>
                </div>

                <button
                  onClick={() => copyShareUrl(createdToken)}
                  className="w-full py-3 rounded-xl bg-cyber-cyan text-slate-950 font-mono text-xs font-bold flex items-center justify-center gap-2 cursor-pointer"
                >
                  {copiedToken === createdToken ? (
                    <>
                      <Check className="w-4 h-4" /> СКОПИРОВАНО В БУФЕР!
                    </>
                  ) : (
                    <>
                      <Copy className="w-4 h-4" /> СКОПИРОВАТЬ ССЫЛКУ
                    </>
                  )}
                </button>
              </div>
            ) : (
              <form onSubmit={handleCreateShare} className="space-y-4">
                <div>
                  <label className="block text-xs font-mono text-slate-400 mb-1.5 flex items-center gap-1.5">
                    <KeyRound className="w-3.5 h-3.5 text-cyber-purple" /> Пароль для скачивания (необязательно)
                  </label>
                  <input
                    type="text"
                    value={sharePassword}
                    onChange={(e) => setSharePassword(e.target.value)}
                    placeholder="Оставьте пустым для доступа без пароля"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-obsidian border border-obsidian-border text-sm text-white font-mono focus:outline-none focus:border-cyber-purple"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-mono text-slate-400 mb-1.5 flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5 text-cyber-cyan" /> Время жизни
                    </label>
                    <select
                      value={shareTtl}
                      onChange={(e) => setShareTtl(e.target.value)}
                      className="w-full px-3 py-2.5 rounded-xl bg-obsidian border border-obsidian-border text-xs text-white font-mono focus:outline-none focus:border-cyber-cyan"
                    >
                      <option value="1">1 час</option>
                      <option value="24">24 часа (1 сутки)</option>
                      <option value="72">3 дня</option>
                      <option value="168">7 дней</option>
                      <option value="0">Бессрочно</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-mono text-slate-400 mb-1.5">
                      Лимит скачиваний
                    </label>
                    <select
                      value={shareMaxDownloads}
                      onChange={(e) => setShareMaxDownloads(e.target.value)}
                      className="w-full px-3 py-2.5 rounded-xl bg-obsidian border border-obsidian-border text-xs text-white font-mono focus:outline-none focus:border-cyber-cyan"
                    >
                      <option value="0">Без лимита</option>
                      <option value="1">Только 1 раз (Сгораемая)</option>
                      <option value="5">5 скачиваний</option>
                      <option value="10">10 скачиваний</option>
                    </select>
                  </div>
                </div>

                <button
                  type="submit"
                  className="w-full py-3 rounded-xl bg-cyber-purple hover:bg-cyber-purple/90 text-white font-mono text-xs font-bold transition-all cursor-pointer"
                >
                  СГЕНЕРИРОВАТЬ ЗАЩИЩЕННУЮ ССЫЛКУ
                </button>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}