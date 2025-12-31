
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

const getHijriMonthNames = (date: Date): { monthName: string, monthNameAr: string } => {
    if (!date || isNaN(date.getTime())) {
      return { monthName: 'Muharram', monthNameAr: 'محرم' };
    }
    const monthName = new Intl.DateTimeFormat('en-u-ca-islamic-umalqura', { month: 'long' }).format(date);
    const monthNameAr = new Intl.DateTimeFormat('ar-u-ca-islamic-umalqura', { month: 'long' }).format(date);
    return { monthName, monthNameAr };
}

export function getHijriDate(gregorianDate: Date, adjustment: number = 0): HijriDateInfo {
  // Apply adjustment to the Gregorian date before conversion
  const adjustedDate = subDays(gregorianDate, adjustment);

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
  
  // Use 0 adjustment for the search loop, apply user adjustment at the end.
  let hijri = getHijriDate(gregorianDate, 0); 

  let attempts = 0;
  // Limit attempts to prevent an infinite loop in case of an issue.
  const MAX_ATTEMPTS = 40000; 

  // Estimate the difference in days for a rough jump to get closer faster
  const yearDiff = (year - hijri.year) * 354;
  const monthDiff = (month - hijri.month) * 29.5;
  const dayDiff = day - hijri.day;
  const totalDiff = Math.round(yearDiff + monthDiff + dayDiff);
  
  gregorianDate = addDays(gregorianDate, totalDiff);

  // Fine-tune by stepping one day at a time
  while (attempts < MAX_ATTEMPTS) {
      hijri = getHijriDate(gregorianDate, 0);
      
      if (hijri.year === year && hijri.month === month && hijri.day === day) {
          // Found the date, now apply the user's adjustment
          return addDays(gregorianDate, adjustment);
      }
      
      const isTargetFuture = (year > hijri.year) || (year === hijri.year && month > hijri.month) || (year === hijri.year && month === hijri.month && day > hijri.day);

      gregorianDate = addDays(gregorianDate, isTargetFuture ? 1 : -1);
      attempts++;
  }
  
  console.warn("Could not find Gregorian date for Hijri date:", {year, month, day});
  // Return a fallback date if not found within attempts
  return addDays(new Date(), adjustment);
}
