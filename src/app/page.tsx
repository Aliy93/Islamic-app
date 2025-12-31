
'use client';

import { useState, useEffect } from 'react';
import { useLanguage } from '@/context/language-context';
import { useSettings } from '@/context/settings-context';
import { translations } from '@/lib/translations';
import { getHijriDate } from '@/lib/hijri';
import { format, parse, addDays, differenceInSeconds } from 'date-fns';
import { arSA } from 'date-fns/locale';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import PrayerTimes from '@/components/prayer-times';
import { toArabicNumerals } from '@/lib/utils';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';

type PrayerTimesData = {
  Fajr: string;
  Sunrise: string;
  Dhuhr: string;
  Asr:string;
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
}

export default function Home() {
  const { lang } = useLanguage();
  const { prayerMethod, location, locationError } = useSettings();
  const t = translations[lang];

  const [currentDate, setCurrentDate] = useState(new Date());
  const [error, setError] = useState<string | null>(null);
  const [nextPrayer, setNextPrayer] = useState<Prayer | null>(null);
  const [timeToNextPrayer, setTimeToNextPrayer] = useState('');
  const [mounted, setMounted] = useState(false);
  
  const hijriDate = getHijriDate(currentDate);

  useEffect(() => {
    if (locationError) {
      setError(locationError);
    }
    // mark mounted to avoid hydration mismatch for locale-dependent rendering
    setMounted(true);
  }, [locationError])

  useEffect(() => {
    if (!location) return;

    const todayStr = format(currentDate, 'yyyy-MM-dd');

    const fetchPrayerTimes = async () => {
      try {
        const response = await fetch(`https://api.aladhan.com/v1/timings/${Math.floor(currentDate.getTime()/1000)}?latitude=${location.latitude}&longitude=${location.longitude}&method=${prayerMethod}`);
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
  
    const findNextPrayer = (prayerSchedule: Prayer[]) => {
      const now = new Date(); // Use current time for countdown logic
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

    const cachedDataStr = localStorage.getItem('prayerData');
    if (cachedDataStr) {
        const cachedData: CachedPrayerData = JSON.parse(cachedDataStr);
        if(cachedData.date === todayStr && cachedData.location.latitude === location.latitude && cachedData.location.longitude === location.longitude && cachedData.method === prayerMethod) {
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
        if (prayerSchedule.length > 0) findNextPrayer(prayerSchedule)
    }, 60000);
    return () => clearInterval(interval);

  }, [location, currentDate, t.fetchError, prayerMethod]);

  useEffect(() => {
    if (!nextPrayer) return;
    
    const calculateCountdown = () => {
        const now = new Date();
        let prayerTime = parse(nextPrayer.time, 'HH:mm', new Date());

        if (prayerTime < now) { 
            prayerTime = addDays(prayerTime, 1);
        }

        const diff = differenceInSeconds(prayerTime, now);
        if (diff < 0) { // Should not happen with the logic above, but as a safeguard
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

  }, [nextPrayer, lang]);

  const handleDateChange = (direction: 'next' | 'prev') => {
    setCurrentDate(prevDate => addDays(prevDate, direction === 'next' ? 1 : -1));
  };

  return (
    <div className="flex flex-col h-full p-4 space-y-4" dir={lang === 'ar' ? 'rtl' : 'ltr'}>
        <div className="bg-primary/20 text-primary-foreground p-4 rounded-lg text-center">
            <p className="text-sm text-foreground/80 font-body">{t.timeTill}</p>
            <div className="flex items-center justify-center gap-2 my-1">
                <h2 className="text-2xl font-bold text-foreground font-headline">
                  {nextPrayer ? (lang === 'ar' ? t.prayers[nextPrayer.name]?.arabic : nextPrayer.name) : t.loading}
                </h2>
            </div>
            <p className="text-5xl font-bold font-code text-foreground">{timeToNextPrayer || (lang === 'ar' ? toArabicNumerals('00:00:00') : '00:00:00')}</p>
        </div>

        <div className="flex items-center justify-between text-center">
            <Button variant="ghost" size="icon" onClick={() => handleDateChange('prev')}>
                {lang === 'ar' ? <ChevronRight className="h-5 w-5" /> : <ChevronLeft className="h-5 w-5" />}
            </Button>
            <div className="text-center">
                <p className="font-bold text-foreground font-headline">
                  {mounted ? (
                    lang === 'ar' 
                    ? `${hijriDate.monthNameAr} ${toArabicNumerals(hijriDate.day)}, ${toArabicNumerals(hijriDate.year)} هـ` 
                    : `${hijriDate.monthName} ${hijriDate.day}, ${hijriDate.year} AH`
                  ) : t.loading}
                </p>
                <p className="text-sm text-muted-foreground font-body">
                  {mounted ? format(currentDate, 'eeee, d MMMM yyyy', { locale: lang === 'ar' ? arSA : undefined }) : ''}
                </p>
            </div>
            <Button variant="ghost" size="icon" onClick={() => handleDateChange('next')}>
                {lang === 'ar' ? <ChevronLeft className="h-5 w-5" /> : <ChevronRight className="h-5 w-5" />}
            </Button>
        </div>
        
        {error && <p className="text-destructive text-center">{error}</p>}
        
        {!location && !locationError && (
             <Alert>
                <AlertTitle>{t.locationNeeded}</AlertTitle>
                <AlertDescription>{t.locationNeededMsg}</AlertDescription>
            </Alert>
        )}

        <PrayerTimes currentDate={currentDate} nextPrayerName={nextPrayer?.name} />
    </div>
  );
}
