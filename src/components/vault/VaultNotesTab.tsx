"use client";

import React, { useState } from "react";
import { NoteItem, ProjectItem, CATEGORY_LABELS, EVENT_TYPES } from "./types";
import { deleteNote, toggleNoteArchive } from "@/app/actions";
import {
  Layers,
  Filter,
  Trash2,
  Copy,
  Check,
  Archive,
  CheckCircle2,
  RotateCcw,
} from "lucide-react";

interface VaultNotesTabProps {
  notes: NoteItem[];
  projects: ProjectItem[];
  noteFilterProjectId: string;
  setNoteFilterProjectId: (id: string) => void;
}

export default function VaultNotesTab({
  notes,
  projects,
  noteFilterProjectId,
  setNoteFilterProjectId,
}: VaultNotesTabProps) {
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [showArchived, setShowArchived] = useState<boolean>(false);

  const activeNotes = notes.filter((n) => !n.isArchived);
  const archivedNotes = notes.filter((n) => n.isArchived);
  const displayedNotes = showArchived ? archivedNotes : activeNotes;

  const renderFormattedNote = (content: string, noteId: string) => {
    const parts = content.split(/(`[^`]+`)/g);
    return (
      <div className="space-y-2.5">
        <p className="text-xs font-mono text-slate-300 whitespace-pre-wrap leading-relaxed">
          {parts.map((part, i) => {
            if (part.startsWith("`") && part.endsWith("`")) {
              return (
                <code
                  key={i}
                  className="px-1.5 py-0.5 mx-0.5 rounded bg-obsidian border border-cyber-cyan/40 text-cyber-cyan font-mono text-[11px]"
                >
                  {part.slice(1, -1)}
                </code>
              );
            }
            return part;
          })}
        </p>
        <button
          onClick={() => {
            navigator.clipboard.writeText(content);
            setCopiedId(noteId);
            setTimeout(() => setCopiedId(null), 2000);
          }}
          className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-obsidian border border-obsidian-border hover:border-cyber-cyan text-[10px] font-mono text-slate-400 hover:text-cyber-cyan transition-all cursor-pointer"
        >
          {copiedId === noteId ? (
            <>
              <Check className="w-3 h-3 text-emerald-400" /> Скопировано
            </>
          ) : (
            <>
              <Copy className="w-3 h-3" /> Копировать сниппет
            </>
          )}
        </button>
      </div>
    );
  };

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
        <div className="flex flex-wrap items-center gap-3">
          <h2 className="text-xl font-bold flex items-center gap-2">
            <Layers className="w-5 h-5 text-cyber-purple" /> Зашифрованные заметки
          </h2>

          {/* Переключатель: Актуальные заметки VS Архив выполненных */}
          <div className="flex items-center bg-obsidian p-1 rounded-xl border border-obsidian-border">
            <button
              onClick={() => setShowArchived(false)}
              className={`px-3 py-1 rounded-lg font-mono text-xs font-bold cursor-pointer transition-all ${
                !showArchived
                  ? "bg-cyber-cyan/20 text-cyber-cyan border border-cyber-cyan/40"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              Активные ({activeNotes.length})
            </button>
            <button
              onClick={() => setShowArchived(true)}
              className={`px-3 py-1 rounded-lg font-mono text-xs font-bold flex items-center gap-1.5 cursor-pointer transition-all ${
                showArchived
                  ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/40"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              <Archive className="w-3.5 h-3.5" /> Архив / Выполнено ({archivedNotes.length})
            </button>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-cyber-cyan" />
          <select
            value={noteFilterProjectId}
            onChange={(e) => setNoteFilterProjectId(e.target.value)}
            className="px-3.5 py-2 rounded-xl bg-obsidian-card border border-obsidian-border text-xs font-mono text-slate-300 outline-none focus:border-cyber-cyan"
          >
            <option value="ALL">Все узлы ({projects.length})</option>
            {projects.map((p) => (
              <option key={p.id} value={p.id}>
                Узел: {p.title}
              </option>
            ))}
          </select>
        </div>
      </div>

      {displayedNotes.length === 0 ? (
        <div className="p-10 rounded-2xl bg-obsidian-card border border-obsidian-border text-center text-slate-500 font-mono text-xs">
          {showArchived
            ? "В архиве пока нет выполненных заметок."
            : "Активных заметок в этой сфере пока нет. Нажми «+ Заметка» или используй Ctrl + K!"}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {displayedNotes.map((note) => {
            const cat = CATEGORY_LABELS[note.category] || CATEGORY_LABELS.DEV;
            const evType = EVENT_TYPES[note.eventType || "NOTE"] || EVENT_TYPES.NOTE;

            return (
              <div
                key={note.id}
                className={`p-6 rounded-2xl bg-obsidian-card border flex flex-col justify-between transition-all ${
                  note.isArchived
                    ? "border-emerald-500/30 opacity-80"
                    : "border-obsidian-border hover:border-cyber-cyan/40"
                }`}
              >
                <div>
                  <div className="flex items-center justify-between gap-2 mb-3">
                    <div className="flex flex-wrap items-center gap-1.5">
                      <span className={`px-2 py-0.5 rounded border text-[10px] font-mono ${cat.color}`}>
                        {cat.label}
                      </span>
                      <span className={`px-2 py-0.5 rounded border text-[10px] font-mono ${evType.color}`}>
                        {evType.label}
                      </span>
                    </div>

                    <div className="flex items-center gap-1">
                      {/* Кнопка: Выполнено / В архив (без удаления!) */}
                      <form action={toggleNoteArchive.bind(null, note.id, !!note.isArchived)}>
                        <button
                          title={note.isArchived ? "Вернуть из архива в активные" : "Отметить выполненным (В архив)"}
                          className={`p-1.5 rounded-lg border transition-colors cursor-pointer ${
                            note.isArchived
                              ? "bg-obsidian border-obsidian-border text-slate-400 hover:text-cyber-cyan"
                              : "bg-emerald-500/10 border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/20"
                          }`}
                        >
                          {note.isArchived ? (
                            <RotateCcw className="w-3.5 h-3.5" />
                          ) : (
                            <CheckCircle2 className="w-3.5 h-3.5" />
                          )}
                        </button>
                      </form>

                      <form action={deleteNote.bind(null, note.id)}>
                        <button
                          title="Удалить навсегда"
                          className="p-1.5 text-slate-500 hover:text-cyber-crimson cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </form>
                    </div>
                  </div>

                  {note.project && (
                    <div className="text-[11px] font-mono text-cyber-cyan mb-1.5">
                      // Узел: {note.project.title}
                    </div>
                  )}

                  <h3
                    className={`font-bold text-base mb-2.5 ${
                      note.isArchived ? "line-through text-slate-400" : "text-white"
                    }`}
                  >
                    {note.title}
                  </h3>
                  {renderFormattedNote(note.content, note.id)}
                </div>

                <div className="mt-5 pt-3 border-t border-obsidian-border/60 flex items-center justify-between text-[10px] font-mono text-slate-500">
                  <span>Создано: {new Date(note.createdAt).toLocaleDateString("ru-RU")}</span>
                  {note.isArchived && (
                    <span className="text-emerald-400 font-bold">✓ В АРХИВЕ</span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}