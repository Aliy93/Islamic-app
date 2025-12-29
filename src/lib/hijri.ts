import { addDays, subDays } from 'date-fns';

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

/**
 * A simple iterative function to find a Gregorian date that corresponds to a specific Hijri date.
 * This is a workaround because JavaScript's Intl API doesn't provide a direct way to convert from Hijri to Gregorian.
 * It starts with an estimate and adjusts until it finds the correct date.
 */
export function getGregorianDateFromHijri(year: number, month: number, day: number, adjustment: number = 0): Date {
  // Rough estimate: Hijri year is ~354/365 the length of a Gregorian year.
  // This gets us in the ballpark.
  let gregorianDate = new Date((year - 1) * 354.367 + (month - 1) * 29.53 + day, 0, 1);
  
  let hijri = getHijriDate(gregorianDate, 0); // Use 0 adjustment for the search loop

  let attempts = 0;
  // Iterate forward or backward until we find the target Hijri date
  while ((hijri.year !== year || hijri.month !== month || hijri.day !== day) && attempts < 40) {
    // Determine the difference in days for a rough jump
    const yearDiff = (year - hijri.year) * 354;
    const monthDiff = (month - hijri.month) * 29.5;
    const dayDiff = day - hijri.day;
    const totalDiff = Math.ceil(yearDiff + monthDiff + dayDiff);
    
    gregorianDate = addDays(gregorianDate, totalDiff !== 0 ? totalDiff : (day > hijri.day ? 1 : -1));
    hijri = getHijriDate(gregorianDate, 0);
    attempts++;
  }

  // Apply the user's manual adjustment at the end
  return subDays(gregorianDate, adjustment);
}
