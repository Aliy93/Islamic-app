'use client';

import { useState, useEffect } from 'react';
import { useLanguage } from '@/context/language-context';
import { useSettings } from '@/context/settings-context';
import { translations } from '@/lib/translations';
import { getHijriDate, HijriDateInfo } from '@/lib/hijri';
import { format, parse, addDays, differenceInSeconds } from 'date-fns';
import { arSA } from 'date-fns/locale';
import { ChevronLeft, ChevronRight, MapPin, Moon } from 'lucide-react';
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

const IslamicCorner = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 100 100" className={`absolute w-12 h-12 text-[#D4AF37]/40 ${className}`} fill="currentColor">
    <path d="M0 0 L100 0 L100 10 L10 10 L10 100 L0 100 Z" />
    <circle cx="20" cy="20" r="5" />
  </svg>
);

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

  useEffect(() => {
    setMounted(true);
  }, []);

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
      <div className="premium-gradient border border-[#D4AF37]/30 text-white p-6 rounded-[24px] shadow-2xl relative overflow-hidden transition-all group">
        <div className="absolute inset-0 islamic-pattern opacity-10" />
        
        {/* Corner Ornaments */}
        <IslamicCorner className="top-2 left-2" />
        <IslamicCorner className="top-2 right-2 rotate-90" />
        <IslamicCorner className="bottom-2 left-2 -rotate-90" />
        <IslamicCorner className="bottom-2 right-2 rotate-180" />

        <div className="relative z-10 flex flex-col items-center">
          <div className="flex items-center gap-2 mb-3 bg-[#D4AF37]/20 border border-[#D4AF37]/40 px-4 py-1.5 rounded-full backdrop-blur-md">
            <Moon className="w-4 h-4 text-[#D4AF37]" />
            <p className="text-[10px] font-bold text-[#D4AF37] uppercase tracking-[0.2em]">{t.timeTill}</p>
          </div>
          
          <h2 className="text-2xl font-bold mb-2 font-headline text-white/90 tracking-wide">
            {mounted && nextPrayer ? (lang === 'ar' ? t.prayers[nextPrayer.name]?.arabic : nextPrayer.name) : '...'}
          </h2>
          
          <div className="text-6xl font-black font-mono tracking-tighter drop-shadow-[0_4px_4px_rgba(0,0,0,0.5)] text-white">
            {mounted ? (timeToNextPrayer || '00:00:00') : '00:00:00'}
          </div>
          
          {location && (
            <div className="mt-6 flex items-center gap-2 text-[#D4AF37] text-[10px] font-bold uppercase tracking-[0.2em] bg-white/10 px-4 py-2 rounded-full border border-white/10 backdrop-blur-sm shadow-inner transition-all hover:bg-white/20">
              <MapPin className="w-3.5 h-3.5" />
              <span>{t.location}</span>
              <span className="text-[10px] opacity-70 ml-1 font-sans">
                {t.autoDetect}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Modern Date Section */}
      <div className="flex items-center justify-between px-2">
        <Button variant="ghost" size="icon" onClick={() => handleDateChange('prev')} className="rounded-full hover:bg-accent/50">
          {lang === 'ar' ? <ChevronRight className="h-6 w-6 text-primary" /> : <ChevronLeft className="h-6 w-6 text-primary" />}
        </Button>
        <div className="text-center">
          <div className="text-xl font-bold text-foreground font-headline leading-tight">
            {mounted && hijriDate ? (
              lang === 'ar'
                ? `${hijriDate.monthNameAr} ${toArabicNumerals(hijriDate.day)}, ${toArabicNumerals(hijriDate.year)} هـ`
                : `${hijriDate.monthName} ${hijriDate.day}, ${hijriDate.year} AH`
            ) : <div className="h-7 w-32 bg-muted animate-pulse rounded mx-auto" />}
          </div>
          <div className="text-[10px] text-muted-foreground font-bold uppercase tracking-[0.15em] mt-1.5 flex justify-center">
            {mounted ? format(currentDate, 'eeee, d MMMM yyyy', { locale: lang === 'ar' ? arSA : undefined }) : <div className="h-3 w-40 bg-muted animate-pulse rounded" />}
          </div>
        </div>
        <Button variant="ghost" size="icon" onClick={() => handleDateChange('next')} className="rounded-full hover:bg-accent/50">
          {lang === 'ar' ? <ChevronLeft className="h-6 w-6 text-primary" /> : <ChevronRight className="h-6 w-6 text-primary" />}
        </Button>
      </div>

      {error && (
        <Alert variant="destructive" className="rounded-2xl border-destructive/20 shadow-sm">
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {!location && !locationError && mounted && (
        <Alert className="rounded-2xl bg-accent/30 border-accent/40 shadow-sm">
          <AlertTitle className="font-bold">{t.locationNeeded}</AlertTitle>
          <AlertDescription>{t.locationNeededMsg}</AlertDescription>
        </Alert>
      )}

      {/* Prayer Times Section */}
      <div className="flex-grow">
        <div className="flex items-center gap-3 mb-5 px-2">
          <div className="h-px bg-muted flex-grow" />
          <h4 className="text-[10px] font-bold text-muted-foreground uppercase tracking-[0.2em]">{t.todayPrayerTimes}</h4>
          <div className="h-px bg-muted flex-grow" />
        </div>
        <PrayerTimes currentDate={currentDate.getTime()} nextPrayerName={nextPrayer?.name} />
      </div>
    </div>
  );
}
