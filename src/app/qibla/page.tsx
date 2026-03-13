'use client';
import { Compass } from 'lucide-react';
import { useLanguage } from '@/context/language-context';
import { translations } from '@/lib/translations';
import QiblaCompass from '@/components/qibla-compass';

export default function QiblaPage() {
  const { lang } = useLanguage();
  const t = translations[lang];

  return (
    <div className="min-h-screen flex flex-col bg-[radial-gradient(circle_at_top,rgba(16,185,129,0.10),rgba(255,255,255,0)_34%),linear-gradient(180deg,#f7fcfa_0%,#ffffff_48%,#f4fbf7_100%)]" dir={lang === 'ar' ? 'rtl' : 'ltr'}>
      <header className="sticky top-0 z-10 border-b border-primary/10 bg-background/80 backdrop-blur-xl">
        <div className="p-4">
          <div className="mx-auto flex max-w-md items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl border border-primary/15 bg-primary/10 text-primary shadow-sm">
              <Compass className="h-5 w-5" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-primary">{t.qiblaFinder}</h1>
              <p className="text-sm text-muted-foreground">
                {lang === 'ar'
                  ? 'اتبع البوصلة وحرّك الهاتف حتى تصطف علامة الكعبة مع أعلى الجهاز.'
                  : 'Follow the dial and rotate your phone until the Kaaba marker reaches the top.'}
              </p>
            </div>
          </div>
        </div>
      </header>
      <main className="flex-grow px-4 pb-8 pt-6">
        <div className="mx-auto flex max-w-md flex-col items-center gap-5">
          <div className="w-full rounded-[28px] border border-primary/10 bg-white/70 p-4 text-center shadow-sm backdrop-blur-sm">
            <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-primary/80">
              {lang === 'ar' ? 'وضع الهاتف' : 'Phone Mode'}
            </p>
            <p className="mt-2 text-sm text-muted-foreground">
              {lang === 'ar'
                ? 'لأفضل نتيجة، أمسك الهاتف بشكل مستوٍ وبعيداً عن المعادن والمغانط.'
                : 'For the best result, hold the phone flat and away from metal or magnets.'}
            </p>
          </div>
          <QiblaCompass />
        </div>
      </main>
    </div>
  );
}
