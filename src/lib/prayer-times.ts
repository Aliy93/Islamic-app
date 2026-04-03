import { parse } from 'date-fns';
import { Coordinates, CalculationMethod, PrayerTimes as AdhanPrayerTimes, CalculationParameters } from 'adhan';

export type LocationCoords = {
  latitude: number;
  longitude: number;
};

export type PrayerTimesData = {
  Fajr: string;
  Sunrise: string;
  Dhuhr: string;
  Asr: string;
  Maghrib: string;
  Isha: string;
};

export type PrayerName = keyof PrayerTimesData;

export type PrayerScheduleItem = {
  name: PrayerName;
  time: string;
};

const PRIMARY_PRAYERS: PrayerName[] = ['Fajr', 'Dhuhr', 'Asr', 'Maghrib', 'Isha'];

const METHOD_MAP: Record<number, () => CalculationParameters> = {
  1: () => CalculationMethod.NorthAmerica(),
  2: () => CalculationMethod.MuslimWorldLeague(),
  3: () => CalculationMethod.Egyptian(),
  4: () => CalculationMethod.UmmAlQura(),
  5: () => CalculationMethod.Karachi(),
  7: () => CalculationMethod.Tehran(),
};

function formatTimeHHmm(date: Date): string {
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  return `${hours}:${minutes}`;
}

export function getPrayerTimes(params: {
  date: Date;
  location: LocationCoords;
  method: number;
}): PrayerTimesData {
  const { date, location, method } = params;
  const coordinates = new Coordinates(location.latitude, location.longitude);
  const calculationParams = (METHOD_MAP[method] ?? METHOD_MAP[2])();
  const prayerTimes = new AdhanPrayerTimes(coordinates, date, calculationParams);

  return {
    Fajr: formatTimeHHmm(prayerTimes.fajr),
    Sunrise: formatTimeHHmm(prayerTimes.sunrise),
    Dhuhr: formatTimeHHmm(prayerTimes.dhuhr),
    Asr: formatTimeHHmm(prayerTimes.asr),
    Maghrib: formatTimeHHmm(prayerTimes.maghrib),
    Isha: formatTimeHHmm(prayerTimes.isha),
  };
}

export function getPrayerSchedule(timings: PrayerTimesData, includeSunrise: boolean = true): PrayerScheduleItem[] {
  const prayerNames = includeSunrise ? (Object.keys(timings) as PrayerName[]) : PRIMARY_PRAYERS;

  return prayerNames.map((name) => ({
    name,
    time: timings[name],
  }));
}

export function findNextPrayer(schedule: PrayerScheduleItem[], now: Date = new Date()): PrayerScheduleItem | null {
  for (const prayer of schedule) {
    const prayerTime = parse(prayer.time, 'HH:mm', now);
    if (prayerTime > now) {
      return prayer;
    }
  }

  return schedule[0] ?? null;
}