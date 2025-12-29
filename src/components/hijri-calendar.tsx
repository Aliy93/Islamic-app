'use client';

import { useState, useEffect, useMemo } from 'react';
import {
  format,
  startOfMonth,
  eachDayOfInterval,
  isToday,
  add,
  sub,
  isSameMonth,
  startOfWeek,
} from 'date-fns';
import { arSA } from 'date-fns/locale/ar-SA';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { getHijriDate, HijriDateInfo } from '@/lib/hijri';
import { getEventForDate, IslamicEvent } from '@/lib/islamic-events';
import { cn } from '@/lib/utils';

type CalendarDay = {
  gregorian: Date;
  hijri: HijriDateInfo;
  isCurrentMonth: boolean;
  event: IslamicEvent | undefined;
};

interface HijriCalendarProps {
    lang: 'en' | 'ar';
}

export default function HijriCalendar({ lang = 'en' }: HijriCalendarProps) {
  const [viewDate, setViewDate] = useState(new Date());
  const [hijriAdjustment, setHijriAdjustment] = useState(0);

  useEffect(() => {
    const savedAdjustment = localStorage.getItem('hijriAdjustment');
    if (savedAdjustment && [-1, 0, 1].includes(Number(savedAdjustment))) {
      setHijriAdjustment(parseInt(savedAdjustment, 10));
    }
  }, []);


  const calendarGrid = useMemo((): CalendarDay[][] => {
    const monthStart = startOfMonth(viewDate);
    const gridStart = startOfWeek(monthStart, { weekStartsOn: lang === 'ar' ? 6 : 0 }); // Saturday for AR, Sunday for EN

    const days = Array.from({ length: 42 }, (_, i) => add(gridStart, { days: i }));

    const weeks: CalendarDay[][] = [];
    for (let i = 0; i < 6; i++) {
        const weekDays = days.slice(i * 7, (i + 1) * 7).map(day => {
            const hijri = getHijriDate(day, hijriAdjustment);
            const event = getEventForDate(hijri.month, hijri.day);
            return {
                gregorian: day,
                hijri: hijri,
                isCurrentMonth: isSameMonth(day, viewDate),
                event: event,
            };
        });
        weeks.push(weekDays);
    }
    return weeks;
}, [viewDate, hijriAdjustment, lang]);

  const handlePrevMonth = () => setViewDate(sub(viewDate, { months: 1 }));
  const handleNextMonth = () => setViewDate(add(viewDate, { months: 1 }));

  const longWeekdays = lang === 'ar' 
    ? ['سبت', 'أحد', 'اثنين', 'ثلاثاء', 'أربعاء', 'خميس', 'جمعة'] 
    : ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];

  if (lang === 'en') {
      longWeekdays.unshift(longWeekdays.pop()!);
  }

  const hijriDateForHeader = getHijriDate(viewDate, hijriAdjustment);

  return (
    <div className="bg-card rounded-lg shadow">
      <div className="flex items-center justify-between gap-4 p-4">
        <Button variant="ghost" size="icon" onClick={handlePrevMonth} aria-label="Previous month">
          <ChevronLeft className="h-6 w-6 text-foreground" />
        </Button>
        <div className="text-center flex-grow">
          <h2 className="font-bold text-lg text-foreground">
            {lang === 'ar' ? `${hijriDateForHeader.day} ${hijriDateForHeader.monthNameAr} ${hijriDateForHeader.year}` : `${hijriDateForHeader.day} ${hijriDateForHeader.monthName} ${hijriDateForHeader.year}` }
          </h2>
          <p className="text-sm text-muted-foreground">
            {format(viewDate, 'MMMM yyyy', { locale: lang === 'ar' ? arSA : undefined })}
          </p>
        </div>
        <Button variant="ghost" size="icon" onClick={handleNextMonth} aria-label="Next month">
          <ChevronRight className="h-6 w-6 text-foreground" />
        </Button>
      </div>
      
      <div className="grid grid-cols-7 text-center text-sm font-medium text-red-500 py-2 border-b">
        {longWeekdays.map((day, index) => (
          <div key={`${day}-${index}`}>{day}</div>
        ))}
      </div>

      <div className="p-2">
        {calendarGrid.map((week, weekIndex) => (
          <div key={weekIndex} className="grid grid-cols-7 text-center">
            {week.map((day) => (
              <div
                key={day.gregorian.toISOString()}
                className={cn(
                  'relative p-1 h-14 flex flex-col items-center justify-center rounded-full',
                  {
                    'text-muted-foreground/50': !day.isCurrentMonth,
                    'text-foreground': day.isCurrentMonth,
                  }
                )}
              >
                <div className={cn(
                  'w-8 h-8 flex flex-col items-center justify-center rounded-full transition-colors',
                  day.isCurrentMonth && isToday(day.gregorian) && 'bg-primary text-primary-foreground',
                  day.isCurrentMonth && !isToday(day.gregorian) && 'hover:bg-accent/50',
                  { 'border border-primary': day.event }
                )}>
                  <span className={cn(
                      'font-medium text-sm'
                  )}>
                    {format(day.gregorian, 'd')}
                  </span>
                </div>
                <span className="text-[10px] text-muted-foreground">
                    {day.isCurrentMonth ? day.hijri.day : ''}
                </span>
                {day.event && day.isCurrentMonth && (
                    <div className="absolute bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 bg-green-500 rounded-full"></div>
                )}
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}
