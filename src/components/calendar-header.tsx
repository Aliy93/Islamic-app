'use client';

import { CalendarDays } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { getHijriDate } from '@/lib/hijri';
import { Language } from '@/context/language-context';
import { useSettings } from '@/context/settings-context';
import { translations } from '@/lib/translations';
import { formatLocalizedGregorianDate, formatLocalizedHijriMonthByNumber, formatLocalizedNumber } from '@/lib/localization';

interface CalendarHeaderProps {
  onTodayClick: () => void;
  lang: Language;
}

export default function CalendarHeader({ onTodayClick, lang }: CalendarHeaderProps) {
  const { hijriAdjustment } = useSettings();
  // Always use the current date
  const currentDate = new Date(); 
  const hijriDate = getHijriDate(currentDate, hijriAdjustment);
  const t = translations[lang];

  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-3">
        <CalendarDays className="w-8 h-8 text-primary" />
        <div>
          <p className="font-bold text-foreground">
            {`${formatLocalizedNumber(hijriDate.day, lang)} ${formatLocalizedHijriMonthByNumber(hijriDate.month, lang)} ${formatLocalizedNumber(hijriDate.year, lang)} ${t.hijriEra}`}
          </p>
          <p className="text-sm text-muted-foreground">
            {formatLocalizedGregorianDate(currentDate, lang, { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
          </p>
        </div>
      </div>
      <Button variant="outline" onClick={onTodayClick}>
        {t.today}
      </Button>
    </div>
  );
}
