'use client';

import { createContext, useContext, useState, ReactNode, useEffect, useCallback } from 'react';
import { useToast } from '@/hooks/use-toast';

// Default to Muslim World League, a common choice
const DEFAULT_PRAYER_METHOD = 2; 
const DEFAULT_HIJRI_ADJUSTMENT = 0;

type Location = {
  latitude: number;
  longitude: number;
};

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
  locationError: string | null;
}

const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

export function SettingsProvider({ children }: { children: ReactNode }) {
  const [prayerMethod, setPrayerMethodState] = useState<number>(() => {
    if (typeof window === 'undefined') return DEFAULT_PRAYER_METHOD;
    const savedMethod = window.localStorage.getItem('prayerMethod');
    return savedMethod ? Number(savedMethod) : DEFAULT_PRAYER_METHOD;
  });

  const [hijriAdjustment, setHijriAdjustmentState] = useState<number>(() => {
    if (typeof window === 'undefined') return DEFAULT_HIJRI_ADJUSTMENT;
    const savedAdjustment = window.localStorage.getItem('hijriAdjustment');
    return savedAdjustment ? Number(savedAdjustment) : DEFAULT_HIJRI_ADJUSTMENT;
  });

  const [isManualLocation, setIsManualLocationState] = useState<boolean>(() => {
    if (typeof window === 'undefined') return false;
    const savedIsManual = window.localStorage.getItem('isManualLocation');
    return savedIsManual === 'true';
  });

  const [location, setLocationState] = useState<Location | null>(() => {
    if (typeof window === 'undefined') return null;
    const savedLocation = window.localStorage.getItem('location');
    return savedLocation ? (JSON.parse(savedLocation) as Location) : null;
  });

  const [locationError, setLocationError] = useState<string | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    // Sync persisted settings after hydration.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setPrayerMethodState(() => {
      const savedMethod = window.localStorage.getItem('prayerMethod');
      return savedMethod ? Number(savedMethod) : DEFAULT_PRAYER_METHOD;
    });

    setHijriAdjustmentState(() => {
      const savedAdjustment = window.localStorage.getItem('hijriAdjustment');
      return savedAdjustment ? Number(savedAdjustment) : DEFAULT_HIJRI_ADJUSTMENT;
    });

    setIsManualLocationState(() => {
      const savedIsManual = window.localStorage.getItem('isManualLocation');
      return savedIsManual === 'true';
    });

    const savedLocation = window.localStorage.getItem('location');
    if (savedLocation) {
      setLocationState(JSON.parse(savedLocation) as Location);
    }
  }, []);

  const setLocation = (newLocation: Location) => {
    localStorage.setItem('location', JSON.stringify(newLocation));
    setLocationState(newLocation);
    localStorage.removeItem('prayerData'); // Invalidate cache on location change
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
        () => {
          setLocationError("Could not get location. Please enable location services.");
          toast({
            variant: "destructive",
            title: "Location Error",
            description: "Could not get location. Please enable location services or set it manually.",
          });
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
    if (!location && !isManualLocation) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      fetchAndSetLocation();
    }
  }, [fetchAndSetLocation, isManualLocation, location]);

  const setPrayerMethod = (method: number) => {
    localStorage.setItem('prayerMethod', String(method));
    setPrayerMethodState(method);
    localStorage.removeItem('prayerData');
  };

  const setHijriAdjustment = (adjustment: number) => {
    localStorage.setItem('hijriAdjustment', String(adjustment));
    setHijriAdjustmentState(adjustment);
  };

  const setIsManualLocation = (isManual: boolean) => {
    localStorage.setItem('isManualLocation', String(isManual));
    setIsManualLocationState(isManual);
    if (!isManual) {
      fetchAndSetLocation(); // Fetch GPS location when switching to automatic
    }
  }


  return (
    <SettingsContext.Provider value={{ 
      prayerMethod, setPrayerMethod, 
      hijriAdjustment, setHijriAdjustment,
      location, setLocation,
      isManualLocation, setIsManualLocation,
      fetchAndSetLocation,
      locationError
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
