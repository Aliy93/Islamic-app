'use client';

import { useQibla } from '@/hooks/use-qibla';
import { useLanguage } from '@/context/language-context';
import { translations } from '@/lib/translations';
import { Button } from '@/components/ui/button';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { Compass, Zap, Ban } from 'lucide-react';
import { toArabicNumerals } from '@/lib/utils';
import { useSettings } from '@/context/settings-context';
import { useEffect } from 'react';

// Kaaba SVG Icon
const KaabaIcon = () => (
    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-full text-primary">
        <path d="M3.75 3.75L12 2L20.25 3.75L12 5.5L3.75 3.75Z" fill="currentColor" stroke="black" strokeWidth="1.5" strokeLinejoin="round"/>
        <path d="M3.75 3.75V17.25L12 22L20.25 17.25V3.75" stroke="black" strokeWidth="1.5" strokeLinejoin="round"/>
        <path d="M20.25 3.75L12 5.5L3.75 3.75" stroke="black" strokeWidth="1.5" strokeLinejoin="round"/>
        <path d="M12 22V5.5" stroke="black" strokeWidth="1.5" strokeLinejoin="round"/>
    </svg>
);


export default function QiblaCompass() {
  const { lang } = useLanguage();
  const { location, locationError, fetchAndSetLocation } = useSettings();
  const { 
    qiblaDirection,
    permissionState,
    requestPermission,
    error: qiblaError,
    isLoading,
    compassRotation,
    qiblaRotation,
  } = useQibla();

  const t = translations[lang];

  useEffect(() => {
    if(!location && !locationError) {
        fetchAndSetLocation();
    }
  }, [location, locationError, fetchAndSetLocation]);

  const renderContent = () => {
    if (isLoading) {
      return (
        <div className="text-center space-y-2">
          <Compass className="w-12 h-12 mx-auto animate-pulse" />
          <p className="font-semibold">{t.loading}</p>
        </div>
      );
    }
    
    if (!location && locationError) {
       return (
            <Alert>
                <Ban className="w-4 h-4"/>
                <AlertTitle>{t.locationNeeded}</AlertTitle>
                <AlertDescription>
                    {locationError} {t.locationNeededMsg}
                </AlertDescription>
            </Alert>
       )
    }

    if (qiblaError || permissionState === 'denied') {
      return (
        <Alert variant="destructive">
            <Ban className="w-4 h-4"/>
            <AlertTitle>{t.qiblaErrorTitle}</AlertTitle>
            <AlertDescription>
                {t.permissionNeeded}
            </AlertDescription>
        </Alert>
      );
    }
    
    if (permissionState === 'prompt') {
       return (
        <Alert>
            <Zap className="w-4 h-4" />
            <AlertTitle>{t.permissionPromptTitle}</AlertTitle>
            <AlertDescription>{t.permissionPrompt}</AlertDescription>
            <Button onClick={requestPermission} className="mt-4 w-full">{t.grantPermission}</Button>
        </Alert>
       )
    }
    
    // When everything is ready
    return (
      <div className="flex flex-col items-center justify-center gap-6">
        <div 
          className="relative w-64 h-64 rounded-full bg-card border-8 border-border shadow-inner transition-transform duration-200 ease-linear"
          style={{ transform: `rotate(${compassRotation}deg)` }}
        >
            {/* Cardinal directions */}
            <span className="absolute top-2 left-1/2 -translate-x-1/2 font-bold text-primary text-xl">N</span>
            <span className="absolute bottom-2 left-1/2 -translate-x-1/2 font-bold text-muted-foreground text-xl">S</span>
            <span className="absolute left-2 top-1/2 -translate-y-1/2 font-bold text-muted-foreground text-xl">W</span>
            <span className="absolute right-2 top-1/2 -translate-y-1/2 font-bold text-muted-foreground text-xl">E</span>

            {/* Ticks */}
            {Array.from({ length: 120 }).map((_, i) => (
                <div
                    key={i}
                    className="absolute top-0 left-1/2 h-full w-px -translate-x-1/2"
                    style={{ transform: `rotate(${i * 3}deg)` }}
                >
                    <div className={`mx-auto bg-muted-foreground ${i % 15 === 0 ? 'h-4 w-0.5' : 'h-2 w-px'}`}></div>
                </div>
            ))}

            {/* Qibla Arrow */}
            <div 
              className="absolute inset-0 flex items-center justify-center transition-transform duration-200 ease-in-out"
              style={{ transform: `rotate(${qiblaRotation}deg)` }}
            >
                <KaabaIcon />
            </div>
        </div>
        <div className="text-center">
            <h2 className="text-lg font-semibold text-muted-foreground">{t.qiblaDirection}</h2>
            <p className="text-5xl font-bold text-foreground">
                {lang === 'ar' ? toArabicNumerals(qiblaDirection.toFixed(0)) : qiblaDirection.toFixed(0)}°
            </p>
        </div>
        <Alert>
            <Zap className="h-4 w-4" />
            <AlertTitle>{t.calibratingTitle}</AlertTitle>
            <AlertDescription>{t.calibrating}</AlertDescription>
        </Alert>
      </div>
    );
  };

  return <>{renderContent()}</>;
}
