'use client';

import { useQibla } from '@/hooks/use-qibla';
import { useLanguage } from '@/context/language-context';
import { translations } from '@/lib/translations';
import { Button } from '@/components/ui/button';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { Compass, Zap, Ban } from 'lucide-react';
import { toArabicNumerals } from '@/lib/utils';
import { useSettings } from '@/context/settings-context';
import { useEffect } from 'react';

// Kaaba SVG Icon
const KaabaIcon = () => (
    <svg width="48" height="48" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-full" style={{ color: '#00332C' }}>
        <path d="M3.75 3.75L12 2L20.25 3.75L12 5.5L3.75 3.75Z" fill="currentColor" stroke="black" strokeWidth="1" strokeLinejoin="round"/>
        <path d="M3.75 3.75V17.25L12 22L20.25 17.25V3.75" stroke="black" strokeWidth="1" strokeLinejoin="round"/>
        <path d="M20.25 3.75L12 5.5L3.75 3.75" stroke="black" strokeWidth="1" strokeLinejoin="round"/>
        <path d="M12 22V5.5" stroke="black" strokeWidth="1" strokeLinejoin="round"/>
    </svg>
);


export default function QiblaCompass() {
  const { lang } = useLanguage();
  const { location, locationError, fetchAndSetLocation } = useSettings();
  const { 
    qiblaDirection,
    permissionState,
    requestPermission,
    error: qiblaError,
    isLoading,
    compassHeading,
  } = useQibla();

  const t = translations[lang];

  useEffect(() => {
    if(!location && !locationError) {
        fetchAndSetLocation();
    }
  }, [location, locationError, fetchAndSetLocation]);

  const renderContent = () => {
    if (isLoading) {
      return (
        <div className="text-center space-y-2">
          <Compass className="w-12 h-12 mx-auto animate-pulse" />
          <p className="font-semibold">{t.loading}</p>
        </div>
      );
    }
    
    if (!location && locationError) {
       return (
            <Alert>
                <Ban className="w-4 h-4"/>
                <AlertTitle>{t.locationNeeded}</AlertTitle>
                <AlertDescription>
                    {locationError} {t.locationNeededMsg}
                </AlertDescription>
            </Alert>
       )
    }

    if (qiblaError || permissionState === 'denied') {
      return (
        <Alert variant="destructive">
            <Ban className="w-4 h-4"/>
            <AlertTitle>{t.qiblaErrorTitle}</AlertTitle>
            <AlertDescription>
                {t.permissionNeeded}
            </AlertDescription>
        </Alert>
      );
    }
    
    if (permissionState === 'prompt') {
       return (
        <Alert>
            <Zap className="w-4 h-4" />
            <AlertTitle>{t.permissionPromptTitle}</AlertTitle>
            <AlertDescription>{t.permissionPrompt}</AlertDescription>
            <Button onClick={requestPermission} className="mt-4 w-full">{t.grantPermission}</Button>
        </Alert>
       )
    }
    
    const needleRotation = 360 - compassHeading;
    const qiblaMarkerRotation = (qiblaDirection + 360) % 360;
    
    return (
      <div className="flex flex-col items-center justify-center gap-6">
        <div 
          className="relative w-80 h-80"
        >
            <div className="absolute inset-0">
                <div 
                  className="relative w-full h-full rounded-full transition-transform duration-200 ease-linear"
                  style={{ transform: `rotate(${needleRotation}deg)`}}
                  >
                  {/* Outer Ticks */}
                  {Array.from({ length: 120 }).map((_, i) => (
                      <div
                          key={i}
                          className="absolute top-0 left-1/2 h-full w-px -translate-x-1/2"
                          style={{ transform: `rotate(${i * 3}deg)` }}
                      >
                          <div className={`mx-auto ${i % 15 === 0 ? 'h-5 w-0.5' : 'h-3 w-px'}`} style={{backgroundColor: '#00332C'}}></div>
                      </div>
                  ))}

                  {/* Cardinal Directions */}
                  <span className="absolute top-6 left-1/2 -translate-x-1/2 font-bold text-xl" style={{color: '#00332C'}}>N</span>
                  <span className="absolute top-16 left-1/2 text-xs font-bold -translate-x-1/2" style={{color: '#00332C', transform: `translateX(-50%) rotate(${-needleRotation}deg)`}}>NE</span>
                  <span className="absolute bottom-6 left-1/2 -translate-x-1/2 font-bold text-xl" style={{color: '#00332C'}}>S</span>
                  <span className="absolute bottom-16 left-1/2 text-xs font-bold -translate-x-1/2" style={{color: '#00332C', transform: `translateX(-50%) rotate(${-needleRotation}deg)`}}>SW</span>
                  <span className="absolute left-6 top-1/2 -translate-y-1/2 font-bold text-xl" style={{color: '#00332C'}}>W</span>
                  <span className="absolute left-16 top-1/2 text-xs font-bold -translate-y-1/2" style={{color: '#00332C', transform: `translateY(-50%) rotate(${-needleRotation}deg)`}}>NW</span>
                  <span className="absolute right-6 top-1/2 -translate-y-1/2 font-bold text-xl" style={{color: '#00332C'}}>E</span>
                  <span className="absolute right-16 top-1/2 text-xs font-bold -translate-y-1/2" style={{color: '#00332C', transform: `translateY(-50%) rotate(${-needleRotation}deg)`}}>SE</span>

                </div>
            </div>

            {/* Compass rose */}
            <div className="absolute inset-0 flex items-center justify-center">
                <div className="relative w-56 h-56">
                    <div className="absolute inset-0" style={{ transform: 'rotate(22.5deg)' }}>
                        {[...Array(4)].map((_, i) => (
                            <div key={i} className="absolute inset-0" style={{ transform: `rotate(${i * 90}deg)` }}>
                                <div className="absolute w-full h-full" style={{ clipPath: 'polygon(50% 0%, 60% 50%, 50% 100%, 40% 50%)', backgroundColor: '#00332C' }}></div>
                            </div>
                        ))}
                    </div>
                    <div className="absolute inset-0">
                         {[...Array(4)].map((_, i) => (
                            <div key={i} className="absolute inset-0" style={{ transform: `rotate(${i * 90}deg)` }}>
                                <div className="absolute w-full h-full transform scale-75" style={{ clipPath: 'polygon(50% 0%, 60% 50%, 50% 100%, 40% 50%)', backgroundColor: '#00332C' }}></div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Dashed Circle */}
            <svg className="absolute inset-0 w-full h-full" viewBox="0 0 100 100">
                <circle cx="50" cy="50" r="35" fill="none" stroke="#00332C" strokeWidth="0.5" strokeDasharray="1 1" />
            </svg>

            {/* Qibla Marker */}
            <div className="absolute inset-0 flex items-center justify-center transition-transform duration-200 ease-in-out"
              style={{ transform: `rotate(${qiblaMarkerRotation}deg)` }}>
                <KaabaIcon />
            </div>
            
            {/* Compass Needle */}
            <div
              className="absolute inset-0 flex items-center justify-center transition-transform duration-200 ease-in-out"
              style={{ transform: `rotate(${needleRotation}deg)` }}
            >
              <div className="relative w-4 h-64">
                {/* Red part (North) */}
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-0 h-0" style={{
                  borderLeft: '8px solid transparent',
                  borderRight: '8px solid transparent',
                  borderBottom: '96px solid #C43C3C'
                }}></div>
                {/* Blue part (South) */}
                <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-0 h-0" style={{
                  borderLeft: '8px solid transparent',
                  borderRight: '8px solid transparent',
                  borderTop: '96px solid #3C70C4'
                }}></div>
                {/* Pivot */}
                 <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-4 h-4 rounded-full" style={{backgroundColor: '#333'}}></div>
                 {/* Counter-weight on red side */}
                 <div className="absolute top-16 left-1/2 -translate-x-1/2 w-6 h-4" style={{backgroundColor: '#C43C3C', clipPath: 'polygon(0% 0%, 100% 0%, 80% 100%, 20% 100%)'}}></div>
                 <div className="absolute top-20 left-1/2 -translate-x-1/2 w-6 h-4 bg-yellow-400" style={{clipPath: 'polygon(20% 0, 80% 0, 60% 100%, 40% 100%)'}}></div>

              </div>
            </div>

        </div>

        <div className="text-center">
            <h2 className="text-lg font-semibold" style={{color: '#00332C'}}>{t.qiblaDirection}</h2>
            <p className="text-5xl font-bold" style={{color: '#00332C'}}>
                {lang === 'ar' ? toArabicNumerals(qiblaDirection.toFixed(0)) : qiblaDirection.toFixed(0)}°
            </p>
        </div>

      </div>
    );
  };

  return <>{renderContent()}</>;
}
