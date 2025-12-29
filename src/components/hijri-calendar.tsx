'use client';

import { useState, useEffect, useMemo } from 'react';
import {
  format,
  startOfMonth,
  eachDayOfInterval,
  getDay,
  isToday,
  add,
  sub,
  isSameMonth,
  startOfWeek,
  endOfMonth,
} from 'date-fns';
import { ChevronLeft, ChevronRight, Star } from 'lucide-react';
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

export default function HijriCalendar() {
  const [viewDate, setViewDate] = useState(new Date());
  const [hijriAdjustment, setHijriAdjustment] = useState(0);

  useEffect(() => {
    const savedAdjustment = localStorage.getItem('hijriAdjustment');
    if (savedAdjustment && [-1, 0, 1].includes(Number(savedAdjustment))) {
      setHijriAdjustment(parseInt(savedAdjustment, 10));
    }
  }, []);

  const handleSetAdjustment = (adj: number) => {
    setHijriAdjustment(adj);
    localStorage.setItem('hijriAdjustment', adj.toString());
  };

  const calendarGrid = useMemo((): CalendarDay[][] => {
    const monthStart = startOfMonth(viewDate);
    const gridStart = startOfWeek(monthStart, { weekStartsOn: 0 }); // Sunday

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
}, [viewDate, hijriAdjustment]);

  const handlePrevMonth = () => setViewDate(sub(viewDate, { months: 1 }));
  const handleNextMonth = () => setViewDate(add(viewDate, { months: 1 }));

  const longWeekdays = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];

  const hijriDateForHeader = getHijriDate(viewDate, hijriAdjustment);

  return (
    <div className="bg-card rounded-lg shadow">
      <div className="flex items-center justify-between gap-4 p-4">
        <Button variant="ghost" size="icon" onClick={handlePrevMonth} aria-label="Previous month">
          <ChevronLeft className="h-6 w-6 text-foreground" />
        </Button>
        <div className="text-center flex-grow">
          <h2 className="font-bold text-lg text-foreground">
            {hijriDateForHeader.day} {hijriDateForHeader.monthName} {hijriDateForHeader.year}
          </h2>
          <p className="text-sm text-muted-foreground">
            {format(viewDate, 'MMMM yyyy')}
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
            {week.map((day, dayIndex) => (
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
                      'font-medium text-sm',
                      {'text-red-500': dayIndex === 0 && day.isCurrentMonth, 'text-blue-500': dayIndex === 6 && day.isCurrentMonth}
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
