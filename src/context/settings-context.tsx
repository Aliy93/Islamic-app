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
  const [prayerMethod, setPrayerMethodState] = useState<number>(DEFAULT_PRAYER_METHOD);
  const [hijriAdjustment, setHijriAdjustmentState] = useState<number>(DEFAULT_HIJRI_ADJUSTMENT);
  const [location, setLocationState] = useState<Location | null>(null);
  const [isManualLocation, setIsManualLocationState] = useState<boolean>(false);
  const [locationError, setLocationError] = useState<string | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    const savedMethod = localStorage.getItem('prayerMethod');
    if (savedMethod) setPrayerMethodState(Number(savedMethod));

    const savedAdjustment = localStorage.getItem('hijriAdjustment');
    if (savedAdjustment) setHijriAdjustmentState(Number(savedAdjustment));
    
    const savedIsManual = localStorage.getItem('isManualLocation');
    const isManual = savedIsManual === 'true';
    setIsManualLocationState(isManual);
    
    const savedLocation = localStorage.getItem('location');
    if (savedLocation) {
        setLocationState(JSON.parse(savedLocation));
    } else if (!isManual) {
        fetchAndSetLocation();
    }
  }, []);

  const setPrayerMethod = (method: number) => {
    localStorage.setItem('prayerMethod', String(method));
    setPrayerMethodState(method);
    localStorage.removeItem('prayerData');
  };

  const setHijriAdjustment = (adjustment: number) => {
    localStorage.setItem('hijriAdjustment', String(adjustment));
    setHijriAdjustmentState(adjustment);
  };

  const setLocation = (newLocation: Location) => {
    localStorage.setItem('location', JSON.stringify(newLocation));
    setLocationState(newLocation);
    localStorage.removeItem('prayerData'); // Invalidate cache on location change
  }

  const setIsManualLocation = (isManual: boolean) => {
    localStorage.setItem('isManualLocation', String(isManual));
    setIsManualLocationState(isManual);
    if (!isManual) {
      fetchAndSetLocation(); // Fetch GPS location when switching to automatic
    }
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
        (err) => {
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
