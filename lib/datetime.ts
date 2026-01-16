import type { Locale } from '@/contexts/I18nContext';

const LOCALE_MAP: Record<Locale, string> = {
  zh: 'zh-CN',
  en: 'en-US',
  es: 'es-ES',
};

export function formatShortDateTime(iso: string, locale: Locale): string {
  const date = new Date(iso);
  if (!Number.isFinite(date.valueOf())) return iso;

  const resolved = LOCALE_MAP[locale] ?? 'en-US';

  try {
    return date.toLocaleString(resolved, {
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    try {
      return date.toLocaleString();
    } catch {
      return iso;
    }
  }
}
