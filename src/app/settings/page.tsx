'use client';
import { useEffect, useMemo, useState } from 'react';
import { getLanguageDefinition, Language, isRtlLanguage, supportedLanguages, useLanguage } from '@/context/language-context';
import { useSettings } from '@/context/settings-context';
import { translations } from '@/lib/translations';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/hooks/use-toast';
import { Globe, CalendarDays, BookOpen, MapPin } from 'lucide-react';

const prayerCalculationMethods = [
  { value: 1, name: 'ISNA (North America)' },
  { value: 2, name: 'Muslim World League' },
  { value: 3, name: 'Egyptian General Authority' },
  { value: 4, name: 'Umm Al-Qura, Makkah' },
  { value: 5, name: 'University of Islamic Sciences, Karachi' },
  { value: 7, name: 'Institute of Geophysics, University of Tehran' },
];


export default function SettingsPage() {
  const { lang, setLang } = useLanguage();
  const { 
    prayerMethod, setPrayerMethod, 
    hijriAdjustment, setHijriAdjustment,
    location, setLocation,
    isManualLocation, setIsManualLocation,
    fetchAndSetLocation 
  } = useSettings();
  const { toast } = useToast();
  const t = translations[lang];
  const [locationDraft, setLocationDraft] = useState({ latitude: '', longitude: '' });
  const currentLanguage = getLanguageDefinition(lang);

  useEffect(() => {
    setLocationDraft({
      latitude: location?.latitude?.toString() ?? '',
      longitude: location?.longitude?.toString() ?? '',
    });
  }, [location, isManualLocation]);

  const parsedLatitude = useMemo(() => Number(locationDraft.latitude), [locationDraft.latitude]);
  const parsedLongitude = useMemo(() => Number(locationDraft.longitude), [locationDraft.longitude]);
  const hasCompleteDraft = locationDraft.latitude.trim() !== '' && locationDraft.longitude.trim() !== '';
  const isManualLocationValid =
    hasCompleteDraft &&
    Number.isFinite(parsedLatitude) &&
    Number.isFinite(parsedLongitude) &&
    parsedLatitude >= -90 &&
    parsedLatitude <= 90 &&
    parsedLongitude >= -180 &&
    parsedLongitude <= 180;

  const saveManualLocation = () => {
    if (!isManualLocationValid) {
      toast({
        variant: 'destructive',
        title: t.location,
        description: t.invalidCoordinates,
      });
      return;
    }

    setLocation({ latitude: parsedLatitude, longitude: parsedLongitude });
    toast({
      title: t.location,
      description: t.locationSaved,
    });
  };

  return (
    <div className="p-4 space-y-6" dir={isRtlLanguage(lang) ? 'rtl' : 'ltr'}>
       <header className="bg-background text-foreground pb-4 flex items-center justify-between sticky top-0 z-10">
        <h1 className="text-xl font-bold">{t.settings}</h1>
      </header>
      
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Globe className="w-5 h-5" />
            {t.language}
          </CardTitle>
          <CardDescription>{t.languageDescription}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="language-select" className="text-base">
              {t.currentLanguage}
            </Label>
            <p className="text-sm text-muted-foreground">{currentLanguage.label} ({currentLanguage.nativeLabel})</p>
          </div>
          <Select value={lang} onValueChange={(value) => setLang(value as Language)}>
            <SelectTrigger id="language-select">
              <SelectValue placeholder={t.selectLanguage} />
            </SelectTrigger>
            <SelectContent>
              {supportedLanguages.map((language) => (
                <SelectItem key={language.value} value={language.value}>
                  {language.label} ({language.nativeLabel})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MapPin className="w-5 h-5" />
            {t.location}
          </CardTitle>
           <CardDescription>{t.locationDescription}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <Label htmlFor="manual-location-switch" className="text-base">
              {t.manualLocation}
            </Label>
            <Switch
              id="manual-location-switch"
              checked={isManualLocation}
              onCheckedChange={setIsManualLocation}
            />
          </div>
          {isManualLocation ? (
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <Label htmlFor="latitude">{t.latitude}</Label>
                  <Input
                    id="latitude"
                    type="number"
                    inputMode="decimal"
                    value={locationDraft.latitude}
                    onChange={(e) => setLocationDraft((current) => ({ ...current, latitude: e.target.value }))}
                    placeholder="e.g. 34.0522"
                  />
                </div>
                <div>
                  <Label htmlFor="longitude">{t.longitude}</Label>
                  <Input
                    id="longitude"
                    type="number"
                    inputMode="decimal"
                    value={locationDraft.longitude}
                    onChange={(e) => setLocationDraft((current) => ({ ...current, longitude: e.target.value }))}
                    placeholder="e.g. -118.2437"
                  />
                </div>
              </div>
              <p className="text-sm text-muted-foreground">{t.manualLocationHint}</p>
              <Button onClick={saveManualLocation} className="w-full" disabled={!isManualLocationValid}>
                {t.saveLocation}
              </Button>
            </div>
          ) : (
            <Button onClick={fetchAndSetLocation} className="w-full">
              {t.useCurrentLocation}
            </Button>
          )}
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
