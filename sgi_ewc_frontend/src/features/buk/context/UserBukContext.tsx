import React, { useMemo, useState } from 'react';
import { useUserBuk } from '../hooks/useUserBuk';
import { useLanguage } from '../../../contexts/LanguageContext';

const UserBukList: React.FC = () => {
    const { users, loading, error, refresh, endpoint, page, pageSize, total, totalPages, setPage, registerUser } = useUserBuk();
    const { t } = useLanguage();
    const [registeringId, setRegisteringId] = useState<number | null>(null);
    const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

    const rangeStart = useMemo(() => (total === 0 ? 0 : (page - 1) * pageSize + 1), [total, page, pageSize]);
    const rangeEnd = useMemo(
        () => (total === 0 ? 0 : Math.min(total, rangeStart + users.length - 1)),
        [total, rangeStart, users.length]
    );

    const handleRegister = async (userId: number) => {
        const target = users.find(user => user.id === userId);
        if (!target || target.existsInApp) return;

        setFeedback(null);
        setRegisteringId(userId);
        try {
            await registerUser(target);
            setFeedback({ type: 'success', message: `${t('buk.actions.registerSuccess')} (${target.email})` });
        } catch (err) {
            const message = err instanceof Error ? err.message : String(err);
            setFeedback({ type: 'error', message: `${t('buk.actions.registerError')}: ${message}` });
        } finally {
            setRegisteringId(null);
        }
    };

    const handlePrev = () => {
        if (page <= 1 || loading) return;
        setPage(page - 1);
    };

    const handleNext = () => {
        if (page >= totalPages || loading) return;
        setPage(page + 1);
    };

    return (
        <section className="space-y-6">
            <header className="flex flex-col gap-4 p-6 border shadow-sm rounded-2xl border-slate-200/70 bg-white/80 backdrop-blur dark:border-white/5 dark:bg-white/5">
                <div>
                    <p className="text-sm font-semibold tracking-wide uppercase text-slate-400 dark:text-blue-200/60">BUK</p>
                    <h1 className="text-2xl font-semibold text-slate-900 dark:text-white">{t('buk.title')}</h1>
                    <p className="text-sm text-slate-600 dark:text-blue-100/80">{t('buk.description')}</p>
                </div>
                <div className="flex flex-wrap items-center gap-3 text-sm text-slate-500 dark:text-blue-100/70">
                    <span className="inline-flex items-center gap-2 px-3 py-1 border rounded-full border-slate-200 text-slate-600 dark:border-white/10 dark:text-white">
                        {t('buk.total')}: {total}
                    </span>
                    {endpoint && (
                        <span className="px-3 py-1 text-xs break-all border rounded-full border-slate-100 text-slate-500 dark:border-white/10 dark:text-blue-100/70">
                            {t('buk.endpointLabel')}: {endpoint}
                        </span>
                    )}
                    <button
                        type="button"
                        onClick={refresh}
                        disabled={loading}
                        className="ml-auto inline-flex items-center justify-center rounded-full bg-sky-600 px-4 py-1.5 text-sm font-semibold text-white shadow hover:bg-sky-500 disabled:opacity-60"
                    >
                        {loading ? t('common.loading') : t('buk.refresh')}
                    </button>
                </div>
            </header>

            {error && (
                <div className="p-4 text-sm border rounded-xl border-rose-200 bg-rose-50/80 text-rose-700 dark:border-rose-500/40 dark:bg-rose-500/10 dark:text-rose-100">
                    {t('buk.error')}: {error}
                </div>
            )}

            {feedback && (
                <div
                    className={`p-4 text-sm border rounded-xl ${
                        feedback.type === 'success'
                            ? 'border-emerald-200 bg-emerald-50/80 text-emerald-700 dark:border-emerald-500/40 dark:bg-emerald-500/10 dark:text-emerald-100'
                            : 'border-amber-200 bg-amber-50/80 text-amber-700 dark:border-amber-500/40 dark:bg-amber-500/10 dark:text-amber-100'
                    }`}
                >
                    {feedback.message}
                </div>
            )}

            <div className="overflow-hidden bg-white border shadow rounded-2xl border-slate-200 dark:border-white/10 dark:bg-slate-900">
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-slate-200 dark:divide-white/10">
                        <thead className="bg-slate-50 dark:bg-white/5">
                            <tr>
                                <th scope="col" className="px-6 py-3 text-xs font-semibold tracking-wider text-left uppercase text-slate-500 dark:text-blue-100/70">
                                    {t('buk.columns.id')}
                                </th>
                                <th scope="col" className="px-6 py-3 text-xs font-semibold tracking-wider text-left uppercase text-slate-500 dark:text-blue-100/70">
                                    {t('buk.columns.name')}
                                </th>
                                <th scope="col" className="px-6 py-3 text-xs font-semibold tracking-wider text-left uppercase text-slate-500 dark:text-blue-100/70">
                                    {t('buk.columns.email')}
                                </th>
                                <th scope="col" className="px-6 py-3 text-xs font-semibold tracking-wider text-left uppercase text-slate-500 dark:text-blue-100/70">
                                    {t('buk.columns.personId')}
                                </th>
                                <th scope="col" className="px-6 py-3 text-xs font-semibold tracking-wider text-left uppercase text-slate-500 dark:text-blue-100/70">
                                    {t('buk.columns.status')}
                                </th>
                                <th scope="col" className="px-6 py-3 text-xs font-semibold tracking-wider text-left uppercase text-slate-500 dark:text-blue-100/70">
                                    {t('buk.columns.registration')}
                                </th>
                            </tr>
                        </thead>
                        <tbody className="text-sm bg-white divide-y divide-slate-100 text-slate-700 dark:divide-white/5 dark:bg-transparent dark:text-white">
                            {loading && users.length === 0 ? (
                                <tr>
                                    <td colSpan={6} className="px-6 py-8 text-center text-slate-500 dark:text-blue-100/80">
                                        {t('common.loading')}
                                    </td>
                                </tr>
                            ) : users.length === 0 ? (
                                <tr>
                                    <td colSpan={6} className="px-6 py-8 text-center text-slate-500 dark:text-blue-100/80">
                                        {t('buk.empty')}
                                    </td>
                                </tr>
                            ) : (
                                users.map(user => (
                                    <tr key={user.id} className="hover:bg-slate-50/60 dark:hover:bg-white/5">
                                        <td className="px-6 py-4 font-mono text-sm text-slate-500 dark:text-blue-100/80">{user.id}</td>
                                        <td className="px-6 py-4 font-medium">{user.name}</td>
                                        <td className="px-6 py-4 text-slate-500 dark:text-blue-100/80">{user.email}</td>
                                        <td className="px-6 py-4 font-mono text-sm text-slate-500 dark:text-blue-100/80">{user.person_id ?? '—'}</td>
                                        <td className="px-6 py-4">
                                            <span
                                                className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ${
                                                    user.activated
                                                        ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-200'
                                                        : 'bg-rose-100 text-rose-700 dark:bg-rose-500/20 dark:text-rose-200'
                                                }`}
                                            >
                                                {user.activated ? t('common.active') : t('common.inactive')}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4">
                                            {user.existsInApp ? (
                                                <span className="inline-flex items-center px-3 py-1 text-xs font-semibold rounded-full bg-slate-100 text-slate-600 dark:bg-white/10 dark:text-blue-100/80">
                                                    {t('buk.actions.registered')}
                                                </span>
                                            ) : (
                                                <button
                                                    type="button"
                                                    onClick={() => handleRegister(user.id)}
                                                    disabled={registeringId === user.id || loading}
                                                    className="inline-flex items-center rounded-full bg-indigo-600 px-3 py-1.5 text-xs font-semibold text-white shadow hover:bg-indigo-500 disabled:opacity-60"
                                                >
                                                    {registeringId === user.id
                                                        ? t('buk.actions.registering')
                                                        : t('buk.actions.register')}
                                                </button>
                                            )}
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
                <div className="flex flex-col gap-3 px-6 py-4 text-xs border-t border-slate-200/70 bg-slate-50/60 text-slate-500 dark:border-white/10 dark:bg-white/5 dark:text-blue-100/70 md:flex-row md:items-center md:justify-between md:text-sm">
                    <span>
                        {total === 0
                            ? t('buk.pagination.empty')
                            : `${t('buk.pagination.showing')} ${rangeStart}-${rangeEnd} ${t('buk.pagination.of')} ${total}`}
                    </span>
                    <div className="flex items-center gap-3">
                        <button
                            type="button"
                            onClick={handlePrev}
                            disabled={page <= 1 || loading}
                            className="inline-flex items-center px-3 py-1 text-xs font-semibold transition border rounded-full border-slate-200 text-slate-600 hover:border-slate-300 hover:text-slate-700 disabled:opacity-50 dark:border-white/10 dark:text-blue-100/70 dark:hover:border-white/20"
                        >
                            {t('buk.pagination.previous')}
                        </button>
                        <span className="font-semibold text-slate-600 dark:text-blue-100/80">
                            {page} / {totalPages}
                        </span>
                        <button
                            type="button"
                            onClick={handleNext}
                            disabled={page >= totalPages || loading}
                            className="inline-flex items-center px-3 py-1 text-xs font-semibold transition border rounded-full border-slate-200 text-slate-600 hover:border-slate-300 hover:text-slate-700 disabled:opacity-50 dark:border-white/10 dark:text-blue-100/70 dark:hover:border-white/20"
                        >
                            {t('buk.pagination.next')}
                        </button>
                    </div>
                </div>
            </div>
        </section>
    );
};

export default UserBukList;