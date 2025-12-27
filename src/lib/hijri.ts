import { addDays } from 'date-fns';

export type HijriDateInfo = {
  day: number;
  month: number;
  year: number;
  monthName: string;
  monthNameAr: string;
  weekday: string;
};

// Using Intl.DateTimeFormat is a modern and reliable way to handle calendar conversions.
// 'islamic-umalqura' is an algorithmic calendar, ensuring consistency.
const getHijriParts = (date: Date): Record<string, string> => {
  const formatter = new Intl.DateTimeFormat('en-u-ca-islamic-umalqura', {
    day: 'numeric',
    month: 'numeric',
    year: 'numeric',
    weekday: 'long',
  });
  const parts = formatter.formatToParts(date);
  return parts.reduce((acc, part) => {
    if (part.type !== 'literal') {
      acc[part.type] = part.value;
    }
    return acc;
  }, {} as Record<string, string>);
};

const getHijriMonthNames = (date: Date): { monthName: string, monthNameAr: string } => {
    const monthName = new Intl.DateTimeFormat('en-u-ca-islamic-umalqura', { month: 'long' }).format(date);
    const monthNameAr = new Intl.DateTimeFormat('ar-u-ca-islamic-umalqura', { month: 'long' }).format(date);
    return { monthName, monthNameAr };
}

export function getHijriDate(gregorianDate: Date, adjustment: number = 0): HijriDateInfo {
  // Apply adjustment to the Gregorian date before conversion
  const adjustedDate = addDays(gregorianDate, adjustment);

  const parts = getHijriParts(adjustedDate);
  const { monthName, monthNameAr } = getHijriMonthNames(adjustedDate);

  return {
    day: parseInt(parts.day, 10),
    month: parseInt(parts.month, 10),
    year: parseInt(parts.year, 10),
    monthName,
    monthNameAr,
    weekday: parts.weekday,
  };
}
