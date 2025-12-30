'use client';
import { useLanguage } from '@/context/language-context';
import { translations } from '@/lib/translations';

export default function QiblaPage() {
  const { lang } = useLanguage();
  const t = translations[lang];

  return (
    <div className="h-screen flex flex-col" dir={lang === 'ar' ? 'rtl' : 'ltr'}>
       <header className="bg-background text-foreground p-4 flex items-center justify-between sticky top-0 z-10">
        <h1 className="text-xl font-bold">{t.qiblaFinder}</h1>
      </header>
      <main className="flex-grow">
        <iframe
          src="https://qiblafinder.withgoogle.com/intl/en/desktop"
          className="w-full h-full border-0"
          title="Qibla Finder"
        ></iframe>
      </main>
    </div>
  );
}
