'use client';

import { createContext, useContext, useState, ReactNode, useEffect } from 'react';

// Default to Muslim World League, a common choice
const DEFAULT_PRAYER_METHOD = 2; 
const DEFAULT_HIJRI_ADJUSTMENT = 0;

interface SettingsContextType {
  prayerMethod: number;
  setPrayerMethod: (method: number) => void;
  hijriAdjustment: number;
  setHijriAdjustment: (adjustment: number) => void;
}

const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

export function SettingsProvider({ children }: { children: ReactNode }) {
  const [prayerMethod, setPrayerMethodState] = useState<number>(DEFAULT_PRAYER_METHOD);
  const [hijriAdjustment, setHijriAdjustmentState] = useState<number>(DEFAULT_HIJRI_ADJUSTMENT);

  useEffect(() => {
    const savedMethod = localStorage.getItem('prayerMethod');
    const savedAdjustment = localStorage.getItem('hijriAdjustment');
    
    if (savedMethod) {
      setPrayerMethodState(Number(savedMethod));
    }
    if (savedAdjustment) {
        setHijriAdjustmentState(Number(savedAdjustment));
    }
  }, []);

  const setPrayerMethod = (method: number) => {
    localStorage.setItem('prayerMethod', String(method));
    setPrayerMethodState(method);
    // Force-clear prayer data cache to reflect new calculation method
    localStorage.removeItem('prayerData');
  };

  const setHijriAdjustment = (adjustment: number) => {
    localStorage.setItem('hijriAdjustment', String(adjustment));
    setHijriAdjustmentState(adjustment);
  };


  return (
    <SettingsContext.Provider value={{ prayerMethod, setPrayerMethod, hijriAdjustment, setHijriAdjustment }}>
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
