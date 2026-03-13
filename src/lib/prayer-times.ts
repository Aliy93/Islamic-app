import { format, parse } from 'date-fns';

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
};

const PRAYER_CACHE_PREFIX = 'prayerData:';
const PRIMARY_PRAYERS: PrayerName[] = ['Fajr', 'Dhuhr', 'Asr', 'Maghrib', 'Isha'];

function normalizeCoordinate(value: number): string {
  return value.toFixed(4);
}

function sanitizePrayerTime(time: string): string {
  return time.split(' ')[0].trim();
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
    return JSON.parse(cachedData) as CachedPrayerData;
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
    `https://api.aladhan.com/v1/timings/${timestamp}?latitude=${location.latitude}&longitude=${location.longitude}&method=${method}`
  );

  if (!response.ok) {
    throw new Error(fetchErrorMessage);
  }

  const data = await response.json();
  if (data.code !== 200 || !data.data?.timings) {
    throw new Error(data.data || fetchErrorMessage);
  }

  const timings = Object.fromEntries(
    Object.entries(data.data.timings).map(([name, time]) => [name, sanitizePrayerTime(String(time))])
  ) as PrayerTimesData;

  writePrayerCache(cacheKey, {
    timings,
    date: format(date, 'yyyy-MM-dd'),
    location,
    method,
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