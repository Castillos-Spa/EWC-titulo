import React, { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { useTour } from '../../contexts/useTour';

interface Rect { top: number; left: number; width: number; height: number; }

function getRect(el: HTMLElement | null): Rect | null {
  if (!el) return null;
  const r = el.getBoundingClientRect();
  return { top: r.top + window.scrollY, left: r.left + window.scrollX, width: r.width, height: r.height };
}

export const OverlayTour: React.FC = () => {
  const { active, steps, index, nextStep, prevStep, stopTour } = useTour();
  const [rect, setRect] = useState<Rect | null>(null);
  const rafRef = useRef<number>();

  const step = steps[index];

  const measure = () => {
    if (!active) { setRect(null); return; }
    const selector = step?.target;
    let el: HTMLElement | null = null;
    if (selector) {
      const found = document.querySelector(selector);
      if (found instanceof HTMLElement) el = found;
    }
    setRect(getRect(el));
  };

  useLayoutEffect(() => { measure(); }, [active, index, step?.target]);

  useEffect(() => {
    if (!active) return;
    const onResize = () => { cancelAnimationFrame(rafRef.current!); rafRef.current = requestAnimationFrame(measure); };
    window.addEventListener('resize', onResize);
    window.addEventListener('scroll', onResize, true);
    return () => {
      window.removeEventListener('resize', onResize);
      window.removeEventListener('scroll', onResize, true);
    };
  }, [active, step?.target]);

  if (!active) return null;

  const highlight = rect && rect.width > 0 && rect.height > 0;
  const padding = 10;
  const box = highlight ? {
    top: rect.top - padding,
    left: rect.left - padding,
    width: rect.width + padding * 2,
    height: rect.height + padding * 2,
  } : null;

  return createPortal(
    <div aria-live="polite" aria-label="Guía interactiva" className="pointer-events-none">
      {/* Fondo transparente (modo demo: permitir ver contenido subyacente) */}
      <div className="fixed inset-0 z-[90]" />
      {box && (
        <div
          className="absolute z-[95] rounded-xl ring-2 ring-sky-400 shadow-2xl bg-white/5 dark:bg-white/10"
          style={{ position: 'absolute', top: box.top, left: box.left, width: box.width, height: box.height, transition: 'all 0.25s' }}
        />
      )}
      {/* Tooltip inferior */}
      <div className="fixed z-[100] left-1/2 bottom-5 w-[92vw] max-w-xl -translate-x-1/2 rounded-2xl border border-slate-200 bg-white p-5 text-slate-800 shadow-2xl dark:border-white/10 dark:bg-slate-900 dark:text-white pointer-events-auto">
        <div className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-blue-200/80">Paso {index + 1} de {steps.length}</div>
        <div className="mb-1 text-lg font-semibold">{step.title}</div>
        <p className="mb-4 text-sm text-slate-600 dark:text-blue-200/80">{step.description}</p>
        <div className="flex items-center justify-between">
          <div className="flex gap-2">
            <button type="button" onClick={stopTour} className="rounded-full border border-slate-300 px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-100 dark:border-white/10 dark:text-white dark:hover:bg-white/10">Salir</button>
            <button type="button" disabled={index === 0} onClick={prevStep} className="rounded-full border border-slate-300 px-3 py-1.5 text-xs font-medium text-slate-700 disabled:opacity-50 hover:bg-slate-100 dark:border-white/10 dark:text-white dark:hover:bg-white/10">Anterior</button>
          </div>
          <button type="button" onClick={nextStep} className="rounded-full bg-sky-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-sky-500">{index === steps.length - 1 ? 'Finalizar' : 'Siguiente'}</button>
        </div>
      </div>
    </div>,
    document.body
  );
};

export default OverlayTour;
