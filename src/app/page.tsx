'use client';

import { useState, useEffect } from 'react';
import { useLanguage } from '@/context/language-context';
import { useSettings } from '@/context/settings-context';
import { translations } from '@/lib/translations';
import { getHijriDate, HijriDateInfo } from '@/lib/hijri';
import { format, parse, addDays, differenceInSeconds } from 'date-fns';
import { arSA } from 'date-fns/locale';
import { ChevronLeft, ChevronRight, MapPin, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import PrayerTimes from '@/components/prayer-times';
import { toArabicNumerals } from '@/lib/utils';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';

type PrayerTimesData = {
  Fajr: string;
  Sunrise: string;
  Dhuhr: string;
  Asr: string;
  Maghrib: string;
  Isha: string;
};

type Prayer = {
  name: keyof PrayerTimesData;
  time: string;
};

type CachedPrayerData = {
  timings: PrayerTimesData;
  date: string;
  location: { latitude: number; longitude: number };
  method: number;
};

export default function Home() {
  const { lang } = useLanguage();
  const { prayerMethod, location, locationError } = useSettings();
  const t = translations[lang];

  const [currentDate, setCurrentDate] = useState(new Date());
  const [error, setError] = useState<string | null>(null);
  const [nextPrayer, setNextPrayer] = useState<Prayer | null>(null);
  const [timeToNextPrayer, setTimeToNextPrayer] = useState('');
  const [mounted, setMounted] = useState(false);
  const [hijriDate, setHijriDate] = useState<HijriDateInfo | null>(null);

  // Initialize mounting state and stable date-dependent data
  useEffect(() => {
    setMounted(true);
  }, []);

  // Update Hijri date on the client to avoid hydration mismatch
  useEffect(() => {
    if (mounted) {
      setHijriDate(getHijriDate(currentDate));
    }
  }, [currentDate, mounted]);

  useEffect(() => {
    if (locationError) {
      setError(locationError);
    }
  }, [locationError]);

  useEffect(() => {
    if (!location || !mounted) return;

    const todayStr = format(currentDate, 'yyyy-MM-dd');

    const findNextPrayer = (prayerSchedule: Prayer[]) => {
      const now = new Date();
      let upcomingPrayer: Prayer | null = null;

      for (const prayer of prayerSchedule) {
        const prayerTime = parse(prayer.time, 'HH:mm', now);
        if (prayerTime > now) {
          upcomingPrayer = prayer;
          break;
        }
      }

      if (!upcomingPrayer) {
        upcomingPrayer = prayerSchedule[0];
      }
      setNextPrayer(upcomingPrayer);
    };

    const fetchPrayerTimes = async () => {
      try {
        const timestamp = Math.floor(currentDate.getTime() / 1000);
        const response = await fetch(`https://api.aladhan.com/v1/timings/${timestamp}?latitude=${location.latitude}&longitude=${location.longitude}&method=${prayerMethod}`);
        if (!response.ok) throw new Error(t.fetchError);

        const data = await response.json();
        if (data.code !== 200) throw new Error(data.data || t.fetchError);

        const timings: PrayerTimesData = data.data.timings;

        const newCachedData: CachedPrayerData = {
          timings,
          date: todayStr,
          location: location,
          method: prayerMethod,
        };
        localStorage.setItem('prayerData', JSON.stringify(newCachedData));

        const prayerSchedule: Prayer[] = Object.entries(timings)
          .filter(([key]) => ['Fajr', 'Dhuhr', 'Asr', 'Maghrib', 'Isha'].includes(key))
          .map(([name, time]) => ({ name: name as keyof PrayerTimesData, time }));

        findNextPrayer(prayerSchedule);
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : t.fetchError;
        setError(message);
      }
    };

    const cachedDataStr = localStorage.getItem('prayerData');
    if (cachedDataStr) {
      const cachedData: CachedPrayerData = JSON.parse(cachedDataStr);
      if (cachedData.date === todayStr && cachedData.location.latitude === location.latitude && cachedData.location.longitude === location.longitude && cachedData.method === prayerMethod) {
        const prayerSchedule: Prayer[] = Object.entries(cachedData.timings)
          .filter(([key]) => ['Fajr', 'Dhuhr', 'Asr', 'Maghrib', 'Isha'].includes(key))
          .map(([name, time]) => ({ name: name as keyof PrayerTimesData, time }));
        findNextPrayer(prayerSchedule);
      } else {
        fetchPrayerTimes();
      }
    } else {
      fetchPrayerTimes();
    }

    const interval = setInterval(() => {
      const prayerDataStr = localStorage.getItem('prayerData');
      if (!prayerDataStr) return;
      const timings = JSON.parse(prayerDataStr)?.timings;
      if (!timings) return;

      const prayerSchedule: Prayer[] = (Object.entries(timings) as [keyof PrayerTimesData, string][])
        .filter(([key]) => ['Fajr', 'Dhuhr', 'Asr', 'Maghrib', 'Isha'].includes(key))
        .map(([name, time]) => ({ name, time }));
      if (prayerSchedule.length > 0) findNextPrayer(prayerSchedule);
    }, 60000);
    return () => clearInterval(interval);

  }, [location, currentDate, t.fetchError, prayerMethod, mounted]);

  useEffect(() => {
    if (!nextPrayer || !mounted) return;

    const calculateCountdown = () => {
      const now = new Date();
      let prayerTime = parse(nextPrayer.time, 'HH:mm', new Date());

      if (prayerTime < now) {
        prayerTime = addDays(prayerTime, 1);
      }

      const diff = differenceInSeconds(prayerTime, now);
      if (diff < 0) {
        setTimeToNextPrayer('00:00:00');
        return;
      }
      const hours = Math.floor(diff / 3600);
      const minutes = Math.floor((diff % 3600) / 60);
      const seconds = diff % 60;

      const timeString = `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
      setTimeToNextPrayer(lang === 'ar' ? toArabicNumerals(timeString) : timeString);
    };

    calculateCountdown();
    const countdownInterval = setInterval(calculateCountdown, 1000);
    return () => clearInterval(countdownInterval);

  }, [nextPrayer, lang, mounted]);

  const handleDateChange = (direction: 'next' | 'prev') => {
    setCurrentDate(prevDate => addDays(prevDate, direction === 'next' ? 1 : -1));
  };

  return (
    <div className="flex flex-col h-full p-5 space-y-6" dir={lang === 'ar' ? 'rtl' : 'ltr'}>
      {/* Premium Next Prayer Card */}
      <div className="premium-gradient text-white p-6 rounded-[24px] shadow-xl relative overflow-hidden transition-all hover:shadow-2xl">
        <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-10 -mt-10 blur-2xl" />
        <div className="absolute bottom-0 left-0 w-24 h-24 bg-primary/20 rounded-full -ml-10 -mb-10 blur-xl" />
        <div className="relative z-10 flex flex-col items-center">
          <div className="flex items-center gap-2 mb-2 bg-white/20 px-3 py-1 rounded-full backdrop-blur-sm">
            <Clock className="w-4 h-4" />
            <p className="text-xs font-medium uppercase tracking-wider">{t.timeTill}</p>
          </div>
          <h2 className="text-3xl font-bold mb-1 font-headline">
            {mounted && nextPrayer ? (lang === 'ar' ? t.prayers[nextPrayer.name]?.arabic : nextPrayer.name) : '...'}
          </h2>
          <p className="text-5xl font-bold font-mono tracking-tight drop-shadow-sm">
            {mounted ? (timeToNextPrayer || '00:00:00') : '00:00:00'}
          </p>
          {location && (
            <div className="mt-4 flex items-center gap-1.5 text-white/80 text-xs">
              <MapPin className="w-3.5 h-3.5" />
              <span>{Math.round(location.latitude * 100) / 100}, {Math.round(location.longitude * 100) / 100}</span>
            </div>
          )}
        </div>
      </div>

      {/* Modern Date Section */}
      <div className="flex items-center justify-between px-2">
        <Button variant="ghost" size="icon" onClick={() => handleDateChange('prev')} className="rounded-full hover:bg-accent">
          {lang === 'ar' ? <ChevronRight className="h-6 w-6 text-primary" /> : <ChevronLeft className="h-6 w-6 text-primary" />}
        </Button>
        <div className="text-center">
          <h3 className="text-xl font-bold text-foreground font-headline">
            {mounted && hijriDate ? (
              lang === 'ar'
                ? `${hijriDate.monthNameAr} ${toArabicNumerals(hijriDate.day)}, ${toArabicNumerals(hijriDate.year)} هـ`
                : `${hijriDate.monthName} ${hijriDate.day}, ${hijriDate.year} AH`
            ) : <div className="h-7 w-32 bg-muted animate-pulse rounded mx-auto" />}
          </h3>
          <p className="text-sm text-muted-foreground font-medium uppercase tracking-wide mt-0.5">
            {mounted ? format(currentDate, 'eeee, d MMMM yyyy', { locale: lang === 'ar' ? arSA : undefined }) : <div className="h-4 w-40 bg-muted animate-pulse rounded mx-auto mt-2" />}
          </p>
        </div>
        <Button variant="ghost" size="icon" onClick={() => handleDateChange('next')} className="rounded-full hover:bg-accent">
          {lang === 'ar' ? <ChevronLeft className="h-6 w-6 text-primary" /> : <ChevronRight className="h-6 w-6 text-primary" />}
        </Button>
      </div>

      {error && (
        <Alert variant="destructive" className="rounded-xl">
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {!location && !locationError && mounted && (
        <Alert className="rounded-xl bg-accent/50 border-accent">
          <AlertTitle className="font-bold">{t.locationNeeded}</AlertTitle>
          <AlertDescription>{t.locationNeededMsg}</AlertDescription>
        </Alert>
      )}

      {/* Prayer Times Section */}
      <div className="flex-grow">
        <h4 className="text-sm font-bold text-muted-foreground uppercase tracking-widest mb-4 px-2">{t.todayPrayerTimes}</h4>
        <PrayerTimes currentDate={currentDate.getTime()} nextPrayerName={nextPrayer?.name} />
      </div>
    </div>
  );
}
