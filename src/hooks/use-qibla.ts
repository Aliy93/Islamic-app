'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useSettings } from '@/context/settings-context';
import { calculateQibla, circularStdDevDeg, getMagneticDeclination, smoothCompass } from '@/lib/qibla';

type PermissionState = 'prompt' | 'granted' | 'denied';
type CompassSupport = 'generic-sensors' | 'deviceorientation' | 'none';

function getScreenOrientationAngle(): number {
  try {
    const s: any = screen as any;
    if (s?.orientation && typeof s.orientation.angle === 'number') return s.orientation.angle;
    const w: any = window as any;
    if (typeof w.orientation === 'number') return w.orientation;
  } catch {}
  return 0;
}

function normalizeDeg(deg: number): number {
  return (deg % 360 + 360) % 360;
}

export function useQibla() {
  const { location, locationError } = useSettings();
  const [permissionState, setPermissionState] = useState<PermissionState>('prompt');
  const [error, setError] = useState<string | null>(null);
  const [support, setSupport] = useState<CompassSupport>('none');
  const [deviceHeadingMagneticNorth, setDeviceHeadingMagneticNorth] = useState<number>(0);
  const [isCompassActive, setIsCompassActive] = useState(false);
  const [needsCalibration, setNeedsCalibration] = useState(false);

  const fallbackSupportRef = useRef<CompassSupport>('none');

  const headingBufferRef = useRef<number[]>([]);
  const stabilityBufferRef = useRef<number[]>([]);

  const qiblaBearingTrueNorth = useMemo(() => {
    if (!location) return 0;
    return calculateQibla(location.latitude, location.longitude);
  }, [location]);

  const magneticDeclination = useMemo(() => {
    if (!location) return 0;
    return getMagneticDeclination(location.latitude, location.longitude);
  }, [location]);

  // Per spec:
  // ArrowRotation = (QiblaBearingTrueNorth - DeviceHeadingMagneticNorth - MagneticDeclination + 360) % 360
  const arrowRotation = useMemo(() => {
    return normalizeDeg(qiblaBearingTrueNorth - deviceHeadingMagneticNorth - magneticDeclination);
  }, [qiblaBearingTrueNorth, deviceHeadingMagneticNorth, magneticDeclination]);

  const setHeading = useCallback((headingMagneticDeg: number) => {
    const smoothed = smoothCompass(headingMagneticDeg, headingBufferRef.current, 12);
    setDeviceHeadingMagneticNorth(smoothed);
    setIsCompassActive(true);

    const buf = stabilityBufferRef.current;
    buf.push(smoothed);
    if (buf.length > 25) buf.shift();
    const std = circularStdDevDeg(buf);
    // Heuristic: show calibration when readings are unstable/noisy
    setNeedsCalibration(buf.length < 8 || std > 18);
  }, []);

  // Detect which compass sources are available
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const win: any = window;
    const hasGeneric = 'Magnetometer' in win && 'Accelerometer' in win;
    const hasDO = typeof win.DeviceOrientationEvent !== 'undefined';

    // Prefer Generic Sensor API when present, but keep a fallback to DeviceOrientation.
    fallbackSupportRef.current = hasGeneric && hasDO ? 'deviceorientation' : 'none';
    setSupport(hasGeneric ? 'generic-sensors' : hasDO ? 'deviceorientation' : 'none');

    // On most browsers, there is no explicit permission prompt for orientation.
    // iOS Safari requires a user gesture via DeviceOrientationEvent.requestPermission().
    const needsExplicitPermission = typeof (win.DeviceOrientationEvent as any)?.requestPermission === 'function';
    setPermissionState((prev) => (prev === 'prompt' && !needsExplicitPermission ? 'granted' : prev));
  }, []);

  const requestPermission = useCallback(async () => {
    setError(null);
    try {
      // iOS requires a user gesture to request DeviceOrientation permission.
      if (typeof (DeviceOrientationEvent as any)?.requestPermission === 'function') {
        const response = await (DeviceOrientationEvent as any).requestPermission();
        if (response === 'granted') {
          setPermissionState('granted');
        } else {
          setPermissionState('denied');
          setError('Permission to access device orientation was denied.');
        }
        return;
      }

      // Other browsers: permissions are handled by the browser automatically.
      setPermissionState('granted');
    } catch (e: any) {
      setPermissionState('denied');
      setError(`Permission error: ${e?.message ?? e}`);
    }
  }, []);

  // Start live compass when permission granted
  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (permissionState !== 'granted') return;
    if (support === 'none') return;

    let cancelled = false;
    setIsCompassActive(false);

    // Reset stability buffers on start
    headingBufferRef.current = [];
    stabilityBufferRef.current = [];

    const cleanupFns: Array<() => void> = [];

    const startGenericSensors = async () => {
      const win: any = window;
      const accel = new win.Accelerometer({ frequency: 30 });
      const magnet = new win.Magnetometer({ frequency: 30 });

      const onReading = () => {
        if (cancelled) return;

        const ax = accel.x ?? 0;
        const ay = accel.y ?? 0;
        const az = accel.z ?? 0;
        const mx = magnet.x ?? 0;
        const my = magnet.y ?? 0;
        const mz = magnet.z ?? 0;

        // roll/pitch from gravity
        const roll = Math.atan2(ay, az);
        const pitch = Math.atan2(-ax, Math.sqrt(ay * ay + az * az));

        // tilt-compensated magnetometer
        const Xh = mx * Math.cos(pitch) + mz * Math.sin(pitch);
        const Yh = mx * Math.sin(roll) * Math.sin(pitch) + my * Math.cos(roll) - mz * Math.sin(roll) * Math.cos(pitch);

        // Heading relative to magnetic north
        let heading = (Math.atan2(Yh, Xh) * 180) / Math.PI;
        heading = normalizeDeg(heading);

        // Adjust to screen orientation
        heading = normalizeDeg(heading + getScreenOrientationAngle());

        setHeading(heading);
      };

      magnet.addEventListener('reading', onReading);
      accel.addEventListener('reading', onReading);

      cleanupFns.push(() => {
        try { magnet.removeEventListener('reading', onReading); } catch {}
        try { accel.removeEventListener('reading', onReading); } catch {}
        try { magnet.stop(); } catch {}
        try { accel.stop(); } catch {}
      });

      try {
        await accel.start();
        await magnet.start();
      } catch (e: any) {
        throw e;
      }
    };

    const startDeviceOrientation = () => {
      const onDO = (event: DeviceOrientationEvent) => {
        if (cancelled) return;
        let heading: number | null = null;

        // iOS magnetic heading
        if ('webkitCompassHeading' in event && (event as any).webkitCompassHeading != null) {
          heading = (event as any).webkitCompassHeading;
        } else if (event.alpha != null) {
          // Best-effort: alpha is not reliably magnetic-north-referenced across all browsers.
          // We treat it as a heading-like value when it's the only option.
          heading = normalizeDeg(360 - (event.alpha as number));
        }

        if (heading != null) {
          heading = normalizeDeg(heading + getScreenOrientationAngle());
          setHeading(heading);
        }
      };

      const win: any = window;
      const eventName = 'ondeviceorientationabsolute' in win ? 'deviceorientationabsolute' : 'deviceorientation';
      window.addEventListener(eventName, onDO as any);
      cleanupFns.push(() => window.removeEventListener(eventName, onDO as any));
    };

    (async () => {
      try {
        if (support === 'generic-sensors') {
          try {
            await startGenericSensors();
          } catch (e: any) {
            // If Generic Sensors are blocked/unavailable (common on desktop and some mobile browsers),
            // fall back to DeviceOrientation when possible.
            if (fallbackSupportRef.current === 'deviceorientation') {
              setSupport('deviceorientation');
              return;
            }
            throw e;
          }
        } else {
          startDeviceOrientation();
        }
      } catch (e: any) {
        if (cancelled) return;
        setError(`Compass unavailable: ${e?.message ?? e}`);
        setPermissionState('denied');
      }
    })();

    return () => {
      cancelled = true;
      cleanupFns.forEach((fn) => {
        try { fn(); } catch {}
      });
    };
  }, [permissionState, support, setHeading]);

  return {
    qiblaBearingTrueNorth,
    magneticDeclination,
    deviceHeadingMagneticNorth,
    arrowRotation,
    needsCalibration,
    isCompassActive,
    isSupported: support !== 'none',
    support,
    permissionState,
    requestPermission,
    error,
    isLoading: !location && !locationError,
    locationError,
  };
}
