import type { AppLocale, LocalizedString } from '@/types';

export function getLocalizedString(value: LocalizedString, locale: AppLocale): string {
  return value[locale] ?? value.zh;
}

