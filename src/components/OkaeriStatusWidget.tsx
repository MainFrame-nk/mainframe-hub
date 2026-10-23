"use client";

import React, { useEffect, useState } from "react";
import { Radio, AlertCircle } from "lucide-react";

interface OnlineUser {
  userId: string;
  username: string;
  avatarUrl: string | null;
  isOnlineOnSite: boolean;
  isInVoice: boolean;
}

export default function OkaeriStatusWidget() {
  const [users, setUsers] = useState<OnlineUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [isOffline, setIsOffline] = useState(false);

  useEffect(() => {
    async function fetchOnlineStatus() {
      try {
        const res = await fetch("https://okaeri-gaming.ru/api/online", {
          cache: "no-store",
        });
        if (!res.ok) throw new Error("API error");
        const data = await res.json();
        setUsers(data);
        setIsOffline(false);
      } catch (e) {
        setIsOffline(true);
        setUsers([]);
      } finally {
        setLoading(false);
      }
    }

    fetchOnlineStatus();
    const interval = setInterval(fetchOnlineStatus, 15000);
    return () => clearInterval(interval);
  }, []);

  const totalOnline = users.length;
  const inVoiceCount = users.filter((u) => u.isInVoice).length;

  // Функция для формирования правильного URL аватара
  const getAvatarUrl = (url: string | null) => {
    if (!url) return null;
    // Если путь относительный (начинается с /), привязываем его к домену okaeri-gaming.ru
    if (url.startsWith("/")) {
      return `https://okaeri-gaming.ru${url}`;
    }
    return url;
  };

  return (
    <div className="flex items-center justify-between gap-4 p-3.5 rounded-xl bg-obsidian border border-obsidian-border font-mono text-xs">
      <div className="flex items-center gap-3">
        <div className="relative flex items-center justify-center">
          <span className={`w-2.5 h-2.5 rounded-full absolute ${isOffline ? "bg-amber-500" : "bg-emerald-400"} animate-ping`} />
          <span className={`w-2.5 h-2.5 rounded-full relative ${isOffline ? "bg-amber-500" : "bg-emerald-400"}`} />
        </div>
        <div>
          <div className="text-slate-200 font-bold flex items-center gap-1.5">
            <span>Okaeri Telemetry</span>
            <Radio className="w-3.5 h-3.5 text-cyber-cyan" />
          </div>
          <div className="text-slate-400 text-[11px]">
            {loading
              ? "Синхронизация..."
              : isOffline
              ? "Режим standby (API недоступен)"
              : `${totalOnline} в сети / ${inVoiceCount} в голосе`}
          </div>
        </div>
      </div>

      {/* Аватарки с безопасным авто-исправлением путей */}
      <div className="flex items-center -space-x-2 overflow-hidden">
        {isOffline ? (
          <span className="text-amber-500 text-[11px] flex items-center gap-1">
            <AlertCircle className="w-3.5 h-3.5" /> Offline
          </span>
        ) : (
          <>
            {users.slice(0, 4).map((user) => {
                const fullAvatarUrl = getAvatarUrl(user.avatarUrl);
                return (
                    <div
                    key={user.userId}
                    title={`${user.username} ${user.isInVoice ? "(В голосе)" : ""}`}
                    className="w-7 h-7 rounded-full border border-obsidian-border bg-obsidian-card flex items-center justify-center overflow-hidden text-[10px] text-cyber-cyan font-bold"
                    >
                    {fullAvatarUrl ? (
                        <img
                        src={fullAvatarUrl}
                        alt={user.username}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                            // Безопасно скрываем картинку через DOM-элемент самого события без ошибок типов
                            (e.currentTarget as HTMLImageElement).style.display = "none";
                        }}
                        />
                    ) : (
                        user.username.slice(0, 2).toUpperCase()
                    )}
                    </div>
                );
            })}
            {totalOnline > 4 && (
              <div className="w-7 h-7 rounded-full border border-obsidian-border bg-obsidian-card flex items-center justify-center text-[10px] text-slate-400 font-bold">
                +{totalOnline - 4}
              </div>
            )}
            {totalOnline === 0 && !loading && (
              <span className="text-slate-500 text-[11px]">Никого</span>
            )}
          </>
        )}
      </div>
    </div>
  );
}