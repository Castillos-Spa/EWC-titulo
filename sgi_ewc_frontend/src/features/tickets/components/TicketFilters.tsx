import React from 'react';
import { LayoutList, LayoutPanelLeft, RefreshCcw, Search } from 'lucide-react';
import { TicketPriority, TicketStatus } from '../../../types/Ticket';
import type { ViewMode } from '../context/TicketsContext';
import { useLanguage } from '../../../contexts/LanguageContext';

interface TicketFiltersProps {
  search: string;
  status: 'all' | TicketStatus;
  category: string;
  priority: 'all' | TicketPriority;
  categories: string[];
  view: ViewMode;
  total: number;
  onSearchChange: (value: string) => void;
  onStatusChange: (value: 'all' | TicketStatus) => void;
  onCategoryChange: (value: string) => void;
  onPriorityChange: (value: 'all' | TicketPriority) => void;
  onViewChange: (value: ViewMode) => void;
  onReset: () => void;
}

const viewButtonStyles = (active: boolean) =>
  `inline-flex items-center gap-2 rounded-2xl px-4 py-2 text-sm font-semibold transition ${
    active
      ? 'bg-slate-900 text-white shadow-lg shadow-slate-900/30 dark:bg-white dark:text-slate-900'
      : 'border border-slate-200/70 bg-white/70 text-slate-600 hover:border-sky-400 hover:text-sky-500 dark:border-white/10 dark:bg-white/5 dark:text-slate-300'
  }`;

const TicketFilters: React.FC<TicketFiltersProps> = ({
  search,
  status,
  category,
  priority,
  categories,
  view,
  total,
  onSearchChange,
  onStatusChange,
  onCategoryChange,
  onPriorityChange,
  onViewChange,
  onReset,
}) => {
  const { t } = useLanguage();
  return (
  <section className="relative overflow-hidden rounded-3xl border border-slate-200/60 bg-white/80 p-6 shadow-lg shadow-slate-200/40 backdrop-blur dark:border-white/10 dark:bg-slate-900/60 dark:shadow-slate-900/30">
    <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_right,_rgba(14,165,233,0.18),_rgba(79,70,229,0.1)_55%,_rgba(15,23,42,0)_85%)]" />
    <div className="relative grid gap-6 lg:grid-cols-[1.5fr,2fr]">
      <div className="space-y-2">
        <span className="inline-flex items-center gap-2 rounded-full border border-slate-200/70 bg-white/70 px-3 py-1 text-xs font-semibold tracking-[0.28em] text-slate-500 backdrop-blur dark:border-white/10 dark:bg-white/10 dark:text-blue-100">
          <LayoutPanelLeft className="h-4 w-4" />
          <span>{t('tickets.panel.filters')}</span>
        </span>
        <p className="text-sm text-slate-500 dark:text-blue-200/80">
          {total > 0 ? `${total} ${t('tickets.matchesSuffix')}` : t('tickets.noMatches')}
        </p>
        <div className="inline-flex items-center gap-2">
          <button
            type="button"
            onClick={() => onViewChange('kanban')}
            className={viewButtonStyles(view === 'kanban')}
          >
            <LayoutPanelLeft className="h-4 w-4" />
            {t('tickets.view.kanban')}
          </button>
          <button
            type="button"
            onClick={() => onViewChange('list')}
            className={viewButtonStyles(view === 'list')}
          >
            <LayoutList className="h-4 w-4" />
            {t('tickets.view.list')}
          </button>
        </div>
      </div>
      <div className="grid gap-4">
        <div className="relative">
          <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400 dark:text-slate-500" />
          <input
            value={search}
            onChange={(event) => onSearchChange(event.target.value)}
            placeholder={t('tickets.filters.searchPlaceholder')}
            className="w-full rounded-2xl border border-slate-200 bg-white/80 px-11 py-3 text-sm text-slate-700 shadow-inner shadow-slate-200/60 transition focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-200 dark:border-slate-700 dark:bg-slate-950/70 dark:text-slate-100 dark:shadow-none dark:focus:border-sky-400 dark:focus:ring-sky-500/30"
          />
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <label className="flex flex-col gap-2 text-xs font-semibold uppercase tracking-[0.24em] text-slate-500 dark:text-blue-200/70">
            <span>{t('common.status')}</span>
            <select
              value={status}
              onChange={(event) => onStatusChange(event.target.value as 'all' | TicketStatus)}
              className="rounded-2xl border border-slate-200 bg-white/80 px-4 py-3 text-sm text-slate-700 shadow-inner shadow-slate-200/60 transition focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-200 dark:border-slate-700 dark:bg-slate-950/70 dark:text-slate-100 dark:shadow-none dark:focus:border-sky-400 dark:focus:ring-sky-500/30"
            >
              <option value="all">{t('common.all')}</option>
              {Object.values(TicketStatus).map(option => (
                <option key={option} value={option}>{option}</option>
              ))}
            </select>
          </label>
          <label className="flex flex-col gap-2 text-xs font-semibold uppercase tracking-[0.24em] text-slate-500 dark:text-blue-200/70">
            <span>{t('common.priority')}</span>
            <select
              value={priority}
              onChange={(event) => onPriorityChange(event.target.value as 'all' | TicketPriority)}
              className="rounded-2xl border border-slate-200 bg-white/80 px-4 py-3 text-sm text-slate-700 shadow-inner shadow-slate-200/60 transition focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-200 dark:border-slate-700 dark:bg-slate-950/70 dark:text-slate-100 dark:shadow-none dark:focus:border-sky-400 dark:focus:ring-sky-500/30"
            >
              <option value="all">{t('common.all')}</option>
              {Object.values(TicketPriority).map(option => (
                <option key={option} value={option}>{option}</option>
              ))}
            </select>
          </label>
          <label className="flex flex-col gap-2 text-xs font-semibold uppercase tracking-[0.24em] text-slate-500 dark:text-blue-200/70">
            <span>{t('common.category')}</span>
            <select
              value={category}
              onChange={(event) => onCategoryChange(event.target.value)}
              className="rounded-2xl border border-slate-200 bg-white/80 px-4 py-3 text-sm text-slate-700 shadow-inner shadow-slate-200/60 transition focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-200 dark:border-slate-700 dark:bg-slate-950/70 dark:text-slate-100 dark:shadow-none dark:focus:border-sky-400 dark:focus:ring-sky-500/30"
            >
              <option value="all">{t('common.all')}</option>
              {categories.map(option => (
                <option key={option} value={option}>{option}</option>
              ))}
            </select>
          </label>
        </div>
        <div className="flex justify-end">
          <button
            type="button"
            onClick={onReset}
            className="inline-flex items-center gap-2 rounded-2xl border border-slate-200/70 bg-white/70 px-4 py-2 text-sm font-semibold text-slate-600 shadow-sm transition hover:border-sky-400 hover:text-sky-500 dark:border-white/10 dark:bg-white/5 dark:text-slate-200"
          >
            <RefreshCcw className="h-4 w-4" />
            {t('tickets.filters.reset')}
          </button>
        </div>
      </div>
    </div>
  </section>
);
}

export default TicketFilters;
