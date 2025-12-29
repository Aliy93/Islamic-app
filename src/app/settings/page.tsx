'use client';
import { useLanguage } from '@/context/language-context';
import { translations } from '@/lib/translations';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Globe } from 'lucide-react';

export default function SettingsPage() {
  const { lang, toggleLang } = useLanguage();
  const t = translations[lang];

  return (
    <div className="p-4" dir={lang === 'ar' ? 'rtl' : 'ltr'}>
       <header className="bg-background text-foreground pb-4 flex items-center justify-between sticky top-0 z-10">
        <h1 className="text-xl font-bold">{t.settings}</h1>
      </header>
      <Card>
        <CardHeader>
          <CardTitle>{t.settings}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <Label htmlFor="language-toggle" className="flex items-center gap-2 text-lg">
              <Globe className="w-5 h-5" />
              Language
            </Label>
            <Button onClick={toggleLang} id="language-toggle">
              {lang === 'en' ? 'Switch to Arabic' : 'التبديل إلى الإنجليزية'}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
