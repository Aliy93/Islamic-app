'use client';
import { useState, useEffect, useCallback } from 'react';
import { Compass } from 'lucide-react';
import { calculateQiblaDirection } from '@/lib/qibla';
import { useLanguage } from '@/context/language-context';
import { useSettings } from '@/context/settings-context';
import { translations } from '@/lib/translations';
import { Alert, AlertDescription, AlertTitle } from './ui/alert';
import { Button } from './ui/button';
import { toArabicNumerals } from '@/lib/utils';
import { Skeleton } from './ui/skeleton';

type PermissionState = 'granted' | 'denied' | 'prompt';

export default function QiblaCompass() {
  const { lang } = useLanguage();
  const t = translations[lang];
  const { location, locationError: settingsLocationError, fetchAndSetLocation } = useSettings();

  const [qiblaDirection, setQiblaDirection] = useState<number>(0);
  const [heading, setHeading] = useState<number | null>(null);
  const [permissionState, setPermissionState] = useState<PermissionState>('prompt');
  const [isCalibrating, setIsCalibrating] = useState(true);

  const handleOrientation = useCallback((event: DeviceOrientationEvent) => {
    const compassHeading = (event as any).webkitCompassHeading ?? event.alpha;
    if (compassHeading !== null) {
      setHeading(compassHeading);
      if (isCalibrating) {
        setIsCalibrating(false);
      }
    }
  }, [isCalibrating]);
  
  const requestPermission = useCallback(async () => {
    if (typeof (DeviceOrientationEvent as any).requestPermission !== 'function') {
      // For non-iOS 13+ browsers
      setPermissionState('granted');
      return;
    }

    try {
      const state: PermissionState = await (DeviceOrientationEvent as any).requestPermission();
      setPermissionState(state);
    } catch (error) {
      console.error(error);
      setPermissionState('denied');
    }
  }, []);

  useEffect(() => {
    if (permissionState === 'granted') {
      window.addEventListener('deviceorientation', handleOrientation);
      // Fetch location only after permission is granted
      fetchAndSetLocation();
    }
    
    return () => {
      window.removeEventListener('deviceorientation', handleOrientation);
    };
  }, [permissionState, handleOrientation, fetchAndSetLocation]);

  useEffect(() => {
    if (location) {
      const qibla = calculateQiblaDirection(location.latitude, location.longitude);
      setQiblaDirection(qibla);
    }
  }, [location]);

  const compassRotation = heading !== null ? 360 - heading : 0;
  const qiblaPointerRotation = heading !== null ? qiblaDirection - heading : qiblaDirection;

  if (settingsLocationError) {
    return (
      <Alert variant="destructive">
        <AlertTitle>{t.locationNeeded}</AlertTitle>
        <AlertDescription>
          {settingsLocationError}
           <Button onClick={fetchAndSetLocation} className="mt-4">Try Again</Button>
        </AlertDescription>
      </Alert>
    );
  }
  
  if (permissionState === 'denied') {
    return (
        <Alert variant="destructive">
            <AlertTitle>Permission Denied</AlertTitle>
            <AlertDescription>Compass permission was denied. Please enable it in your browser settings.</AlertDescription>
            <Button onClick={requestPermission} className="mt-4">Request Permission</Button>
        </Alert>
    )
  }

  if (permissionState === 'prompt') {
     return (
        <div className="text-center space-y-4 p-4">
            <p className="font-body">{t.permissionNeeded}</p>
            <Button onClick={requestPermission}>{t.grantPermission}</Button>
        </div>
    );
  }

  if (isCalibrating || heading === null || !location) {
      return (
        <div className="flex flex-col items-center justify-center space-y-4 text-center">
            <Skeleton className="w-64 h-64 rounded-full" />
            <div className="space-y-2">
                <Skeleton className="h-6 w-40" />
                <Skeleton className="h-10 w-24 mx-auto" />
            </div>
            <p className="font-body animate-pulse">
                {!location ? 'Getting location...' : t.calibrating}
            </p>
        </div>
      )
  }


  return (
    <div className="flex flex-col items-center justify-center space-y-6">
      <div
        className="relative w-64 h-64 rounded-full bg-card border-8 border-primary/20 flex items-center justify-center transition-transform duration-500"
        style={{ transform: `rotate(${compassRotation}deg)` }}
      >
        {/* Compass markings */}
        <div className="absolute w-full h-full font-headline">
            <div className="absolute top-0 left-1/2 -translate-x-1/2 -mt-7 text-xl font-bold text-primary">N</div>
            <div className="absolute bottom-0 left-1/2 -translate-x-1/2 -mb-7 text-xl font-bold">S</div>
            <div className="absolute left-0 top-1/2 -translate-y-1/2 -ml-7 text-xl font-bold">W</div>
            <div className="absolute right-0 top-1/2 -translate-y-1/2 -mr-7 text-xl font-bold">E</div>
        </div>

        {/* Qibla Pointer */}
        <div
          className="absolute w-full h-full"
          style={{ transform: `rotate(${qiblaPointerRotation}deg)` }}
        >
          <div className="absolute top-[-24px] left-1/2 -translate-x-1/2 w-0 h-0
            border-l-[12px] border-l-transparent
            border-r-[12px] border-r-transparent
            border-b-[24px] border-b-primary">
          </div>
        </div>

        <div className="w-4 h-4 rounded-full bg-primary z-10"></div>
      </div>
      
       <div className="text-center">
            <p className="text-muted-foreground font-body">{lang === 'ar' ? 'اتجاه القبلة' : 'Qibla Direction'}</p>
            <p className="text-2xl font-bold font-code text-primary">{lang === 'ar' ? toArabicNumerals(qiblaDirection.toFixed(0)) : qiblaDirection.toFixed(0)}°</p>
       </div>
    </div>
  );
}
