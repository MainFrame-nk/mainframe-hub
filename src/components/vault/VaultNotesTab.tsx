"use client";

import React, { useState } from "react";
import { NoteItem, ProjectItem, CATEGORY_LABELS } from "./types";
import { deleteNote } from "@/app/actions";
import { Layers, Filter, Trash2, Copy, Check } from "lucide-react";

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
        <h2 className="text-xl font-bold flex items-center gap-2">
          <Layers className="w-5 h-5 text-cyber-purple" /> Зашифрованные заметки и сниппеты ({notes.length})
        </h2>

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

      {notes.length === 0 ? (
        <div className="p-10 rounded-2xl bg-obsidian-card border border-obsidian-border text-center text-slate-500 font-mono text-xs">
          Заметок в этой сфере пока нет. Нажми «+ Заметка» или используй `Ctrl + K`!
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {notes.map((note) => {
            const cat = CATEGORY_LABELS[note.category] || CATEGORY_LABELS.DEV;
            return (
              <div
                key={note.id}
                className="p-6 rounded-2xl bg-obsidian-card border border-obsidian-border flex flex-col justify-between hover:border-cyber-cyan/40 transition-all"
              >
                <div>
                  <div className="flex items-center justify-between gap-2 mb-3">
                    <span className={`px-2.5 py-0.5 rounded border text-[10px] font-mono ${cat.color}`}>
                      {cat.label}
                    </span>
                    <form action={deleteNote.bind(null, note.id)}>
                      <button className="text-slate-500 hover:text-cyber-crimson cursor-pointer">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </form>
                  </div>
                  {note.project && (
                    <div className="text-[11px] font-mono text-cyber-cyan mb-1.5">
                      // Узел: {note.project.title}
                    </div>
                  )}
                  <h3 className="font-bold text-base mb-2.5 text-white">{note.title}</h3>
                  {renderFormattedNote(note.content, note.id)}
                </div>
                <div className="mt-5 pt-3 border-t border-obsidian-border/60 text-[10px] font-mono text-slate-500">
                  {new Date(note.createdAt).toLocaleDateString("ru-RU")}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}