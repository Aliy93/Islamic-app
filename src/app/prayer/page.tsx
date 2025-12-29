'use client';
import { Settings } from 'lucide-react';
import { Button } from '@/components/ui/button';
import PrayerTimes from '@/components/prayer-times';
import { useLanguage } from '@/context/language-context';
import { translations } from '@/lib/translations';

export default function PrayerPage() {
  const { lang, toggleLang } = useLanguage();
  const t = translations[lang];

  return (
    <div className="min-h-screen flex flex-col" dir={lang === 'ar' ? 'rtl' : 'ltr'}>
      <header className="bg-background text-foreground p-4 flex items-center justify-between gap-4 sticky top-0 z-10">
        <h1 className="text-xl font-bold">{t.prayerTimes}</h1>
        <Button variant="ghost" size="icon" onClick={toggleLang}>
          <Settings />
        </Button>
      </header>
      <main className="flex-grow p-4">
        <PrayerTimes />
      </main>
    </div>
  );
}
