export interface StageItem {
  id: string;
  title: string;
  status: string; // "TODO" | "IN_PROGRESS" | "DONE"
}

export interface ProjectItem {
  id: string;
  title: string;
  tagline: string;
  category: string;
  isPublic: boolean;
  techStack: string;
  accentColor: string;
  liveUrl?: string | null;
  stages: StageItem[];
}

export interface NoteItem {
  id: string;
  title: string;
  content: string;
  category: string;
  eventType?: string; // "NOTE" | "MEETING" | "DEADLINE" | "EVENT"
  isArchived?: boolean;
  scheduledFor?: Date | string | null;
  remindOffset?: number | null;
  reminderSent?: boolean;
  createdAt: Date | string;
  project: { id: string; title: string } | null;
}

export const EVENT_TYPES: Record<string, { label: string; color: string; dot: string }> = {
  NOTE: {
    label: "📝 Заметка",
    color: "text-cyber-cyan border-cyber-cyan/40 bg-cyber-cyan/10",
    dot: "bg-cyber-cyan",
  },
  MEETING: {
    label: "🤝 Встреча",
    color: "text-cyber-purple border-cyber-purple/40 bg-cyber-purple/10",
    dot: "bg-cyber-purple",
  },
  DEADLINE: {
    label: "🔥 Дедлайн",
    color: "text-cyber-crimson border-cyber-crimson/40 bg-cyber-crimson/15",
    dot: "bg-cyber-crimson",
  },
  EVENT: {
    label: "🎉 Событие",
    color: "text-emerald-400 border-emerald-400/40 bg-emerald-400/10",
    dot: "bg-emerald-400",
  },
};

export interface LeadItem {
  id: string;
  name: string;
  contact: string;
  message: string;
  status: string; // "NEW" | "IN_PROGRESS" | "CLOSED"
  createdAt: Date;
}

export const CATEGORIES = [
  { id: "ALL", label: "⚡ Все сферы" },
  { id: "DEV", label: "💻 Разработка" },
  { id: "BUSINESS", label: "💼 Бизнес" },
  { id: "WORK", label: "🛠️ Работа" },
  { id: "FAMILY", label: "🏠 Семья" },
];

export const CATEGORY_LABELS: Record<string, { label: string; color: string }> = {
  DEV: { label: "💻 Разработка", color: "text-cyber-cyan border-cyber-cyan/40 bg-cyber-cyan/10" },
  BUSINESS: { label: "💼 Бизнес", color: "text-cyber-crimson border-cyber-crimson/40 bg-cyber-crimson/10" },
  WORK: { label: "🛠️ Работа", color: "text-cyber-purple border-cyber-purple/40 bg-cyber-purple/10" },
  FAMILY: { label: "🏠 Семья", color: "text-emerald-400 border-emerald-400/40 bg-emerald-400/10" },
};