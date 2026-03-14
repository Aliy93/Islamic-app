import { format, parse } from 'date-fns';
import { z } from 'zod';
import { parsePrayerTimesApiResponse } from '@/lib/external-data';

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

type CachedPrayerData = {
  timings: PrayerTimesData;
  date: string;
  location: LocationCoords;
  method: number;
  cachedAt: number;
};

const PRAYER_CACHE_PREFIX = 'prayerData:';
const PRIMARY_PRAYERS: PrayerName[] = ['Fajr', 'Dhuhr', 'Asr', 'Maghrib', 'Isha'];
const PRAYER_CACHE_TTL_MS = 24 * 60 * 60 * 1000;
const prayerTimeSchema = z.string().regex(/^\d{2}:\d{2}$/);
const prayerTimesSchema = z.object({
  Fajr: prayerTimeSchema,
  Sunrise: prayerTimeSchema,
  Dhuhr: prayerTimeSchema,
  Asr: prayerTimeSchema,
  Maghrib: prayerTimeSchema,
  Isha: prayerTimeSchema,
});
const cachedPrayerDataSchema = z.object({
  timings: prayerTimesSchema,
  date: z.string(),
  location: z.object({
    latitude: z.number().finite(),
    longitude: z.number().finite(),
  }),
  method: z.number(),
  cachedAt: z.number().int().nonnegative(),
});

function normalizeCoordinate(value: number): string {
  return value.toFixed(4);
}

function sanitizePrayerTime(time: string): string {
  return time.split(' ')[0].trim();
}

function normalizePrayerTimes(timings: PrayerTimesData, fetchErrorMessage: string): PrayerTimesData {
  const sanitized = {
    Fajr: sanitizePrayerTime(timings.Fajr),
    Sunrise: sanitizePrayerTime(timings.Sunrise),
    Dhuhr: sanitizePrayerTime(timings.Dhuhr),
    Asr: sanitizePrayerTime(timings.Asr),
    Maghrib: sanitizePrayerTime(timings.Maghrib),
    Isha: sanitizePrayerTime(timings.Isha),
  };

  const result = prayerTimesSchema.safeParse(sanitized);
  if (!result.success) {
    throw new Error(fetchErrorMessage);
  }

  return result.data;
}

function buildPrayerCacheKey(date: Date, location: LocationCoords, method: number): string {
  const dateStr = format(date, 'yyyy-MM-dd');
  return `${PRAYER_CACHE_PREFIX}${dateStr}:${normalizeCoordinate(location.latitude)}:${normalizeCoordinate(location.longitude)}:${method}`;
}

function readPrayerCache(key: string): CachedPrayerData | null {
  if (typeof window === 'undefined') return null;

  const cachedData = window.localStorage.getItem(key);
  if (!cachedData) return null;

  try {
    const parsed = cachedPrayerDataSchema.safeParse(JSON.parse(cachedData));
    if (!parsed.success) {
      window.localStorage.removeItem(key);
      return null;
    }

    if (Date.now() - parsed.data.cachedAt > PRAYER_CACHE_TTL_MS) {
      window.localStorage.removeItem(key);
      return null;
    }

    return parsed.data;
  } catch {
    window.localStorage.removeItem(key);
    return null;
  }
}

function writePrayerCache(key: string, value: CachedPrayerData) {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(key, JSON.stringify(value));
}

export async function getPrayerTimes(params: {
  date: Date;
  location: LocationCoords;
  method: number;
  fetchErrorMessage: string;
}): Promise<PrayerTimesData> {
  const { date, location, method, fetchErrorMessage } = params;
  const cacheKey = buildPrayerCacheKey(date, location, method);
  const cachedData = readPrayerCache(cacheKey);

  if (cachedData?.timings) {
    return cachedData.timings;
  }

  const timestamp = Math.floor(date.getTime() / 1000);
  const response = await fetch(
    `https://api.aladhan.com/v1/timings/${timestamp}?latitude=${location.latitude}&longitude=${location.longitude}&method=${method}`,
    {
      cache: 'no-store',
      referrerPolicy: 'no-referrer',
    }
  );

  if (!response.ok) {
    throw new Error(fetchErrorMessage);
  }

  const data = await response.json();
  const rawTimings = parsePrayerTimesApiResponse(data);
  const timings = normalizePrayerTimes(rawTimings, fetchErrorMessage);

  writePrayerCache(cacheKey, {
    timings,
    date: format(date, 'yyyy-MM-dd'),
    location,
    method,
    cachedAt: Date.now(),
  });

  return timings;
}

export function getPrayerSchedule(timings: PrayerTimesData, includeSunrise: boolean = true): PrayerScheduleItem[] {
  const prayerNames = includeSunrise ? (Object.keys(timings) as PrayerName[]) : PRIMARY_PRAYERS;

  return prayerNames.map((name) => ({
    name,
    time: sanitizePrayerTime(timings[name]),
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