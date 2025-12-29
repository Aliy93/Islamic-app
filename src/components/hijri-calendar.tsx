
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
  endOfMonth,
  getDay,
} from 'date-fns';
import { arSA } from 'date-fns/locale/ar-SA';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { getHijriDate, HijriDateInfo } from '@/lib/hijri';
import { getEventForDate, IslamicEvent } from '@/lib/islamic-events';
import { cn } from '@/lib/utils';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from './ui/card';

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
  const [selectedDay, setSelectedDay] = useState<CalendarDay | null>(null);

  useEffect(() => {
    const savedAdjustment = localStorage.getItem('hijriAdjustment');
    if (savedAdjustment && [-1, 0, 1].includes(Number(savedAdjustment))) {
      setHijriAdjustment(parseInt(savedAdjustment, 10));
    }
  }, []);

  const calendarGrid = useMemo((): CalendarDay[][] => {
    const monthStart = startOfMonth(viewDate);
    const gridStart = startOfWeek(monthStart, { weekStartsOn: 6 }); // Week starts on Saturday

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

  const handlePrevMonth = () => {
    setViewDate(sub(viewDate, { months: 1 }));
    setSelectedDay(null);
  }
  const handleNextMonth = () => {
    setViewDate(add(viewDate, { months: 1 }));
    setSelectedDay(null);
  }

  const handleDayClick = (day: CalendarDay) => {
    if (day.event) {
        setSelectedDay(day);
    } else {
        setSelectedDay(null);
    }
  }

  const longWeekdays = lang === 'ar' 
    ? ['سبت', 'أحد', 'اثنين', 'ثلاثاء', 'أربعاء', 'خميس', 'جمعة'] 
    : ['Sat', 'Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri'];
    
  const startOfMonthHijri = getHijriDate(startOfMonth(viewDate), hijriAdjustment);
  const endOfMonthHijri = getHijriDate(endOfMonth(viewDate), hijriAdjustment);

  const getHijriHeader = () => {
      if (startOfMonthHijri.month === endOfMonthHijri.month) {
          return lang === 'ar'
              ? `${startOfMonthHijri.monthNameAr} ${startOfMonthHijri.year}`
              : `${startOfMonthHijri.monthName} ${startOfMonthHijri.year}`;
      }
      return lang === 'ar'
          ? `${startOfMonthHijri.monthNameAr} - ${endOfMonthHijri.monthNameAr} ${endOfMonthHijri.year}`
          : `${startOfMonthHijri.monthName} - ${endOfMonthHijri.monthName} ${endOfMonthHijri.year}`;
  };

  return (
    <Card className="bg-card rounded-lg shadow">
      <CardHeader className="flex flex-row items-center justify-between gap-4 p-4">
        <Button variant="ghost" size="icon" onClick={handlePrevMonth} aria-label="Previous month">
          <ChevronLeft className="h-6 w-6 text-foreground" />
        </Button>
        <div className="text-center flex-grow">
          <h2 className="font-bold text-lg text-foreground">
            {getHijriHeader()}
          </h2>
          <p className="text-sm text-muted-foreground">
             {format(viewDate, 'MMMM yyyy', { locale: lang === 'ar' ? arSA : undefined })}
          </p>
        </div>
        <Button variant="ghost" size="icon" onClick={handleNextMonth} aria-label="Next month">
          <ChevronRight className="h-6 w-6 text-foreground" />
        </Button>
      </CardHeader>
      
      <div className="grid grid-cols-7 text-center text-sm font-medium text-red-500 py-2 border-b">
        {longWeekdays.map((day) => (
          <div key={day}>{day}</div>
        ))}
      </div>

      <CardContent className="p-2">
        {calendarGrid.map((week, weekIndex) => (
          <div key={weekIndex} className="grid grid-cols-7 text-center">
            {week.map((day) => (
              <div
                key={day.gregorian.toISOString()}
                onClick={() => handleDayClick(day)}
                className={cn(
                  'relative p-1 h-14 flex flex-col items-center justify-center rounded-full cursor-pointer',
                  {
                    'text-muted-foreground/50': !day.isCurrentMonth,
                    'text-foreground': day.isCurrentMonth,
                    'bg-accent': selectedDay?.gregorian.getTime() === day.gregorian.getTime()
                  }
                )}
              >
                <div className={cn(
                  'w-8 h-8 flex flex-col items-center justify-center rounded-full transition-colors',
                  day.isCurrentMonth && isToday(day.gregorian) && 'bg-primary text-primary-foreground',
                  day.isCurrentMonth && !isToday(day.gregorian) && 'hover:bg-accent/50',
                  { 'border-2 border-primary': day.event }
                )}>
                  <span className={cn(
                      'font-bold text-lg',
                      {'opacity-50': !day.isCurrentMonth}
                  )}>
                    {day.hijri.day}
                  </span>
                </div>
                 <span className="text-[10px] text-muted-foreground">
                    {format(day.gregorian, 'd')}
                </span>
                {day.event && day.isCurrentMonth && (
                    <div className="absolute bottom-1 left-1/2 -translate-x-1/2 w-1.5 h-1.5 bg-primary rounded-full"></div>
                )}
              </div>
            ))}
          </div>
        ))}
      </CardContent>
      {selectedDay?.event && (
        <CardFooter className="p-4 border-t bg-accent/50">
            <div className="flex items-center gap-4">
                <div className="text-center border-r-4 border-primary pr-4">
                    <p className="text-4xl font-bold">{selectedDay.hijri.day}</p>
                </div>
                <div>
                    <h3 className="font-bold text-foreground">{lang === 'ar' ? selectedDay.event.nameAr : selectedDay.event.name}</h3>
                    <p className="text-sm text-muted-foreground">
                        {lang === 'ar' 
                            ? `${selectedDay.hijri.monthNameAr} ${selectedDay.hijri.day}, ${selectedDay.hijri.year}`
                            : `${selectedDay.hijri.day} ${selectedDay.hijri.monthName}, ${selectedDay.hijri.year}`
                        }
                    </p>
                </div>
            </div>
        </CardFooter>
      )}
    </Card>
  );
}
