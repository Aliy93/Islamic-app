'use client';
import { useState, useEffect } from 'react';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Sun, Sunrise, Sunset, Moon } from 'lucide-react';
import { format, parse } from 'date-fns';
import { useLanguage } from '@/context/language-context';
import { translations } from '@/lib/translations';
import { cn } from '@/lib/utils';

type PrayerTimesData = {
  Fajr: string;
  Sunrise: string;
  Dhuhr: string;
  Asr: string;
  Maghrib: string;
  Isha: string;
};

type PrayerInfo = {
    name: keyof PrayerTimesData;
    begins: string;
}

type CachedPrayerData = {
    timings: PrayerTimesData;
    date: string;
    location: { latitude: number; longitude: number };
}

const prayerIcons: Record<keyof PrayerTimesData, React.ReactNode> = {
    Fajr: <Moon className="w-5 h-5" />,
    Sunrise: <Sunrise className="w-5 h-5" />,
    Dhuhr: <Sun className="w-5 h-5" />,
    Asr: <Sun className="w-5 h-5 opacity-70" />,
    Maghrib: <Sunset className="w-5 h-5" />,
    Isha: <Moon className="w-5 h-5" />,
};

interface PrayerTimesProps {
    currentDate?: Date;
    location?: { latitude: number; longitude: number } | null;
    nextPrayerName?: string;
}

export default function PrayerTimes({ currentDate: initialDate, location: initialLocation, nextPrayerName }: PrayerTimesProps) {
  const { lang } = useLanguage();
  const t = translations[lang];

  const [prayerTimes, setPrayerTimes] = useState<PrayerTimesData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentDate, setCurrentDate] = useState(initialDate || new Date());
  const [location, setLocation] = useState(initialLocation);

  useEffect(() => {
    setCurrentDate(initialDate || new Date());
  }, [initialDate]);
  
  useEffect(() => {
    if (initialLocation) {
        setLocation(initialLocation);
    } else {
        const cachedDataStr = localStorage.getItem('prayerData');
        if (cachedDataStr) {
            const cachedData: CachedPrayerData = JSON.parse(cachedDataStr);
            setLocation(cachedData.location);
        }
    }
  }, [initialLocation]);

  useEffect(() => {
    const todayStr = format(currentDate, 'yyyy-MM-dd');
    const cachedDataStr = localStorage.getItem('prayerData');
    if (cachedDataStr) {
        const cachedData: CachedPrayerData = JSON.parse(cachedDataStr);
        if(cachedData.date === todayStr) {
            setPrayerTimes(cachedData.timings);
            setLoading(false);
            return;
        }
    }

    if (!location) {
      setLoading(false);
      return;
    }
  
    const fetchPrayerTimes = async () => {
      setLoading(true);
      setError(null);
      try {
        const response = await fetch(`https://api.aladhan.com/v1/timings/${Math.floor(currentDate.getTime()/1000)}?latitude=${location.latitude}&longitude=${location.longitude}&method=2`);
        if (!response.ok) throw new Error(t.fetchError);
        
        const data = await response.json();
        if (data.code === 200) {
          setPrayerTimes(data.data.timings);
          const newCachedData: CachedPrayerData = {
              timings: data.data.timings,
              date: format(currentDate, 'yyyy-MM-dd'),
              location: location,
          };
          localStorage.setItem('prayerData', JSON.stringify(newCachedData));
        } else {
          throw new Error(data.data || t.fetchError);
        }
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchPrayerTimes();
  }, [location, currentDate, t.fetchError]);

  if (loading) {
    return (
      <div className="space-y-2">
        {[...Array(6)].map((_, i) => (
            <Skeleton key={i} className="h-16 w-full rounded-lg" />
        ))}
      </div>
    );
  }

  if (error) {
    return (
        <Alert variant="destructive">
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
        </Alert>
    );
  }

  if (!prayerTimes) {
    return (
         <Alert>
            <AlertTitle>{t.locationNeeded}</AlertTitle>
            <AlertDescription>{t.locationNeededMsg}</AlertDescription>
        </Alert>
    );
  }
  
  const prayerSchedule: PrayerInfo[] = (Object.keys(prayerIcons) as Array<keyof PrayerTimesData>).map(name => {
    const time24 = prayerTimes[name];
    const beginsTime = parse(time24, 'HH:mm', new Date());

    return {
        name,
        begins: format(beginsTime, 'h:mm a'),
    }
  });


  return (
    <ul className="space-y-2">
        {prayerSchedule.map((prayer) => (
            <li key={prayer.name} className={cn(
                "flex items-center justify-between p-3 rounded-lg text-foreground transition-colors font-sans",
                prayer.name === nextPrayerName ? 'bg-primary text-primary-foreground' : 'bg-card'
            )}>
                <div className="flex items-center gap-4">
                    <div className={cn(prayer.name === nextPrayerName ? 'text-primary-foreground' : 'text-primary')}>
                       {prayerIcons[prayer.name]}
                   </div>
                    <p className="font-bold text-lg">{lang === 'ar' ? t.prayers[prayer.name]?.arabic : prayer.name}</p>
                </div>
                 <div className="flex items-center gap-3 text-right">
                    <div className={cn("text-right font-code", lang === 'ar' ? 'ml-2' : 'mr-2')}>
                        <p className="font-bold text-lg">{prayer.begins}</p>
                    </div>
                </div>
            </li>
        ))}
    </ul>
  );
}
