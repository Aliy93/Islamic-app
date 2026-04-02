
import { addDays, differenceInCalendarDays, subDays } from 'date-fns';
import { getDefaultHijriMonthNames } from '@/lib/hijri-months';

export type HijriDateInfo = {
  day: number;
  month: number;
  year: number;
  monthName: string;
  monthNameAr: string;
  weekday: string;
};

const ESTIMATED_DAYS_PER_HIJRI_YEAR = 354.367;
const ESTIMATED_DAYS_PER_HIJRI_MONTH = 29.531;
const INITIAL_SEARCH_PADDING_DAYS = 45;
const SEARCH_EXPANSION_DAYS = 30;
const gregorianFromHijriCache = new Map<string, number>();

// Using Intl.DateTimeFormat is a modern and reliable way to handle calendar conversions.
// 'islamic-umalqura' is an algorithmic calendar, ensuring consistency.
const getHijriParts = (date: Date): Record<string, string> => {
  const formatter = new Intl.DateTimeFormat('en-u-ca-islamic-umalqura', {
    day: 'numeric',
    month: 'numeric',
    year: 'numeric',
    weekday: 'long',
  });
  if (!date || isNaN(date.getTime())) {
    // Return a default or handle the invalid date case
    return { day: '1', month: '1', year: '1445', weekday: 'Unknown' };
  }
  const parts = formatter.formatToParts(date);
  return parts.reduce((acc, part) => {
    if (part.type !== 'literal') {
      acc[part.type] = part.value;
    }
    return acc;
  }, {} as Record<string, string>);
};

const getHijriMonthNames = (month: number): { monthName: string, monthNameAr: string } => {
    return getDefaultHijriMonthNames(month);
}

function toStableDate(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate(), 12);
}

function compareHijriDate(
  left: Pick<HijriDateInfo, 'year' | 'month' | 'day'>,
  right: Pick<HijriDateInfo, 'year' | 'month' | 'day'>
): number {
  if (left.year !== right.year) return left.year - right.year;
  if (left.month !== right.month) return left.month - right.month;
  return left.day - right.day;
}

function getCacheKey(year: number, month: number, day: number): string {
  return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
}

function findGregorianDateForHijriTarget(target: Pick<HijriDateInfo, 'year' | 'month' | 'day'>): Date {
  const referenceDate = toStableDate(new Date());
  const referenceHijri = getHijriDate(referenceDate, 0);
  const estimatedOffset = Math.round(
    (target.year - referenceHijri.year) * ESTIMATED_DAYS_PER_HIJRI_YEAR +
    (target.month - referenceHijri.month) * ESTIMATED_DAYS_PER_HIJRI_MONTH +
    (target.day - referenceHijri.day)
  );

  let low = addDays(referenceDate, estimatedOffset - INITIAL_SEARCH_PADDING_DAYS);
  let high = addDays(referenceDate, estimatedOffset + INITIAL_SEARCH_PADDING_DAYS);

  while (compareHijriDate(getHijriDate(low, 0), target) > 0) {
    low = addDays(low, -SEARCH_EXPANSION_DAYS);
  }

  while (compareHijriDate(getHijriDate(high, 0), target) < 0) {
    high = addDays(high, SEARCH_EXPANSION_DAYS);
  }

  while (differenceInCalendarDays(high, low) >= 0) {
    const mid = addDays(low, Math.floor(differenceInCalendarDays(high, low) / 2));
    const midHijri = getHijriDate(mid, 0);
    const comparison = compareHijriDate(midHijri, target);

    if (comparison === 0) {
      return mid;
    }

    if (comparison < 0) {
      low = addDays(mid, 1);
    } else {
      high = addDays(mid, -1);
    }
  }

  console.warn('Could not find Gregorian date for Hijri date:', target);
  return referenceDate;
}

export function getHijriDate(gregorianDate: Date, adjustment: number = 0): HijriDateInfo {
  // Apply adjustment to the Gregorian date before conversion
  const adjustedDate = addDays(gregorianDate, adjustment);

  const parts = getHijriParts(adjustedDate);
  const month = parseInt(parts.month, 10);
  const { monthName, monthNameAr } = getHijriMonthNames(month);

  return {
    day: parseInt(parts.day, 10),
    month,
    year: parseInt(parts.year, 10),
    monthName,
    monthNameAr,
    weekday: parts.weekday,
  };
}

export function getGregorianDateFromHijri(year: number, month: number, day: number, adjustment: number = 0): Date {
  const cacheKey = getCacheKey(year, month, day);
  const cachedTimestamp = gregorianFromHijriCache.get(cacheKey);
  const baseDate = cachedTimestamp
    ? new Date(cachedTimestamp)
    : findGregorianDateForHijriTarget({ year, month, day });

  if (!cachedTimestamp) {
    gregorianFromHijriCache.set(cacheKey, baseDate.getTime());
  }

  return subDays(baseDate, adjustment);
}
