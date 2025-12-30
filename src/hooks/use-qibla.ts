
'use client';
import { useState, useEffect, useCallback } from 'react';
import { useSettings } from '@/context/settings-context';
import { calculateQiblaDirection, getMagneticDeclination, smoothValue } from '@/lib/qibla';

// --- Type Definitions ---
export type QiblaHook = {
  qiblaDirection: number;
  compassHeading: number;
  isCalibrating: boolean;
  permissionState: PermissionState;
  error: string | null;
  requestPermission: () => Promise<void>;
};

export type PermissionState = 'idle' | 'prompt' | 'granted' | 'denied';


// --- The Hook ---
export function useQibla(): QiblaHook {
  const { location, locationError, fetchAndSetLocation } = useSettings();
  
  // Qibla Direction (Bearing)
  const [qiblaDirection, setQiblaDirection] = useState(0); 
  
  // Raw and Smoothed Compass Heading
  const [compassHeading, setCompassHeading] = useState(0);
  const [smoothedHeading, setSmoothedHeading] = useState(0);

  // Status and Error States
  const [isCalibrating, setIsCalibrating] = useState(true);
  const [permissionState, setPermissionState] = useState<PermissionState>('idle');
  const [error, setError] = useState<string | null>(null);


  // --- 1. Calculate Qibla Direction ---
  useEffect(() => {
    if (location) {
      const qibla = calculateQiblaDirection(location.latitude, location.longitude);
      const declination = getMagneticDeclination(location.latitude, location.longitude);
      setQiblaDirection((qibla + declination + 360) % 360);
    } else if (locationError) {
      setError(locationError);
    }
  }, [location, locationError]);


  // --- 2. Handle Device Orientation Events ---
  const handleDeviceOrientation = useCallback((event: DeviceOrientationEvent) => {
    let heading = null;
    // For iOS 13+ devices
    if ((event as any).webkitCompassHeading) {
      heading = (event as any).webkitCompassHeading;
    }
    // For other browsers
    else if (event.alpha !== null) {
      // The alpha value is the compass direction in degrees, 0-360
      // We need to adjust it based on the screen orientation
      heading = (360 - event.alpha);
    }
    
    if (heading !== null) {
        setCompassHeading(heading);
        if(isCalibrating) {
            // After first successful reading, stop showing calibration message.
            setTimeout(() => setIsCalibrating(false), 2000); 
        }
    }
  }, [isCalibrating]);
  
  
  // --- 3. Request Sensor Permissions ---
  const requestPermission = useCallback(async () => {
    setError(null);
    setPermissionState('prompt');
    
    // Check if it's iOS 13+ which requires explicit permission
    if (typeof (DeviceOrientationEvent as any).requestPermission === 'function') {
      try {
        const status = await (DeviceOrientationEvent as any).requestPermission();
        if (status === 'granted') {
          setPermissionState('granted');
          window.addEventListener('deviceorientation', handleDeviceOrientation);
        } else {
          setPermissionState('denied');
          setError('Permission to access device orientation was denied.');
        }
      } catch (err) {
        setError('Error requesting device orientation permission.');
        setPermissionState('denied');
      }
    } else {
      // For other devices (Android, etc.), permission is usually handled by the browser automatically
      // or doesn't require a specific JS call. We assume it's granted and add the listener.
      setPermissionState('granted');
      window.addEventListener('deviceorientation', handleDeviceOrientation);
    }

    if (!location && !locationError) {
        fetchAndSetLocation();
    }
  }, [handleDeviceOrientation, location, locationError, fetchAndSetLocation]);

  // --- 4. Cleanup ---
  useEffect(() => {
    return () => {
      window.removeEventListener('deviceorientation', handleDeviceOrientation);
    };
  }, [handleDeviceOrientation]);

  // --- 5. Smoothing effect for the compass ---
  useEffect(() => {
    const animationFrameId = requestAnimationFrame(() => {
      setSmoothedHeading(prev => smoothValue(prev, compassHeading, 0.1));
    });
    return () => cancelAnimationFrame(animationFrameId);
  }, [compassHeading]);


  return {
    qiblaDirection,
    compassHeading: smoothedHeading,
    isCalibrating,
    permissionState,
    error,
    requestPermission,
  };
}
