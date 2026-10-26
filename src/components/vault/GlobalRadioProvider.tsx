"use client";

import React, {
  createContext,
  useContext,
  useState,
  useRef,
  useEffect,
} from "react";
import { AudioTrackItem } from "./types";
import { toggleAudioFavorite, deleteAudioTrack } from "@/app/actions";
import {
  Play,
  Pause,
  SkipForward,
  SkipBack,
  Shuffle,
  Repeat,
  Volume2,
  VolumeX,
  Disc3,
  Sliders,
  Minimize2,
  Maximize2,
} from "lucide-react";

interface RadioContextType {
  tracks: AudioTrackItem[];
  currentTrack: AudioTrackItem | null;
  isPlaying: boolean;
  isShuffle: boolean;
  isRepeat: boolean;
  bassGain: number;
  trebleGain: number;
  playTrack: (track: AudioTrackItem) => void;
  togglePlayPause: () => void;
  playNext: () => void;
  playPrev: () => void;
  startRadioStream: (pool?: AudioTrackItem[]) => void;
  setIsShuffle: (val: boolean) => void;
  setBassGain: (val: number) => void;
  setTrebleGain: (val: number) => void;
  handleToggleFav: (id: string, currentFav: boolean) => Promise<void>;
  handleDeleteTrack: (id: string) => Promise<void>;
  refreshTracksList: (newTracks: AudioTrackItem[]) => void;
}

const RadioContext = createContext<RadioContextType | null>(null);

export function useGlobalRadio() {
  const ctx = useContext(RadioContext);
  if (!ctx) {
    throw new Error("useGlobalRadio must be used within GlobalRadioProvider");
  }
  return ctx;
}

export default function GlobalRadioProvider({
  initialTracks = [],
  isAuthorized = false,
  children,
}: {
  initialTracks: AudioTrackItem[];
  isAuthorized: boolean;
  children: React.ReactNode;
}) {
  const [tracks, setTracks] = useState<AudioTrackItem[]>(initialTracks);
  useEffect(() => {
    setTracks(initialTracks);
  }, [initialTracks]);

  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Web Audio API узлы для мощного Bass / Treble эквалайзера (±24 dB) + Лимитер
  const audioCtxRef = useRef<AudioContext | null>(null);
  const bassFilterRef = useRef<BiquadFilterNode | null>(null);
  const trebleFilterRef = useRef<BiquadFilterNode | null>(null);
  const isAudioGraphConnected = useRef(false);

  const [currentTrack, setCurrentTrack] = useState<AudioTrackItem | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isShuffle, setIsShuffle] = useState(true);
  const [isRepeat, setIsRepeat] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(0.85);
  const [isMuted, setIsMuted] = useState(false);

  // Эквалайзер: расширенный диапазон от -24 dB до +24 dB
  const [bassGain, setBassGain] = useState<number>(0);
  const [trebleGain, setTrebleGain] = useState<number>(0);
  const [showEqPopup, setShowEqPopup] = useState(false);

  // Режим компактной мини-капсулы (чтобы плеер не перекрывал низ страницы)
  const [isMinimized, setIsMinimized] = useState(false);

  const ensureWebAudioEq = () => {
    if (!audioRef.current || isAudioGraphConnected.current) return;
    try {
      const AudioCtx =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      const ctx = new AudioCtx();
      const source = ctx.createMediaElementSource(audioRef.current);

      // 1. Фильтр Низких Частот (BASS - 85 Hz LowShelf, до ±24 dB)
      const bass = ctx.createBiquadFilter();
      bass.type = "lowshelf";
      bass.frequency.value = 85;
      bass.gain.value = bassGain;

      // 2. Фильтр Высоких Частот (TREBLE - 9500 Hz HighShelf, до ±24 dB)
      const treble = ctx.createBiquadFilter();
      treble.type = "highshelf";
      treble.frequency.value = 9500;
      treble.gain.value = trebleGain;

      // 3. Студийный компрессор-лимитер (защищает от хрипа на +24 dB баса!)
      const compressor = ctx.createDynamicsCompressor();
      compressor.threshold.value = -6;
      compressor.knee.value = 12;
      compressor.ratio.value = 8;
      compressor.attack.value = 0.003;
      compressor.release.value = 0.15;

      // Цепочка: Audio -> Bass -> Treble -> Compressor -> Speakers
      source.connect(bass);
      bass.connect(treble);
      treble.connect(compressor);
      compressor.connect(ctx.destination);

      audioCtxRef.current = ctx;
      bassFilterRef.current = bass;
      trebleFilterRef.current = treble;
      isAudioGraphConnected.current = true;
    } catch (e) {
      console.error("Web Audio EQ init error:", e);
    }
  };

  useEffect(() => {
    if (bassFilterRef.current && audioCtxRef.current) {
      bassFilterRef.current.gain.setTargetAtTime(
        bassGain,
        audioCtxRef.current.currentTime,
        0.04
      );
    }
  }, [bassGain]);

  useEffect(() => {
    if (trebleFilterRef.current && audioCtxRef.current) {
      trebleFilterRef.current.gain.setTargetAtTime(
        trebleGain,
        audioCtxRef.current.currentTime,
        0.04
      );
    }
  }, [trebleGain]);

  const playTrack = (track: AudioTrackItem) => {
    ensureWebAudioEq();
    if (audioCtxRef.current?.state === "suspended") {
      audioCtxRef.current.resume();
    }
    if (currentTrack?.id === track.id) {
      togglePlayPause();
      return;
    }
    setCurrentTrack(track);
    setIsPlaying(true);
  };

  const togglePlayPause = () => {
    if (!audioRef.current) return;
    ensureWebAudioEq();
    if (audioCtxRef.current?.state === "suspended") {
      audioCtxRef.current.resume();
    }
    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      audioRef.current.play();
      setIsPlaying(true);
    }
  };

  const playNext = () => {
    if (tracks.length === 0) return;
    if (isShuffle && tracks.length > 1) {
      const candidates = tracks.filter((t) => t.id !== currentTrack?.id);
      const next = candidates[Math.floor(Math.random() * candidates.length)];
      setCurrentTrack(next);
      setIsPlaying(true);
      return;
    }
    const idx = tracks.findIndex((t) => t.id === currentTrack?.id);
    const nextIdx = idx === -1 || idx + 1 >= tracks.length ? 0 : idx + 1;
    setCurrentTrack(tracks[nextIdx]);
    setIsPlaying(true);
  };

  const playPrev = () => {
    if (tracks.length === 0) return;
    const idx = tracks.findIndex((t) => t.id === currentTrack?.id);
    const prevIdx = idx <= 0 ? tracks.length - 1 : idx - 1;
    setCurrentTrack(tracks[prevIdx]);
    setIsPlaying(true);
  };

  const startRadioStream = (customPool?: AudioTrackItem[]) => {
    const pool = customPool && customPool.length > 0 ? customPool : tracks;
    if (pool.length === 0) return;
    ensureWebAudioEq();
    if (audioCtxRef.current?.state === "suspended") {
      audioCtxRef.current.resume();
    }
    setIsShuffle(true);
    const randomTrack = pool[Math.floor(Math.random() * pool.length)];
    setCurrentTrack(randomTrack);
    setIsPlaying(true);
  };

  const handleToggleFav = async (id: string, currentFav: boolean) => {
    setTracks((prev) =>
      prev.map((t) => (t.id === id ? { ...t, isFav: !currentFav } : t))
    );
    if (currentTrack?.id === id) {
      setCurrentTrack((prev) => (prev ? { ...prev, isFav: !currentFav } : null));
    }
    await toggleAudioFavorite(id, currentFav);
  };

  const handleDeleteTrack = async (id: string) => {
    setTracks((prev) => prev.filter((t) => t.id !== id));
    if (currentTrack?.id === id) {
      audioRef.current?.pause();
      setCurrentTrack(null);
      setIsPlaying(false);
    }
    await deleteAudioTrack(id);
  };

  useEffect(() => {
    if (!audioRef.current || !currentTrack) return;
    audioRef.current.src = `/api/vault/audio/${currentTrack.id}`;
    audioRef.current.volume = isMuted ? 0 : volume;
    audioRef.current
      .play()
      .then(() => setIsPlaying(true))
      .catch(() => setIsPlaying(false));
  }, [currentTrack?.id]);

  useEffect(() => {
    if (!audioRef.current) return;
    audioRef.current.volume = isMuted ? 0 : volume;
  }, [volume, isMuted]);

  const formatTime = (sec: number) => {
    if (!sec || isNaN(sec)) return "0:00";
    const m = Math.floor(sec / 60);
    const s = Math.floor(sec % 60);
    return `${m}:${s < 10 ? "0" : ""}${s}`;
  };

  return (
    <RadioContext.Provider
      value={{
        tracks,
        currentTrack,
        isPlaying,
        isShuffle,
        isRepeat,
        bassGain,
        trebleGain,
        playTrack,
        togglePlayPause,
        playNext,
        playPrev,
        startRadioStream,
        setIsShuffle,
        setBassGain,
        setTrebleGain,
        handleToggleFav,
        handleDeleteTrack,
        refreshTracksList: setTracks,
      }}
    >
      {/* Если плеер открыт и развернут — даем странице мягкий отступ снизу, чтобы ничего не перекрывалось */}
      <div className={currentTrack && !isMinimized ? "pb-28" : ""}>
        {children}
      </div>

      {isAuthorized && (
        <>
          <audio
            ref={audioRef}
            crossOrigin="anonymous"
            onTimeUpdate={() => setCurrentTime(audioRef.current?.currentTime || 0)}
            onLoadedMetadata={() => setDuration(audioRef.current?.duration || 0)}
            onEnded={() => {
              if (isRepeat && audioRef.current) {
                audioRef.current.currentTime = 0;
                audioRef.current.play();
              } else {
                playNext();
              }
            }}
          />

          {/* ВАРИАНТ А: СВЕРНУТАЯ МИНИ-КАПСУЛА В УГЛУ (НЕ ЗАКРЫВАЕТ НИЧЕГО НА СТРАНИЦЕ) */}
          {currentTrack && isMinimized && (
            <div className="fixed bottom-4 right-4 z-40 flex items-center gap-2.5 p-2.5 rounded-2xl bg-obsidian-card/95 backdrop-blur-xl border border-cyber-cyan/50 shadow-[0_0_25px_rgba(0,0,0,0.85)]">
              <button
                type="button"
                onClick={togglePlayPause}
                className="w-8 h-8 rounded-xl bg-cyber-cyan text-obsidian flex items-center justify-center cursor-pointer"
              >
                {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 ml-0.5" />}
              </button>
              <div className="max-w-[140px]">
                <div className="text-xs font-bold text-white truncate">{currentTrack.title}</div>
                <div className="text-[10px] font-mono text-cyber-cyan truncate">{currentTrack.artist}</div>
              </div>
              <button
                type="button"
                onClick={playNext}
                className="p-1.5 text-slate-300 hover:text-white cursor-pointer"
                title="Следующий трек"
              >
                <SkipForward className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => setIsMinimized(false)}
                className="p-1.5 text-slate-400 hover:text-cyber-cyan cursor-pointer"
                title="Развернуть плеер"
              >
                <Maximize2 className="w-4 h-4" />
              </button>
            </div>
          )}

          {/* ВАРИАНТ Б: ПОЛНЫЙ НИЖНИЙ ПЛЕЕР С ЭКВАЛАЙЗЕРОМ ±24 dB */}
          {currentTrack && !isMinimized && (
            <div className="fixed bottom-3 left-1/2 -translate-x-1/2 z-40 w-[95%] max-w-5xl rounded-2xl bg-obsidian-card/95 backdrop-blur-xl border border-cyber-cyan/40 shadow-[0_0_35px_rgba(0,0,0,0.9)] px-4 py-2.5">
              {showEqPopup && (
                <div className="absolute bottom-full right-4 mb-3 w-80 p-4 rounded-2xl bg-obsidian border border-cyber-cyan/50 shadow-2xl space-y-3.5">
                  <div className="flex items-center justify-between border-b border-obsidian-border pb-2">
                    <span className="text-xs font-mono font-bold text-cyber-cyan flex items-center gap-1.5">
                      <Sliders className="w-3.5 h-3.5" /> PRO DSP EQ (-24..+24 dB)
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        setBassGain(0);
                        setTrebleGain(0);
                      }}
                      className="text-[10px] font-mono text-slate-400 hover:text-white cursor-pointer"
                    >
                      Сброс (0 dB)
                    </button>
                  </div>

                  {/* Ползунок BASS (±24 dB) */}
                  <div className="space-y-1">
                    <div className="flex justify-between text-[11px] font-mono">
                      <span className="text-slate-300">🔥 BASS (Sub 85Hz)</span>
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

                  {/* Ползунок TREBLE (±24 dB) */}
                  <div className="space-y-1">
                    <div className="flex justify-between text-[11px] font-mono">
                      <span className="text-slate-300">⚡ TREBLE (Air 9.5kHz)</span>
                      <span className="text-cyber-cyan font-bold">
                        {trebleGain > 0 ? `+${trebleGain}` : trebleGain} dB
                      </span>
                    </div>
                    <input
                      type="range"
                      min={-24}
                      max={24}
                      step={1}
                      value={trebleGain}
                      onChange={(e) => setTrebleGain(Number(e.target.value))}
                      className="w-full h-1.5 accent-cyber-cyan bg-obsidian-card rounded-lg cursor-pointer"
                    />
                  </div>

                  <div className="grid grid-cols-3 gap-1.5 pt-1">
                    <button
                      type="button"
                      onClick={() => {
                        setBassGain(10);
                        setTrebleGain(3);
                      }}
                      className="py-1 rounded bg-cyber-purple/20 border border-cyber-purple/40 text-[10px] font-mono text-cyber-purple font-bold cursor-pointer"
                    >
                      Phonk (+10)
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setBassGain(18);
                        setTrebleGain(4);
                      }}
                      className="py-1 rounded bg-cyber-crimson/20 border border-cyber-crimson/40 text-[10px] font-mono text-cyber-crimson font-bold cursor-pointer"
                    >
                      🔥 SUB (+18)
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setBassGain(4);
                        setTrebleGain(12);
                      }}
                      className="py-1 rounded bg-cyber-cyan/20 border border-cyber-cyan/40 text-[10px] font-mono text-cyber-cyan font-bold cursor-pointer"
                    >
                      Crystal (+12)
                    </button>
                  </div>
                </div>
              )}

              <div className="flex flex-wrap items-center justify-between gap-4">
                <div className="flex items-center gap-3 min-w-[180px] max-w-[240px]">
                  <div className="w-9 h-9 rounded-xl bg-obsidian border border-cyber-cyan/40 flex items-center justify-center text-cyber-cyan shrink-0">
                    <Disc3 className={`w-5 h-5 ${isPlaying ? "animate-spin" : ""}`} />
                  </div>
                  <div className="min-w-0">
                    <div className="text-xs font-bold text-white truncate">
                      {currentTrack.title}
                    </div>
                    <div className="text-[11px] font-mono text-cyber-cyan truncate">
                      {currentTrack.artist}
                    </div>
                  </div>
                </div>

                <div className="flex-1 max-w-xl flex flex-col items-center gap-1">
                  <div className="flex items-center gap-4">
                    <button
                      type="button"
                      onClick={() => setIsShuffle(!isShuffle)}
                      className={`p-1 rounded-lg transition-colors cursor-pointer ${
                        isShuffle ? "text-cyber-cyan" : "text-slate-500 hover:text-white"
                      }`}
                    >
                      <Shuffle className="w-4 h-4" />
                    </button>

                    <button
                      type="button"
                      onClick={playPrev}
                      className="p-1 text-slate-300 hover:text-white cursor-pointer"
                    >
                      <SkipBack className="w-4 h-4" />
                    </button>

                    <button
                      type="button"
                      onClick={togglePlayPause}
                      className="w-8 h-8 rounded-xl bg-cyber-cyan text-obsidian flex items-center justify-center shadow-[0_0_15px_rgba(0,240,255,0.4)] cursor-pointer"
                    >
                      {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 ml-0.5" />}
                    </button>

                    <button
                      type="button"
                      onClick={playNext}
                      className="p-1 text-slate-300 hover:text-white cursor-pointer"
                    >
                      <SkipForward className="w-4 h-4" />
                    </button>

                    <button
                      type="button"
                      onClick={() => setIsRepeat(!isRepeat)}
                      className={`p-1 rounded-lg transition-colors cursor-pointer ${
                        isRepeat ? "text-cyber-purple" : "text-slate-500 hover:text-white"
                      }`}
                    >
                      <Repeat className="w-4 h-4" />
                    </button>
                  </div>

                  <div className="w-full flex items-center gap-2 text-[10px] font-mono text-slate-400">
                    <span className="w-8 text-right">{formatTime(currentTime)}</span>
                    <input
                      type="range"
                      min={0}
                      max={duration || 100}
                      value={currentTime}
                      onChange={(e) => {
                        const val = Number(e.target.value);
                        setCurrentTime(val);
                        if (audioRef.current) audioRef.current.currentTime = val;
                      }}
                      className="flex-1 h-1.5 accent-cyber-cyan bg-obsidian rounded-lg cursor-pointer"
                    />
                    <span className="w-8">{formatTime(duration)}</span>
                  </div>
                </div>

                <div className="flex items-center gap-2.5 justify-end">
                  <button
                    type="button"
                    onClick={() => setShowEqPopup(!showEqPopup)}
                    className={`px-2.5 py-1.5 rounded-xl font-mono text-[11px] font-bold border flex items-center gap-1 transition-all cursor-pointer ${
                      showEqPopup || bassGain !== 0 || trebleGain !== 0
                        ? "bg-cyber-purple/20 text-cyber-purple border-cyber-purple/50"
                        : "bg-obsidian text-slate-400 border-obsidian-border hover:text-white"
                    }`}
                  >
                    <Sliders className="w-3.5 h-3.5" />
                    <span>EQ</span>
                  </button>

                  <div className="hidden sm:flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => setIsMuted(!isMuted)}
                      className="text-slate-400 hover:text-white cursor-pointer"
                    >
                      {isMuted || volume === 0 ? (
                        <VolumeX className="w-4 h-4 text-cyber-crimson" />
                      ) : (
                        <Volume2 className="w-4 h-4 text-cyber-cyan" />
                      )}
                    </button>
                    <input
                      type="range"
                      min={0}
                      max={1}
                      step={0.02}
                      value={isMuted ? 0 : volume}
                      onChange={(e) => {
                        setIsMuted(false);
                        setVolume(Number(e.target.value));
                      }}
                      className="w-16 h-1.5 accent-cyber-purple bg-obsidian rounded-lg cursor-pointer"
                    />
                  </div>

                  {/* Кнопка сворачивания плеера в маленькую угловую капсулу */}
                  <button
                    type="button"
                    onClick={() => {
                      setShowEqPopup(false);
                      setIsMinimized(true);
                    }}
                    className="p-1.5 rounded-lg bg-obsidian border border-obsidian-border text-slate-400 hover:text-cyber-cyan cursor-pointer"
                    title="Свернуть плеер в угол экрана"
                  >
                    <Minimize2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </RadioContext.Provider>
  );
}