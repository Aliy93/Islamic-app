
'use client';

import { useState, useEffect, useMemo } from 'react';
import {
  format,
  isToday,
  add,
  sub,
} from 'date-fns';
import { arSA, enUS } from 'date-fns/locale';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { getHijriDate, HijriDateInfo, getGregorianDateFromHijri } from '@/lib/hijri';
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
    currentHijriDate: { year: number; month: number; };
    setCurrentHijriDate: (date: { year: number; month: number; }) => void;
}

export default function HijriCalendar({ lang = 'en', currentHijriDate, setCurrentHijriDate }: HijriCalendarProps) {
  const [hijriAdjustment, setHijriAdjustment] = useState(0);
  const [selectedDay, setSelectedDay] = useState<CalendarDay | null>(null);

  useEffect(() => {
    const savedAdjustment = localStorage.getItem('hijriAdjustment');
    if (savedAdjustment && [-1, 0, 1].includes(Number(savedAdjustment))) {
      setHijriAdjustment(parseInt(savedAdjustment, 10));
    }
  }, []);

  const calendarGrid = useMemo((): CalendarDay[][] => {
    const { year, month } = currentHijriDate;

    // 1. Find the Gregorian date for the 1st of the current Hijri month
    const firstDayOfHijriMonthGregorian = getGregorianDateFromHijri(year, month, 1, hijriAdjustment);

    // 2. Determine the number of days in the current Hijri month (29 or 30)
    const nextMonthGregorian = getGregorianDateFromHijri(month === 12 ? year + 1 : year, month === 12 ? 1 : month + 1, 1, hijriAdjustment);
    const daysInMonth = Math.round((nextMonthGregorian.getTime() - firstDayOfHijriMonthGregorian.getTime()) / (1000 * 60 * 60 * 24));

    // 3. Generate all days of the current Hijri month
    const monthDays: CalendarDay[] = Array.from({ length: daysInMonth }, (_, i) => {
      const dayNumber = i + 1;
      const gregorianDate = add(firstDayOfHijriMonthGregorian, { days: i });
      const hijriInfo = getHijriDate(gregorianDate, hijriAdjustment);
      return {
        gregorian: gregorianDate,
        hijri: hijriInfo,
        isCurrentMonth: true,
        event: getEventForDate(hijriInfo.month, hijriInfo.day),
      };
    });

    if (monthDays.length === 0) return [];

    // 4. Get padding days from previous and next months
    const weekStartsOn = 6; // Saturday
    const startDayOfWeek = (monthDays[0].gregorian.getDay() + 1) % 7; // Convert Sunday-first to Saturday-first
    const endDayOfWeek = (monthDays[daysInMonth - 1].gregorian.getDay() + 1) % 7;

    const daysBefore: CalendarDay[] = Array.from({ length: startDayOfWeek }).map((_, i) => {
        const gregorianDate = sub(firstDayOfHijriMonthGregorian, { days: startDayOfWeek - i });
        const hijriInfo = getHijriDate(gregorianDate, hijriAdjustment);
        return {
            gregorian: gregorianDate,
            hijri: hijriInfo,
            isCurrentMonth: false,
            event: undefined,
        };
    });
    
    const daysAfter: CalendarDay[] = Array.from({ length: 6 - endDayOfWeek }).map((_, i) => {
        const gregorianDate = add(nextMonthGregorian, { days: i });
        const hijriInfo = getHijriDate(gregorianDate, hijriAdjustment);
        return {
            gregorian: gregorianDate,
            hijri: hijriInfo,
            isCurrentMonth: false,
            event: undefined,
        };
    });

    const allDays = [...daysBefore, ...monthDays, ...daysAfter];

    // 5. Structure into weeks
    const weeks: CalendarDay[][] = [];
    for (let i = 0; i < allDays.length; i += 7) {
      weeks.push(allDays.slice(i, i + 7));
    }
    // Ensure 6 weeks for consistent layout
    while(weeks.length < 6 && weeks.length > 0) {
        const lastDay = weeks[weeks.length-1][6].gregorian;
        const nextWeek = Array.from({length: 7}).map((_,i) => {
            const gregorianDate = add(lastDay, {days: i + 1});
            const hijriInfo = getHijriDate(gregorianDate, hijriAdjustment);
            return {
                gregorian: gregorianDate,
                hijri: hijriInfo,
                isCurrentMonth: false,
                event: undefined,
            }
        });
        weeks.push(nextWeek);
    }
    
    return weeks;
  }, [currentHijriDate, hijriAdjustment]);

  useEffect(() => {
    // Find the first event in the current month view and select it by default
    const firstEventInView = calendarGrid
      .flat()
      .find(day => day.isCurrentMonth && day.event);
    setSelectedDay(firstEventInView || null);
  }, [calendarGrid]);

  const handlePrevMonth = () => {
    setCurrentHijriDate(prev => {
        if (prev.month === 1) return { year: prev.year - 1, month: 12 };
        return { ...prev, month: prev.month - 1 };
    });
    setSelectedDay(null);
  }
  const handleNextMonth = () => {
    setCurrentHijriDate(prev => {
        if (prev.month === 12) return { year: prev.year + 1, month: 1 };
        return { ...prev, month: prev.month + 1 };
    });
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
    
  const firstDayInGrid = calendarGrid[0]?.[0];
  const lastDayInGrid = calendarGrid[calendarGrid.length - 1]?.[6];

  const getHijriHeader = () => {
      if (!firstDayInGrid) return "";
      const hijriInfo = getHijriDate(getGregorianDateFromHijri(currentHijriDate.year, currentHijriDate.month, 1));
      return lang === 'ar'
          ? `${hijriInfo.monthNameAr} ${hijriInfo.year}`
          : `${hijriInfo.monthName} ${hijriInfo.year}`;
  };
  
  const getGregorianHeader = () => {
      if (!firstDayInGrid || !lastDayInGrid) return "";
      const startGrego = format(firstDayInGrid.gregorian, 'MMMM', { locale: lang === 'ar' ? arSA : enUS });
      const endGrego = format(lastDayInGrid.gregorian, 'MMMM yyyy', { locale: lang === 'ar' ? arSA : enUS });
      const startYear = format(firstDayInGrid.gregorian, 'yyyy');
      const endYear = format(lastDayInGrid.gregorian, 'yyyy');
      
      if (startYear !== endYear) {
          return `${format(firstDayInGrid.gregorian, 'MMMM yyyy', { locale: lang === 'ar' ? arSA : enUS })} - ${endGrego}`;
      }
      if (startGrego === endGrego.split(' ')[0]) {
          return endGrego;
      }
      return `${startGrego} - ${endGrego}`;
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
             {getGregorianHeader()}
          </p>
        </div>
        <Button variant="ghost" size="icon" onClick={handleNextMonth} aria-label="Next month">
          <ChevronRight className="h-6 w-6 text-foreground" />
        </Button>
      </CardHeader>
      
      <div className="grid grid-cols-7 text-center text-sm font-medium text-muted-foreground py-2 border-b">
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
                  'relative p-1 h-14 flex flex-col items-center justify-center rounded-lg',
                  {
                    'text-muted-foreground/50': !day.isCurrentMonth,
                    'text-foreground': day.isCurrentMonth,
                    'bg-accent': selectedDay?.gregorian.getTime() === day.gregorian.getTime(),
                    'cursor-pointer': !!day.event,
                  }
                )}
              >
                <div className={cn(
                  'w-10 h-10 flex flex-col items-center justify-center rounded-lg transition-colors',
                   day.isCurrentMonth && isToday(day.gregorian) && 'bg-primary text-primary-foreground',
                  day.isCurrentMonth && !isToday(day.gregorian) && !!day.event && 'hover:bg-accent/50',
                  { 'border-2 border-primary': day.isCurrentMonth && day.event }
                )}>
                  <span className={cn(
                      'font-bold text-lg',
                      {'opacity-50': !day.isCurrentMonth}
                  )}>
                    {day.hijri.day}
                  </span>
                 <span className="text-[10px] text-muted-foreground">
                    {format(day.gregorian, 'd')}
                </span>
                </div>
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
            <div className="flex items-center gap-4 w-full">
                <div className="text-center border-r-4 border-primary pr-4">
                    <p className="text-4xl font-bold">{selectedDay.hijri.day}</p>
                </div>
                <div className="flex-grow">
                    <h3 className="font-bold text-foreground">{lang === 'ar' ? selectedDay.event.nameAr : selectedDay.event.name}</h3>
                    <div className="flex justify-between text-sm text-muted-foreground">
                       <span>
                            {lang === 'ar' 
                                ? `${selectedDay.hijri.monthNameAr} ${selectedDay.hijri.day}, ${selectedDay.hijri.year}`
                                : `${selectedDay.hijri.day} ${selectedDay.hijri.monthName}, ${selectedDay.hijri.year}`
                            }
                        </span>
                        <span>
                            {format(selectedDay.gregorian, 'd MMMM, yyyy', { locale: lang === 'ar' ? arSA : enUS })}
                        </span>
                    </div>
                </div>
            </div>
        </CardFooter>
      )}
    </Card>
  );
}
