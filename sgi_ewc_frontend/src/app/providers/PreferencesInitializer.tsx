import { useEffect } from 'react';

type UiDensity = 'comfortable' | 'compact';
type FontScale = 'sm' | 'md' | 'lg';

// Este componente aplica y sincroniza preferencias globales ligeras (densidad y tipografía).
// No renderiza nada: sólo side-effects centralizados.
export function PreferencesInitializer() {
  // Tema: aplicar al iniciar y reaccionar a cambios de storage y del sistema
  useEffect(() => {
    const mm: MediaQueryList | null = globalThis.matchMedia ? globalThis.matchMedia('(prefers-color-scheme: dark)') : null;
    const applyTheme = () => {
      const t = localStorage.getItem('theme');
      const prefersDark = mm?.matches ?? false;
      let dark = prefersDark;
      if (t) {
        if (t === 'system') dark = prefersDark;
        else if (t === 'dark') dark = true;
        else dark = false;
      }
      document.documentElement.classList.toggle('dark', dark);
    };
    applyTheme();
    const onStorage = (e: StorageEvent) => {
      if (e.key === 'theme') applyTheme();
    };
    const onChange = () => applyTheme();
    globalThis.addEventListener?.('storage', onStorage as unknown as EventListener);
    mm?.addEventListener?.('change', onChange);
    return () => {
      globalThis.removeEventListener?.('storage', onStorage as unknown as EventListener);
      mm?.removeEventListener?.('change', onChange);
    };
  }, []);

  // Densidad de interfaz: aplica variables CSS y dataset en <html>
  useEffect(() => {
    const applyDensity = (density: UiDensity) => {
      const root = document.documentElement;
      root.dataset.uiDensity = density;
      const spacing = density === 'compact' ? '1rem' : '1.5rem';
      const controlPadding = density === 'compact' ? '0.6rem 0.9rem' : '0.75rem 1.15rem';
      const radius = density === 'compact' ? '0.9rem' : '1.2rem';
      root.style.setProperty('--app-spacing', spacing);
      root.style.setProperty('--app-control-padding', controlPadding);
      root.style.setProperty('--app-card-radius', radius);
    };

    const stored = localStorage.getItem('uiDensity');
    const initial: UiDensity = stored === 'compact' || stored === 'comfortable' ? (stored as UiDensity) : 'comfortable';
    applyDensity(initial);

    // Notificar a quien escuche (ej. MainLayout) el valor inicial
    globalThis.dispatchEvent?.(new CustomEvent<UiDensity>('ui-density-change', { detail: initial }));

    const onStorage = (e: StorageEvent) => {
      if (e.key === 'uiDensity' && e.newValue) {
        const v = e.newValue as UiDensity;
        if (v === 'compact' || v === 'comfortable') applyDensity(v);
      }
    };
    const onCustom = (e: Event) => {
      const ce = e as CustomEvent<UiDensity>;
      if (ce.detail) applyDensity(ce.detail);
    };
    globalThis.addEventListener?.('storage', onStorage as unknown as EventListener);
    globalThis.addEventListener?.('ui-density-change', onCustom as EventListener);
    return () => {
      globalThis.removeEventListener?.('storage', onStorage as unknown as EventListener);
      globalThis.removeEventListener?.('ui-density-change', onCustom as EventListener);
    };
  }, []);

  // Escala tipográfica global
  useEffect(() => {
    const applyFontScale = (scale: FontScale) => {
      const root = document.documentElement;
      let size = '15px';
      if (scale === 'sm') size = '14px';
      else if (scale === 'lg') size = '16.5px';
      root.style.fontSize = size;
    };

    const stored = localStorage.getItem('fontScale');
    const initial: FontScale = stored === 'sm' || stored === 'md' || stored === 'lg' ? (stored as FontScale) : 'md';
    applyFontScale(initial);

    const onStorage = (e: StorageEvent) => {
      if (e.key === 'fontScale' && e.newValue) {
        const v = e.newValue as FontScale;
        if (v === 'sm' || v === 'md' || v === 'lg') applyFontScale(v);
      }
    };
    const onCustom = (e: Event) => {
      const ce = e as CustomEvent<FontScale>;
      if (ce.detail) applyFontScale(ce.detail);
    };
    globalThis.addEventListener?.('storage', onStorage as unknown as EventListener);
    globalThis.addEventListener?.('font-scale-change', onCustom as EventListener);
    return () => {
      globalThis.removeEventListener?.('storage', onStorage as unknown as EventListener);
      globalThis.removeEventListener?.('font-scale-change', onCustom as EventListener);
    };
  }, []);

  return null;
}
