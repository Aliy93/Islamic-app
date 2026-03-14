'use client';
import { useState, useEffect } from 'react';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Sun, Sunrise, Sunset, Moon, CloudSun } from 'lucide-react';
import { parse } from 'date-fns';
import { useLanguage } from '@/context/language-context';
import { useSettings } from '@/context/settings-context';
import { translations } from '@/lib/translations';
import { cn } from '@/lib/utils';
import { formatLocalizedTime } from '@/lib/localization';
import { getPrayerSchedule, getPrayerTimes, PrayerTimesData } from '@/lib/prayer-times';

type PrayerInfo = {
  name: keyof PrayerTimesData;
  begins: string;
};

const prayerIcons: Record<keyof PrayerTimesData, React.ReactNode> = {
  Fajr: <Moon className="w-5 h-5" />,
  Sunrise: <Sunrise className="w-5 h-5" />,
  Dhuhr: <Sun className="w-5 h-5" />,
  Asr: <CloudSun className="w-5 h-5" />,
  Maghrib: <Sunset className="w-5 h-5" />,
  Isha: <Moon className="w-5 h-5" />,
};

interface PrayerTimesProps {
  currentDate?: number;
  nextPrayerName?: string;
}

export default function PrayerTimes({ currentDate: initialDate, nextPrayerName }: PrayerTimesProps) {
  const { lang } = useLanguage();
  const { prayerMethod, location } = useSettings();
  const t = translations[lang];

  const [prayerTimes, setPrayerTimes] = useState<PrayerTimesData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentDate, setCurrentDate] = useState<Date | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    setCurrentDate(initialDate ? new Date(initialDate) : new Date());
  }, [initialDate]);

  useEffect(() => {
    if (!location || !currentDate || !mounted) {
      return;
    }

    const fetchPrayerTimes = async () => {
      setLoading(true);
      setError(null);
      try {
        const timings = await getPrayerTimes({
          date: currentDate,
          location,
          method: prayerMethod,
          fetchErrorMessage: t.fetchError,
        });
        setPrayerTimes(timings);
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : t.fetchError;
        setError(message);
      } finally {
        setLoading(false);
      }
    };

    fetchPrayerTimes();
  }, [location, currentDate, t.fetchError, prayerMethod, mounted]);

  if (!mounted || loading) {
    return (
      <div className="space-y-3">
        {[...Array(6)].map((_, i) => (
          <Skeleton key={i} className="h-16 w-full rounded-2xl" />
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <Alert variant="destructive" className="rounded-2xl">
        <AlertTitle>Error</AlertTitle>
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    );
  }

  if (!prayerTimes) {
    return (
      <Alert className="rounded-2xl border-accent bg-accent/30">
        <AlertTitle className="font-bold">{t.locationNeeded}</AlertTitle>
        <AlertDescription>{t.locationNeededMsg}</AlertDescription>
      </Alert>
    );
  }

  const prayerScheduleData = getPrayerSchedule(prayerTimes, true);
  const prayerSchedule: PrayerInfo[] = (Object.keys(prayerIcons) as Array<keyof PrayerTimesData>).map(name => {
    const time24 = prayerScheduleData.find((prayer) => prayer.name === name)?.time ?? prayerTimes[name];
    const beginsTime = parse(time24, 'HH:mm', new Date());

    return {
      name,
      begins: formatLocalizedTime(beginsTime, lang),
    }
  });

  return (
    <ul className="space-y-3 pb-4">
      {prayerSchedule.map((prayer) => {
        const isNext = prayer.name === nextPrayerName;
        return (
          <li key={prayer.name} className={cn(
            "group flex items-center justify-between p-4 rounded-[20px] transition-all duration-300 relative overflow-hidden",
            isNext
              ? 'premium-gradient text-white shadow-xl shadow-primary/20 scale-[1.02] border border-[#DCA15D]/30'
              : 'bg-card border border-border/50 hover:border-primary/20'
          )}>
            {isNext && <div className="absolute inset-0 islamic-pattern opacity-5 pointer-events-none" />}
            
            <div className="flex items-center gap-4 relative z-10">
              <div className={cn(
                "p-2.5 rounded-xl transition-colors",
                isNext ? 'bg-white/10 text-[#DCA15D] border border-white/10 shadow-inner' : 'bg-secondary/50 text-primary'
              )}>
                {prayerIcons[prayer.name]}
              </div>
              <div>
                <p className={cn(
                  "font-bold text-lg font-headline tracking-wide",
                  isNext ? 'text-white' : 'text-foreground'
                )}>
                  {t.prayers[prayer.name]?.label}
                </p>
                <p className={cn(
                  "text-[10px] font-bold uppercase tracking-[0.1em]",
                  isNext ? 'text-[#DCA15D]/80' : 'text-muted-foreground'
                )}>
                  {t.prayers[prayer.name]?.begins}
                </p>
              </div>
            </div>

            <div className="relative z-10">
              <p className={cn(
                "font-bold text-xl font-mono tracking-tight",
                isNext ? 'text-white' : 'text-foreground/80'
              )}>
                {prayer.begins}
              </p>
            </div>
          </li>
        );
      })}
    </ul>
  );
}
