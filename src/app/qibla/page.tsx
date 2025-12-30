'use client';
import { useLanguage } from '@/context/language-context';
import { translations } from '@/lib/translations';
import QiblaCompass from '@/components/qibla-compass';

export default function QiblaPage() {
  const { lang } = useLanguage();
  const t = translations[lang];

  return (
    <div className="h-screen flex flex-col bg-background" dir={lang === 'ar' ? 'rtl' : 'ltr'}>
       <header className="p-4 flex items-center justify-between sticky top-0 z-10">
        <h1 className="text-xl font-bold text-primary">{t.qiblaFinder}</h1>
      </header>
      <main className="flex-grow flex flex-col items-center justify-center p-4">
        <QiblaCompass />
      </main>
    </div>
  );
}
