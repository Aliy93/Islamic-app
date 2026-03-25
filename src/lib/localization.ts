import { getLocaleTag, Language, usesEasternArabicNumerals } from '@/context/language-context';
import { getGregorianDateFromHijri, getHijriDate } from '@/lib/hijri';
import { toArabicNumerals } from '@/lib/utils';

const REFERENCE_HIJRI_YEAR = 1447;

function withFallback<T>(factory: () => T, fallback: () => T): T {
  try {
    return factory();
  } catch {
    return fallback();
  }
}

export function formatLocalizedNumber(value: number | string, lang: Language): string {
  const normalized = String(value);
  return usesEasternArabicNumerals(lang) ? toArabicNumerals(normalized) : normalized;
}

export function formatLocalizedGregorianDate(date: Date, lang: Language, options: Intl.DateTimeFormatOptions): string {
  return withFallback(
    () => new Intl.DateTimeFormat(getLocaleTag(lang), options).format(date),
    () => new Intl.DateTimeFormat('en-US', options).format(date)
  );
}

export function formatLocalizedTime(date: Date, lang: Language): string {
  return formatLocalizedGregorianDate(date, lang, {
    hour: 'numeric',
    minute: '2-digit',
  });
}

export function formatLocalizedHijriMonth(date: Date, lang: Language): string {
  return withFallback(() => {
    if (lang === 'om') {
      // Provide Latin-script Hijri month names appropriate for Afan Oromo users
      const hijri = getHijriDate(date, 0);
      const omMonths = [
        'Muharram',
        'Safar',
        "Rabi'ul-Awwal",
        "Rabi'ul-Thani",
        'Jumada I',
        'Jumada II',
        'Rajab',
        "Sha'ban",
        'Ramadan',
        'Shawwal',
        "Dhu'l-Qi'dah",
        "Dhu'l-Hijjah",
      ];
      return omMonths[Math.max(0, Math.min(11, hijri.month - 1))];
    }

    const localeForHijri = `${getLocaleTag(lang)}-u-ca-islamic-umalqura`;
    return new Intl.DateTimeFormat(localeForHijri, { month: 'long' }).format(date);
  }, () => new Intl.DateTimeFormat('en-u-ca-islamic-umalqura', { month: 'long' }).format(date));
}

export function formatLocalizedHijriMonthByNumber(month: number, lang: Language): string {
  const normalizedMonth = Math.min(Math.max(month, 1), 12);
  const referenceDate = getGregorianDateFromHijri(REFERENCE_HIJRI_YEAR, normalizedMonth, 1);
  return formatLocalizedHijriMonth(referenceDate, lang);
}

export function getLocalizedWeekdayShortNames(lang: Language): string[] {
  const saturday = new Date(Date.UTC(2024, 0, 6));

  return Array.from({ length: 7 }, (_, index) => {
    const day = new Date(saturday);
    day.setUTCDate(saturday.getUTCDate() + index);

    return formatLocalizedGregorianDate(day, lang, { weekday: 'short' });
  });
}