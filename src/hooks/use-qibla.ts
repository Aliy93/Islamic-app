'use client';
import { useState, useEffect, useCallback } from 'react';
import { useSettings } from '@/context/settings-context';
import { calculateQibla, getMagneticDeclination, smoothCompass } from '@/lib/qibla';

type PermissionState = 'prompt' | 'granted' | 'denied';

export function useQibla() {
  const { location, locationError } = useSettings();
  const [qiblaDirection, setQiblaDirection] = useState<number>(0);
  const [compassHeading, setCompassHeading] = useState<number>(0);
  const [declination, setDeclination] = useState<number>(0);
  const [permissionState, setPermissionState] = useState<PermissionState>('prompt');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const headingBuffer = useState<number[]>(() => [])[0];
  const [rawSensor, setRawSensor] = useState<{ alpha?: number | null; absolute?: boolean | null; webkit?: number | null }>({});
  const [isDetecting, setIsDetecting] = useState(false);

  const handleDeviceOrientation = useCallback((event: DeviceOrientationEvent) => {
    let heading: number | null = null;
    
    // For iOS devices
    if ('webkitCompassHeading' in event && event.webkitCompassHeading !== null) {
      heading = event.webkitCompassHeading;
    } 
    // For other devices
    else if (event.alpha !== null) {
        // Adjust for screen orientation when available
        const rawAlpha = event.alpha as number;
        const orientationAngle = (typeof window !== 'undefined' && (screen as any)?.orientation && typeof (screen as any).orientation.angle === 'number')
          ? (screen as any).orientation.angle
          : (typeof (window as any).orientation === 'number' ? (window as any).orientation : 0);

        // Many browsers report alpha as rotation clockwise from device reference.
        // Common normalization: heading = 360 - alpha, then adjust by screen orientation.
        let normalized = 360 - rawAlpha;
        normalized = (normalized + orientationAngle) % 360;
        heading = normalized;
    }

    if (heading !== null) {
      // NOTE: We do NOT correct for magnetic declination here.
      // The requirement is to point relative to MAGNETIC NORTH.
      const smoothedHeading = smoothCompass(heading, headingBuffer, 10);
      setCompassHeading(smoothedHeading);
      setRawSensor({ alpha: event.alpha, absolute: event.absolute ?? null, webkit: (event as any).webkitCompassHeading ?? null });
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

        // Attempt to fetch a more accurate magnetic declination (best-effort).
        (async () => {
          try {
            const url = `https://www.ngdc.noaa.gov/geomag-web/calculators/calculateDeclination?lat1=${location.latitude}&lon1=${location.longitude}&resultFormat=json`;
            const res = await fetch(url);
            if (res.ok) {
              const data = await res.json();
              let dec: number | null = null;
              if (Array.isArray(data.result) && data.result.length > 0 && typeof data.result[0].declination === 'number') {
                dec = data.result[0].declination;
              } else if (data.declination && typeof data.declination === 'number') {
                dec = data.declination;
              }
              if (dec === null) {
                dec = getMagneticDeclination(location.latitude, location.longitude);
              }
              setDeclination(dec);
              setQiblaDirection((direction - dec + 360) % 360);
            } else {
              const dec = getMagneticDeclination(location.latitude, location.longitude);
              setDeclination(dec);
              setQiblaDirection((direction - dec + 360) % 360);
            }
          } catch (e) {
            const dec = getMagneticDeclination(location.latitude, location.longitude);
            setDeclination(dec);
            setQiblaDirection((direction - dec + 360) % 360);
          } finally {
            setIsLoading(false);
          }
        })();
    } else {
        setIsLoading(true);
    }

    return () => {
      window.removeEventListener('deviceorientation', handleDeviceOrientation);
    };
  }, [location, handleDeviceOrientation]);
  
  // Calculate final rotation for the UI needle
  const qiblaRotation = (qiblaDirection - compassHeading + 360) % 360;

  // Manual/auto declination controls
  const setManualDeclination = useCallback((d: number) => {
    setDeclination(d);
    if (location) {
      setQiblaDirection((calculateQibla(location.latitude, location.longitude) - d + 360) % 360);
    }
  }, [location]);

  const autoDetectDeclination = useCallback(async () => {
    if (!location) {
      setError('Location not available for auto-detect');
      return;
    }
    try {
      const url = `https://www.ngdc.noaa.gov/geomag-web/calculators/calculateDeclination?lat1=${location.latitude}&lon1=${location.longitude}&resultFormat=json`;
      const res = await fetch(url);
      if (res.ok) {
        const data = await res.json();
        let dec: number | null = null;
        if (Array.isArray(data.result) && data.result.length > 0 && typeof data.result[0].declination === 'number') {
          dec = data.result[0].declination;
        } else if (data.declination && typeof data.declination === 'number') {
          dec = data.declination;
        }
        if (dec === null) dec = getMagneticDeclination(location.latitude, location.longitude);
        setDeclination(dec);
        setQiblaDirection((calculateQibla(location.latitude, location.longitude) - dec + 360) % 360);
        return;
      }
      // fallback to local approximation if network/API fails
      const dec = getMagneticDeclination(location.latitude, location.longitude);
      setDeclination(dec);
      setQiblaDirection((calculateQibla(location.latitude, location.longitude) - dec + 360) % 360);
    } catch (e: any) {
      // Do not treat declination fetch failure as fatal — use local fallback
      const dec = getMagneticDeclination(location.latitude, location.longitude);
      setDeclination(dec);
      setQiblaDirection((calculateQibla(location.latitude, location.longitude) - dec + 360) % 360);
    }
  }, [location]);
  // Attempt to detect magnetic north using device Magnetometer + Accelerometer (tilt compensated)
  const startMagneticAutoDetect = useCallback(async (options?: { samples?: number; frequency?: number }) => {
    const samplesTarget = options?.samples ?? 30;
    const freq = options?.frequency ?? 10;
    if (typeof window === 'undefined') return;

    setIsDetecting(true);

    const win: any = window;
    if (!('Magnetometer' in win) || !('Accelerometer' in win)) {
      // If Generic Sensor API is not available, fall back to DeviceOrientation sampling
      // as a best-effort estimate so the feature doesn't fail silently.
      try {
        const readings: number[] = [];
        let count = 0;
        const onDO = (ev: DeviceOrientationEvent) => {
          let heading: number | null = null;
          if ('webkitCompassHeading' in ev && (ev as any).webkitCompassHeading != null) {
            heading = (ev as any).webkitCompassHeading;
          } else if (ev.alpha != null) {
            const rawAlpha = ev.alpha as number;
            const orientationAngle = (typeof window !== 'undefined' && (screen as any)?.orientation && typeof (screen as any).orientation.angle === 'number')
              ? (screen as any).orientation.angle
              : (typeof (window as any).orientation === 'number' ? (window as any).orientation : 0);
            let normalized = 360 - rawAlpha;
            normalized = (normalized + orientationAngle) % 360;
            heading = normalized;
          }
          if (heading != null) {
            readings.push(heading);
            count++;
          }
          if (count >= (options?.samples ?? 30)) {
            window.removeEventListener('deviceorientation', onDO);
            const avg = readings.reduce((s, v) => s + v, 0) / readings.length;
            setCompassHeading(avg);
            setIsDetecting(false);
          }
        };
        window.addEventListener('deviceorientation', onDO as any);
        // safety timeout
        setTimeout(() => {
          try { window.removeEventListener('deviceorientation', onDO as any); } catch {}
          if (readings.length > 0) {
            const avg = readings.reduce((s, v) => s + v, 0) / readings.length;
            setCompassHeading(avg);
          } else {
            setError('DeviceOrientation unavailable for fallback detection.');
          }
          setIsDetecting(false);
        }, ((options?.samples ?? 30) * (1000 / (options?.frequency ?? 10))) + 2000);
      } catch (e: any) {
        setError('Magnetometer/Accelerometer not supported in this browser.');
        setIsDetecting(false);
      }
      return;
    }

    // Track detecting state
    let accel: any = null;
    let magnet: any = null;
    try {
      // Check permissions when available
      try {
        const perms = (navigator as any).permissions;
        if (perms && typeof perms.query === 'function') {
          try {
            const pm = await perms.query({ name: 'magnetometer' } as any);
            if (pm.state === 'denied') {
              setError('Magnetometer permission denied. Please enable sensor permissions.');
              return;
            }
          } catch {}
        }
      } catch {}

      accel = new win.Accelerometer({ frequency: freq });
      magnet = new win.Magnetometer({ frequency: freq });

      const readings: number[] = [];

      const onReading = () => {
        const ax = accel.x ?? 0;
        const ay = accel.y ?? 0;
        const az = accel.z ?? 0;
        const mx = magnet.x ?? 0;
        const my = magnet.y ?? 0;
        const mz = magnet.z ?? 0;

        // Compute roll and pitch from accelerometer
        const roll = Math.atan2(ay, az);
        const pitch = Math.atan2(-ax, Math.sqrt(ay * ay + az * az));

        // Tilt compensated magnetic sensor readings
        const Xh = mx * Math.cos(pitch) + mz * Math.sin(pitch);
        const Yh = mx * Math.sin(roll) * Math.sin(pitch) + my * Math.cos(roll) - mz * Math.sin(roll) * Math.cos(pitch);

        let heading = (Math.atan2(Yh, Xh) * 180) / Math.PI;
        heading = (heading + 360) % 360;

        readings.push(heading);

        if (readings.length >= samplesTarget) {
          const avg = readings.reduce((s, v) => s + v, 0) / readings.length;
          setCompassHeading(avg);
          try { magnet.removeEventListener('reading', onReading); } catch {}
          try { accel.removeEventListener('reading', onReading); } catch {}
          try { magnet.stop(); } catch {}
          try { accel.stop(); } catch {}
          setIsDetecting(false);
        }
      };

      magnet.addEventListener('reading', onReading);
      accel.addEventListener('reading', onReading);

      await accel.start();
      await magnet.start();
    } catch (e: any) {
      setError(`Magnetic auto-detect failed: ${e?.message ?? e}`);
      try { if (magnet && typeof magnet.stop === 'function') magnet.stop(); } catch {}
      try { if (accel && typeof accel.stop === 'function') accel.stop(); } catch {}
      setIsDetecting(false);
    }
  }, []);


  return {
    qiblaDirection,
    compassHeading,
    permissionState,
    requestPermission,
    error,
    isLoading: isLoading || (!location && !locationError),
    qiblaRotation,
    declination,
    setManualDeclination,
    autoDetectDeclination,
    rawSensor,
    startMagneticAutoDetect,
    isDetecting,
  };
}
