"use client";

import { useState, useMemo, useEffect } from "react";
import {
  TransactionItem,
  WishlistItemType,
  ProjectItem,
  FINANCE_CATEGORIES,
} from "./types";
import {
  createTransaction,
  deleteTransaction,
  createWishlistItem,
  addSavedAmountToWishlist,
  markWishlistAsBought,
  deleteWishlistItem,
  syncTelegramFinanceMessages,
} from "@/app/actions";
import {
  TrendingUp,
  TrendingDown,
  Wallet,
  Plus,
  Trash2,
  ShoppingBag,
  CheckCircle2,
  Filter,
  Bot,
  RefreshCw,
  BarChart3,
  PieChart,
} from "lucide-react";

interface Props {
  transactions: TransactionItem[];
  wishlist: WishlistItemType[];
  projects: ProjectItem[];
}

const HEX_COLORS: Record<string, string> = {
  FOOD: "#fbbf24",      // amber-400
  SERVERS: "#00f0ff",   // cyber-cyan
  BUSINESS: "#8b5cf6",  // cyber-purple
  HOME: "#34d399",      // emerald-400
  FUN: "#ff2a5f",       // cyber-crimson
  TRANSPORT: "#60a5fa", // blue-400
  OTHER: "#94a3b8",     // slate-400
};

export default function VaultFinanceTab({ transactions, wishlist, projects }: Props) {
  const currentMonthStr = new Date().toISOString().slice(0, 7);
  const [selectedMonth, setSelectedMonth] = useState<string>(currentMonthStr);
  const [txType, setTxType] = useState<"EXPENSE" | "INCOME">("EXPENSE");
  const [showBotHelp, setShowBotHelp] = useState(false);
  const [isSyncingTg, setIsSyncingTg] = useState(false);

  // Автоматически проверяем новые сообщения в Telegram-боте при входе во вкладку и каждые 15 сек
  useEffect(() => {
    syncTelegramFinanceMessages();
    const timer = setInterval(() => {
      syncTelegramFinanceMessages();
    }, 15000);
    return () => clearInterval(timer);
  }, []);

  const handleManualSync = async () => {
    setIsSyncingTg(true);
    await syncTelegramFinanceMessages();
    setIsSyncingTg(false);
  };

  // Генерируем последние 6 месяцев для столбчатого графика динамики
  const last6MonthsData = useMemo(() => {
    const months: string[] = [];
    const now = new Date();
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const yyyy = d.getFullYear();
      const mm = String(d.getMonth() + 1).padStart(2, "0");
      months.push(`${yyyy}-${mm}`);
    }

    const data = months.map((m) => {
      let inc = 0;
      let exp = 0;
      transactions.forEach((t) => {
        const tm = new Date(t.date).toISOString().slice(0, 7);
        if (tm === m) {
          if (t.type === "INCOME") inc += t.amount;
          else exp += t.amount;
        }
      });
      const [y, mo] = m.split("-");
      const shortLabel = new Date(Number(y), Number(mo) - 1, 1).toLocaleDateString("ru-RU", {
        month: "short",
      });
      return { monthKey: m, label: shortLabel, income: inc, expense: exp };
    });

    const maxVal = Math.max(
      1000,
      ...data.map((d) => Math.max(d.income, d.expense))
    );

    return { data, maxVal };
  }, [transactions]);

  // Список доступных месяцев для фильтра
  const availableMonths = useMemo(() => {
    const set = new Set<string>([currentMonthStr]);
    transactions.forEach((t) => {
      const m = new Date(t.date).toISOString().slice(0, 7);
      set.add(m);
    });
    return Array.from(set).sort().reverse();
  }, [transactions, currentMonthStr]);

  // Транзакции выбранного месяца
  const filteredTransactions = useMemo(() => {
    if (selectedMonth === "ALL") return transactions;
    return transactions.filter(
      (t) => new Date(t.date).toISOString().slice(0, 7) === selectedMonth
    );
  }, [transactions, selectedMonth]);

  // Статистика и расчет долей категорий для кольцевого графика (Donut Chart)
  const stats = useMemo(() => {
    let income = 0;
    let expense = 0;
    const byCategory: Record<string, number> = {};

    filteredTransactions.forEach((t) => {
      if (t.type === "INCOME") {
        income += t.amount;
      } else {
        expense += t.amount;
        byCategory[t.category] = (byCategory[t.category] || 0) + t.amount;
      }
    });

    const net = income - expense;
    const savingsRate = income > 0 ? Math.round(((income - expense) / income) * 100) : 0;

    let cumulativePercent = 0;
    const sortedCategories = Object.entries(byCategory)
      .map(([cat, sum]) => {
        const rawPct = expense > 0 ? (sum / expense) * 100 : 0;
        const percent = Math.round(rawPct);
        const startOffset = cumulativePercent;
        cumulativePercent += rawPct;
        return {
          category: cat,
          amount: sum,
          percent,
          rawPct,
          startOffset,
          hex: HEX_COLORS[cat] || HEX_COLORS.OTHER,
        };
      })
      .sort((a, b) => b.amount - a.amount);

    return { income, expense, net, savingsRate, sortedCategories };
  }, [filteredTransactions]);

  const formatMoney = (val: number) =>
    new Intl.NumberFormat("ru-RU", {
      style: "currency",
      currency: "RUB",
      maximumFractionDigits: 0,
    }).format(val);

  const formatMonthLabel = (yyyyMm: string) => {
    if (yyyyMm === "ALL") return "За всё время";
    const [y, m] = yyyyMm.split("-");
    const date = new Date(Number(y), Number(m) - 1, 1);
    return date.toLocaleDateString("ru-RU", { month: "long", year: "numeric" });
  };

  return (
    <div className="space-y-6">
      {/* 1. ПАНЕЛЬ ФИЛЬТРАЦИИ ПО МЕСЯЦАМ + СИНХРОНИЗАЦИЯ С TELEGRAM */}
      <div className="flex flex-wrap items-center justify-between gap-4 p-4 rounded-2xl bg-obsidian-card/90 border border-obsidian-border">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400">
            <Filter className="w-4 h-4" />
          </div>
          <div>
            <p className="text-[11px] font-mono text-slate-400 uppercase">Фильтр по месяцам</p>
            <div className="flex items-center gap-2 mt-1 flex-wrap">
              <button
                onClick={() => setSelectedMonth("ALL")}
                className={`px-3 py-1 rounded-lg font-mono text-xs transition-all cursor-pointer ${
                  selectedMonth === "ALL"
                    ? "bg-cyber-purple text-white font-bold"
                    : "bg-obsidian border border-obsidian-border text-slate-400 hover:text-white"
                }`}
              >
                Все месяцы
              </button>
              {availableMonths.map((m) => (
                <button
                  key={m}
                  onClick={() => setSelectedMonth(m)}
                  className={`px-3 py-1 rounded-lg font-mono text-xs capitalize transition-all cursor-pointer ${
                    selectedMonth === m
                      ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 font-bold"
                      : "bg-obsidian border border-obsidian-border text-slate-400 hover:text-white"
                  }`}
                >
                  {formatMonthLabel(m)}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleManualSync}
            disabled={isSyncingTg}
            className="px-3.5 py-2 rounded-xl bg-emerald-500/15 hover:bg-emerald-500/25 border border-emerald-500/40 text-emerald-400 font-mono text-xs font-bold flex items-center gap-2 transition-all cursor-pointer disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isSyncingTg ? "animate-spin" : ""}`} />
            <span>{isSyncingTg ? "Синхронизация..." : "Забрать из ТГ-бота"}</span>
          </button>

          <button
            onClick={() => setShowBotHelp(!showBotHelp)}
            className="px-3.5 py-2 rounded-xl bg-obsidian border border-cyber-cyan/40 text-cyber-cyan hover:bg-cyber-cyan/10 font-mono text-xs flex items-center gap-2 transition-all cursor-pointer"
          >
            <Bot className="w-4 h-4" />
            <span>Формат команд ТГ</span>
          </button>
        </div>
      </div>

      {showBotHelp && (
        <div className="p-5 rounded-2xl bg-obsidian border border-cyber-cyan/40 space-y-2 text-xs font-mono">
          <p className="text-cyber-cyan font-bold">⚡ БЫСТРЫЙ ВВОД ТРАТ И ДОХОДОВ ИЗ TELEGRAM:</p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2 pt-1">
            <div className="p-2.5 rounded-lg bg-obsidian-card border border-obsidian-border">
              <span className="text-cyber-crimson font-bold">- 1500 Еда Бизнес-ланч и кофе</span>
              <p className="text-slate-500 text-[11px] mt-0.5">Запишет Расход 1 500 ₽ в категорию Еда</p>
            </div>
            <div className="p-2.5 rounded-lg bg-obsidian-card border border-obsidian-border">
              <span className="text-emerald-400 font-bold">+ 45000 Бизнес Оплата за проект</span>
              <p className="text-slate-500 text-[11px] mt-0.5">Запишет Доход 45 000 ₽ в категорию Бизнес</p>
            </div>
          </div>
        </div>
      )}

      {/* 2. СВОДНЫЕ КАРТОЧКИ МЕТРИК */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        <div className="p-5 rounded-2xl bg-obsidian-card/90 border border-emerald-500/30">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-xs font-mono text-slate-400 uppercase">Доходы ({formatMonthLabel(selectedMonth)})</span>
            <TrendingUp className="w-5 h-5 text-emerald-400" />
          </div>
          <div className="text-2xl md:text-3xl font-bold font-mono text-emerald-400">
            +{formatMoney(stats.income)}
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-obsidian-card/90 border border-cyber-crimson/30">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-xs font-mono text-slate-400 uppercase">Расходы ({formatMonthLabel(selectedMonth)})</span>
            <TrendingDown className="w-5 h-5 text-cyber-crimson" />
          </div>
          <div className="text-2xl md:text-3xl font-bold font-mono text-cyber-crimson">
            -{formatMoney(stats.expense)}
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-obsidian-card/90 border border-cyber-purple/40">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-xs font-mono text-slate-400 uppercase">Чистый баланс</span>
            <Wallet className="w-5 h-5 text-cyber-purple" />
          </div>
          <div
            className={`text-2xl md:text-3xl font-bold font-mono ${
              stats.net >= 0 ? "text-cyber-cyan" : "text-cyber-crimson"
            }`}
          >
            {stats.net >= 0 ? `+${formatMoney(stats.net)}` : formatMoney(stats.net)}
          </div>
        </div>
      </div>

      {/* 3. ВИЗУАЛЬНЫЕ ГРАФИКИ: ДИНАМИКА ПО МЕСЯЦАМ (BAR CHART) + СТРУКТУРА КАТЕГОРИЙ (DONUT CHART) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* ГРАФИК 1: Столбчатая диаграмма Доходы vs Расходы за 6 месяцев */}
        <div className="lg:col-span-6 p-6 rounded-2xl bg-obsidian-card/90 border border-obsidian-border flex flex-col justify-between">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-mono font-bold uppercase text-slate-200 flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-cyber-cyan" />
              <span>Динамика по месяцам (6 мес.)</span>
            </h3>
            <div className="flex items-center gap-3 text-[11px] font-mono">
              <span className="flex items-center gap-1 text-emerald-400">
                <span className="w-2.5 h-2.5 rounded-sm bg-emerald-400 inline-block" /> Доход
              </span>
              <span className="flex items-center gap-1 text-cyber-crimson">
                <span className="w-2.5 h-2.5 rounded-sm bg-cyber-crimson inline-block" /> Расход
              </span>
            </div>
          </div>

          <div className="h-52 flex items-end justify-between gap-3 pt-6 px-2 border-b border-obsidian-border/80">
            {last6MonthsData.data.map((m) => {
              const incHeight = Math.max(4, Math.round((m.income / last6MonthsData.maxVal) * 160));
              const expHeight = Math.max(4, Math.round((m.expense / last6MonthsData.maxVal) * 160));
              const isSelected = selectedMonth === m.monthKey;

              return (
                <div
                  key={m.monthKey}
                  onClick={() => setSelectedMonth(m.monthKey)}
                  className={`flex-1 flex flex-col items-center group cursor-pointer p-1.5 rounded-xl transition-all ${
                    isSelected ? "bg-obsidian border border-cyber-cyan/40" : "hover:bg-obsidian/50"
                  }`}
                  title={`${m.label}: Доход ${formatMoney(m.income)} / Расход ${formatMoney(m.expense)}`}
                >
                  <div className="w-full flex items-end justify-center gap-1.5 h-40">
                    {/* Столбик Дохода */}
                    <div
                      style={{ height: `${incHeight}px` }}
                      className="w-3.5 sm:w-4 rounded-t-md bg-gradient-to-t from-emerald-600 to-emerald-400 shadow-[0_0_12px_rgba(52,211,153,0.3)] transition-all duration-500"
                    />
                    {/* Столбик Расхода */}
                    <div
                      style={{ height: `${expHeight}px` }}
                      className="w-3.5 sm:w-4 rounded-t-md bg-gradient-to-t from-rose-700 to-cyber-crimson shadow-[0_0_12px_rgba(255,42,95,0.3)] transition-all duration-500"
                    />
                  </div>
                  <span
                    className={`mt-2 text-[11px] font-mono uppercase ${
                      isSelected ? "text-cyber-cyan font-bold" : "text-slate-400"
                    }`}
                  >
                    {m.label}
                  </span>
                </div>
              );
            })}
          </div>
          <p className="text-[11px] font-mono text-slate-500 mt-3 text-center">
            Нажми на любой месяц на графике для фильтрации операций
          </p>
        </div>

        {/* ГРАФИК 2: Кольцевая диаграмма (Donut SVG) + Полосы категорий */}
        <div className="lg:col-span-6 p-6 rounded-2xl bg-obsidian-card/90 border border-obsidian-border">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-mono font-bold uppercase text-slate-200 flex items-center gap-2">
              <PieChart className="w-4 h-4 text-cyber-purple" />
              <span>Категории расходов ({formatMonthLabel(selectedMonth)})</span>
            </h3>
            <span className="text-xs font-mono text-cyber-crimson font-bold">
              {formatMoney(stats.expense)}
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-12 gap-6 items-center">
            {/* Кольцевой SVG-график */}
            <div className="sm:col-span-5 flex justify-center">
              <div className="relative w-40 h-40 flex items-center justify-center">
                <svg className="w-full h-full -rotate-90" viewBox="0 0 36 36">
                  <circle
                    cx="18"
                    cy="18"
                    r="15.915"
                    fill="transparent"
                    stroke="#1e2230"
                    strokeWidth="3.5"
                  />
                  {stats.sortedCategories.map((item) => (
                    <circle
                      key={item.category}
                      cx="18"
                      cy="18"
                      r="15.915"
                      fill="transparent"
                      stroke={item.hex}
                      strokeWidth="3.8"
                      strokeDasharray={`${item.rawPct} ${100 - item.rawPct}`}
                      strokeDashoffset={-item.startOffset}
                      className="transition-all duration-500"
                    />
                  ))}
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                  <span className="text-[10px] font-mono text-slate-400 uppercase">Всего трат</span>
                  <span className="text-xs font-mono font-bold text-white mt-0.5">
                    {formatMoney(stats.expense)}
                  </span>
                </div>
              </div>
            </div>

            {/* Детализация по категориям */}
            <div className="sm:col-span-7 space-y-3">
              {stats.sortedCategories.length === 0 ? (
                <p className="text-xs font-mono text-slate-500 py-4">
                  За этот период пока нет расходов. Добавь операцию справа или через Telegram-бота!
                </p>
              ) : (
                stats.sortedCategories.map((item) => {
                  const cfg = FINANCE_CATEGORIES[item.category] || FINANCE_CATEGORIES.OTHER;
                  return (
                    <div key={item.category} className="space-y-1">
                      <div className="flex items-center justify-between text-xs font-mono">
                        <span className="text-slate-200 truncate">{cfg.label}</span>
                        <span className="text-slate-400 shrink-0">
                          <strong className="text-white">{formatMoney(item.amount)}</strong> ({item.percent}%)
                        </span>
                      </div>
                      <div className="w-full h-1.5 rounded-full bg-obsidian overflow-hidden">
                        <div
                          style={{ width: `${Math.max(item.percent, 3)}%` }}
                          className={`h-full rounded-full ${cfg.barColor}`}
                        />
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      </div>

      {/* 4. НИЖНИЙ БЛОК: ЖУРНАЛ ОПЕРАЦИЙ + ФОРМА ВВОДА + ПЛАНЫ ПОКУПОК */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Журнал транзакций */}
        <div className="lg:col-span-7 p-6 rounded-2xl bg-obsidian-card/90 border border-obsidian-border">
          <h3 className="text-sm font-mono font-bold uppercase text-slate-200 mb-4">
            🧾 Журнал операций ({filteredTransactions.length})
          </h3>

          <div className="space-y-2.5 max-h-[460px] overflow-y-auto pr-1">
            {filteredTransactions.length === 0 ? (
              <p className="text-xs font-mono text-slate-500 py-8 text-center">
                Операций за выбранный месяц пока нет.
              </p>
            ) : (
              filteredTransactions.map((tx) => {
                const cfg = FINANCE_CATEGORIES[tx.category] || FINANCE_CATEGORIES.OTHER;
                const isIncome = tx.type === "INCOME";
                return (
                  <div
                    key={tx.id}
                    className="p-3.5 rounded-xl bg-obsidian border border-obsidian-border hover:border-slate-700 flex items-center justify-between gap-3 transition-all"
                  >
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-mono border ${cfg.color}`}>
                          {cfg.label}
                        </span>
                        {tx.project && (
                          <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-cyber-purple/10 text-cyber-purple border border-cyber-purple/30">
                            📁 {tx.project.title}
                          </span>
                        )}
                        <span className="text-[11px] font-mono text-slate-500">
                          {new Date(tx.date).toLocaleDateString("ru-RU")}
                        </span>
                      </div>
                      {tx.description && (
                        <p className="text-sm text-slate-200 mt-1 truncate">{tx.description}</p>
                      )}
                    </div>

                    <div className="flex items-center gap-3 shrink-0">
                      <span
                        className={`font-mono font-bold text-sm ${
                          isIncome ? "text-emerald-400" : "text-cyber-crimson"
                        }`}
                      >
                        {isIncome ? "+" : "-"}
                        {formatMoney(tx.amount)}
                      </span>
                      <form action={deleteTransaction.bind(null, tx.id)}>
                        <button
                          type="submit"
                          className="p-1.5 rounded-lg text-slate-500 hover:text-cyber-crimson transition-colors cursor-pointer"
                          title="Удалить запись"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </form>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Форма записи + Планы покупок (Wishlist) */}
        <div className="lg:col-span-5 space-y-6">
          <div className="p-6 rounded-2xl bg-obsidian-card/90 border border-obsidian-border">
            <h3 className="text-sm font-mono font-bold uppercase text-slate-200 mb-4 flex items-center gap-2">
              <Plus className="w-4 h-4 text-cyber-cyan" />
              <span>Записать операцию вручную</span>
            </h3>

            <form action={createTransaction} className="space-y-3.5">
              <input type="hidden" name="type" value={txType} />

              <div className="grid grid-cols-2 gap-2 p-1 rounded-xl bg-obsidian border border-obsidian-border">
                <button
                  type="button"
                  onClick={() => setTxType("EXPENSE")}
                  className={`py-2 rounded-lg font-mono text-xs font-bold transition-all cursor-pointer ${
                    txType === "EXPENSE"
                      ? "bg-cyber-crimson text-white shadow-[0_0_15px_rgba(255,42,95,0.3)]"
                      : "text-slate-400 hover:text-white"
                  }`}
                >
                  📉 РАСХОД
                </button>
                <button
                  type="button"
                  onClick={() => setTxType("INCOME")}
                  className={`py-2 rounded-lg font-mono text-xs font-bold transition-all cursor-pointer ${
                    txType === "INCOME"
                      ? "bg-emerald-500 text-obsidian shadow-[0_0_15px_rgba(16,185,129,0.3)]"
                      : "text-slate-400 hover:text-white"
                  }`}
                >
                  📈 ДОХОД
                </button>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-mono text-slate-400 mb-1">Сумма (₽)*</label>
                  <input
                    type="number"
                    step="any"
                    name="amount"
                    required
                    placeholder="1500"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-obsidian border border-obsidian-border focus:border-cyber-cyan outline-none font-mono text-sm"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-mono text-slate-400 mb-1">Дата</label>
                  <input
                    type="date"
                    name="date"
                    defaultValue={new Date().toISOString().slice(0, 10)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-obsidian border border-obsidian-border focus:border-cyber-cyan outline-none font-mono text-xs"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-mono text-slate-400 mb-1">Категория</label>
                  <select
                    name="category"
                    className="w-full px-3 py-2.5 rounded-xl bg-obsidian border border-obsidian-border focus:border-cyber-cyan outline-none font-mono text-xs"
                  >
                    {Object.entries(FINANCE_CATEGORIES).map(([key, cfg]) => (
                      <option key={key} value={key}>
                        {cfg.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-mono text-slate-400 mb-1">Проект (опц.)</label>
                  <select
                    name="projectId"
                    className="w-full px-3 py-2.5 rounded-xl bg-obsidian border border-obsidian-border focus:border-cyber-cyan outline-none font-mono text-xs"
                  >
                    <option value="">— Личное —</option>
                    {projects.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.title}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-mono text-slate-400 mb-1">Комментарий</label>
                <input
                  type="text"
                  name="description"
                  placeholder="Бизнес-ланч и кофе"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-obsidian border border-obsidian-border focus:border-cyber-cyan outline-none text-sm"
                />
              </div>

              <button
                type="submit"
                className="w-full py-2.5 rounded-xl bg-cyber-cyan hover:bg-cyber-cyan/90 text-obsidian font-mono text-xs font-bold transition-all cursor-pointer"
              >
                СОХРАНИТЬ В БАЗУ
              </button>
            </form>
          </div>

          {/* ПЛАНЫ ПОКУПОК */}
          <div className="p-6 rounded-2xl bg-obsidian-card/90 border border-obsidian-border space-y-4">
            <h3 className="text-sm font-mono font-bold uppercase text-slate-200 flex items-center gap-2">
              <ShoppingBag className="w-4 h-4 text-cyber-purple" />
              <span>Планы покупок ({wishlist.filter((w) => !w.isBought).length})</span>
            </h3>

            <form action={createWishlistItem} className="p-3.5 rounded-xl bg-obsidian border border-obsidian-border space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                <input
                  type="text"
                  name="title"
                  required
                  placeholder="Цель (напр. Монитор)"
                  className="px-3 py-2 rounded-lg bg-obsidian-card border border-obsidian-border text-xs outline-none focus:border-cyber-purple"
                />
                <input
                  type="number"
                  name="targetPrice"
                  required
                  placeholder="Сумма (₽)"
                  className="px-3 py-2 rounded-lg bg-obsidian-card border border-obsidian-border text-xs font-mono outline-none focus:border-cyber-purple"
                />
              </div>
              <div className="grid grid-cols-2 gap-2.5">
                <select
                  name="category"
                  className="px-2.5 py-2 rounded-lg bg-obsidian-card border border-obsidian-border text-xs font-mono outline-none"
                >
                  {Object.entries(FINANCE_CATEGORIES).map(([k, v]) => (
                    <option key={k} value={k}>
                      {v.label}
                    </option>
                  ))}
                </select>
                <button
                  type="submit"
                  className="py-2 rounded-lg bg-cyber-purple hover:bg-cyber-purple/90 text-white font-mono text-xs font-bold transition-all cursor-pointer"
                >
                  + В планы
                </button>
              </div>
            </form>

            <div className="space-y-3 max-h-[320px] overflow-y-auto pr-1">
              {wishlist.map((item) => {
                const pct = Math.min(100, Math.round((item.savedAmount / item.targetPrice) * 100));
                return (
                  <div
                    key={item.id}
                    className={`p-4 rounded-xl border transition-all space-y-2.5 ${
                      item.isBought
                        ? "bg-obsidian/40 border-emerald-500/30 opacity-60"
                        : "bg-obsidian border-obsidian-border"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <h4 className="text-sm font-bold text-slate-100">{item.title}</h4>
                        <p className="text-xs font-mono text-slate-400 mt-0.5">
                          Накоплено: <strong className="text-cyber-cyan">{formatMoney(item.savedAmount)}</strong> /{" "}
                          <strong className="text-white">{formatMoney(item.targetPrice)}</strong> ({pct}%)
                        </p>
                      </div>
                      <form action={deleteWishlistItem.bind(null, item.id)}>
                        <button type="submit" className="text-slate-500 hover:text-cyber-crimson p-1 cursor-pointer">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </form>
                    </div>

                    <div className="w-full h-2 rounded-full bg-obsidian-card overflow-hidden">
                      <div
                        style={{ width: `${pct}%` }}
                        className="h-full bg-gradient-to-r from-cyber-purple to-cyber-cyan transition-all duration-300"
                      />
                    </div>

                    {!item.isBought && (
                      <div className="flex items-center justify-between gap-2 pt-1">
                        <div className="flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => addSavedAmountToWishlist(item.id, 1000)}
                            className="px-2 py-1 rounded bg-obsidian-card border border-obsidian-border hover:border-cyber-cyan text-[11px] font-mono text-slate-300 cursor-pointer"
                          >
                            +1к
                          </button>
                          <button
                            type="button"
                            onClick={() => addSavedAmountToWishlist(item.id, 5000)}
                            className="px-2 py-1 rounded bg-obsidian-card border border-obsidian-border hover:border-cyber-cyan text-[11px] font-mono text-slate-300 cursor-pointer"
                          >
                            +5к
                          </button>
                        </div>
                        <button
                          type="button"
                          onClick={() => markWishlistAsBought(item.id)}
                          className="px-3 py-1 rounded-lg bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-400 border border-emerald-500/40 font-mono text-xs font-bold flex items-center gap-1 cursor-pointer"
                        >
                          <CheckCircle2 className="w-3.5 h-3.5" /> Куплено
                        </button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}