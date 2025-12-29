'use client';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import HijriCalendar from '@/components/hijri-calendar';
import { useLanguage } from '@/context/language-context';
import { translations } from '@/lib/translations';
import { useState } from 'react';
import CalendarHeader from '@/components/calendar-header';

export default function CalendarPage() {
  const { lang } = useLanguage();
  const t = translations[lang];
  const [currentDate, setCurrentDate] = useState(new Date());

  const handleSetToday = () => {
    setCurrentDate(new Date());
  };


  return (
    <div className="min-h-screen flex flex-col" dir={lang === 'ar' ? 'rtl' : 'ltr'}>
       <header className="bg-background text-foreground p-4 flex items-center justify-between gap-4 sticky top-0 z-10">
        <h1 className="text-xl font-bold">{t.calendar}</h1>
      </header>
      <main className="flex-grow p-4 space-y-4">
        <CalendarHeader 
          currentDate={currentDate} 
          onTodayClick={handleSetToday} 
          lang={lang} 
        />
        <HijriCalendar lang={lang} />
      </main>
    </div>
  );
}
