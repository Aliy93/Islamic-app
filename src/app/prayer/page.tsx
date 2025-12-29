'use client';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import PrayerTimes from '@/components/prayer-times';
import { useLanguage } from '@/context/language-context';
import { translations } from '@/lib/translations';

export default function PrayerPage() {
  const { lang } = useLanguage();
  const t = translations[lang];

  return (
    <div className="min-h-screen flex flex-col" dir={lang === 'ar' ? 'rtl' : 'ltr'}>
      <header className="bg-primary text-primary-foreground p-4 flex items-center gap-4">
        <Link href="/" passHref>
          <Button variant="ghost" size="icon" className="hover:bg-primary/80">
            <ArrowLeft />
          </Button>
        </Link>
        <h1 className="text-xl font-bold">{t.prayerTimes}</h1>
      </header>
      <main className="flex-grow p-4">
        <PrayerTimes />
      </main>
    </div>
  );
}
