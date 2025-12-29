'use client';

import { format } from 'date-fns';
import { arSA, enUS } from 'date-fns/locale';
import { CalendarDays } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { getHijriDate } from '@/lib/hijri';
import { translations } from '@/lib/translations';
import { Language } from '@/context/language-context';

interface CalendarHeaderProps {
  onTodayClick: () => void;
  lang: Language;
}

export default function CalendarHeader({ onTodayClick, lang }: CalendarHeaderProps) {
  // Always use the current date
  const currentDate = new Date(); 
  const hijriDate = getHijriDate(currentDate);
  const t = translations[lang];

  const gregorianFullDate = format(currentDate, 'MMMM yyyy', { locale: lang === 'ar' ? arSA : enUS });

  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-3">
        <CalendarDays className="w-8 h-8 text-primary" />
        <div>
          <p className="font-bold text-foreground">
            {lang === 'ar'
              ? `${hijriDate.day} ${hijriDate.monthNameAr} ${hijriDate.year} هـ`
              : `${hijriDate.monthName} ${hijriDate.day}, ${hijriDate.year} H`}
          </p>
          <p className="text-sm text-muted-foreground">
            {format(currentDate, 'eeee, d MMMM yyyy', { locale: lang === 'ar' ? arSA : enUS })}
          </p>
        </div>
      </div>
      <Button variant="outline" onClick={onTodayClick}>
        {lang === 'ar' ? 'اليوم' : 'Today'}
      </Button>
    </div>
  );
}
