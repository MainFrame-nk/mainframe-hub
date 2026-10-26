"use client";

import React, { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { AUDIO_GENRES } from "./types";
import { useGlobalRadio } from "./GlobalRadioProvider";
import {
  Radio,
  Play,
  Pause,
  Shuffle,
  Heart,
  Trash2,
  Upload,
  Music,
  Search,
  Sliders,
} from "lucide-react";

interface Props {
  isVisibleTab: boolean;
}

export default function VaultRadioSystem({ isVisibleTab }: Props) {
  const router = useRouter();
  const {
    tracks,
    currentTrack,
    isPlaying,
    bassGain,
    trebleGain,
    playTrack,
    startRadioStream,
    setBassGain,
    setTrebleGain,
    handleToggleFav,
    handleDeleteTrack,
  } = useGlobalRadio();

  // Вместо двух конфликтующих стейтов — единая четкая вкладка: "ALL" | "FAV" | жанр
  const [activeFilter, setActiveFilter] = useState<string>("ALL");
  const [search, setSearch] = useState("");

  // Загрузка нового трека
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [titleInput, setTitleInput] = useState("");
  const [artistInput, setArtistInput] = useState("");
  const [genreInput, setGenreInput] = useState("CYBERPUNK");
  const [uploadProgress, setUploadProgress] = useState<number | null>(null);

  const favCount = useMemo(() => tracks.filter((t) => t.isFav).length, [tracks]);

  // Четкая фильтрация треков по вкладкам ("ALL", "FAV" или конкретный жанр)
  const filteredTracks = useMemo(() => {
    const q = search.toLowerCase().trim();
    return tracks.filter((t) => {
      const matchTab =
        activeFilter === "ALL"
          ? true
          : activeFilter === "FAV"
          ? Boolean(t.isFav)
          : t.genre === activeFilter;

      const matchSearch =
        !q ||
        t.title.toLowerCase().includes(q) ||
        t.artist.toLowerCase().includes(q);

      return matchTab && matchSearch;
    });
  }, [tracks, activeFilter, search]);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setSelectedFile(file);

    const rawName = file.name.replace(/\.[^/.]+$/, "");
    if (rawName.includes(" - ")) {
      const [art, tit] = rawName.split(" - ", 2);
      setArtistInput(art.trim());
      setTitleInput(tit.trim());
    } else {
      setTitleInput(rawName.trim());
    }
  };

  const handleUploadTrack = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFile) return;

    const formData = new FormData();
    formData.append("file", selectedFile);
    formData.append("title", titleInput || selectedFile.name);
    formData.append("artist", artistInput || "MainFrame Radio");
    formData.append("genre", genreInput);

    const xhr = new XMLHttpRequest();
    xhr.open("POST", "/api/vault/audio/upload", true);

    xhr.upload.onprogress = (ev) => {
      if (ev.lengthComputable) {
        setUploadProgress(Math.round((ev.loaded / ev.total) * 100));
      }
    };

    xhr.onload = () => {
      setUploadProgress(null);
      setSelectedFile(null);
      setTitleInput("");
      setArtistInput("");
      router.refresh();
    };

    xhr.onerror = () => {
      setUploadProgress(null);
      alert("Ошибка загрузки аудиофайла");
    };

    setUploadProgress(1);
    xhr.send(formData);
  };

  const formatSize = (bytes: number) => {
    if (!bytes) return "";
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  if (!isVisibleTab) return null;

  return (
    <div className="space-y-6 pb-28">
      {/* 1. ШАПКА РАДИОСТАНЦИИ MAINFRAME FM */}
      <div className="p-6 rounded-2xl bg-obsidian-card/90 border border-obsidian-border flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-cyber-purple/15 border border-cyber-purple/40 flex items-center justify-center text-cyber-purple shadow-[0_0_25px_rgba(139,92,246,0.25)]">
            <Radio className={`w-7 h-7 ${isPlaying ? "animate-pulse text-cyber-cyan" : ""}`} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-mono font-bold uppercase text-white">
                MAINFRAME FM // ГЛОБАЛЬНОЕ РАДИО & DSP ЭКВАЛАЙЗЕР
              </h2>
              <span className="px-2 py-0.5 rounded bg-cyber-cyan/15 border border-cyber-cyan/40 text-cyber-cyan text-[10px] font-mono">
                {tracks.length} ТРЕКОВ
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Играет непрерывно по всему сайту (только для тебя). Настраивай Bass и Treble в реальном времени.
            </p>
          </div>
        </div>

        <button
          onClick={() => startRadioStream(filteredTracks)}
          disabled={tracks.length === 0}
          className="px-5 py-3 rounded-xl bg-gradient-to-r from-cyber-purple to-cyber-cyan text-obsidian font-mono text-xs font-extrabold flex items-center gap-2 shadow-[0_0_25px_rgba(0,240,255,0.3)] hover:opacity-95 transition-all cursor-pointer disabled:opacity-40"
        >
          <Shuffle className="w-4 h-4" />
          <span>ЗАПУСТИТЬ ЭФИР (SHUFFLE)</span>
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* ЛЕВАЯ КОЛОНКА (8 cols): ВКЛАДКИ (ВСЕ / ИЗБРАННОЕ / ЖАНРЫ) + СПИСОК ТРЕКОВ */}
        <div className="lg:col-span-8 space-y-4">
          <div className="p-4 rounded-2xl bg-obsidian-card/90 border border-obsidian-border space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex flex-wrap items-center gap-1.5">
                {/* Вкладка: ВСЕ ВОЛНЫ */}
                <button
                  type="button"
                  onClick={() => setActiveFilter("ALL")}
                  className={`px-3 py-1.5 rounded-lg font-mono text-xs transition-all cursor-pointer ${
                    activeFilter === "ALL"
                      ? "bg-cyber-purple text-white font-bold shadow-[0_0_15px_rgba(139,92,246,0.3)]"
                      : "bg-obsidian text-slate-400 hover:text-white border border-obsidian-border"
                  }`}
                >
                  🌊 Все треки ({tracks.length})
                </button>

                {/* Вкладка: ИЗБРАННОЕ */}
                <button
                  type="button"
                  onClick={() => setActiveFilter("FAV")}
                  className={`px-3 py-1.5 rounded-lg font-mono text-xs flex items-center gap-1.5 transition-all cursor-pointer ${
                    activeFilter === "FAV"
                      ? "bg-cyber-crimson text-white font-bold shadow-[0_0_15px_rgba(255,42,95,0.35)]"
                      : "bg-obsidian text-slate-400 hover:text-white border border-obsidian-border"
                  }`}
                >
                  <Heart className={`w-3.5 h-3.5 ${activeFilter === "FAV" ? "fill-white" : "text-cyber-crimson"}`} />
                  <span>Избранное ({favCount})</span>
                </button>

                {/* Вкладки по жанрам */}
                {Object.entries(AUDIO_GENRES).map(([k, cfg]) => (
                  <button
                    key={k}
                    type="button"
                    onClick={() => setActiveFilter(k)}
                    className={`px-3 py-1.5 rounded-lg font-mono text-xs transition-all cursor-pointer ${
                      activeFilter === k
                        ? "bg-cyber-cyan/20 text-cyber-cyan border border-cyber-cyan/40 font-bold"
                        : "bg-obsidian text-slate-400 hover:text-white border border-obsidian-border"
                    }`}
                  >
                    {cfg.label}
                  </button>
                ))}
              </div>

              <div className="relative">
                <Search className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Поиск трека или артиста..."
                  className="pl-8 pr-3 py-1.5 rounded-xl bg-obsidian border border-obsidian-border text-xs font-mono text-white outline-none focus:border-cyber-cyan w-52"
                />
              </div>
            </div>
          </div>

          {/* Список треков */}
          <div className="p-5 rounded-2xl bg-obsidian-card/90 border border-obsidian-border space-y-2.5 max-h-[540px] overflow-y-auto">
            {filteredTracks.length === 0 ? (
              <div className="py-12 text-center space-y-2">
                <Music className="w-10 h-10 text-slate-600 mx-auto" />
                <p className="text-xs font-mono text-slate-400">
                  {activeFilter === "FAV"
                    ? "В «Избранном» пока нет треков. Нажми на сердечко ❤️ справа от любого трека!"
                    : "В этой категории пока нет загруженных треков."}
                </p>
              </div>
            ) : (
              filteredTracks.map((track, idx) => {
                const isCurrent = currentTrack?.id === track.id;
                const genreCfg = AUDIO_GENRES[track.genre] || AUDIO_GENRES.OTHER;

                return (
                  <div
                    key={track.id}
                    onClick={() => playTrack(track)}
                    className={`p-3.5 rounded-xl border flex items-center justify-between gap-3 transition-all cursor-pointer group ${
                      isCurrent
                        ? "bg-obsidian border-cyber-cyan shadow-[0_0_20px_rgba(0,240,255,0.12)]"
                        : "bg-obsidian/70 border-obsidian-border hover:border-slate-700"
                    }`}
                  >
                    <div className="flex items-center gap-3.5 min-w-0">
                      <button
                        type="button"
                        className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 transition-all ${
                          isCurrent
                            ? "bg-cyber-cyan text-obsidian"
                            : "bg-obsidian-card border border-obsidian-border text-slate-300 group-hover:border-cyber-cyan group-hover:text-cyber-cyan"
                        }`}
                      >
                        {isCurrent && isPlaying ? (
                          <Pause className="w-4 h-4" />
                        ) : (
                          <Play className="w-4 h-4 ml-0.5" />
                        )}
                      </button>

                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-mono text-slate-500">
                            {String(idx + 1).padStart(2, "0")}.
                          </span>
                          <h4
                            className={`text-sm font-bold truncate ${
                              isCurrent ? "text-cyber-cyan" : "text-slate-100"
                            }`}
                          >
                            {track.title}
                          </h4>
                        </div>
                        <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                          <span className="text-xs font-mono text-slate-400 truncate">
                            {track.artist}
                          </span>
                          <span className={`px-2 py-0.2 rounded text-[10px] font-mono border ${genreCfg.color}`}>
                            {genreCfg.label}
                          </span>
                          {track.fileSize > 0 && (
                            <span className="text-[10px] font-mono text-slate-500">
                              {formatSize(track.fileSize)}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    <div
                      className="flex items-center gap-2 shrink-0"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <button
                        type="button"
                        onClick={() => handleToggleFav(track.id, track.isFav)}
                        className={`p-2 rounded-lg transition-colors cursor-pointer ${
                          track.isFav
                            ? "text-cyber-crimson"
                            : "text-slate-500 hover:text-cyber-crimson"
                        }`}
                        title={track.isFav ? "Убрать из избранного" : "Добавить в избранное"}
                      >
                        <Heart className={`w-4 h-4 ${track.isFav ? "fill-cyber-crimson" : ""}`} />
                      </button>

                      <button
                        type="button"
                        onClick={() => handleDeleteTrack(track.id)}
                        className="p-2 rounded-lg text-slate-500 hover:text-cyber-crimson transition-colors cursor-pointer"
                        title="Удалить трек"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* ПРАВАЯ КОЛОНКА (4 cols): СТУДИЙНЫЙ ЭКВАЛАЙЗЕР BASS/TREBLE + ЗАГРУЗКА ТРЕКОВ */}
        <div className="lg:col-span-4 space-y-6">
          {/* Блок Эквалайзера */}
          <div className="p-5 rounded-2xl bg-obsidian-card/90 border border-obsidian-border space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-mono font-bold uppercase text-slate-200 flex items-center gap-2">
                <Sliders className="w-4 h-4 text-cyber-purple" />
                <span>Эквалайзер (Bass & Treble)</span>
              </h3>
              <button
                type="button"
                onClick={() => {
                  setBassGain(0);
                  setTrebleGain(0);
                }}
                className="text-[11px] font-mono text-slate-400 hover:text-cyber-cyan cursor-pointer"
              >
                Сброс 0 dB
              </button>
            </div>

            <div className="space-y-3 p-3.5 rounded-xl bg-obsidian border border-obsidian-border">
              <div className="space-y-1">
                <div className="flex justify-between text-xs font-mono">
                  <span className="text-slate-300">🔥 BASS (Низкие 80 Hz)</span>
                  <span className="text-cyber-purple font-bold">
                    {bassGain > 0 ? `+${bassGain}` : bassGain} dB
                  </span>
                </div>
                <input
                  type="range"
                  min={-24}
                  max={24}
                  step={1}
                  value={bassGain}
                  onChange={(e) => setBassGain(Number(e.target.value))}
                  className="w-full h-1.5 accent-cyber-purple bg-obsidian-card rounded-lg cursor-pointer"
                />
              </div>

              <div className="space-y-1">
                <div className="flex justify-between text-xs font-mono">
                  <span className="text-slate-300">⚡ TREBLE (Высокие 10 kHz)</span>
                  <span className="text-cyber-cyan font-bold">
                    {trebleGain > 0 ? `+${trebleGain}` : trebleGain} dB
                  </span>
                </div>
                <input
                  type="range"
                  min={-12}
                  max={12}
                  step={1}
                  value={trebleGain}
                  onChange={(e) => setTrebleGain(Number(e.target.value))}
                  className="w-full h-1.5 accent-cyber-cyan bg-obsidian-card rounded-lg cursor-pointer"
                />
              </div>

              <div className="grid grid-cols-3 gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => {
                    setBassGain(0);
                    setTrebleGain(0);
                  }}
                  className="py-1.5 rounded-lg bg-obsidian-card border border-obsidian-border hover:border-slate-500 text-[11px] font-mono text-slate-300 cursor-pointer"
                >
                  Flat
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setBassGain(8);
                    setTrebleGain(2);
                  }}
                  className="py-1.5 rounded-lg bg-cyber-purple/20 border border-cyber-purple/40 text-[11px] font-mono text-cyber-purple font-bold cursor-pointer"
                >
                  Bass Boost
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setBassGain(3);
                    setTrebleGain(6);
                  }}
                  className="py-1.5 rounded-lg bg-cyber-cyan/20 border border-cyber-cyan/40 text-[11px] font-mono text-cyber-cyan font-bold cursor-pointer"
                >
                  Crystal Hi
                </button>
              </div>
            </div>
          </div>

          {/* Форма загрузки трека */}
          <div className="p-6 rounded-2xl bg-obsidian-card/90 border border-obsidian-border space-y-4">
            <h3 className="text-sm font-mono font-bold uppercase text-slate-200 flex items-center gap-2">
              <Upload className="w-4 h-4 text-cyber-cyan" />
              <span>Загрузить трек в хранилище</span>
            </h3>

            <form onSubmit={handleUploadTrack} className="space-y-3.5">
              <label className="block p-5 rounded-xl bg-obsidian border-2 border-dashed border-obsidian-border hover:border-cyber-cyan/60 text-center cursor-pointer transition-all">
                <Music className="w-7 h-7 text-cyber-cyan mx-auto mb-2" />
                <span className="block text-xs font-mono text-slate-200 font-bold">
                  {selectedFile ? selectedFile.name : "Выбери MP3 / FLAC / WAV файл"}
                </span>
                <span className="block text-[10px] font-mono text-slate-500 mt-1">
                  {selectedFile
                    ? formatSize(selectedFile.size)
                    : "Приватное хранение без цензуры"}
                </span>
                <input
                  type="file"
                  accept="audio/*,.mp3,.flac,.wav,.ogg,.m4a"
                  onChange={handleFileSelect}
                  className="hidden"
                />
              </label>

              <div>
                <label className="block text-[11px] font-mono text-slate-400 mb-1">
                  Название трека *
                </label>
                <input
                  type="text"
                  value={titleInput}
                  onChange={(e) => setTitleInput(e.target.value)}
                  required
                  placeholder="Nightcall / After Dark..."
                  className="w-full px-3.5 py-2 rounded-xl bg-obsidian border border-obsidian-border text-sm text-white outline-none focus:border-cyber-cyan"
                />
              </div>

              <div>
                <label className="block text-[11px] font-mono text-slate-400 mb-1">
                  Исполнитель (Artist)
                </label>
                <input
                  type="text"
                  value={artistInput}
                  onChange={(e) => setArtistInput(e.target.value)}
                  placeholder="Kavinsky / Mr.Kitty..."
                  className="w-full px-3.5 py-2 rounded-xl bg-obsidian border border-obsidian-border text-sm text-white outline-none focus:border-cyber-cyan"
                />
              </div>

              <div>
                <label className="block text-[11px] font-mono text-slate-400 mb-1">
                  Радио-волна (Жанр)
                </label>
                <select
                  value={genreInput}
                  onChange={(e) => setGenreInput(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl bg-obsidian border border-obsidian-border text-xs font-mono text-slate-200 outline-none focus:border-cyber-cyan"
                >
                  {Object.entries(AUDIO_GENRES).map(([k, v]) => (
                    <option key={k} value={k}>
                      {v.label}
                    </option>
                  ))}
                </select>
              </div>

              {uploadProgress !== null && (
                <div className="space-y-1">
                  <div className="flex justify-between text-[11px] font-mono text-cyber-cyan">
                    <span>Сохранение в закрытое хранилище...</span>
                    <span>{uploadProgress}%</span>
                  </div>
                  <div className="w-full h-2 rounded-full bg-obsidian overflow-hidden">
                    <div
                      style={{ width: `${uploadProgress}%` }}
                      className="h-full bg-gradient-to-r from-cyber-purple to-cyber-cyan transition-all"
                    />
                  </div>
                </div>
              )}

              <button
                type="submit"
                disabled={!selectedFile || uploadProgress !== null}
                className="w-full py-3 rounded-xl bg-cyber-cyan hover:bg-cyber-cyan/90 text-obsidian font-mono text-xs font-bold transition-all cursor-pointer disabled:opacity-40"
              >
                СОХРАНИТЬ В АУДИОТЕКУ VAULT
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}