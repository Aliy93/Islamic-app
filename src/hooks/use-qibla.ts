'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useSettings } from '@/context/settings-context';
import { calculateQibla, circularStdDevDeg, getMagneticDeclination, smoothCompass } from '@/lib/qibla';

type PermissionState = 'prompt' | 'granted' | 'denied';
type CompassSupport = 'generic-sensors' | 'deviceorientation' | 'none';

type PermissionResponse = 'granted' | 'denied';

type SensorCtor<T> = new (options?: { frequency?: number }) => T;

type VectorSensor = EventTarget & {
  x: number | null;
  y: number | null;
  z: number | null;
  start: () => void;
  stop: () => void;
  addEventListener: (type: 'reading', listener: () => void) => void;
  removeEventListener: (type: 'reading', listener: () => void) => void;
};

type WindowWithSensors = {
  Accelerometer?: SensorCtor<VectorSensor>;
  Magnetometer?: SensorCtor<VectorSensor>;
};

type DeviceOrientationEventWithPermission = typeof DeviceOrientationEvent & {
  requestPermission?: () => Promise<PermissionResponse>;
};

function getScreenOrientationAngle(): number {
  if (typeof window === 'undefined') return 0;
  if (screen.orientation && typeof screen.orientation.angle === 'number') return screen.orientation.angle;
  const legacy = (window as unknown as { orientation?: number }).orientation;
  return typeof legacy === 'number' ? legacy : 0;
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
    const win = window as unknown as WindowWithSensors;
    const hasGeneric = typeof win.Magnetometer !== 'undefined' && typeof win.Accelerometer !== 'undefined';
    const hasDO = typeof window.DeviceOrientationEvent !== 'undefined';

    // Prefer Generic Sensor API when present, but keep a fallback to DeviceOrientation.
    fallbackSupportRef.current = hasGeneric && hasDO ? 'deviceorientation' : 'none';
    setSupport(hasGeneric ? 'generic-sensors' : hasDO ? 'deviceorientation' : 'none');

    // On most browsers, there is no explicit permission prompt for orientation.
    // iOS Safari requires a user gesture via DeviceOrientationEvent.requestPermission().
    const doe = DeviceOrientationEvent as unknown as DeviceOrientationEventWithPermission;
    const needsExplicitPermission = typeof doe.requestPermission === 'function';
    setPermissionState((prev) => (prev === 'prompt' && !needsExplicitPermission ? 'granted' : prev));
  }, []);

  const requestPermission = useCallback(async () => {
    setError(null);
    try {
      const doe = DeviceOrientationEvent as unknown as DeviceOrientationEventWithPermission;
      // iOS requires a user gesture to request DeviceOrientation permission.
      if (typeof doe.requestPermission === 'function') {
        const response = await doe.requestPermission();
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
    } catch (e: unknown) {
      setPermissionState('denied');
      const message = e instanceof Error ? e.message : String(e);
      setError(`Permission error: ${message}`);
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
      const win = window as unknown as WindowWithSensors;
      if (!win.Accelerometer || !win.Magnetometer) {
        throw new Error('Generic sensors are not available on this device.');
      }

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
        accel.start();
        magnet.start();
      } catch (e: unknown) {
        throw e;
      }
    };

    const startDeviceOrientation = () => {
      const onDO = (event: DeviceOrientationEvent) => {
        if (cancelled) return;
        let heading: number | null = null;

        // iOS magnetic heading
        const webkitCompassHeading = (event as unknown as { webkitCompassHeading?: number }).webkitCompassHeading;
        if (typeof webkitCompassHeading === 'number') {
          heading = webkitCompassHeading;
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

      const eventName: 'deviceorientationabsolute' | 'deviceorientation' =
        'ondeviceorientationabsolute' in window ? 'deviceorientationabsolute' : 'deviceorientation';

      window.addEventListener(eventName, onDO as unknown as EventListener);
      cleanupFns.push(() => window.removeEventListener(eventName, onDO as unknown as EventListener));
    };

    (async () => {
      try {
        if (support === 'generic-sensors') {
          try {
            await startGenericSensors();
          } catch (e: unknown) {
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
      } catch (e: unknown) {
        if (cancelled) return;
        const message = e instanceof Error ? e.message : String(e);
        setError(`Compass unavailable: ${message}`);
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
