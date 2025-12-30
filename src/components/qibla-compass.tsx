
'use client';
import { useLanguage } from '@/context/language-context';
import { translations } from '@/lib/translations';
import { Alert, AlertTitle, AlertDescription } from './ui/alert';

export default function QiblaCompass() {
  const { lang } = useLanguage();
  const t = translations[lang];

  return (
    <Alert>
      <AlertTitle>{t.calibratingTitle}</AlertTitle>
      <AlertDescription>{t.calibrating}</AlertDescription>
    </Alert>
  );
}
