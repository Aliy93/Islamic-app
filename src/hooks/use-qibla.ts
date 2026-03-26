'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useSettings } from '@/context/settings-context';
import { calculateQibla, circularStdDevDeg, smoothCompass } from '@/lib/qibla';

type PermissionState = 'prompt' | 'granted' | 'denied';
type CompassSupport = 'generic-sensors' | 'deviceorientation' | 'none';
type HeadingReference = 'magnetic' | 'true' | 'unknown';

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

const DECLINATION_CACHE_PREFIX = 'qiblaDeclination:';
const DECLINATION_CACHE_TTL_MS = 1000 * 60 * 60 * 24 * 30;

function buildDeclinationCacheKey(latitude: number, longitude: number) {
  return `${DECLINATION_CACHE_PREFIX}${latitude.toFixed(3)},${longitude.toFixed(3)}`;
}

function readCachedDeclination(cacheKey: string) {
  if (typeof window === 'undefined') return null;

  const rawValue = window.localStorage.getItem(cacheKey);
  if (!rawValue) return null;

  try {
    const parsed = JSON.parse(rawValue) as { declination?: unknown; expiresAt?: unknown };
    const declination = typeof parsed.declination === 'number' ? parsed.declination : null;
    const expiresAt = typeof parsed.expiresAt === 'number' ? parsed.expiresAt : null;

    if (declination === null || expiresAt === null || expiresAt <= Date.now()) {
      window.localStorage.removeItem(cacheKey);
      return null;
    }

    return declination;
  } catch {
    window.localStorage.removeItem(cacheKey);
    return null;
  }
}

function writeCachedDeclination(cacheKey: string, declination: number) {
  if (typeof window === 'undefined') return;

  window.localStorage.setItem(
    cacheKey,
    JSON.stringify({
      declination,
      expiresAt: Date.now() + DECLINATION_CACHE_TTL_MS,
    })
  );
}

export function useQibla() {
  const { location, locationError } = useSettings();
  const [permissionState, setPermissionState] = useState<PermissionState>('prompt');
  const [error, setError] = useState<string | null>(null);
  const [support, setSupport] = useState<CompassSupport>('none');
  const [deviceHeading, setDeviceHeading] = useState<number>(0);
  const [headingReference, setHeadingReference] = useState<HeadingReference>('unknown');
  const [magneticDeclination, setMagneticDeclination] = useState<number>(0);
  const [isCompassActive, setIsCompassActive] = useState(false);
  const [needsCalibration, setNeedsCalibration] = useState(false);
  const [compassAccuracy, setCompassAccuracy] = useState<number | null>(null);
  const [isPageVisible, setIsPageVisible] = useState(true);

  const fallbackSupportRef = useRef<CompassSupport>('none');

  const headingBufferRef = useRef<number[]>([]);
  const stabilityBufferRef = useRef<number[]>([]);

  const qiblaBearingTrueNorth = useMemo(() => {
    if (!location) return 0;
    return calculateQibla(location.latitude, location.longitude);
  }, [location]);

  useEffect(() => {
    if (!location) {
      setMagneticDeclination(0);
      return;
    }

    const cacheKey = buildDeclinationCacheKey(location.latitude, location.longitude);
    const cachedDeclination = readCachedDeclination(cacheKey);

    if (cachedDeclination !== null) {
      setMagneticDeclination(cachedDeclination);
      return;
    }

    let cancelled = false;
    const abortController = new AbortController();

    const loadDeclination = async () => {
      try {
        const url = new URL('/api/declination', window.location.origin);
        url.searchParams.set('lat', location.latitude.toString());
        url.searchParams.set('lon', location.longitude.toString());

        const response = await fetch(url, {
          cache: 'no-store',
          signal: abortController.signal,
        });

        if (!response.ok) {
          throw new Error('Declination lookup failed.');
        }

        const payload = (await response.json()) as { declination?: unknown };
        const declination = typeof payload.declination === 'number' ? payload.declination : null;
        if (declination === null || !Number.isFinite(declination)) {
          throw new Error('Declination lookup returned an invalid value.');
        }

        if (cancelled) {
          return;
        }

        setMagneticDeclination(declination);
        writeCachedDeclination(cacheKey, declination);
      } catch (loadError: unknown) {
        if (cancelled) {
          return;
        }

        const isAbortError = loadError instanceof Error && loadError.name === 'AbortError';
        if (!isAbortError) {
          setMagneticDeclination(0);
        }
      }
    };

    void loadDeclination();

    return () => {
      cancelled = true;
      abortController.abort();
    };
  }, [location]);

  const appliedDeclination = useMemo(() => {
    return headingReference === 'magnetic' ? magneticDeclination : 0;
  }, [headingReference, magneticDeclination]);

  const arrowRotation = useMemo(() => {
    return normalizeDeg(qiblaBearingTrueNorth - deviceHeading - appliedDeclination);
  }, [appliedDeclination, deviceHeading, qiblaBearingTrueNorth]);

  const setHeading = useCallback((headingDeg: number, reference: HeadingReference) => {
    const smoothed = smoothCompass(headingDeg, headingBufferRef.current, 12);
    setDeviceHeading(smoothed);
    setHeadingReference(reference);
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

    // On phones, prefer the browser-normalized orientation APIs first.
    fallbackSupportRef.current = hasDO && hasGeneric ? 'generic-sensors' : 'none';
    // This effect initializes capability state from browser APIs during mount.
    setSupport(hasDO ? 'deviceorientation' : hasGeneric ? 'generic-sensors' : 'none');

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

  useEffect(() => {
    if (typeof document === 'undefined') return;

    const updateVisibility = () => {
      const visible = document.visibilityState === 'visible';
      setIsPageVisible(visible);
      if (!visible) {
        setIsCompassActive(false);
        setHeadingReference('unknown');
      }
    };

    updateVisibility();
    document.addEventListener('visibilitychange', updateVisibility);

    return () => {
      document.removeEventListener('visibilitychange', updateVisibility);
    };
  }, []);

  // Start live compass when permission granted
  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (permissionState !== 'granted') return;
    if (support === 'none') return;
    if (!isPageVisible) return;

    let cancelled = false;
    // Reset live sensor state when starting or restarting listeners.
    setIsCompassActive(false);
    setHeadingReference('unknown');
    setCompassAccuracy(null);

    // Reset stability buffers on start
    headingBufferRef.current = [];
    stabilityBufferRef.current = [];

    const cleanupFns: Array<() => void> = [];

    const fallbackOrFail = (message: string) => {
      if (fallbackSupportRef.current !== 'none' && fallbackSupportRef.current !== support) {
        setSupport(fallbackSupportRef.current);
        return;
      }

      setError(message);
      setPermissionState('denied');
    };

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

        setError(null);
        setHeading(heading, 'magnetic');
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
      let hasUsableHeading = false;
      const timeoutId = window.setTimeout(() => {
        if (!cancelled && !hasUsableHeading) {
          fallbackOrFail('Unable to get an absolute compass heading on this device.');
        }
      }, 2500);

      const onDO = (event: DeviceOrientationEvent) => {
        if (cancelled) return;
        let heading: number | null = null;
        let accuracy: number | null = null;

        // iOS magnetic heading
        const eventWithCompass = event as unknown as { webkitCompassHeading?: number; webkitCompassAccuracy?: number };
        const webkitCompassHeading = eventWithCompass.webkitCompassHeading;
        const webkitCompassAccuracy = eventWithCompass.webkitCompassAccuracy;
        if (typeof webkitCompassHeading === 'number') {
          if (typeof webkitCompassAccuracy === 'number') {
            accuracy = webkitCompassAccuracy;
            setCompassAccuracy(webkitCompassAccuracy);
            if (webkitCompassAccuracy > 25) {
              setNeedsCalibration(true);
            }
            if (webkitCompassAccuracy > 45) {
              return;
            }
          }
          heading = webkitCompassHeading;
        } else if (event.alpha != null && (event.absolute || 'ondeviceorientationabsolute' in window)) {
          setCompassAccuracy(null);
          heading = normalizeDeg(360 - (event.alpha as number));
        }

        if (heading != null) {
          hasUsableHeading = true;
          window.clearTimeout(timeoutId);
          heading = normalizeDeg(heading + getScreenOrientationAngle());
          setError(null);
          setHeading(heading, typeof webkitCompassHeading === 'number' ? 'magnetic' : 'true');
          if (accuracy != null && accuracy <= 25) {
            setNeedsCalibration(false);
          }
        }
      };

      const eventName: 'deviceorientationabsolute' | 'deviceorientation' =
        'ondeviceorientationabsolute' in window ? 'deviceorientationabsolute' : 'deviceorientation';

      window.addEventListener(eventName, onDO as unknown as EventListener);
      cleanupFns.push(() => {
        window.clearTimeout(timeoutId);
        window.removeEventListener(eventName, onDO as unknown as EventListener);
      });
    };

    (async () => {
      try {
        if (support === 'generic-sensors') {
          try {
            await startGenericSensors();
          } catch (e: unknown) {
            const message = e instanceof Error ? e.message : String(e);
            fallbackOrFail(`Compass unavailable: ${message}`);
            return;
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
  }, [isPageVisible, permissionState, support, setHeading]);

  return {
    qiblaBearingTrueNorth,
    magneticDeclination,
    appliedDeclination,
    headingReference,
    deviceHeading,
    arrowRotation,
    needsCalibration,
    isCompassActive,
    isSupported: support !== 'none',
    support,
    compassAccuracy,
    permissionState,
    requestPermission,
    error,
    isLoading: !location && !locationError,
    locationError,
  };
}
