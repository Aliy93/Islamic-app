'use client';
import { Compass } from 'lucide-react';
import { isRtlLanguage, useLanguage } from '@/context/language-context';
import { translations } from '@/lib/translations';
import QiblaCompass from '@/components/qibla-compass';

export default function QiblaPage() {
  const { lang } = useLanguage();
  const t = translations[lang];

  return (
    <div className="brand-page-gradient min-h-screen flex flex-col" dir={isRtlLanguage(lang) ? 'rtl' : 'ltr'}>
      <header className="sticky top-0 z-10 border-b border-primary/10 bg-background/80 backdrop-blur-xl">
        <div className="p-4">
          <div className="mx-auto flex max-w-md items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl border border-primary/15 bg-primary/10 text-primary shadow-sm">
              <Compass className="h-5 w-5" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-primary">{t.qiblaFinder}</h1>
              <p className="text-sm text-muted-foreground">
                {t.qiblaPageIntro}
              </p>
            </div>
          </div>
        </div>
      </header>
      <main className="flex-grow px-4 pb-8 pt-6">
        <div className="mx-auto flex max-w-md flex-col items-center gap-5">
          <div className="w-full rounded-[28px] border border-primary/10 bg-white/70 p-4 text-center shadow-sm backdrop-blur-sm">
            <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-primary/80">
              {t.phoneMode}
            </p>
            <p className="mt-2 text-sm text-muted-foreground">
              {t.qiblaPhoneModeHint}
            </p>
          </div>
          <QiblaCompass />
        </div>
      </main>
    </div>
  );
}
