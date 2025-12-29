'use client';

import { format } from 'date-fns';
import { arSA, enUS } from 'date-fns/locale';
import { CalendarDays } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { getHijriDate } from '@/lib/hijri';
import { translations } from '@/lib/translations';
import { Language } from '@/context/language-context';

interface CalendarHeaderProps {
  currentDate: Date;
  onTodayClick: () => void;
  lang: Language;
}

export default function CalendarHeader({ currentDate, onTodayClick, lang }: CalendarHeaderProps) {
  const hijriDate = getHijriDate(currentDate);
  const t = translations[lang];

  // This will now reflect the first day of the viewed month
  const gregorianFullDate = format(currentDate, 'MMMM yyyy', { locale: lang === 'ar' ? arSA : enUS });

  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-3">
        <CalendarDays className="w-8 h-8 text-primary" />
        <div>
          <p className="font-bold text-foreground">
            {lang === 'ar'
              ? `${hijriDate.monthNameAr} ${hijriDate.year} هـ`
              : `${hijriDate.monthName} ${hijriDate.year} H`}
          </p>
          <p className="text-sm text-muted-foreground">
            {gregorianFullDate}
          </p>
        </div>
      </div>
      <Button variant="outline" onClick={onTodayClick}>
        {lang === 'ar' ? 'اليوم' : 'Today'}
      </Button>
    </div>
  );
}
