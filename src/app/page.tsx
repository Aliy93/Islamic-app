'use client';

import { useState, useEffect } from 'react';
import { useLanguage } from '@/context/language-context';
import { translations } from '@/lib/translations';
import { getHijriDate } from '@/lib/hijri';
import { format, parse, addDays, differenceInSeconds } from 'date-fns';
import { arSA } from 'date-fns/locale';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import PrayerTimes from '@/components/prayer-times';

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

export default function Home() {
  const { lang } = useLanguage();
  const t = translations[lang];

  const [currentDate, setCurrentDate] = useState(new Date());
  const [location, setLocation] = useState<{ latitude: number; longitude: number } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [nextPrayer, setNextPrayer] = useState<Prayer | null>(null);
  const [timeToNextPrayer, setTimeToNextPrayer] = useState('');
  
  const hijriDate = getHijriDate(currentDate);

  useEffect(() => {
    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setLocation({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
          });
        },
        (err) => {
          setError(t.locationError);
        }
      );
    } else {
      setError(t.geolocationNotSupported);
    }
  }, [t.locationError, t.geolocationNotSupported]);

  useEffect(() => {
    if (!location) return;

    const fetchPrayerTimes = async () => {
      try {
        const response = await fetch(`https://api.aladhan.com/v1/timings/${Math.floor(currentDate.getTime()/1000)}?latitude=${location.latitude}&longitude=${location.longitude}&method=2`);
        if (!response.ok) throw new Error(t.fetchError);
        
        const data = await response.json();
        if (data.code !== 200) throw new Error(data.data || t.fetchError);

        const timings: PrayerTimesData = data.data.timings;
        const prayerSchedule: Prayer[] = Object.entries(timings)
            .filter(([key]) => ['Fajr', 'Dhuhr', 'Asr', 'Maghrib', 'Isha'].includes(key))
            .map(([name, time]) => ({ name: name as keyof PrayerTimesData, time }));

        findNextPrayer(prayerSchedule);
      } catch (err: any) {
        setError(err.message);
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

    fetchPrayerTimes();
    const interval = setInterval(fetchPrayerTimes, 60000);
    return () => clearInterval(interval);

  }, [location, currentDate, t.fetchError]);

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

        setTimeToNextPrayer(`${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`);
    };

    calculateCountdown();
    const countdownInterval = setInterval(calculateCountdown, 1000);
    return () => clearInterval(countdownInterval);

  }, [nextPrayer]);

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
            <p className="text-5xl font-bold font-code text-foreground">{timeToNextPrayer || '00:00:00'}</p>
        </div>

        <div className="flex items-center justify-between text-center">
            <Button variant="ghost" size="icon" onClick={() => handleDateChange('prev')}>
                <ChevronLeft className="h-5 w-5" />
            </Button>
            <div className="text-center">
                <p className="font-bold text-foreground font-headline">
                    {lang === 'ar' 
                        ? `${hijriDate.monthNameAr} ${hijriDate.day}, ${hijriDate.year} هـ` 
                        : `${hijriDate.monthName} ${hijriDate.day}, ${hijriDate.year} AH`
                    }
                </p>
                <p className="text-sm text-muted-foreground font-body">
                    {format(currentDate, 'eeee, d MMMM yyyy', { locale: lang === 'ar' ? arSA : undefined })}
                </p>
            </div>
            <Button variant="ghost" size="icon" onClick={() => handleDateChange('next')}>
                <ChevronRight className="h-5 w-5" />
            </Button>
        </div>
        
        {error && <p className="text-destructive text-center">{error}</p>}

        <PrayerTimes currentDate={currentDate} location={location} nextPrayerName={nextPrayer?.name} />
    </div>
  );
}
