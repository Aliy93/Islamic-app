'use client';

import { useState } from 'react';
import { Menu, Compass, CalendarDays, BookOpen, Calendar as CalendarIcon, Globe } from 'lucide-react';
import HijriCalendar from '@/components/hijri-calendar';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { islamicEvents } from '@/lib/islamic-events';
import { format } from 'date-fns';
import { arSA } from 'date-fns/locale/ar-SA';
import Link from 'next/link';

export default function Home() {
  const [lang, setLang] = useState<'en' | 'ar'>('en');

  const getHijriMonthName = (month: number) => {
    const dateForMonth = new Date();
    dateForMonth.setMonth(month -1); // month is 1-indexed
    
    try {
        const locale = lang === 'ar' ? 'ar-u-ca-islamic-umalqura' : 'en-u-ca-islamic-umalqura';
        return new Intl.DateTimeFormat(locale, { month: 'long' }).format(dateForMonth);
    } catch (e) {
        console.error(e);
        // Fallback for invalid month
        const fallbackDate = new Date(2024, 0, 15); // A known valid date
        const locale = lang === 'ar' ? 'ar-u-ca-islamic-umalqura' : 'en-u-ca-islamic-umalqura';
        return new Intl.DateTimeFormat(locale, { month: 'long' }).format(fallbackDate);
    }
  }
  
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const upcomingEvents = islamicEvents.filter(event => {
    const eventDate = new Date(1445, event.month -1, event.day);
    // This is not a perfect conversion, but for filtering it's okay for now
    // A proper Hijri to Gregorian conversion would be needed for accuracy
    const approxGregorian = new Date(2024, event.month - 1, event.day);
    return approxGregorian >= today;
  });

  const toggleLang = () => {
    setLang(currentLang => currentLang === 'en' ? 'ar' : 'en');
  }

  const translations = {
    en: {
      title: "Muslim App",
      qibla: "Qibla",
      prayer: "Prayer",
      quran: "Quran",
      calendar: "Calendar",
      upcomingHolidays: "Upcoming Holidays",
    },
    ar: {
      title: "تطبيق مسلم",
      qibla: "قبلة",
      prayer: "صلاة",
      quran: "قرآن",
      calendar: "تقويم",
      upcomingHolidays: "العطلات القادمة",
    }
  }
  const t = translations[lang];

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900 font-sans" dir={lang === 'ar' ? 'rtl' : 'ltr'}>
      <div className="max-w-md mx-auto bg-white dark:bg-black shadow-lg">
        <header className="bg-primary text-primary-foreground p-4 flex items-center justify-between">
          <Button variant="ghost" size="icon" className="hover:bg-primary/80">
            <Menu />
          </Button>
          <h1 className="text-xl font-bold">{t.title}</h1>
          <Button variant="ghost" size="icon" className="hover:bg-primary/80" onClick={toggleLang}>
            <Globe />
          </Button>
        </header>

        <main className="p-4">
          <div className="bg-primary text-primary-foreground rounded-lg p-4 grid grid-cols-4 gap-4 text-center mb-4">
             <Link href="/qibla" passHref className="flex flex-col h-auto items-center justify-center gap-1.5 p-2 rounded-lg hover:bg-primary/80 text-primary-foreground no-underline">
              <Compass className="w-6 h-6" />
              <span className="text-xs mt-1">{t.qibla}</span>
            </Link>
            <Link href="/prayer" passHref className="flex flex-col h-auto items-center justify-center gap-1.5 p-2 rounded-lg hover:bg-primary/80 text-primary-foreground no-underline">
              <CalendarDays className="w-6 h-6" />
               <span className="text-xs mt-1">{t.prayer}</span>
            </Link>
            <Link href="/quran" passHref className="flex flex-col h-auto items-center justify-center gap-1.5 p-2 rounded-lg hover:bg-primary/80 text-primary-foreground no-underline">
              <BookOpen className="w-6 h-6" />
              <span className="text-xs mt-1">{t.quran}</span>
            </Link>
            <Button variant="ghost" className="flex flex-col h-auto items-center bg-black/10 rounded-lg">
              <CalendarIcon className="w-6 h-6" />
              <span className="text-xs mt-1">{t.calendar}</span>
            </Button>
          </div>

          <HijriCalendar lang={lang} />

          <div className="mt-6">
            <h2 className="font-bold text-lg mb-2 text-foreground">{t.upcomingHolidays}</h2>
            <Card>
              <CardContent className="p-0">
                <ul className="divide-y divide-border">
                  {upcomingEvents.map((event, index) => (
                    <li key={index} className="px-4 py-3 flex justify-between items-center">
                      <div>
                        <p className="font-semibold text-foreground">{lang === 'ar' ? event.nameAr : event.name}</p>
                        <p className="text-sm text-muted-foreground">{event.day} {getHijriMonthName(event.month)} 1445</p>
                      </div>
                      <span className="text-sm font-medium text-primary">{format(new Date(2024, event.month - 1, event.day), "dd MMMM yyyy", { locale: lang === 'ar' ? arSA : undefined })}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          </div>
        </main>
      </div>
    </div>
  );
}
