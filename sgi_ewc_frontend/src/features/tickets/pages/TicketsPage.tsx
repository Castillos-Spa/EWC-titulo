import { useMemo, useState, useEffect } from 'react';
import { Sparkles, Ticket as TicketIcon, Plus } from 'lucide-react';
import { TicketsProvider, useTicketsContext } from '../context/TicketsContext';
import CreateTicketModal from '../components/CreateTicketModal';
import TicketDetailModal from '../components/TicketDetailModal';
import TicketKpis from '../components/TicketKpis';
import TicketFilters from '../components/TicketFilters';
import TicketKanban from '../components/TicketKanban';
import TicketTable from '../components/TicketTable';
import type { Ticket } from '../../../types/Ticket';
import { useLanguage } from '../../../contexts/LanguageContext';
import { useIntlFormat } from '../../../app/intl/format';

function TicketsInnerPage() {
  const {
    items,
    loading,
    error,
    search,
    view,
    status,
    category,
    priority,
    setSearch,
    setView,
    setStatus,
    setCategory,
    setPriority,
  } = useTicketsContext();

  const [selected, setSelected] = useState<Ticket | null>(null);
  const [openCreate, setOpenCreate] = useState(false);
  const { t } = useLanguage();
  const { locale } = useIntlFormat();

  // Integración con búsquedas globales y apertura directa
  // - "global-search": ajusta el filtro de búsqueda de Tickets
  // - "tickets:open": abre el detalle del ticket por id
  useEffect(() => {
    const onGlobalSearch = (event: Event) => {
      const ce = event as CustomEvent<{ query?: string }>;
      const query = ce.detail?.query ?? '';
      setSearch(query);
    };
    const onOpenTicket = (event: Event) => {
      const ce = event as CustomEvent<{ id?: number }>;
      const id = ce.detail?.id;
      if (!id) return;
      const ticket = items.find(it => it.id === id);
      if (ticket) {
        setSelected(ticket);
      } else {
        // si no está cargado, al menos filtrar por id
        setSearch(String(id));
      }
    };
    globalThis.addEventListener('global-search', onGlobalSearch as EventListener);
    globalThis.addEventListener('tickets:open', onOpenTicket as EventListener);
    return () => {
      globalThis.removeEventListener('global-search', onGlobalSearch as EventListener);
      globalThis.removeEventListener('tickets:open', onOpenTicket as EventListener);
    };
  }, [items, setSearch]);

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase();
    return items.filter(ticket => {
      const matchesQuery =
        query === '' ||
        ticket.title.toLowerCase().includes(query) ||
        ticket.description?.toLowerCase().includes(query) ||
        String(ticket.id).includes(query);
      const matchesStatus = status === 'all' || ticket.status === status;
      const matchesCategory = category === 'all' || ticket.category === category;
      const matchesPriority = priority === 'all' || ticket.priority === priority;
      return matchesQuery && matchesStatus && matchesCategory && matchesPriority;
    });
  }, [items, search, status, category, priority]);

  const categories = useMemo(() => {
    const unique = new Set<string>();
    for (const ticket of items) {
      if (ticket.category) unique.add(ticket.category);
    }
    return Array.from(unique).sort((a, b) => a.localeCompare(b));
  }, [items]);

  const resetFilters = () => {
    setSearch('');
    setStatus('all');
    setCategory('all');
    setPriority('all');
  };

  if (loading) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center text-sm font-semibold uppercase tracking-[0.32em] text-slate-500 dark:text-slate-300">
        {t('tickets.syncing')}
      </div>
    );
  }

  return (
    <div className="space-y-10 text-slate-800 dark:text-slate-100">
      <section className="relative overflow-hidden rounded-3xl border border-slate-200/60 bg-gradient-to-br from-indigo-100 via-white to-sky-100 px-8 py-6 shadow-xl shadow-slate-200/40 dark:border-white/10 dark:from-slate-900 dark:via-slate-950 dark:to-sky-900/10">
        <div className="pointer-events-none absolute -left-24 top-1/2 h-96 w-96 -translate-y-1/2 rounded-full bg-indigo-300/35 blur-3xl dark:bg-indigo-500/25" />
        <div className="pointer-events-none absolute -right-16 -top-16 h-80 w-80 rounded-full bg-sky-300/35 blur-3xl dark:bg-sky-500/25" />
        <div className="relative flex flex-wrap items-start justify-between gap-8">
          <div className="max-w-2xl space-y-4">
            <span className="inline-flex items-center gap-2 rounded-full border border-white/70 bg-white/80 px-3 py-1 text-xs font-semibold uppercase tracking-[0.32em] text-slate-600 shadow-sm backdrop-blur dark:border-white/10 dark:bg-white/5 dark:text-blue-100">
              <TicketIcon className="h-4 w-4" />
              <span>{t('tickets.helpdesk')}</span>
            </span>
            <h1 className="text-3xl font-semibold tracking-tight text-slate-900 dark:text-white">{t('tickets.header')}</h1>
            <p className="text-sm text-slate-600 dark:text-blue-100/80">
              {t('tickets.headerSub')}
            </p>
            <div className="inline-flex items-center gap-2 rounded-2xl border border-slate-200/60 bg-white/70 px-4 py-2 text-xs font-semibold uppercase tracking-[0.28em] text-slate-500 shadow-sm dark:border-white/10 dark:bg-white/5 dark:text-blue-200/70">
              <Sparkles className="h-4 w-4" /> {new Intl.NumberFormat(locale).format(items.length)} {t('tickets.totalActiveSuffix')}
            </div>
          </div>
          <button
            type="button"
            onClick={() => setOpenCreate(true)}
            className="inline-flex items-center gap-2 rounded-2xl bg-gradient-to-br from-indigo-500 to-sky-500 px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-indigo-400/40 transition hover:-translate-y-0.5"
          >
            <Plus className="h-4 w-4" /> {t('tickets.newTicket')}
          </button>
        </div>
      </section>

      {error && (
        <div className="relative overflow-hidden rounded-3xl border border-rose-200/70 bg-rose-50/80 px-6 py-4 text-rose-700 shadow-sm shadow-rose-200/40 dark:border-rose-500/30 dark:bg-rose-500/10 dark:text-rose-100">
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(244,114,182,0.25),_rgba(244,63,94,0)_70%)]" />
          <div className="relative">{error}</div>
        </div>
      )}

      <TicketKpis items={items} loading={loading} />

      <TicketFilters
        search={search}
        status={status}
        category={category}
        priority={priority}
        categories={categories}
        view={view}
        total={filtered.length}
        onSearchChange={setSearch}
        onStatusChange={setStatus}
        onCategoryChange={setCategory}
        onPriorityChange={setPriority}
        onViewChange={setView}
        onReset={resetFilters}
      />

      {view === 'kanban' ? (
        <TicketKanban items={filtered} onSelect={setSelected} />
      ) : (
        <TicketTable items={filtered} onSelect={setSelected} />
      )}

      {filtered.length === 0 && (
        <div className="relative overflow-hidden rounded-3xl border border-slate-200/60 bg-white/80 px-6 py-12 text-center shadow-lg shadow-slate-200/40 backdrop-blur dark:border-white/10 dark:bg-slate-900/60 dark:shadow-slate-900/30">
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(56,189,248,0.18),_rgba(15,23,42,0)_70%)]" />
          <div className="relative space-y-3 text-sm">
            <h3 className="text-lg font-semibold text-slate-900 dark:text-white">{t('tickets.noResultsTitle')}</h3>
            <p className="text-slate-500 dark:text-blue-200/80">{t('tickets.noResultsHint')}</p>
          </div>
        </div>
      )}

      {selected ? (
        <TicketDetailModal open ticket={selected} onClose={() => setSelected(null)} />
      ) : null}
      <CreateTicketModal open={openCreate} onClose={() => setOpenCreate(false)} />
    </div>
  );
}

export default function TicketsPage() {
  return (
    <TicketsProvider>
      <TicketsInnerPage />
    </TicketsProvider>
  );
}
