"use client";

import React from "react";
import { LeadItem } from "./types";
import {
  updateLeadStatus,
  deleteLead,
  convertLeadToProject,
} from "@/app/actions";
import { Inbox, Rocket, Trash2 } from "lucide-react";

interface VaultCrmTabProps {
  leads: LeadItem[];
  onConvertedToProject: () => void;
}

export default function VaultCrmTab({ leads, onConvertedToProject }: VaultCrmTabProps) {
  const columns = [
    { id: "NEW", title: "🔥 Новые заявки", border: "border-cyber-crimson/40" },
    { id: "IN_PROGRESS", title: "⚡ В диалоге / В работе", border: "border-cyber-cyan/40" },
    { id: "CLOSED", title: "✅ Архив / Закрыты", border: "border-emerald-500/40" },
  ];

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 className="text-xl font-bold flex items-center gap-2">
          <Inbox className="w-5 h-5 text-cyber-crimson" /> Воронка клиентских заявок (Leads CRM)
        </h2>
        <span className="text-xs font-mono text-slate-400">
          Кнопка «🚀 В проект» автоматически создает узел с роадмапом в Канбане
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {columns.map((crmCol) => {
          const colLeads = leads.filter((l) => l.status === crmCol.id);
          return (
            <div
              key={crmCol.id}
              className={`p-4 rounded-2xl bg-obsidian-card border ${crmCol.border} min-h-[260px] space-y-3`}
            >
              <div className="flex items-center justify-between pb-2.5 border-b border-obsidian-border">
                <span className="font-mono text-xs font-bold text-white">{crmCol.title}</span>
                <span className="px-2 py-0.5 rounded bg-obsidian text-xs font-mono text-slate-400">
                  {colLeads.length}
                </span>
              </div>

              {colLeads.length === 0 ? (
                <div className="py-12 text-center text-xs font-mono text-slate-600">
                  Пусто
                </div>
              ) : (
                colLeads.map((lead) => (
                  <div
                    key={lead.id}
                    className="p-4 rounded-xl bg-obsidian border border-obsidian-border space-y-3"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <h4 className="font-bold text-sm text-white">{lead.name}</h4>
                        <p className="text-xs font-mono text-cyber-cyan">{lead.contact}</p>
                      </div>
                      <span className="text-[10px] font-mono text-slate-500">
                        {new Date(lead.createdAt).toLocaleDateString("ru-RU")}
                      </span>
                    </div>

                    <p className="text-xs text-slate-300 whitespace-pre-wrap bg-obsidian-card p-2.5 rounded-lg border border-obsidian-border">
                      {lead.message}
                    </p>

                    <div className="flex flex-wrap items-center justify-between gap-1.5 pt-2 border-t border-obsidian-border/60">
                      <div className="flex flex-wrap items-center gap-1.5">
                        <form
                          action={async () => {
                            await convertLeadToProject(lead.id);
                            onConvertedToProject();
                          }}
                        >
                          <button
                            title="Создать проект в Канбане на основе этой заявки"
                            className="px-2.5 py-1 rounded-lg bg-cyber-purple/20 hover:bg-cyber-purple/30 border border-cyber-purple/50 text-cyber-purple text-[11px] font-mono font-bold flex items-center gap-1 cursor-pointer transition-all"
                          >
                            <Rocket className="w-3 h-3" /> В проект
                          </button>
                        </form>

                        {lead.status !== "IN_PROGRESS" && (
                          <form action={updateLeadStatus.bind(null, lead.id, "IN_PROGRESS")}>
                            <button className="px-2 py-1 rounded-lg bg-obsidian-card border border-obsidian-border hover:border-cyber-cyan text-[10px] font-mono text-slate-300 cursor-pointer">
                              В работу
                            </button>
                          </form>
                        )}

                        {lead.status !== "CLOSED" && (
                          <form action={updateLeadStatus.bind(null, lead.id, "CLOSED")}>
                            <button className="px-2 py-1 rounded-lg bg-obsidian-card border border-obsidian-border hover:border-emerald-400 text-[10px] font-mono text-slate-300 cursor-pointer">
                              Архив
                            </button>
                          </form>
                        )}
                      </div>

                      <form action={deleteLead.bind(null, lead.id)}>
                        <button className="p-1 text-slate-500 hover:text-cyber-crimson cursor-pointer">
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </form>
                    </div>
                  </div>
                ))
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}