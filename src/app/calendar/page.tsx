'use client';
import { useLanguage } from '@/context/language-context';
import { translations } from '@/lib/translations';
import { useState } from 'react';
import HijriCalendar from '@/components/hijri-calendar';
import CalendarHeader from '@/components/calendar-header';
import { getHijriDate } from '@/lib/hijri';

export default function CalendarPage() {
  const { lang } = useLanguage();
  const t = translations[lang];
  
  // The state for the calendar view is now managed here
  const [currentHijriDate, setCurrentHijriDate] = useState(() => {
    const todayHijri = getHijriDate(new Date());
    return { year: todayHijri.year, month: todayHijri.month };
  });

  const handleSetToday = () => {
    const todayHijri = getHijriDate(new Date());
    setCurrentHijriDate({ year: todayHijri.year, month: todayHijri.month });
  };
  
  return (
    <div className="min-h-screen flex flex-col" dir={lang === 'ar' ? 'rtl' : 'ltr'}>
      <header className="bg-background text-foreground p-4 flex items-center justify-between gap-4 sticky top-0 z-10">
        <h1 className="text-xl font-bold">{t.calendar}</h1>
      </header>
      <main className="flex-grow p-4 space-y-4">
        <CalendarHeader 
          onTodayClick={handleSetToday} 
          lang={lang} 
        />
        <HijriCalendar 
          lang={lang} 
          currentHijriDate={currentHijriDate}
          setCurrentHijriDate={setCurrentHijriDate}
        />
      </main>
    </div>
  );
}
