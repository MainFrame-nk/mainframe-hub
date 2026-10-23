"use client";

import React, { useState } from "react";
import { deleteCloudFile } from "@/app/actions";
import { Cloud, Upload, FileText, Download, Trash2, HardDrive, Link as LinkIcon } from "lucide-react";

interface CloudFileItem {
  id: string;
  name: string;
  size: number;
  mimeType: string;
  fileUrl: string;
  createdAt: Date;
}

export default function CloudVaultWidget({ files }: { files: CloudFileItem[] }) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [statusText, setStatusText] = useState("");

  const totalBytesUsed = files.reduce((acc, f) => acc + f.size, 0);
  const totalGBUsed = (totalBytesUsed / (1024 * 1024 * 1024)).toFixed(2);
  const maxStorageGB = 5120; // 5 ТБ Google Drive
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

  // Честная загрузка с реальным прогрессом через XMLHttpRequest
  function handleUploadSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!selectedFile) return;

    setUploading(true);
    setProgress(0);
    setStatusText("Подключение к хранилищу...");

    const formData = new FormData();
    formData.append("file", selectedFile);

    const xhr = new XMLHttpRequest();
    
    // Отслеживаем реальный прогресс отправки файла браузером
    xhr.upload.addEventListener("progress", (event) => {
      if (event.lengthComputable) {
        const percentComplete = Math.round((event.loaded / event.total) * 100);
        setProgress(percentComplete);
        setStatusText(`Загрузка в облако: ${percentComplete}%`);
      }
    });

    xhr.addEventListener("load", () => {
      if (xhr.status === 200) {
        setStatusText("Файл успешно сохранен!");
        setProgress(100);
        setSelectedFile(null);
        setTimeout(() => {
          setUploading(false);
          setProgress(0);
          setStatusText("");
          window.location.reload(); // Перезагружаем страницу, чтобы подтянуть новый файл из базы
        }, 1000);
      } else {
        setStatusText("Ошибка загрузки на сервер!");
        setUploading(false);
      }
    });

    xhr.addEventListener("error", () => {
      setStatusText("Ошибка сети!");
      setUploading(false);
    });

    // Отправляем на специальный эндпоинт загрузки
    xhr.open("POST", "/api/upload", true);
    xhr.send(formData);
  }

  return (
    <div className="mb-12 p-6 md:p-8 rounded-3xl bg-obsidian-card border border-obsidian-border shadow-2xl">
      <div className="flex flex-wrap items-center justify-between gap-4 mb-6 pb-4 border-b border-obsidian-border">
        <div>
          <h2 className="text-xl font-bold flex items-center gap-2 text-white">
            <Cloud className="w-5 h-5 text-cyber-cyan" /> MainFrame Cloud Vault (Google Drive 5 TB)
          </h2>
          <p className="text-xs font-mono text-slate-400 mt-1">
            Хранилище дистрибутивов, установщиков и архивов.
          </p>
        </div>

        <div className="bg-obsidian px-4 py-2.5 rounded-2xl border border-obsidian-border min-w-[220px]">
          <div className="flex items-center justify-between text-xs font-mono mb-1.5">
            <span className="text-slate-400 flex items-center gap-1.5">
              <HardDrive className="w-3.5 h-3.5 text-cyber-purple" /> Google Drive
            </span>
            <span className="text-cyber-cyan font-bold">{totalGBUsed} GB / 5 TB</span>
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
        <div className="lg:col-span-4 p-6 rounded-2xl bg-obsidian border border-obsidian-border">
          <h3 className="text-sm font-bold text-white mb-3 flex items-center gap-2">
            <Upload className="w-4 h-4 text-cyber-cyan" /> Загрузить файл / дистрибутив
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
                    📎 {selectedFile.name}
                  </span>
                ) : (
                  "Перетащите файл или кликните"
                )}
              </div>
              <div className="text-[10px] font-mono text-slate-500 mt-1">
                {selectedFile ? formatBytes(selectedFile.size) : "Поддерживаются файлы до 5 ГБ"}
              </div>
            </div>

            {uploading && (
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs font-mono">
                  <span className="text-slate-400 truncate max-w-[180px]">{statusText}</span>
                  <span className="text-cyber-cyan font-bold">{progress}%</span>
                </div>
                <div className="w-full h-2 rounded-full bg-obsidian-card overflow-hidden border border-obsidian-border">
                  <div
                    className="h-full bg-cyber-purple transition-all duration-150 shadow-[0_0_10px_rgba(139,92,246,0.5)]"
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
              {uploading ? `ЗАГРУЗКА (${progress}%)...` : "ЗАГРУЗИТЬ В ГУГЛ ДИСК"}
            </button>
          </form>
        </div>

        {/* Список файлов */}
        <div className="lg:col-span-8">
          <h3 className="text-sm font-bold text-white mb-3 flex items-center gap-2">
            <FileText className="w-4 h-4 text-cyber-purple" /> Файлы в облаке ({files.length})
          </h3>

          {files.length === 0 ? (
            <div className="p-8 rounded-2xl bg-obsidian border border-obsidian-border text-center text-slate-500 font-mono text-xs">
              В облачном хранилище пока нет файлов.
            </div>
          ) : (
            <div className="space-y-2.5 max-h-[320px] overflow-y-auto pr-2">
              {files.map((file) => (
                <div
                  key={file.id}
                  className="flex items-center justify-between gap-4 p-3.5 rounded-xl bg-obsidian border border-obsidian-border hover:border-obsidian-border/80 transition-colors"
                >
                  <div className="flex items-center gap-3 overflow-hidden">
                    <div className="p-2 rounded-lg bg-obsidian-card border border-obsidian-border text-cyber-cyan shrink-0">
                      <FileText className="w-4 h-4" />
                    </div>
                    <div className="overflow-hidden">
                      <div className="text-sm font-medium text-white truncate">{file.name}</div>
                      <div className="text-[11px] font-mono text-slate-500 flex items-center gap-2">
                        <span>{formatBytes(file.size)}</span>
                        <span>•</span>
                        <span>{new Date(file.createdAt).toLocaleDateString("ru-RU")}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      onClick={() => {
                        navigator.clipboard.writeText(file.fileUrl);
                        alert("Прямая ссылка на файл скопирована в буфер обмена!");
                      }}
                      className="p-2 rounded-lg bg-obsidian-card border border-obsidian-border hover:border-cyber-purple text-slate-300 hover:text-cyber-purple transition-colors cursor-pointer"
                      title="Скопировать ссылку для шеринга"
                    >
                      <LinkIcon className="w-4 h-4" />
                    </button>

                    <a
                      href={file.fileUrl}
                      download
                      target="_blank"
                      rel="noreferrer"
                      className="p-2 rounded-lg bg-obsidian-card border border-obsidian-border hover:border-cyber-cyan text-slate-300 hover:text-cyber-cyan transition-colors"
                      title="Скачать файл"
                    >
                      <Download className="w-4 h-4" />
                    </a>

                    <form action={deleteCloudFile.bind(null, file.id)}>
                      <button
                        title="Удалить файл"
                        className="p-2 rounded-lg bg-obsidian-card border border-obsidian-border hover:border-cyber-crimson text-slate-400 hover:text-cyber-crimson transition-colors cursor-pointer"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </form>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}