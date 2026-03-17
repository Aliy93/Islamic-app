'use client';

import { useMemo, useState } from 'react';
import { ChevronDown } from 'lucide-react';
import { Language } from '@/context/language-context';
import { islamicEvents } from '@/lib/islamic-events';
import { getGregorianDateFromHijri } from '@/lib/hijri';
import { formatLocalizedGregorianDate, formatLocalizedHijriMonthByNumber, formatLocalizedNumber } from '@/lib/localization';
import { translations } from '@/lib/translations';
import { cn } from '@/lib/utils';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from './ui/collapsible';
import { Separator } from './ui/separator';

interface AllIslamicEventsProps {
  lang: Language;
  year: number;
}

export default function AllIslamicEvents({ lang, year }: AllIslamicEventsProps) {
  const [isOpen, setIsOpen] = useState(false);
  const t = translations[lang];
  const events = useMemo(() => {
    return [...islamicEvents]
      .sort((left, right) => {
        if (left.month !== right.month) {
          return left.month - right.month;
        }

        return left.day - right.day;
      })
      .map((event) => ({
        ...event,
        gregorianDate: getGregorianDateFromHijri(year, event.month, event.day),
      }));
  }, [year]);

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen}>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between gap-4 space-y-0">
          <div>
            <CardTitle>{t.allEvents}</CardTitle>
          </div>
          <CollapsibleTrigger asChild>
            <Button variant="ghost" size="icon" aria-label={t.allEvents}>
              <ChevronDown className={cn('h-5 w-5 transition-transform', isOpen && 'rotate-180')} />
            </Button>
          </CollapsibleTrigger>
        </CardHeader>
        <CollapsibleContent>
          <CardContent className="space-y-4">
            {events.map((event, index) => (
              <div key={`${event.month}-${event.day}-${event.name}`}>
                <div className="flex items-start gap-4">
                  <div className="min-w-14 rounded-lg bg-primary/10 px-3 py-2 text-center text-primary">
                    <p className="text-lg font-bold leading-none">{formatLocalizedNumber(event.day, lang)}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="font-semibold text-foreground">{lang === 'ar' ? event.nameAr : event.name}</p>
                    <p className="text-sm text-muted-foreground">
                      {`${formatLocalizedHijriMonthByNumber(event.month, lang)} ${formatLocalizedNumber(event.day, lang)}, ${formatLocalizedNumber(year, lang)}`}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {formatLocalizedGregorianDate(event.gregorianDate, lang, { day: 'numeric', month: 'long', year: 'numeric' })}
                    </p>
                  </div>
                </div>
                {index < events.length - 1 && <Separator className="mt-4" />}
              </div>
            ))}
          </CardContent>
        </CollapsibleContent>
      </Card>
    </Collapsible>
  );
}