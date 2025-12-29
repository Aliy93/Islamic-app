import { Menu, RefreshCw, Compass, CalendarDays, BookOpen, Calendar as CalendarIcon } from 'lucide-react';
import HijriCalendar from '@/components/hijri-calendar';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { islamicEvents } from '@/lib/islamic-events';
import { format } from 'date-fns';
import Link from 'next/link';

export default function Home() {
  const getHijriMonthName = (month: number) => {
    // This is a bit of a hack, but it works.
    // We create a date in the middle of the month to avoid any off-by-one errors
    // with different calendar systems.
    const dateForMonth = new Date(2024, 0, 15);
    dateForMonth.setMonth(month - 1);
    
    try {
        return new Intl.DateTimeFormat('en-u-ca-islamic-umalqura', { month: 'long' }).format(dateForMonth);
    } catch (e) {
        console.error(e);
        return 'Unknown';
    }
  }

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900 font-sans">
      <div className="max-w-md mx-auto bg-white dark:bg-black shadow-lg">
        <header className="bg-primary text-primary-foreground p-4 flex items-center justify-between">
          <Button variant="ghost" size="icon" className="hover:bg-primary/80">
            <Menu />
          </Button>
          <h1 className="text-xl font-bold">Muslim App</h1>
          <Button variant="ghost" size="icon" className="hover:bg-primary/80">
            <RefreshCw />
          </Button>
        </header>

        <main className="p-4">
          <div className="bg-primary text-primary-foreground rounded-lg p-4 grid grid-cols-4 gap-4 text-center mb-4">
             <Link href="/qibla" passHref className="flex flex-col h-auto items-center justify-center gap-1.5 p-2 rounded-lg hover:bg-primary/80 text-primary-foreground no-underline">
              <Compass className="w-6 h-6" />
              <span className="text-xs mt-1">Qibla</span>
            </Link>
            <Button variant="ghost" className="flex flex-col h-auto items-center hover:bg-primary/80">
              <CalendarDays className="w-6 h-6" />
               <span className="text-xs mt-1">Prayer</span>
            </Button>
            <Button variant="ghost" className="flex flex-col h-auto items-center hover:bg-primary/80">
              <BookOpen className="w-6 h-6" />
              <span className="text-xs mt-1">Quran</span>
            </Button>
            <Button variant="ghost" className="flex flex-col h-auto items-center bg-black/10 rounded-lg">
              <CalendarIcon className="w-6 h-6" />
              <span className="text-xs mt-1">Calendar</span>
            </Button>
          </div>

          <HijriCalendar />

          <div className="mt-6">
            <h2 className="font-bold text-lg mb-2 text-foreground">Upcoming Holidays</h2>
            <Card>
              <CardContent className="p-0">
                <ul className="divide-y divide-border">
                  {islamicEvents.map((event, index) => (
                    <li key={index} className="px-4 py-3 flex justify-between items-center">
                      <div>
                        <p className="font-semibold text-foreground">{event.name}</p>
                        <p className="text-sm text-muted-foreground">{event.day} {getHijriMonthName(event.month)} 1445</p>
                      </div>
                      <span className="text-sm font-medium text-primary">{format(new Date(2024, event.month - 1, event.day), "dd MMMM yyyy")}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          </div>
        </main>
      </div>
    </div>
  );
}
