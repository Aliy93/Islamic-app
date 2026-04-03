'use client';
import { Compass } from 'lucide-react';
import { isRtlLanguage, useLanguage } from '@/context/language-context';
import { translations } from '@/lib/translations';
import QiblaCompass from '@/components/qibla-compass';

export default function QiblaPage() {
  const { lang } = useLanguage();
  const t = translations[lang];

  return (
    <div className="brand-page-gradient flex h-[100dvh] flex-col overflow-y-auto overflow-x-hidden" dir={isRtlLanguage(lang) ? 'rtl' : 'ltr'}>
      <header className="sticky top-0 z-10 border-b border-primary/10 bg-background/80 backdrop-blur-xl">
        <div className="px-4 py-2.5">
          <div className="mx-auto flex max-w-md items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-2xl border border-primary/15 bg-primary/10 text-primary shadow-sm">
              <Compass className="h-4.5 w-4.5" />
            </div>
            <div>
              <h1 className="text-base font-bold text-primary sm:text-lg">{t.qiblaFinder}</h1>
              <p className="text-xs text-muted-foreground sm:text-sm">
                {t.qiblaPageIntro}
              </p>
            </div>
          </div>
        </div>
      </header>
      <main className="flex-grow px-3 pb-8 pt-3 sm:px-4 sm:pt-4">
        <div className="mx-auto flex max-w-md flex-col items-center gap-3 sm:gap-4">
          <div className="w-full rounded-[24px] border border-primary/10 bg-white/70 px-4 py-2.5 text-center shadow-sm backdrop-blur-sm">
            <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-primary/80">
              {t.phoneMode}
            </p>
            <p className="mt-1 text-xs text-muted-foreground sm:text-sm">
              {t.qiblaPhoneModeHint}
            </p>
          </div>
          <QiblaCompass />
        </div>
      </main>
    </div>
  );
}
