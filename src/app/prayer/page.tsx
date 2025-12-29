'use client';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import PrayerTimes from '@/components/prayer-times';

export default function PrayerPage() {
  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900 font-sans">
      <div className="max-w-md mx-auto bg-white dark:bg-black shadow-lg h-screen flex flex-col">
        <header className="bg-primary text-primary-foreground p-4 flex items-center gap-4">
          <Link href="/" passHref>
            <Button variant="ghost" size="icon" className="hover:bg-primary/80">
              <ArrowLeft />
            </Button>
          </Link>
          <h1 className="text-xl font-bold">Prayer Times</h1>
        </header>
        <main className="flex-grow p-4">
          <PrayerTimes />
        </main>
      </div>
    </div>
  );
}
