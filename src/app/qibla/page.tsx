'use client';

import { useLanguage } from '@/context/language-context';
import { translations } from '@/lib/translations';
import QiblaCompass from '@/components/qibla-compass';

export default function QiblaFinderPage() {
  const { lang } = useLanguage();
  const t = translations[lang];

  return (
    <div className="h-screen flex flex-col" dir={lang === 'ar' ? 'rtl' : 'ltr'}>
      <header className="bg-background text-foreground p-4 flex items-center gap-4 sticky top-0 z-10">
        <h1 className="text-xl font-bold">{t.qiblaFinder}</h1>
      </header>
      <main className="flex-grow flex flex-col items-center justify-center bg-background text-foreground p-4">
        <QiblaCompass />
      </main>
    </div>
  );
}
