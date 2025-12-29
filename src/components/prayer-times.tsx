'use client';
import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Sun, Sunrise, Sunset, Moon, Cloudy } from 'lucide-react';
import { format, parse } from 'date-fns';
import { useLanguage } from '@/context/language-context';
import { translations } from '@/lib/translations';

type PrayerTimesData = {
  Fajr: string;
  Sunrise: string;
  Dhuhr: string;
  Asr: string;
  Maghrib: string;
  Isha: string;
};

const prayerIcons = {
    Fajr: <Sunrise className="w-5 h-5 text-primary" />,
    Dhuhr: <Sun className="w-5 h-5 text-primary" />,
    Asr: <Cloudy className="w-5 h-5 text-primary" />,
    Maghrib: <Sunset className="w-5 h-5 text-primary" />,
    Isha: <Moon className="w-5 h-5 text-primary" />,
};

export default function PrayerTimes() {
  const { lang } = useLanguage();
  const t = translations[lang];

  const [prayerTimes, setPrayerTimes] = useState<PrayerTimesData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [location, setLocation] = useState<{ latitude: number; longitude: number } | null>(null);

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
          setError('Could not get location. Please enable location services in your browser.');
          setLoading(false);
        }
      );
    } else {
      setError('Geolocation is not supported by your browser.');
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (location) {
      const fetchPrayerTimes = async () => {
        setLoading(true);
        setError(null);
        try {
          const date = new Date();
          const response = await fetch(`https://api.aladhan.com/v1/timings/${date.getTime()/1000}?latitude=${location.latitude}&longitude=${location.longitude}&method=2`);
          if (!response.ok) {
            throw new Error('Failed to fetch prayer times.');
          }
          const data = await response.json();
          if (data.code === 200) {
            setPrayerTimes(data.data.timings);
          } else {
            throw new Error(data.data || 'Failed to fetch prayer times.');
          }
          
        } catch (err: any) {
          setError(err.message);
        } finally {
          setLoading(false);
        }
      };

      fetchPrayerTimes();
    }
  }, [location]);

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>{t.todayPrayerTimes}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="flex justify-between items-center">
                <Skeleton className="h-5 w-20" />
                <Skeleton className="h-5 w-24" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
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
    return null;
  }
  
  const prayerSchedule = Object.entries(prayerTimes)
    .filter(([key]) => key !== 'Sunrise' && key !== 'Imsak' && key !== 'Midnight' && key !== 'Firstthird' && key !== 'Lastthird')
    .map(([name, time]) => ({ name: name as keyof typeof prayerIcons, time: format(parse(time, 'HH:mm', new Date()), 'h:mm a') }));

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t.todayPrayerTimes}</CardTitle>
      </CardHeader>
      <CardContent>
        <ul className="divide-y divide-border">
            {prayerSchedule.map(({name, time}) => (
                <li key={name} className="flex items-center justify-between py-3">
                    <div className="flex items-center gap-3">
                        {prayerIcons[name]}
                        <span className="font-semibold capitalize text-foreground">{t.prayers[name]}</span>
                    </div>
                    <span className="font-mono text-lg text-muted-foreground">{time}</span>
                </li>
            ))}
        </ul>
      </CardContent>
    </Card>
  );
}
