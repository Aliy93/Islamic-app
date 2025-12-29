'use client';
import { useLanguage } from '@/context/language-context';
import { useSettings } from '@/context/settings-context';
import { translations } from '@/lib/translations';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Globe, CalendarDays, BookOpen } from 'lucide-react';

const prayerCalculationMethods = [
  { value: 1, name: 'ISNA (North America)' },
  { value: 2, name: 'Muslim World League' },
  { value: 3, name: 'Egyptian General Authority' },
  { value: 4, name: 'Umm Al-Qura, Makkah' },
  { value: 5, name: 'University of Islamic Sciences, Karachi' },
  { value: 7, name: 'Institute of Geophysics, University of Tehran' },
];


export default function SettingsPage() {
  const { lang, toggleLang } = useLanguage();
  const { prayerMethod, setPrayerMethod, hijriAdjustment, setHijriAdjustment } = useSettings();
  const t = translations[lang];

  return (
    <div className="p-4 space-y-6" dir={lang === 'ar' ? 'rtl' : 'ltr'}>
       <header className="bg-background text-foreground pb-4 flex items-center justify-between sticky top-0 z-10">
        <h1 className="text-xl font-bold">{t.settings}</h1>
      </header>
      
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Globe className="w-5 h-5" />
            {t.language}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <Label htmlFor="language-toggle" className="text-base">
              {lang === 'en' ? 'Current: English' : 'الحالي: العربية'}
            </Label>
            <Button onClick={toggleLang} id="language-toggle">
              {lang === 'en' ? 'Switch to Arabic' : 'التبديل إلى الإنجليزية'}
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BookOpen className="w-5 h-5" />
            {t.prayerCalculation}
          </CardTitle>
          <CardDescription>
            {t.prayerCalculationDescription}
          </CardDescription>
        </CardHeader>
        <CardContent>
           <Select
              value={String(prayerMethod)}
              onValueChange={(value) => setPrayerMethod(Number(value))}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select a method" />
              </SelectTrigger>
              <SelectContent>
                {prayerCalculationMethods.map(method => (
                  <SelectItem key={method.value} value={String(method.value)}>
                    {method.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CalendarDays className="w-5 h-5" />
            {t.hijriAdjustment}
          </CardTitle>
          <CardDescription>
            {t.hijriAdjustmentDescription}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <RadioGroup 
            value={String(hijriAdjustment)} 
            onValueChange={(value) => setHijriAdjustment(Number(value))}
            className="flex items-center justify-around"
          >
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="-1" id="r1" />
              <Label htmlFor="r1">-1 {t.day}</Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="0" id="r2" />
              <Label htmlFor="r2">0 ({t.default})</Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="1" id="r3" />
              <Label htmlFor="r3">+1 {t.day}</Label>
            </div>
          </RadioGroup>
        </CardContent>
      </Card>

    </div>
  );
}
