'use client';

import Link from 'next/link';
import { useState, useEffect } from 'react';
import { isRtlLanguage, useLanguage } from '@/context/language-context';
import { useSettings } from '@/context/settings-context';
import { translations } from '@/lib/translations';
import { getHijriDate, HijriDateInfo } from '@/lib/hijri';
import { parse, addDays, differenceInSeconds } from 'date-fns';
import { ChevronLeft, ChevronRight, MapPin, Moon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import PrayerTimes from '@/components/prayer-times';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { formatLocalizedGregorianDate, formatLocalizedHijriMonth, formatLocalizedNumber } from '@/lib/localization';
import { findNextPrayer, getPrayerSchedule, getPrayerTimes, PrayerName, PrayerTimesData } from '@/lib/prayer-times';

type Prayer = {
  name: PrayerName;
  time: string;
};

const IslamicCorner = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 100 100" className={`absolute w-12 h-12 text-[#DCA15D]/40 ${className}`} fill="currentColor">
    <path d="M0 0 L100 0 L100 10 L10 10 L10 100 L0 100 Z" />
    <circle cx="20" cy="20" r="5" />
  </svg>
);

export default function Home() {
  const { lang } = useLanguage();
  const { prayerMethod, location, locationError, fetchAndSetLocation, setIsManualLocation } = useSettings();
  const t = translations[lang];

  const [currentDate, setCurrentDate] = useState(new Date());
  const [error, setError] = useState<string | null>(null);
  const [nextPrayer, setNextPrayer] = useState<Prayer | null>(null);
  const [timeToNextPrayer, setTimeToNextPrayer] = useState('');
  const [mounted, setMounted] = useState(false);
  const [hijriDate, setHijriDate] = useState<HijriDateInfo | null>(null);
  const [locationName, setLocationName] = useState<string | null>(null);
  const [prayerTimes, setPrayerTimes] = useState<PrayerTimesData | null>(null);

  useEffect(() => {
    // Hydration gate for time-sensitive client-only content.
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

  // Reverse Geocoding to get City, Country
  useEffect(() => {
    if (!location || !mounted) return;

    const abortController = new AbortController();

    const fetchLocationName = async () => {
      try {
        const response = await fetch(
          `/api/reverse-geocode?lat=${location.latitude}&lon=${location.longitude}`,
          {
            cache: 'no-store',
            signal: abortController.signal,
          }
        );
        if (!response.ok) return;

        const data = await response.json();
        setLocationName(data.label ?? null);
      } catch (error: unknown) {
        if (error instanceof DOMException && error.name === 'AbortError') {
          return;
        }

        // Silently fail and fallback to translations
      }
    };

    fetchLocationName();

    return () => abortController.abort();
  }, [location, mounted]);

  useEffect(() => {
    if (!location || !mounted) return;

    const fetchPrayerTimes = async () => {
      try {
        const timings = await getPrayerTimes({
          date: currentDate,
          location,
          method: prayerMethod,
          fetchErrorMessage: t.fetchError,
        });
        setPrayerTimes(timings);
        setError(null);
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : t.fetchError;
        setError(message);
      }
    };

    fetchPrayerTimes();

  }, [location, currentDate, t.fetchError, prayerMethod, mounted]);

  useEffect(() => {
    if (!prayerTimes || !mounted) return;

    const updateNextPrayer = () => {
      const prayerSchedule = getPrayerSchedule(prayerTimes, false);
      const upcomingPrayer = findNextPrayer(prayerSchedule);
      setNextPrayer(upcomingPrayer as Prayer | null);
    };

    updateNextPrayer();
    const interval = setInterval(updateNextPrayer, 60000);
    return () => clearInterval(interval);
  }, [mounted, prayerTimes]);

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
      setTimeToNextPrayer(formatLocalizedNumber(timeString, lang));
    };

    calculateCountdown();
    const countdownInterval = setInterval(calculateCountdown, 1000);
    return () => clearInterval(countdownInterval);

  }, [nextPrayer, lang, mounted]);

  const handleDateChange = (direction: 'next' | 'prev') => {
    setCurrentDate(prevDate => addDays(prevDate, direction === 'next' ? 1 : -1));
  };

  return (
    <div className="flex flex-col h-full p-5 space-y-6" dir={isRtlLanguage(lang) ? 'rtl' : 'ltr'}>
      {/* Premium Next Prayer Card */}
      <div className="premium-gradient border border-[#DCA15D]/30 text-white p-6 rounded-[24px] shadow-2xl relative overflow-hidden transition-all group">
        <div className="absolute inset-0 islamic-pattern opacity-10" />
        
        {/* Corner Ornaments */}
        <IslamicCorner className="top-2 left-2" />
        <IslamicCorner className="top-2 right-2 rotate-90" />
        <IslamicCorner className="bottom-2 left-2 -rotate-90" />
        <IslamicCorner className="bottom-2 right-2 rotate-180" />

        <div className="relative z-10 flex flex-col items-center">
          <div className="flex items-center gap-2 mb-3 bg-[#DCA15D]/20 border border-[#DCA15D]/40 px-4 py-1.5 rounded-full backdrop-blur-md">
            <Moon className="w-4 h-4 text-[#DCA15D]" />
            <p className="text-[10px] font-bold text-[#DCA15D] uppercase tracking-[0.2em]">{t.timeTill}</p>
          </div>
          
          <h2 className="text-2xl font-bold mb-2 font-headline text-white/90 tracking-wide">
            {mounted && nextPrayer ? t.prayers[nextPrayer.name]?.label : '...'}
          </h2>
          
          <div className="text-6xl font-black font-mono tracking-tighter drop-shadow-[0_4px_4px_rgba(0,0,0,0.5)] text-white">
            {mounted ? (timeToNextPrayer || '00:00:00') : '00:00:00'}
          </div>
          
          {location && (
            <div className="mt-6 flex items-center gap-2 text-[#DCA15D] text-[10px] font-bold uppercase tracking-[0.2em] bg-white/10 px-4 py-2 rounded-full border border-white/10 backdrop-blur-sm shadow-inner transition-all hover:bg-white/20">
              <MapPin className="w-3.5 h-3.5" />
              <span>{t.location}</span>
              <span className="text-[10px] opacity-70 ml-1 font-sans">
                {locationName || t.autoDetect}
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
                `${formatLocalizedHijriMonth(currentDate, lang)} ${formatLocalizedNumber(hijriDate.day, lang)}, ${formatLocalizedNumber(hijriDate.year, lang)} ${t.hijriEra}`
            ) : <div className="h-7 w-32 bg-muted animate-pulse rounded mx-auto" />}
          </div>
          <div className="text-[10px] text-muted-foreground font-bold uppercase tracking-[0.15em] mt-1.5 flex justify-center">
            {mounted ? formatLocalizedGregorianDate(currentDate, lang, { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }) : <div className="h-3 w-40 bg-muted animate-pulse rounded" />}
          </div>
        </div>
        <Button variant="ghost" size="icon" onClick={() => handleDateChange('next')} className="rounded-full hover:bg-accent/50">
          {lang === 'ar' ? <ChevronLeft className="h-6 w-6 text-primary" /> : <ChevronRight className="h-6 w-6 text-primary" />}
        </Button>
      </div>

      {error && (
        <Alert variant="destructive" className="rounded-2xl border-destructive/20 shadow-sm">
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>
            <p>{error}</p>
            {!location && (
              <div className="mt-4 flex flex-wrap gap-2">
                <Button type="button" variant="outline" onClick={fetchAndSetLocation}>
                  {t.useCurrentLocation}
                </Button>
                <Button type="button" asChild>
                  <Link href="/settings" onClick={() => setIsManualLocation(true)}>
                    {t.manualLocation}
                  </Link>
                </Button>
              </div>
            )}
          </AlertDescription>
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
