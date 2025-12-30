'use client';
import { useLanguage } from '@/context/language-context';
import { translations } from '@/lib/translations';
import QiblaCompass from '@/components/qibla-compass';

export default function QiblaPage() {
  const { lang } = useLanguage();
  const t = translations[lang];

  return (
    <div className="h-screen flex flex-col" dir={lang === 'ar' ? 'rtl' : 'ltr'} style={{backgroundColor: '#F5F1E8'}}>
       <header className="p-4 flex items-center justify-between sticky top-0 z-10">
        <h1 className="text-xl font-bold" style={{color: '#00332C'}}>{t.qiblaFinder}</h1>
      </header>
      <main className="flex-grow flex flex-col items-center justify-center p-4">
        <QiblaCompass />
      </main>
    </div>
  );
}
