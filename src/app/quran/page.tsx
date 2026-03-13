'use client';
import { useEffect, useState } from 'react';
import { BookOpen, ExternalLink, History, Sparkles } from 'lucide-react';
import { useLanguage } from '@/context/language-context';
import { translations } from '@/lib/translations';
import { featuredQuranResources, quranWeeklyPlan, type QuranResource } from '@/lib/quran';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

const LAST_READING_KEY = 'quran:last-reading';

type StoredQuranResource = Pick<QuranResource, 'id' | 'title' | 'titleAr' | 'reference' | 'referenceAr' | 'url'>;

export default function QuranPage() {
  const { lang } = useLanguage();
  const t = translations[lang];
  const [lastReading, setLastReading] = useState<StoredQuranResource | null>(null);

  useEffect(() => {
    const saved = window.localStorage.getItem(LAST_READING_KEY);
    if (!saved) return;

    try {
      setLastReading(JSON.parse(saved) as StoredQuranResource);
    } catch {
      window.localStorage.removeItem(LAST_READING_KEY);
    }
  }, []);

  const saveLastReading = (resource: QuranResource) => {
    const payload: StoredQuranResource = {
      id: resource.id,
      title: resource.title,
      titleAr: resource.titleAr,
      reference: resource.reference,
      referenceAr: resource.referenceAr,
      url: resource.url,
    };

    window.localStorage.setItem(LAST_READING_KEY, JSON.stringify(payload));
    setLastReading(payload);
  };

  return (
    <div className="min-h-screen flex flex-col bg-background" dir={lang === 'ar' ? 'rtl' : 'ltr'}>
      <header className="bg-background text-foreground p-4 flex items-center justify-between sticky top-0 z-10">
        <div>
          <h1 className="text-xl font-bold">{t.quran}</h1>
          <p className="text-sm text-muted-foreground mt-1 max-w-xs">{t.quranSubtitle}</p>
        </div>
      </header>
      <main className="flex-grow p-4 space-y-4">
        <section className="premium-gradient rounded-[28px] p-5 text-white relative overflow-hidden shadow-xl">
          <div className="absolute inset-0 islamic-pattern opacity-10" />
          <div className="relative z-10 space-y-4">
            <div className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3 py-1 text-[11px] font-bold uppercase tracking-[0.18em] text-[#D4AF37]">
              <Sparkles className="h-4 w-4" />
              {t.quranContinue}
            </div>
            {lastReading ? (
              <div className="space-y-3">
                <div>
                  <h2 className="text-2xl font-bold font-headline">
                    {lang === 'ar' ? lastReading.titleAr : lastReading.title}
                  </h2>
                  <p className="text-sm text-white/80 mt-1">
                    {lang === 'ar' ? lastReading.referenceAr : lastReading.reference}
                  </p>
                </div>
                <Button variant="secondary" asChild className="rounded-full bg-white text-primary hover:bg-white/90">
                  <a href={lastReading.url} target="_blank" rel="noreferrer">
                    {t.quranOpen}
                    <ExternalLink className="h-4 w-4" />
                  </a>
                </Button>
              </div>
            ) : (
              <div className="rounded-3xl border border-white/10 bg-white/10 p-4 backdrop-blur-sm">
                <p className="text-sm text-white/85">{t.quranContinueEmpty}</p>
              </div>
            )}
            <Button asChild className="rounded-full bg-[#D4AF37] text-[#064E3B] hover:bg-[#e0bb56]">
              <a href="https://quran.com" target="_blank" rel="noreferrer">
                {t.quranFullReader}
                <BookOpen className="h-4 w-4" />
              </a>
            </Button>
          </div>
        </section>

        <Card className="border-border/60 shadow-sm rounded-[24px]">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <History className="h-5 w-5 text-primary" />
              {t.quranQuickAccess}
            </CardTitle>
            <CardDescription>{t.quranExternalNote}</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-3 sm:grid-cols-2">
            {featuredQuranResources.map((resource) => (
              <a
                key={resource.id}
                href={resource.url}
                target="_blank"
                rel="noreferrer"
                onClick={() => saveLastReading(resource)}
                className="group rounded-[22px] border border-border/70 bg-card p-4 transition-colors hover:border-primary/40 hover:bg-accent/30"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h3 className="font-bold text-foreground font-headline leading-tight">
                      {lang === 'ar' ? resource.titleAr : resource.title}
                    </h3>
                    <p className="mt-1 text-sm text-primary font-medium">
                      {lang === 'ar' ? resource.referenceAr : resource.reference}
                    </p>
                  </div>
                  <ExternalLink className="h-4 w-4 text-muted-foreground group-hover:text-primary" />
                </div>
                <p className="mt-3 text-sm text-muted-foreground leading-relaxed">
                  {lang === 'ar' ? resource.descriptionAr : resource.description}
                </p>
              </a>
            ))}
          </CardContent>
        </Card>

        <Card className="border-border/60 shadow-sm rounded-[24px]">
          <CardHeader>
            <CardTitle className="text-lg">{t.quranWeeklyPlan}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {quranWeeklyPlan.map((item) => (
              <div key={item.day} className="rounded-[20px] border border-border/70 bg-secondary/35 p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-primary">
                      {lang === 'ar' ? item.dayAr : item.day}
                    </p>
                    <h3 className="mt-1 font-bold text-foreground font-headline">
                      {lang === 'ar' ? item.titleAr : item.title}
                    </h3>
                  </div>
                  <span className="rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
                    {lang === 'ar' ? item.referenceAr : item.reference}
                  </span>
                </div>
                <p className="mt-3 text-sm text-muted-foreground leading-relaxed">
                  {lang === 'ar' ? item.focusAr : item.focus}
                </p>
              </div>
            ))}
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
