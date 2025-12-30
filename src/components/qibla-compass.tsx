
'use client';
import { useQibla } from '@/hooks/use-qibla';
import { useLanguage } from '@/context/language-context';
import { translations } from '@/lib/translations';
import { toArabicNumerals } from '@/lib/utils';
import { Button } from './ui/button';
import { Alert, AlertTitle, AlertDescription } from './ui/alert';

export default function QiblaCompass() {
  const { lang } = useLanguage();
  const t = translations[lang];
  const { 
    qiblaDirection, 
    compassHeading,
    isCalibrating, 
    permissionState, 
    error,
    requestPermission 
  } = useQibla();

  const rotation = qiblaDirection - compassHeading;

  // Render based on permission state
  if (permissionState === 'idle') {
    return (
      <div className="text-center p-4">
        <Button onClick={requestPermission}>{t.grantPermission}</Button>
      </div>
    );
  }

  if (permissionState === 'denied') {
    return (
      <Alert variant="destructive">
        <AlertTitle>{t.qiblaErrorTitle}</AlertTitle>
        <AlertDescription>{error || t.permissionNeeded}</AlertDescription>
      </Alert>
    );
  }

  if (permissionState === 'prompt') {
      return (
          <Alert>
              <AlertTitle>{t.permissionPromptTitle}</AlertTitle>
              <AlertDescription>{t.permissionPrompt}</AlertDescription>
          </Alert>
      )
  }

  if (isCalibrating && permissionState === 'granted') {
    return (
      <Alert>
        <AlertTitle>{t.calibratingTitle}</AlertTitle>
        <AlertDescription>{t.calibrating}</AlertDescription>
      </Alert>
    );
  }

  if (error) {
     return (
      <Alert variant="destructive">
        <AlertTitle>{t.qiblaErrorTitle}</AlertTitle>
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    );
  }


  return (
    <div className="flex flex-col items-center justify-center space-y-4 text-center">
      <div className="relative w-64 h-64">
        {/* Compass background */}
        <div 
          className="absolute w-full h-full rounded-full bg-card border-8 border-muted transition-transform duration-100 ease-linear"
          style={{ transform: `rotate(${-compassHeading}deg)` }}
        >
          {/* North, East, South, West markers */}
          <span className="absolute top-1 left-1/2 -translate-x-1/2 text-primary font-bold text-xl">N</span>
          <span className="absolute bottom-1 left-1/2 -translate-x-1/2 text-muted-foreground font-bold text-xl">S</span>
          <span className="absolute right-1 top-1/2 -translate-y-1/2 text-muted-foreground font-bold text-xl">E</span>
          <span className="absolute left-1 top-1/2 -translate-y-1/2 text-muted-foreground font-bold text-xl">W</span>
        </div>
        
        {/* Qibla Arrow */}
        <div 
          className="absolute w-full h-full flex justify-center transition-transform duration-100 ease-linear"
          style={{ transform: `rotate(${rotation}deg)` }}
        >
          <svg width="40" height="256" viewBox="0 0 40 256" fill="none" xmlns="http://www.w3.org/2000/svg" className="text-primary">
            <path d="M20 0L0 60H12V256H28V60H40L20 0Z" fill="currentColor"/>
          </svg>
        </div>
      </div>
      <div className="text-center">
        <p className="font-bold text-2xl text-foreground">
          {lang === 'ar' ? toArabicNumerals(Math.round(qiblaDirection)) : Math.round(qiblaDirection)}°
        </p>
        <p className="text-muted-foreground">{t.qiblaDirection}</p>
      </div>
    </div>
  );
}
