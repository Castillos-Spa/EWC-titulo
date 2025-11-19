import React, { useEffect } from 'react';
import { X } from 'lucide-react';

type ModalSize = 'sm' | 'md' | 'lg' | 'xl';

interface ModalProps {
  open: boolean;
  title?: string;
  subtitle?: string;
  onClose: () => void;
  size?: ModalSize;
  children: React.ReactNode;
  footer?: React.ReactNode;
}

const sizeMap: Record<ModalSize, string> = {
  sm: 'max-w-md',
  md: 'max-w-lg',
  lg: 'max-w-3xl',
  xl: 'max-w-5xl',
};

export default function Modal({ open, title, subtitle, onClose, size = 'lg', children, footer }: Readonly<ModalProps>) {
  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    globalThis.addEventListener('keydown', handler);
    return () => globalThis.removeEventListener('keydown', handler);
  }, [open, onClose]);

  if (!open) return null;

  const onBackdropClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-slate-950/60 px-4 py-10 backdrop-blur-sm" onMouseDown={onBackdropClick}>
      <div className={`relative w-full ${sizeMap[size]} overflow-hidden rounded-3xl border border-slate-200/60 bg-white/90 p-6 text-slate-800 shadow-2xl shadow-slate-300/40 backdrop-blur dark:border-white/10 dark:bg-slate-900/90 dark:text-slate-100`}>
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(56,189,248,0.12),_rgba(226,232,240,0.06))] dark:bg-[radial-gradient(circle_at_top,_rgba(37,99,235,0.20),_rgba(15,23,42,0.35))]" />
        <header className="relative mb-4 flex items-start justify-between gap-4">
          <div>
            {title && <h3 className="text-xl font-semibold tracking-tight text-slate-900 dark:text-white">{title}</h3>}
            {subtitle && <p className="mt-1 text-sm text-slate-500 dark:text-blue-200/80">{subtitle}</p>}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-2xl border border-slate-200 bg-white/80 p-2 text-slate-500 transition hover:border-slate-300 hover:text-slate-700 dark:border-white/10 dark:bg-white/5 dark:text-blue-100"
            aria-label="Cerrar"
          >
            <X className="h-4 w-4" />
          </button>
        </header>
        <div className="relative">
          {children}
        </div>
        {footer && (
          <footer className="relative mt-6 border-t border-slate-200/60 pt-4 dark:border-white/10">
            {footer}
          </footer>
        )}
      </div>
    </div>
  );
}
