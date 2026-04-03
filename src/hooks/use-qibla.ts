'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useSettings } from '@/context/settings-context';
import { calculateQibla, circularStdDevDeg, smoothCompass } from '@/lib/qibla';
import { model } from 'geomagnetism';

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

  const magneticDeclination = useMemo(() => {
    if (!location) return 0;

    const cacheKey = buildDeclinationCacheKey(location.latitude, location.longitude);
    const cachedDeclination = readCachedDeclination(cacheKey);
    if (cachedDeclination !== null) return cachedDeclination;

    try {
      const declination = model(new Date(), { allowOutOfBoundsModel: true }).point([location.latitude, location.longitude]).decl;

      if (typeof declination === 'number' && Number.isFinite(declination)) {
        writeCachedDeclination(cacheKey, declination);
        return declination;
      }
    } catch {
      // Fall through to return 0
    }

    return 0;
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
    // eslint-disable-next-line react-hooks/set-state-in-effect
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
    // eslint-disable-next-line react-hooks/set-state-in-effect
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

        // Heading relative to magnetic north (clockwise from north)
        // atan2(-Yh, Xh) gives clockwise-from-north heading
        let heading = (Math.atan2(-Yh, Xh) * 180) / Math.PI;
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
          // Try generic sensors as a fallback before giving up
          if (fallbackSupportRef.current === 'generic-sensors' && support !== 'generic-sensors') {
            setSupport('generic-sensors');
            return;
          }
          fallbackOrFail('Unable to get an absolute compass heading on this device.');
        }
      }, 3000);

      // Determine which event to listen to.
      // Prefer deviceorientationabsolute (Android Chrome) — it provides true-north alpha.
      const useAbsolute = 'ondeviceorientationabsolute' in window;
      const eventName: string = useAbsolute ? 'deviceorientationabsolute' : 'deviceorientation';

      const onDO = (event: DeviceOrientationEvent) => {
        if (cancelled) return;
        let heading: number | null = null;
        let accuracy: number | null = null;
        let ref: HeadingReference = 'unknown';

        // iOS magnetic heading (webkitCompassHeading)
        const eventWithCompass = event as unknown as { webkitCompassHeading?: number; webkitCompassAccuracy?: number };
        const webkitCompassHeading = eventWithCompass.webkitCompassHeading;
        const webkitCompassAccuracy = eventWithCompass.webkitCompassAccuracy;

        if (typeof webkitCompassHeading === 'number' && Number.isFinite(webkitCompassHeading)) {
          if (typeof webkitCompassAccuracy === 'number') {
            accuracy = webkitCompassAccuracy;
            setCompassAccuracy(webkitCompassAccuracy);
            if (webkitCompassAccuracy > 25) {
              setNeedsCalibration(true);
            }
            if (webkitCompassAccuracy > 45) {
              return; // Too inaccurate — skip this reading
            }
          }
          // iOS webkitCompassHeading is already clockwise from magnetic north
          // and already compensated for screen orientation by the browser.
          heading = webkitCompassHeading;
          ref = 'magnetic';
        } else if (event.alpha != null) {
          // Android / desktop: event.alpha is counter-clockwise from a reference.
          // Only trust it as true-north if we are on the absolute event or event.absolute is true.
          const isAbsolute = event.absolute === true || useAbsolute;
          if (!isAbsolute) {
            // Relative alpha (arbitrary origin) — unusable for compass.
            return;
          }
          setCompassAccuracy(null);
          heading = normalizeDeg(360 - (event.alpha as number));
          ref = 'true';
        }

        if (heading != null) {
          hasUsableHeading = true;
          window.clearTimeout(timeoutId);

          // Apply screen orientation offset.
          // iOS webkitCompassHeading is already screen-compensated, so skip for that path.
          if (ref !== 'magnetic' || typeof webkitCompassHeading !== 'number') {
            heading = normalizeDeg(heading + getScreenOrientationAngle());
          }

          setError(null);
          setHeading(heading, ref);
          if (accuracy != null && accuracy <= 25) {
            setNeedsCalibration(false);
          }
        }
      };

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
