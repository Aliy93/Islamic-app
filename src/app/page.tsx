'use client';

import { useState, useEffect } from 'react';
import { Menu, Compass, CalendarDays, BookOpen, Globe, Sun, Sunrise, Sunset, Moon, Cloudy } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useLanguage } from '@/context/language-context';
import { translations } from '@/lib/translations';
import { getHijriDate } from '@/lib/hijri';
import { format, parse } from 'date-fns';
import { arSA } from 'date-fns/locale/ar-SA';
import Link from 'next/link';

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

const prayerIcons: Record<keyof PrayerTimesData, JSX.Element> = {
    Fajr: <Sunrise className="w-8 h-8" />,
    Sunrise: <Sunrise className="w-8 h-8" />,
    Dhuhr: <Sun className="w-8 h-8" />,
    Asr: <Cloudy className="w-8 h-8" />,
    Maghrib: <Sunset className="w-8 h-8" />,
    Isha: <Moon className="w-8 h-8" />,
};

export default function Home() {
  const { lang, toggleLang } = useLanguage();
  const t = translations[lang];

  const [location, setLocation] = useState<{ latitude: number; longitude: number } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [nextPrayer, setNextPrayer] = useState<Prayer | null>(null);
  const [timeToNextPrayer, setTimeToNextPrayer] = useState('');

  useEffect(() => {
    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setLocation({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
          });
        },
        (error) => {
          setError('Could not get location. Please enable location services.');
        }
      );
    } else {
      setError('Geolocation is not supported by your browser.');
    }
  }, []);

  useEffect(() => {
    if (!location) return;

    const fetchAndProcessPrayerTimes = async () => {
      try {
        const date = new Date();
        const response = await fetch(`https://api.aladhan.com/v1/timings/${date.getTime()/1000}?latitude=${location.latitude}&longitude=${location.longitude}&method=2`);
        if (!response.ok) throw new Error('Failed to fetch prayer times.');
        
        const data = await response.json();
        if (data.code !== 200) throw new Error(data.data || 'Failed to fetch prayer times.');

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
        const now = new Date();
        let upcomingPrayer: Prayer | null = null;

        for (const prayer of prayerSchedule) {
            const prayerTime = parse(prayer.time, 'HH:mm', new Date());
            if (prayerTime > now) {
                upcomingPrayer = prayer;
                break;
            }
        }
        // If all prayers for today are done, the next prayer is Fajr tomorrow
        if (!upcomingPrayer) {
             upcomingPrayer = prayerSchedule[0];
             const fajrTime = parse(upcomingPrayer.time, 'HH:mm', new Date());
             fajrTime.setDate(fajrTime.getDate() + 1);
        }
        
        setNextPrayer(upcomingPrayer);
    };

    fetchAndProcessPrayerTimes();

    const interval = setInterval(fetchAndProcessPrayerTimes, 60000); // Re-check every minute
    return () => clearInterval(interval);

  }, [location]);

  useEffect(() => {
      if (!nextPrayer) return;
      
      const calculateCountdown = () => {
          const now = new Date();
          let prayerTime = parse(nextPrayer.time, 'HH:mm', new Date());

          if (prayerTime < now) { // If next prayer is tomorrow (e.g., Fajr)
              prayerTime.setDate(prayerTime.getDate() + 1);
          }

          const diff = prayerTime.getTime() - now.getTime();
          const hours = Math.floor(diff / (1000 * 60 * 60));
          const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

          setTimeToNextPrayer(`${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`);
      };

      calculateCountdown();
      const countdownInterval = setInterval(calculateCountdown, 1000);
      return () => clearInterval(countdownInterval);

  }, [nextPrayer]);


  const today = new Date();
  const hijriDate = getHijriDate(today);

  return (
    <div className="min-h-screen" dir={lang === 'ar' ? 'rtl' : 'ltr'}>
        <header className="bg-primary text-primary-foreground p-4 flex items-center justify-between">
          <Button variant="ghost" size="icon" className="hover:bg-primary/80">
            <Menu />
          </Button>
          <h1 className="text-xl font-bold">{t.title}</h1>
          <Button variant="ghost" size="icon" className="hover:bg-primary/80" onClick={toggleLang}>
            <Globe />
          </Button>
        </header>

        <main className="p-4 flex flex-col items-center text-center">
            <div className="w-full bg-card p-6 rounded-lg shadow-md mb-4 text-center">
                <h2 className="text-2xl font-bold text-foreground">
                    {format(today, 'eeee, MMMM d', { locale: lang === 'ar' ? arSA : undefined })}
                </h2>
                <p className="text-lg text-muted-foreground">
                    {lang === 'ar' ? `${hijriDate.day} ${hijriDate.monthNameAr} ${hijriDate.year}` : `${hijriDate.day} ${hijriDate.monthName} ${hijriDate.year}`}
                </p>
            </div>
            
            <div className="w-full bg-primary text-primary-foreground p-6 rounded-lg shadow-md mb-4 flex flex-col items-center">
                {error && <p className="text-destructive-foreground">{error}</p>}
                {!error && nextPrayer ? (
                    <>
                        <p className="text-lg font-medium opacity-80">{t.nextPrayer}</p>
                        <div className="flex items-center gap-4 my-2">
                           {prayerIcons[nextPrayer.name]}
                           <h3 className="text-4xl font-bold">{t.prayers[nextPrayer.name]}</h3>
                        </div>
                        <p className="text-2xl font-mono">{format(parse(nextPrayer.time, 'HH:mm', new Date()), 'h:mm a')}</p>
                        <p className="text-lg font-medium mt-4 opacity-80">{t.timeUntil}</p>
                        <p className="text-5xl font-bold font-mono">{timeToNextPrayer}</p>
                    </>
                ) : (
                    <p>{t.loading}</p>
                )}
            </div>

            <div className="w-full bg-card p-2 rounded-lg shadow-md grid grid-cols-3 gap-2 text-center">
                <Link href="/qibla" passHref className="flex flex-col h-auto items-center justify-center gap-1.5 p-3 rounded-lg hover:bg-accent/20 no-underline text-foreground">
                  <Compass className="w-6 h-6 text-primary" />
                  <span className="text-sm mt-1 font-semibold">{t.qibla}</span>
                </Link>
                <Link href="/prayer" passHref className="flex flex-col h-auto items-center justify-center gap-1.5 p-3 rounded-lg hover:bg-accent/20 no-underline text-foreground">
                  <CalendarDays className="w-6 h-6 text-primary" />
                   <span className="text-sm mt-1 font-semibold">{t.prayer}</span>
                </Link>
                <Link href="/quran" passHref className="flex flex-col h-auto items-center justify-center gap-1.5 p-3 rounded-lg hover:bg-accent/20 no-underline text-foreground">
                  <BookOpen className="w-6 h-6 text-primary" />
                  <span className="text-sm mt-1 font-semibold">{t.quran}</span>
                </Link>
            </div>
        </main>
    </div>
  );
}
