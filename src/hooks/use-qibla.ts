'use client';
import { useState, useEffect, useCallback } from 'react';
import { useSettings } from '@/context/settings-context';
import { calculateQibla, getMagneticDeclination, smoothCompass } from '@/lib/qibla';

type PermissionState = 'prompt' | 'granted' | 'denied';

export function useQibla() {
  const { location } = useSettings();
  const [qiblaDirection, setQiblaDirection] = useState<number>(0);
  const [compassHeading, setCompassHeading] = useState<number>(0);
  const [permissionState, setPermissionState] = useState<PermissionState>('prompt');
  const [error, setError] = useState<string | null>(null);

  const headingBuffer = useState<number[]>(() => [])[0];

  const handleDeviceOrientation = useCallback((event: DeviceOrientationEvent) => {
    let heading: number | null = null;
    
    // For iOS devices
    if ('webkitCompassHeading' in event && event.webkitCompassHeading !== null) {
      heading = event.webkitCompassHeading;
    } 
    // For other devices
    else if (event.alpha !== null) {
        // The `alpha` value is the rotation around the z-axis, reported in degrees (0-360).
        // It's often relative to the initial orientation, so we must check `absolute`.
        if (event.absolute) {
            heading = 360 - event.alpha;
        } else {
             // For non-absolute orientation, this is trickier.
             // Often, `alpha` gives the compass heading directly on Android.
             heading = event.alpha;
        }
    }

    if (heading !== null) {
      const declination = location ? getMagneticDeclination(location.latitude, location.longitude) : 0;
      const trueHeading = (heading + declination + 360) % 360;
      const smoothedHeading = smoothCompass(trueHeading, headingBuffer, 10);
      setCompassHeading(smoothedHeading);
    }
  }, [location, headingBuffer]);

  const requestPermission = useCallback(async () => {
    // For iOS 13+
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
    if (location) {
      const direction = calculateQibla(location.latitude, location.longitude);
      setQiblaDirection(direction);
    }

    return () => {
      window.removeEventListener('deviceorientation', handleDeviceOrientation);
    };
  }, [location, handleDeviceOrientation]);

  const compassRotation = 360 - compassHeading;
  const qiblaRotation = (qiblaDirection - compassHeading + 360) % 360;

  return {
    qiblaDirection,
    compassHeading,
    permissionState,
    requestPermission,
    error,
    isLoading: !location && permissionState !== 'denied',
    compassRotation,
    qiblaRotation,
  };
}
