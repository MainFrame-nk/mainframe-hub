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

export interface TransactionItem {
  id: string;
  type: string; // "INCOME" | "EXPENSE"
  amount: number;
  category: string;
  description: string | null;
  date: Date | string;
  project?: { id: string; title: string } | null;
}

export interface WishlistItemType {
  id: string;
  title: string;
  targetPrice: number;
  savedAmount: number;
  priority: string; // "LOW" | "MEDIUM" | "HIGH"
  category: string;
  isBought: boolean;
}

export const FINANCE_CATEGORIES: Record<string, { label: string; color: string; barColor: string }> = {
  FOOD: { label: "🍔 Еда и Супермаркеты", color: "text-amber-400 border-amber-400/40 bg-amber-400/10", barColor: "bg-amber-400" },
  SERVERS: { label: "🖥️ Серверы и IT", color: "text-cyber-cyan border-cyber-cyan/40 bg-cyber-cyan/10", barColor: "bg-cyber-cyan" },
  BUSINESS: { label: "💼 Бизнес / Проекты", color: "text-cyber-purple border-cyber-purple/40 bg-cyber-purple/10", barColor: "bg-cyber-purple" },
  HOME: { label: "🏠 Дом и Семья", color: "text-emerald-400 border-emerald-400/40 bg-emerald-400/10", barColor: "bg-emerald-400" },
  FUN: { label: "🎮 Развлечения и Покупки", color: "text-cyber-crimson border-cyber-crimson/40 bg-cyber-crimson/10", barColor: "bg-cyber-crimson" },
  TRANSPORT: { label: "🚕 Транспорт / Авто", color: "text-blue-400 border-blue-400/40 bg-blue-400/10", barColor: "bg-blue-400" },
  OTHER: { label: "📦 Прочее", color: "text-slate-300 border-slate-500/40 bg-slate-500/10", barColor: "bg-slate-400" },
};

export interface ContactItem {
  id: string;
  name: string;
  avatarUrl: string | null;
  tag: string;
  role: string | null;
  telegram: string | null;
  phone: string | null;
  birthday: string | null;
  bio: string | null;
  projectId: string | null;
  project?: { id: string; title: string; accentColor?: string } | null;
  notes?: {
    id: string;
    title: string;
    content: string;
    eventType?: string;
    scheduledFor?: Date | string | null;
    remindOffset?: number | null;
    isArchived?: boolean;
    createdAt: Date | string;
  }[];
}

export const CONTACT_TAGS: Record<string, { label: string; badge: string }> = {
  DEV: { label: "💻 Команда / Разработка", badge: "text-cyber-cyan border-cyber-cyan/40 bg-cyber-cyan/10" },
  CLIENT: { label: "💼 Клиент / Заказчик", badge: "text-amber-400 border-amber-400/40 bg-amber-400/10" },
  PARTNER: { label: "🤝 Партнер / Бизнес", badge: "text-cyber-purple border-cyber-purple/40 bg-cyber-purple/10" },
  FRIEND: { label: "⚡ Друзья / Нетворк", badge: "text-emerald-400 border-emerald-400/40 bg-emerald-400/10" },
  FAMILY: { label: "🏠 Семья / Близкие", badge: "text-cyber-crimson border-cyber-crimson/40 bg-cyber-crimson/10" },
};

export interface AudioTrackItem {
  id: string;
  title: string;
  artist: string;
  genre: string;
  filename: string;
  fileSize: number;
  isFav: boolean;
  createdAt: Date | string;
}

export const AUDIO_GENRES: Record<string, { label: string; color: string }> = {
  CYBERPUNK: { label: "⚡ Cyberpunk / Electro", color: "text-cyber-cyan border-cyber-cyan/40 bg-cyber-cyan/10" },
  SYNTHWAVE: { label: "🌆 Synthwave / Retrowave", color: "text-cyber-purple border-cyber-purple/40 bg-cyber-purple/10" },
  PHONK: { label: "🔥 Drift Phonk / Hard", color: "text-cyber-crimson border-cyber-crimson/40 bg-cyber-crimson/10" },
  FOCUS: { label: "🧠 Deep Focus / Coding", color: "text-emerald-400 border-emerald-400/40 bg-emerald-400/10" },
  ROCK: { label: "🎸 Rock / Metal / Alt", color: "text-amber-400 border-amber-400/40 bg-amber-400/10" },
  OTHER: { label: "🎵 Личный вайб / Разное", color: "text-slate-300 border-slate-500/40 bg-slate-500/10" },
};