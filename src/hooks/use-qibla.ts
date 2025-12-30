
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
  const { location, locationError } = useSettings();
  
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
      // Adjust Qibla direction by magnetic declination to align with compass's magnetic north
      setQiblaDirection(qibla + declination);
    } else if (locationError) {
      setError(locationError);
    }
  }, [location, locationError]);


  // --- 2. Handle Device Orientation Events ---
  const handleDeviceOrientation = useCallback((event: DeviceOrientationEvent) => {
    // For iOS 13+ devices
    if ((event as any).webkitCompassHeading) {
      const heading = (event as any).webkitCompassHeading;
      setCompassHeading(heading);
      if (isCalibrating) setIsCalibrating(false);
      return;
    }
    
    // For other browsers
    if (event.alpha !== null) {
      const heading = 360 - event.alpha;
      setCompassHeading(heading);
      if (isCalibrating) setIsCalibrating(false);
    }
  }, [isCalibrating]);
  
  
  // --- 3. Request Sensor Permissions ---
  const requestPermission = useCallback(async () => {
    // Check if it's iOS 13+
    if (typeof (DeviceOrientationEvent as any).requestPermission === 'function') {
      try {
        setPermissionState('prompt');
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
      // For non-iOS 13+ devices, permission is usually granted by default or on page load
      setPermissionState('granted');
      window.addEventListener('deviceorientation', handleDeviceOrientation);
    }
  }, [handleDeviceOrientation]);

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

/**
 * React Native / Expo Notes:
 * 
 * 1.  **Dependencies**: `expo install expo-sensors`
 * 2.  **Permissions**: Add ` "ios": { "infoPlist": { "NSMotionUsageDescription": "..." } } ` to `app.json`.
 * 3.  **Usage**:
 *     ```javascript
 *     import { Magnetometer } from 'expo-sensors';
 * 
 *     useEffect(() => {
 *       Magnetometer.setUpdateInterval(100);
 *       const subscription = Magnetometer.addListener(data => {
 *         if (data) {
 *           const { x, y } = data;
 *           let angle = Math.atan2(y, x);
 *           let heading = (angle * 180) / Math.PI - 90;
 *           if (heading < 0) {
 *             heading += 360;
 *           }
 *           setCompassHeading(heading);
 *         }
 *       });
 *       return () => subscription.remove();
 *     }, []);
 *     ```
 * 4.  **Qibla Logic**: The `calculateQiblaDirection` and `getMagneticDeclination` functions
 *     from `src/lib/qibla.ts` can be used directly in your React Native project.
 */
