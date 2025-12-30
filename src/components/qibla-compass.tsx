'use client';
import { useEffect } from 'react';
import { Compass, CircleAlert, CheckCircle } from 'lucide-react';
import { useQibla, PermissionState } from '@/hooks/use-qibla';
import { useLanguage } from '@/context/language-context';
import { translations } from '@/lib/translations';
import { cn, toArabicNumerals } from '@/lib/utils';
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
    requestPermission,
  } = useQibla();

  useEffect(() => {
    if (permissionState === 'idle') {
      requestPermission();
    }
  }, [permissionState, requestPermission]);

  const renderContent = () => {
    if (error) {
      return (
        <Alert variant="destructive">
          <CircleAlert className="h-4 w-4" />
          <AlertTitle>{t.qiblaErrorTitle}</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      );
    }
    
    if (permissionState === 'denied') {
        return (
            <Alert variant="destructive">
                <CircleAlert className="h-4 w-4" />
                <AlertTitle>{t.permissionPromptTitle}</AlertTitle>
                <AlertDescription>{t.permissionNeeded}</AlertDescription>
                <Button onClick={requestPermission} className="mt-4">{t.grantPermission}</Button>
            </Alert>
        )
    }

    if (permissionState === 'prompt') {
        return (
             <Alert>
                <Compass className="h-4 w-4" />
                <AlertTitle>{t.permissionPromptTitle}</AlertTitle>
                <AlertDescription>{t.permissionPrompt}</AlertDescription>
            </Alert>
        )
    }

    if (isCalibrating || permissionState !== 'granted') {
      return (
        <Alert>
          <Compass className="h-4 w-4 animate-spin" />
          <AlertTitle>{t.calibratingTitle}</AlertTitle>
          <AlertDescription>{t.calibrating}</AlertDescription>
        </Alert>
      );
    }

    // Main Compass UI
    const rotation = 360 - compassHeading;
    const qiblaRelative = qiblaDirection - compassHeading;

    return (
      <div className="flex flex-col items-center justify-center space-y-6">
        <div
          className="relative w-64 h-64 rounded-full bg-card border-8 border-primary/20 shadow-inner flex items-center justify-center"
          style={{
            transform: `rotate(${rotation}deg)`,
            transition: 'transform 0.5s ease-out',
          }}
        >
          {/* Compass Markings */}
          {['N', 'E', 'S', 'W'].map((dir, i) => (
            <div
              key={dir}
              className="absolute w-full h-full flex justify-center"
              style={{ transform: `rotate(${i * 90}deg)` }}
            >
              <span
                className="text-2xl font-bold text-foreground"
                style={{ transform: `rotate(${-rotation}deg)` }}
              >
                {dir}
              </span>
            </div>
          ))}

          {/* Qibla Arrow */}
          <div
            className="absolute w-full h-full"
            style={{ transform: `rotate(${qiblaRelative}deg)` }}
          >
            <div className="absolute top-[-10px] left-1/2 -translate-x-1/2 w-0 h-0 border-l-[12px] border-l-transparent border-r-[12px] border-r-transparent border-b-[24px] border-b-primary"></div>
          </div>
        </div>

        <div className="text-center p-4 rounded-lg bg-card border shadow-sm">
            <p className="text-sm text-muted-foreground">{t.qiblaDirection}</p>
            <p className="text-4xl font-bold text-primary">
                {lang === 'ar' ? toArabicNumerals(Math.round(qiblaDirection)) : Math.round(qiblaDirection)}°
            </p>
        </div>
      </div>
    );
  };

  return <div className="w-full max-w-sm">{renderContent()}</div>;
}
