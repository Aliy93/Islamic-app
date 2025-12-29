
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
  // Start with today's date as a safe initial estimate.
  let gregorianDate = new Date();
  
  let hijri = getHijriDate(gregorianDate, 0); // Use 0 adjustment for the search loop

  let attempts = 0;
  // Iterate forward or backward until we find the target Hijri date
  // Limit attempts to prevent an infinite loop in case of an issue.
  while ((hijri.year !== year || hijri.month !== month || hijri.day !== day) && attempts < 15000) {
      // Determine the difference in days for a rough jump to get closer faster
      const yearDiff = (year - hijri.year) * 354;
      const monthDiff = (month - hijri.month) * 29.5;
      const dayDiff = day - hijri.day;
      let totalDiff = Math.round(yearDiff + monthDiff + dayDiff);
      
      // If we are close, just step one day at a time
      if (totalDiff === 0) {
        totalDiff = (year > hijri.year || month > hijri.month || day > hijri.day) ? 1 : -1;
      }
      
      gregorianDate = addDays(gregorianDate, totalDiff);
      hijri = getHijriDate(gregorianDate, 0);
      attempts++;
  }

  // Apply the user's manual adjustment at the end
  return subDays(gregorianDate, adjustment);
}
