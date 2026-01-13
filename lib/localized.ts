import type { AppLocale, LocalizedString } from '@/types';

export function getLocalizedString(value: LocalizedString, locale: AppLocale): string {
  return value[locale] ?? value.zh;
}

export function getIntlLocale(locale: AppLocale): string {
  switch (locale) {
    case 'en':
      return 'en-US';
    case 'es':
      return 'es-ES';
    case 'zh':
    default:
      return 'zh-CN';
  }
}
