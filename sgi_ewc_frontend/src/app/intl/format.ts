import type { Languages } from '../../contexts/LanguageContext';

// Mapear idioma de la app a locale de Intl
const LANGUAGE_LOCALES: Record<Languages, string> = {
  es: 'es-CL',
  en: 'en-US',
  pt: 'pt-BR',
  fr: 'fr-FR',
  de: 'de-DE',
  it: 'it-IT',
};

export type DateFormat = 'DMY' | 'MDY';

export const getUserDateFormat = (): DateFormat => {
  const v = (localStorage.getItem('dateFormat') || 'DMY').toUpperCase();
  return v === 'MDY' ? 'MDY' : 'DMY';
};

export const is24HourClock = (): boolean => {
  return localStorage.getItem('timeFormat24h') !== 'false'; // default a 24h
};

export const resolveLocale = (language?: Languages): string => {
  const fromStorage = (localStorage.getItem('language') as Languages | null) || undefined;
  const lang = language || fromStorage || 'es';
  return LANGUAGE_LOCALES[lang] || 'es-CL';
};

type DateInput = string | number | Date | null | undefined;

const toDate = (value?: DateInput): Date | null => {
  if (value == null) return null;
  const d = value instanceof Date ? value : new Date(value);
  return Number.isNaN(d.getTime()) ? null : d;
};

// Devuelve dd/mm/yyyy o mm/dd/yyyy según preferencia del usuario
export const formatDateOnly = (
  value?: DateInput,
  options?: { language?: Languages; dateFormat?: DateFormat }
): string => {
  const d = toDate(value);
  if (!d) return '';
  const fmt = options?.dateFormat || getUserDateFormat();
  const dd = String(d.getDate()).padStart(2, '0');
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const yyyy = String(d.getFullYear());
  return fmt === 'MDY' ? `${mm}/${dd}/${yyyy}` : `${dd}/${mm}/${yyyy}`;
};

export const formatTimeOnly = (
  value?: DateInput,
  options?: { language?: Languages; hour12?: boolean }
): string => {
  const d = toDate(value);
  if (!d) return '';
  const locale = resolveLocale(options?.language);
  const hour12 = options?.hour12 ?? !is24HourClock();
  try {
    return new Intl.DateTimeFormat(locale, {
      hour: '2-digit',
      minute: '2-digit',
      hour12,
    }).format(d);
  } catch {
    // Fallback simple
    const hh = String(d.getHours()).padStart(2, '0');
    const mm = String(d.getMinutes()).padStart(2, '0');
    return `${hh}:${mm}`;
  }
};

export const formatDateTime = (
  value?: DateInput,
  options?: { language?: Languages; dateFormat?: DateFormat; hour12?: boolean }
): string => {
  const d = toDate(value);
  if (!d) return '';
  const date = formatDateOnly(d, { language: options?.language, dateFormat: options?.dateFormat });
  const time = formatTimeOnly(d, { language: options?.language, hour12: options?.hour12 });
  return `${date} ${time}`.trim();
};

// Fecha larga con día de la semana y mes en texto, según idioma (no fuerza DMY/MDY)
export const formatLongDate = (value?: DateInput, options?: { language?: Languages }): string => {
  const d = toDate(value);
  if (!d) return '';
  const locale = resolveLocale(options?.language);
  try {
    return new Intl.DateTimeFormat(locale, { dateStyle: 'full' }).format(d);
  } catch {
    return formatDateOnly(d, { language: options?.language });
  }
};

// Hook ligero para componentes React. Evita estados complejos: lee preferencias en cada render
// y re-renderiza automáticamente cuando cambie el idioma (via LanguageProvider) o storage (evento)
import { useEffect, useMemo, useState } from 'react';
import { useLanguage } from '../../contexts/LanguageContext';

export const useIntlFormat = () => {
  const { language } = useLanguage();
  const [tick, setTick] = useState(0);

  useEffect(() => {
    const handler = (e: StorageEvent) => {
      if (!e.key || e.key === 'dateFormat' || e.key === 'timeFormat24h' || e.key === 'language') {
        setTick((x) => x + 1);
      }
    };
    globalThis.addEventListener('storage', handler);
    const custom = () => setTick((x) => x + 1);
    globalThis.addEventListener('intl-preferences-change', custom as EventListener);
    return () => {
      globalThis.removeEventListener('storage', handler);
      globalThis.removeEventListener('intl-preferences-change', custom as EventListener);
    };
  }, []);

  // Re-crear formateadores cuando cambian dependencias
  return useMemo(() => {
    const locale = resolveLocale(language);
    return {
      locale,
      formatDate: (v?: DateInput) => formatDateOnly(v, { language }),
      formatTime: (v?: DateInput) => formatTimeOnly(v, { language }),
      formatDateTime: (v?: DateInput) => formatDateTime(v, { language }),
      formatLongDate: (v?: DateInput) => formatLongDate(v, { language }),
      is24h: is24HourClock(),
      dateFormat: getUserDateFormat(),
      _tick: tick, // útil para forzar re-render cuando storage cambia
    };
  }, [language, tick]);
};
