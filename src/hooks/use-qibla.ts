'use client';
import { useState, useEffect, useCallback } from 'react';
import { useSettings } from '@/context/settings-context';
import { calculateQibla, getMagneticDeclination, smoothCompass } from '@/lib/qibla';

type PermissionState = 'prompt' | 'granted' | 'denied';

export function useQibla() {
  const { location, locationError } = useSettings();
  const [qiblaDirection, setQiblaDirection] = useState<number>(0);
  const [compassHeading, setCompassHeading] = useState<number>(0);
  const [permissionState, setPermissionState] = useState<PermissionState>('prompt');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const headingBuffer = useState<number[]>(() => [])[0];

  const handleDeviceOrientation = useCallback((event: DeviceOrientationEvent) => {
    let heading: number | null = null;
    
    // For iOS devices
    if ('webkitCompassHeading' in event && event.webkitCompassHeading !== null) {
      heading = event.webkitCompassHeading;
    } 
    // For other devices
    else if (event.alpha !== null) {
        if (event.absolute) {
            heading = 360 - event.alpha;
        } else {
             heading = event.alpha;
        }
    }

    if (heading !== null) {
      // NOTE: We do NOT correct for magnetic declination here.
      // The requirement is to point relative to MAGNETIC NORTH.
      const smoothedHeading = smoothCompass(heading, headingBuffer, 10);
      setCompassHeading(smoothedHeading);
    }
  }, [headingBuffer]);

  const requestPermission = useCallback(async () => {
    if (typeof (DeviceOrientationEvent as any).requestPermission === 'function') {
      try {
        const response = await (DeviceOrientationEvent as any).requestPermission();
        if (response === 'granted') {
          setPermissionState('granted');
          window.addEventListener('deviceorientation', handleDeviceOrientation);
        } else {
          setPermissionState('denied');
          setError("Permission to access device orientation was denied.");
        }
      } catch (e: any) {
        setError(`Error requesting permission: ${e.message}`);
        setPermissionState('denied');
      }
    } else {
      // For non-iOS 13+ browsers
      setPermissionState('granted');
      window.addEventListener('deviceorientation', handleDeviceOrientation);
    }
  }, [handleDeviceOrientation]);

  useEffect(() => {
    if(location) {
        const direction = calculateQibla(location.latitude, location.longitude);
        const declination = getMagneticDeclination(location.latitude, location.longitude);
        const magneticQibla = (direction - declination + 360) % 360;
        setQiblaDirection(magneticQibla);
        setIsLoading(false);
    } else {
        setIsLoading(true);
    }

    return () => {
      window.removeEventListener('deviceorientation', handleDeviceOrientation);
    };
  }, [location, handleDeviceOrientation]);
  
  // Calculate final rotation for the UI needle
  const qiblaRotation = (qiblaDirection - compassHeading + 360) % 360;

  return {
    qiblaDirection,
    compassHeading,
    permissionState,
    requestPermission,
    error,
    isLoading: isLoading || (!location && !locationError),
    qiblaRotation,
  };
}
