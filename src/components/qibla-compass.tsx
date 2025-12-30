'use client';

import { useQibla } from '@/hooks/use-qibla';
import { useLanguage } from '@/context/language-context';
import { translations } from '@/lib/translations';
import { Button } from '@/components/ui/button';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { Compass, Zap, Ban, Navigation } from 'lucide-react';
import { toArabicNumerals } from '@/lib/utils';
import { useSettings } from '@/context/settings-context';
import { useEffect } from 'react';

// Kaaba SVG Icon
const KaabaIcon = () => (
  <svg
    width="48"
    height="48"
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-full text-primary"
  >
    <path
      d="M3.75 3.75L12 2L20.25 3.75L12 5.5L3.75 3.75Z"
      fill="currentColor"
      stroke="hsl(var(--foreground))"
      strokeWidth="1"
      strokeLinejoin="round"
    />
    <path
      d="M3.75 3.75V17.25L12 22L20.25 17.25V3.75"
      stroke="hsl(var(--foreground))"
      strokeWidth="1"
      strokeLinejoin="round"
    />
    <path d="M20.25 3.75L12 5.5L3.75 3.75" stroke="hsl(var(--foreground))" strokeWidth="1" strokeLinejoin="round" />
    <path d="M12 22V5.5" stroke="hsl(var(--foreground))" strokeWidth="1" strokeLinejoin="round" />
  </svg>
);

// North Needle SVG
const NorthNeedle = ({ rotation }: { rotation: number }) => (
  <div
    className="absolute inset-0 flex items-center justify-center transition-transform duration-200 ease-in-out"
    style={{ transform: `rotate(${rotation}deg)` }}
  >
    <div className="relative w-4 h-64">
      {/* Red part (North) */}
      <div
        className="absolute top-0 left-1/2 -translate-x-1/2 w-0 h-0"
        style={{
          borderLeft: '8px solid transparent',
          borderRight: '8px solid transparent',
          borderBottom: '96px solid #D32F2F', // Red color for North
        }}
      ></div>
       {/* White part (South) */}
       <div
        className="absolute bottom-0 left-1/2 -translate-x-1/2 w-0 h-0"
        style={{
          borderLeft: '8px solid transparent',
          borderRight: '8px solid transparent',
          borderTop: '96px solid #F5F5F5', // Light gray/white for South
        }}
      ></div>
    </div>
  </div>
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
    qiblaRotation,
    compassHeading,
  } = useQibla();

  const t = translations[lang];

  useEffect(() => {
    if (!location && !locationError) {
      fetchAndSetLocation();
    }
  }, [location, locationError, fetchAndSetLocation]);

  const renderContent = () => {
    if (isLoading) {
      return (
        <div className="text-center space-y-2 text-primary">
          <Compass className="w-12 h-12 mx-auto animate-pulse" />
          <p className="font-semibold">
            {t.loading}
          </p>
        </div>
      );
    }

    if (locationError && !location) {
      return (
        <Alert variant="destructive">
          <Ban className="w-4 h-4" />
          <AlertTitle>{t.locationNeeded}</AlertTitle>
          <AlertDescription>
            {locationError} {t.locationNeededMsg}
          </AlertDescription>
        </Alert>
      );
    }

    if (qiblaError || permissionState === 'denied') {
      return (
        <Alert variant="destructive">
          <Ban className="w-4 h-4" />
          <AlertTitle>{t.qiblaErrorTitle}</AlertTitle>
          <AlertDescription>{t.permissionNeeded}</AlertDescription>
        </Alert>
      );
    }

    if (permissionState === 'prompt') {
      return (
        <Alert>
          <Zap className="w-4 h-4" />
          <AlertTitle>{t.permissionPromptTitle}</AlertTitle>
          <AlertDescription>{t.permissionPrompt}</AlertDescription>
          <Button onClick={requestPermission} className="mt-4 w-full">
            {t.grantPermission}
          </Button>
        </Alert>
      );
    }

    return (
      <div className="flex flex-col items-center justify-center gap-6">
        <div className="relative w-80 h-80">
          <div
            className="relative w-full h-full rounded-full transition-transform duration-200 ease-in-out"
          >
            {/* Outer Ticks */}
            {Array.from({ length: 120 }).map((_, i) => (
              <div
                key={i}
                className="absolute top-0 left-1/2 h-full w-px -translate-x-1/2"
                style={{ transform: `rotate(${i * 3}deg)` }}
              >
                <div
                  className={`mx-auto bg-primary ${i % 15 === 0 ? 'h-5 w-0.5' : 'h-3 w-px'}`}
                ></div>
              </div>
            ))}

            {/* Cardinal Directions */}
            <span
              className="absolute top-6 left-1/2 -translate-x-1/2 font-bold text-xl text-primary"
            >
              N
            </span>
            <span
              className="absolute bottom-6 left-1/2 -translate-x-1/2 font-bold text-xl text-primary"
            >
              S
            </span>
            <span
              className="absolute left-6 top-1/2 -translate-y-1/2 font-bold text-xl text-primary"
            >
              W
            </span>
            <span
              className="absolute right-6 top-1/2 -translate-y-1/2 font-bold text-xl text-primary"
            >
              E
            </span>
          </div>

          {/* North-pointing Needle */}
          <NorthNeedle rotation={-compassHeading} />
          
          {/* Qibla Direction Indicator */}
          <div
            className="absolute inset-0 flex items-center justify-center transition-transform duration-200 ease-in-out"
            style={{ transform: `rotate(${qiblaDirection}deg)` }}
          >
            <div className="relative w-4 h-64">
              <KaabaIcon />
            </div>
          </div>
          
           {/* Pivot Point */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-4 h-4 rounded-full bg-primary z-10 border-2 border-primary-foreground"></div>


        </div>

        <div className="text-center text-primary">
          <h2 className="text-lg font-semibold">
            {t.qiblaDirection}
          </h2>
          <p className="text-5xl font-bold">
            {lang === 'ar' ? toArabicNumerals(qiblaDirection.toFixed(0)) : qiblaDirection.toFixed(0)}°
          </p>
        </div>
      </div>
    );
  };

  return <>{renderContent()}</>;
}
