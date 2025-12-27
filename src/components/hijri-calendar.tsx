'use client';

import { useState, useEffect, useMemo } from 'react';
import {
  format,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  getDay,
  isToday,
  add,
  sub,
  isSameMonth,
  startOfWeek,
} from 'date-fns';
import { ChevronLeft, ChevronRight, Star } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { getHijriDate, HijriDateInfo } from '@/lib/hijri';
import { getEventForDate, IslamicEvent } from '@/lib/islamic-events';
import { cn } from '@/lib/utils';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

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

  const calendarDays = useMemo((): CalendarDay[] => {
    const monthStart = startOfMonth(viewDate);
    const gridStart = startOfWeek(monthStart, { weekStartsOn: 0 }); // Sunday

    const days = Array.from({ length: 42 }, (_, i) => add(gridStart, { days: i }));

    return days.map((day) => {
      const hijri = getHijriDate(day, hijriAdjustment);
      const event = getEventForDate(hijri.month, hijri.day);
      return {
        gregorian: day,
        hijri: hijri,
        isCurrentMonth: isSameMonth(day, viewDate),
        event: event,
      };
    });
  }, [viewDate, hijriAdjustment]);

  const handlePrevMonth = () => setViewDate(sub(viewDate, { months: 1 }));
  const handleNextMonth = () => setViewDate(add(viewDate, { months: 1 }));
  const handleToday = () => setViewDate(new Date());

  const weekdays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  return (
    <Card className="shadow-lg shadow-primary/5 border-primary/10">
      <CardHeader className="p-4 border-b">
        <div className="flex items-center justify-between gap-4">
          <Button variant="ghost" size="icon" onClick={handlePrevMonth} aria-label="Previous month">
            <ChevronLeft className="h-6 w-6" />
          </Button>
          <div className="text-center font-headline flex-grow">
            <h2 className="text-xl md:text-2xl font-bold text-primary">
              {format(viewDate, 'MMMM yyyy')}
            </h2>
            <p className="text-md text-muted-foreground">
              {getHijriDate(startOfMonth(viewDate), hijriAdjustment).monthName} - {getHijriDate(endOfMonth(viewDate), hijriAdjustment).monthName}, {getHijriDate(endOfMonth(viewDate), hijriAdjustment).year} AH
            </p>
          </div>
          <Button variant="ghost" size="icon" onClick={handleNextMonth} aria-label="Next month">
            <ChevronRight className="h-6 w-6" />
          </Button>
        </div>
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mt-4">
            <Button size="sm" variant="outline" onClick={handleToday}>Today</Button>
            <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground hidden sm:inline">Hijri Adjustment:</span>
                <Button size="sm" variant={hijriAdjustment === -1 ? "default" : "outline"} onClick={() => handleSetAdjustment(-1)}>-1 Day</Button>
                <Button size="sm" variant={hijriAdjustment === 0 ? "default" : "outline"} onClick={() => handleSetAdjustment(0)}>0</Button>
                <Button size="sm" variant={hijriAdjustment === 1 ? "default" : "outline"} onClick={() => handleSetAdjustment(1)}>+1 Day</Button>
            </div>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        <div className="grid grid-cols-7 bg-card">
          {weekdays.map((day) => (
            <div key={day} className="text-center font-bold text-muted-foreground py-3 text-sm border-b border-r last:border-r-0">
              {day}
            </div>
          ))}
        </div>
        <div className="grid grid-cols-7 grid-rows-6">
          {calendarDays.map((day, index) => (
            <TooltipProvider key={index} delayDuration={100}>
              <Tooltip>
                <TooltipTrigger asChild>
                  <div
                    className={cn(
                      'relative p-2 h-24 md:h-28 border-b border-r overflow-hidden transition-colors duration-200 flex flex-col group/day',
                      day.isCurrentMonth ? 'bg-card' : 'bg-muted/30',
                      isToday(day.gregorian) && 'bg-accent/20 ring-1 ring-accent',
                      { 'cursor-pointer hover:bg-primary/5': day.event },
                      index % 7 === 6 && 'border-r-0',
                      index >= 35 && 'border-b-0'
                    )}
                  >
                    <div className="flex justify-between items-start">
                      <span className={cn(
                        'font-bold text-sm select-none',
                        day.isCurrentMonth ? 'text-foreground' : 'text-muted-foreground/60',
                        isToday(day.gregorian) && 'text-primary'
                      )}>
                        {format(day.gregorian, 'd')}
                      </span>
                      <span className={cn(
                        'font-mono text-xs select-none',
                        day.isCurrentMonth ? 'text-muted-foreground' : 'text-muted-foreground/50'
                      )}>
                        {day.hijri.day}
                      </span>
                    </div>
                    {day.event && (
                      <div className="mt-auto text-center flex-grow flex flex-col justify-center items-center">
                        <Star className="h-5 w-5 text-accent-foreground fill-accent mb-1" />
                        <p className="text-xs truncate font-medium text-primary hidden md:block">
                          {day.event.name}
                        </p>
                      </div>
                    )}
                  </div>
                </TooltipTrigger>
                {day.event && (
                  <TooltipContent className="bg-primary text-primary-foreground border-primary-foreground/20">
                    <p className="font-bold">{day.event.name}</p>
                    <p className="text-sm max-w-xs">{day.event.description}</p>
                  </TooltipContent>
                )}
              </Tooltip>
            </TooltipProvider>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
