'use client';
import { useEffect } from 'react';
import { Compass, CircleAlert } from 'lucide-react';
import { useQibla, PermissionState } from '@/hooks/use-qibla';
import { useLanguage } from '@/context/language-context';
import { translations } from '@/lib/translations';
import { toArabicNumerals } from '@/lib/utils';
import { Button } from './ui/button';
import { Alert, AlertTitle, AlertDescription } from './ui/alert';
import CompassSvg from './compass-svg';

const KaabaIcon = () => (
  <svg
    width="32"
    height="32"
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path
      d="M16.09,18.55L12,22.64l-4.09-4.09c-3.13-3.13-3.13-8.21,0-11.34c3.13-3.13,8.21-3.13,11.34,0C19.22,10.34,19.22,15.42,16.09,18.55z"
      fill="#2c4c3b"
    />
    <path
      d="M12,12.25c-1.24,0-2.25-1.01-2.25-2.25S10.76,7.75,12,7.75s2.25,1.01,2.25,2.25S13.24,12.25,12,12.25z"
      fill="#F5F1E6"
    />
  </svg>
);


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

    const rotation = 360 - compassHeading;
    const qiblaRelative = qiblaDirection - compassHeading;

    return (
      <div className="flex flex-col items-center justify-center space-y-8">
        <div className="relative w-80 h-80 flex items-center justify-center">
            {/* Kaaba Icon at the top, pointing to the Qibla */}
            <div
              className="absolute z-10"
              style={{
                transform: `rotate(${qiblaRelative}deg) translateY(-145px)`,
                transformOrigin: 'center',
                transition: 'transform 0.5s ease-out',
              }}
            >
              <div style={{transform: `rotate(${-qiblaRelative}deg)`}}>
                <KaabaIcon />
              </div>
            </div>

            {/* The Compass SVG that rotates to keep North up */}
            <div
              className="absolute w-full h-full"
              style={{
                transform: `rotate(${rotation}deg)`,
                transition: 'transform 0.5s ease-out',
              }}
            >
              <CompassSvg rotation={rotation} />
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
