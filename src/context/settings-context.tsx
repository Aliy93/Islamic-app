'use client';

import { createContext, useContext, useState, ReactNode, useEffect, useCallback, useRef } from 'react';
import { useToast } from '@/hooks/use-toast';
import { locationSchema, normalizeLocation, parseStoredLocation, StoredLocation } from '@/lib/location';

// Default to Muslim World League, a common choice
const DEFAULT_PRAYER_METHOD = 2; 
const DEFAULT_HIJRI_ADJUSTMENT = 0;
const PRAYER_CACHE_PREFIX = 'prayerData:';

type Location = {
  latitude: number;
  longitude: number;
};

type LocationPermissionState = PermissionState | 'unknown' | 'unsupported';

function getInitialLocationPermissionState(): LocationPermissionState {
  if (typeof navigator === 'undefined') {
    return 'unknown';
  }

  return 'permissions' in navigator && typeof navigator.permissions?.query === 'function'
    ? 'unknown'
    : 'unsupported';
}

const settingsNumberSchema = locationSchema.shape.latitude;

interface SettingsContextType {
  prayerMethod: number;
  setPrayerMethod: (method: number) => void;
  hijriAdjustment: number;
  setHijriAdjustment: (adjustment: number) => void;
  location: Location | null;
  setLocation: (location: Location) => void;
  isManualLocation: boolean;
  setIsManualLocation: (isManual: boolean) => void;
  fetchAndSetLocation: () => void;
  clearStoredData: () => void;
  locationError: string | null;
  locationPermissionState: LocationPermissionState;
}

const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

function clearPrayerCache() {
  if (typeof window === 'undefined') return;

  const keysToRemove: string[] = [];
  for (let i = 0; i < window.localStorage.length; i++) {
    const key = window.localStorage.key(i);
    if (key === 'prayerData' || key?.startsWith(PRAYER_CACHE_PREFIX)) {
      keysToRemove.push(key);
    }
  }

  keysToRemove.forEach((key) => window.localStorage.removeItem(key));
}

function readStoredNumber(key: string, fallback: number): number {
  if (typeof window === 'undefined') return fallback;

  const rawValue = window.localStorage.getItem(key);
  if (!rawValue) return fallback;

  const parsed = Number(rawValue);
  return settingsNumberSchema.safeParse(parsed).success ? parsed : fallback;
}

function getGeolocationErrorMessage(error: GeolocationPositionError) {
  switch (error.code) {
    case error.PERMISSION_DENIED:
      return 'Location access was denied. Enable location permission in your browser settings or set it manually.';
    case error.POSITION_UNAVAILABLE:
      return 'Your location is currently unavailable. Check device location services and try again.';
    case error.TIMEOUT:
      return 'Location request timed out. Try again or set your location manually.';
    default:
      return 'Could not get location. Please enable location services.';
  }
}

export function SettingsProvider({ children }: { children: ReactNode }) {
  const [prayerMethod, setPrayerMethodState] = useState<number>(() => {
    return readStoredNumber('prayerMethod', DEFAULT_PRAYER_METHOD);
  });

  const [hijriAdjustment, setHijriAdjustmentState] = useState<number>(() => {
    const value = readStoredNumber('hijriAdjustment', DEFAULT_HIJRI_ADJUSTMENT);
    return value >= -1 && value <= 1 ? value : DEFAULT_HIJRI_ADJUSTMENT;
  });

  const [isManualLocation, setIsManualLocationState] = useState<boolean>(() => {
    if (typeof window === 'undefined') return false;
    const savedIsManual = window.localStorage.getItem('isManualLocation');
    return savedIsManual === 'true';
  });

  const [location, setLocationState] = useState<Location | null>(() => {
    if (typeof window === 'undefined') return null;
    return parseStoredLocation(window.localStorage.getItem('location'));
  });

  const [locationError, setLocationError] = useState<string | null>(null);
  const [locationPermissionState, setLocationPermissionState] = useState<LocationPermissionState>(getInitialLocationPermissionState);
  const autoSwitchedToManualRef = useRef(false);
  const { toast } = useToast();

  useEffect(() => {
    // Sync persisted settings after hydration.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setPrayerMethodState(() => {
      return readStoredNumber('prayerMethod', DEFAULT_PRAYER_METHOD);
    });

    setHijriAdjustmentState(() => {
      const value = readStoredNumber('hijriAdjustment', DEFAULT_HIJRI_ADJUSTMENT);
      return value >= -1 && value <= 1 ? value : DEFAULT_HIJRI_ADJUSTMENT;
    });

    setIsManualLocationState(() => {
      const savedIsManual = window.localStorage.getItem('isManualLocation');
      return savedIsManual === 'true';
    });

    const savedLocation = parseStoredLocation(window.localStorage.getItem('location'));
    setLocationState(savedLocation);
  }, []);

  const setLocation = (newLocation: Location) => {
    const normalizedLocation = normalizeLocation(locationSchema.parse(newLocation) as StoredLocation);
    localStorage.setItem('location', JSON.stringify(normalizedLocation));
    setLocationState(normalizedLocation);
    setLocationError(null);
    clearPrayerCache();
  }

  const fetchAndSetLocation = useCallback(() => {
    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const newLocation = {
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
          };
          setLocation(newLocation);
          setLocationError(null);
        },
        (error) => {
          const message = getGeolocationErrorMessage(error);
          if (error.code === error.PERMISSION_DENIED) {
            setLocationPermissionState('denied');
            localStorage.setItem('isManualLocation', 'true');
            setIsManualLocationState(true);
            autoSwitchedToManualRef.current = true;
          }
          setLocationError(message);
          toast({
            variant: "destructive",
            title: "Location Error",
            description: message,
          });
        },
        {
          enableHighAccuracy: false,
          timeout: 10000,
          maximumAge: 300000,
        }
      );
    } else {
      setLocationError("Geolocation is not supported by your browser.");
      toast({
        variant: "destructive",
        title: "Location Error",
        description: "Geolocation is not supported by your browser. Please set your location manually.",
      });
    }
  }, [toast]);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    if (!('permissions' in navigator) || typeof navigator.permissions?.query !== 'function') {
      return;
    }

    let isMounted = true;
    let permissionStatus: PermissionStatus | null = null;

    const syncPermissionState = (state: PermissionState) => {
      if (!isMounted) return;

      setLocationPermissionState(state);

      if (state === 'granted') {
        setLocationError(null);

        if (autoSwitchedToManualRef.current) {
          localStorage.setItem('isManualLocation', 'false');
          setIsManualLocationState(false);
          autoSwitchedToManualRef.current = false;
        }

        if (!location) {
          fetchAndSetLocation();
        }
      }
    };

    const watchPermission = async () => {
      try {
        permissionStatus = await navigator.permissions.query({ name: 'geolocation' });
        syncPermissionState(permissionStatus.state);
        permissionStatus.onchange = () => syncPermissionState(permissionStatus?.state ?? 'prompt');
      } catch {
        if (isMounted) {
          setLocationPermissionState('unsupported');
        }
      }
    };

    void watchPermission();

    return () => {
      isMounted = false;
      if (permissionStatus) {
        permissionStatus.onchange = null;
      }
    };
  }, [fetchAndSetLocation, location]);

  useEffect(() => {
    if (!location && !isManualLocation) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      fetchAndSetLocation();
    }
  }, [fetchAndSetLocation, isManualLocation, location]);

  const setPrayerMethod = (method: number) => {
    localStorage.setItem('prayerMethod', String(method));
    setPrayerMethodState(method);
    clearPrayerCache();
  };

  const setHijriAdjustment = (adjustment: number) => {
    localStorage.setItem('hijriAdjustment', String(adjustment));
    setHijriAdjustmentState(adjustment);
  };

  const setIsManualLocation = (isManual: boolean) => {
    localStorage.setItem('isManualLocation', String(isManual));
    setIsManualLocationState(isManual);
    autoSwitchedToManualRef.current = false;
    if (!isManual) {
      fetchAndSetLocation(); // Fetch GPS location when switching to automatic
    }
  }

  const clearStoredData = useCallback(() => {
    if (typeof window === 'undefined') return;

    window.localStorage.removeItem('location');
    window.localStorage.removeItem('prayerMethod');
    window.localStorage.removeItem('hijriAdjustment');
    window.localStorage.removeItem('isManualLocation');
    clearPrayerCache();

    setPrayerMethodState(DEFAULT_PRAYER_METHOD);
    setHijriAdjustmentState(DEFAULT_HIJRI_ADJUSTMENT);
    setIsManualLocationState(true);
    setLocationState(null);
    setLocationError(null);
    setLocationPermissionState('unknown');
    autoSwitchedToManualRef.current = false;
  }, []);


  return (
    <SettingsContext.Provider value={{ 
      prayerMethod, setPrayerMethod, 
      hijriAdjustment, setHijriAdjustment,
      location, setLocation,
      isManualLocation, setIsManualLocation,
      fetchAndSetLocation,
      clearStoredData,
      locationError,
      locationPermissionState
    }}>
      {children}
    </SettingsContext.Provider>
  );
}

export function useSettings() {
  const context = useContext(SettingsContext);
  if (context === undefined) {
    throw new Error('useSettings must be used within a SettingsProvider');
  }
  return context;
}
