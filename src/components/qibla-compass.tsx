'use client';

import { useQibla } from '@/hooks/use-qibla';
import { Language, useLanguage } from '@/context/language-context';
import { translations } from '@/lib/translations';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { Compass, RotateCw, Zap, Ban } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useSettings } from '@/context/settings-context';
import { useEffect } from 'react';
import { formatLocalizedNumber } from '@/lib/localization';

// Kaaba SVG Icon
const KaabaIcon = () => (
  <svg
    width="48"
    height="48"
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-full text-primary"
  >
    <path
      d="M3.75 3.75L12 2L20.25 3.75L12 5.5L3.75 3.75Z"
      fill="currentColor"
      stroke="hsl(var(--foreground))"
      strokeWidth="1"
      strokeLinejoin="round"
    />
    <path
      d="M3.75 3.75V17.25L12 22L20.25 17.25V3.75"
      stroke="hsl(var(--foreground))"
      strokeWidth="1"
      strokeLinejoin="round"
    />
    <path d="M20.25 3.75L12 5.5L3.75 3.75" stroke="hsl(var(--foreground))" strokeWidth="1" strokeLinejoin="round" />
    <path d="M12 22V5.5" stroke="hsl(var(--foreground))" strokeWidth="1" strokeLinejoin="round" />
  </svg>
);

// North Needle SVG
const NorthNeedle = ({ rotation }: { rotation: number }) => (
  <div
    className="absolute inset-0 flex items-center justify-center transition-transform duration-200 ease-in-out"
    style={{ transform: `rotate(${rotation}deg)` }}
  >
    <div className="relative w-4 h-64">
      {/* Red part (North) */}
      <div
        className="absolute top-0 left-1/2 -translate-x-1/2 w-0 h-0"
        style={{
          borderLeft: '8px solid transparent',
          borderRight: '8px solid transparent',
          borderBottom: '96px solid hsl(var(--destructive))',
        }}
      ></div>
       {/* White part (South) */}
       <div
        className="absolute bottom-0 left-1/2 -translate-x-1/2 w-0 h-0"
        style={{
          borderLeft: '8px solid transparent',
          borderRight: '8px solid transparent',
          borderTop: '96px solid hsl(var(--muted))',
        }}
      ></div>
    </div>
  </div>
);

const QiblaNeedle = ({ rotation }: { rotation: number }) => (
  <div
    className="absolute inset-0 flex items-center justify-center transition-transform duration-200 ease-in-out"
    style={{ transform: `rotate(${rotation}deg)` }}
  >
    <div className="relative w-4 h-64">
      <KaabaIcon />
    </div>
  </div>
);

function formatBearing(value: number, lang: Language) {
  const rounded = value.toFixed(0);
  return `${formatLocalizedNumber(rounded, lang)}°`;
}

function getSignedTurnAngle(angle: number) {
  return ((angle + 540) % 360) - 180;
}

function renderCompassShell() {
  return (
    <div className="brand-compass-shell relative h-80 w-80 rounded-full">
      <div className="absolute inset-4 rounded-full border border-primary/15 bg-white/70 shadow-inner"></div>
      <div className="absolute inset-7 rounded-full border-[5px] border-primary/70"></div>
      <div className="brand-compass-core absolute inset-[58px] rounded-full border border-primary/10"></div>
      <div className="relative h-full w-full rounded-full transition-transform duration-200 ease-in-out">
        {Array.from({ length: 120 }).map((_, i) => (
          <div
            key={i}
            className="absolute top-0 left-1/2 h-full w-px -translate-x-1/2"
            style={{ transform: `rotate(${i * 3}deg)` }}
          >
            <div className={`mx-auto rounded-full bg-primary ${i % 15 === 0 ? 'h-5 w-0.5 opacity-90' : 'h-3 w-px opacity-80'}`}></div>
          </div>
        ))}

        <span className="absolute top-8 left-1/2 -translate-x-1/2 font-bold text-xl text-[#DCA15D] drop-shadow-sm">N</span>
        <span className="absolute bottom-8 left-1/2 -translate-x-1/2 font-bold text-xl text-[#DCA15D]/85">S</span>
        <span className="absolute left-8 top-1/2 -translate-y-1/2 font-bold text-xl text-[#DCA15D]/85">W</span>
        <span className="absolute right-8 top-1/2 -translate-y-1/2 font-bold text-xl text-[#DCA15D]/85">E</span>
      </div>

      <div className="brand-compass-center-shadow absolute left-1/2 top-1/2 z-10 h-4 w-4 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-primary-foreground bg-primary"></div>
    </div>
  );
}

function CompassFrame({
  topLabel,
  isAligned = false,
  children,
}: {
  topLabel: string;
  isAligned?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div className="relative">
      <div className="absolute -top-4 left-1/2 z-20 -translate-x-1/2 rounded-full border border-primary/20 bg-background px-4 py-1 text-[11px] font-bold uppercase tracking-[0.18em] text-primary shadow-sm">
        {topLabel}
      </div>
      {isAligned ? (
        <div className="brand-aligned-ring absolute inset-6 rounded-full border-4" />
      ) : null}
      {renderCompassShell()}
      {children}
    </div>
  );
}

function StaticQiblaGuide({
  lang,
  bearing,
  body,
  retryLabel,
  onRetry,
}: {
  lang: Language;
  bearing: number;
  body: string;
  retryLabel?: string;
  onRetry?: () => void;
}) {
  const t = translations[lang];
  const topLabel = t.phoneTop;

  return (
    <div className="flex flex-col items-center gap-5 w-full">
      <Card className="w-full rounded-[28px] border-border/60 shadow-sm">
        <CardHeader>
          <CardTitle className="text-lg text-center">{t.qiblaStaticGuideTitle}</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col items-center gap-5">
          <CompassFrame topLabel={topLabel}>
            <QiblaNeedle rotation={bearing} />
          </CompassFrame>

          <div className="text-center text-primary space-y-2">
            <h2 className="text-lg font-semibold">{t.qiblaDirection}</h2>
            <p className="text-5xl font-bold">{formatBearing(bearing, lang)}</p>
            <p className="text-sm text-muted-foreground">
              {t.qiblaBearingFromNorth}
            </p>
          </div>

          <Alert>
            <Compass className="w-4 h-4" />
            <AlertTitle>{t.qiblaStaticGuideTitle}</AlertTitle>
            <AlertDescription>
              {body} {t.qiblaNeedNorthReference}
            </AlertDescription>
          </Alert>

          {onRetry && retryLabel ? (
            <Button onClick={onRetry} variant="outline" className="w-full rounded-full">
              <RotateCw className="h-4 w-4" />
              {retryLabel}
            </Button>
          ) : null}
        </CardContent>
      </Card>
    </div>
  );
}


export default function QiblaCompass() {
  const { lang } = useLanguage();
  const { location, locationError, fetchAndSetLocation } = useSettings();
  const {
    permissionState,
    requestPermission,
    isLoading,
    qiblaBearingTrueNorth,
    magneticDeclination,
    deviceHeadingMagneticNorth,
    arrowRotation,
    needsCalibration,
    isCompassActive,
    isSupported,
    support,
    compassAccuracy,
    error,
  } = useQibla();

  const t = translations[lang];
  const signedTurnAngle = getSignedTurnAngle(arrowRotation);
  const isAligned = Math.abs(signedTurnAngle) <= 8;
  const turnInstruction = isAligned
    ? t.qiblaAligned
    : `${signedTurnAngle > 0 ? t.qiblaTurnRight : t.qiblaTurnLeft} ${formatBearing(Math.abs(signedTurnAngle), lang)}`;
  const topLabel = t.phoneTop;

  useEffect(() => {
    if (!location && !locationError) {
      fetchAndSetLocation();
    }
  }, [location, locationError, fetchAndSetLocation]);

  const renderContent = () => {
    if (isLoading) {
      return (
        <div className="text-center space-y-2 text-primary">
          <Compass className="w-12 h-12 mx-auto animate-pulse" />
          <p className="font-semibold">
            {t.loading}
          </p>
        </div>
      );
    }

    if (locationError && !location) {
      return (
        <Alert variant="destructive">
          <Ban className="w-4 h-4" />
          <AlertTitle>{t.locationNeeded}</AlertTitle>
          <AlertDescription>
            {locationError} {t.locationNeededMsg}
          </AlertDescription>
        </Alert>
      );
    }

    if (permissionState === 'denied') {
      return (
        <div className="w-full space-y-4">
          <Alert variant="destructive">
            <Ban className="w-4 h-4" />
            <AlertTitle>{t.qiblaErrorTitle}</AlertTitle>
            <AlertDescription>{error || t.qiblaPermissionFallback}</AlertDescription>
          </Alert>
          <StaticQiblaGuide
            lang={lang}
            bearing={qiblaBearingTrueNorth}
            body={t.qiblaPermissionFallback}
            retryLabel={t.qiblaRetryPermission}
            onRetry={requestPermission}
          />
        </div>
      );
    }

    if (permissionState === 'prompt') {
      return (
        <Alert>
          <Zap className="w-4 h-4" />
          <AlertTitle>{t.permissionPromptTitle}</AlertTitle>
          <AlertDescription>{t.permissionPrompt}</AlertDescription>
          <Button onClick={requestPermission} className="mt-4 w-full">
            {t.grantPermission}
          </Button>
        </Alert>
      );
    }

    if (!isSupported) {
      return (
        <div className="w-full space-y-4">
          <Alert>
            <AlertTitle>{t.qiblaErrorTitle}</AlertTitle>
            <AlertDescription>{t.qiblaSupportFallback}</AlertDescription>
          </Alert>
          <StaticQiblaGuide
            lang={lang}
            bearing={qiblaBearingTrueNorth}
            body={t.qiblaSupportFallback}
          />
        </div>
      );
    }

    return (
      <div className="flex flex-col items-center justify-center gap-6">
        {permissionState === 'granted' && isCompassActive && needsCalibration && (
          <Alert>
            <Zap className="w-4 h-4" />
            <AlertTitle>{t.calibratingTitle}</AlertTitle>
            <AlertDescription>{t.calibrating}</AlertDescription>
          </Alert>
        )}
        <Card className="brand-card-surface w-full max-w-[26rem] rounded-[32px] border-primary/10 backdrop-blur">
          <CardContent className="flex flex-col items-center gap-6 p-5 sm:p-6">
            <div className="flex items-center gap-2 rounded-full border border-primary/10 bg-white/80 px-3 py-1 text-[11px] font-bold uppercase tracking-[0.18em] text-primary shadow-sm">
              <Compass className="h-3.5 w-3.5" />
              {t.qiblaDirection}
            </div>
            <CompassFrame topLabel={topLabel} isAligned={isAligned}>

              {/* North-pointing Needle (magnetic north) */}
              <NorthNeedle rotation={-deviceHeadingMagneticNorth} />
              
              {/* Qibla Direction Indicator */}
              <QiblaNeedle rotation={arrowRotation} />
            </CompassFrame>

            <div className="text-center text-primary">
              <div className={cn(
                'mt-1 inline-flex items-center rounded-full px-4 py-2 text-sm font-semibold shadow-sm',
                isAligned
                  ? 'border border-[#DCA15D]/40 bg-[#DCA15D]/15 text-[#0B552B]'
                  : 'border border-primary/20 bg-primary/10 text-primary'
              )}>
                {turnInstruction}
              </div>
              <p className="mt-4 text-6xl font-black tracking-tight">
                {formatBearing(qiblaBearingTrueNorth, lang)}
              </p>
              <p className="mt-2 text-sm text-muted-foreground font-body">
                {t.qiblaRotatePhone}
              </p>
            </div>

            <div className="grid w-full grid-cols-1 gap-3 sm:grid-cols-3">
              <div className="rounded-[22px] border border-primary/10 bg-white/80 p-4 text-center shadow-sm">
                <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-muted-foreground">{t.bearing}</p>
                <p className="mt-2 text-2xl font-bold text-primary">{formatBearing(qiblaBearingTrueNorth, lang)}</p>
              </div>
              <div className="rounded-[22px] border border-primary/10 bg-white/80 p-4 text-center shadow-sm">
                <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-muted-foreground">{t.source}</p>
                <p className="mt-2 text-sm font-semibold text-primary">{support === 'generic-sensors' ? t.sensors : t.deviceOrientation}</p>
              </div>
              <div className="rounded-[22px] border border-primary/10 bg-white/80 p-4 text-center shadow-sm">
                <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-muted-foreground">{t.qiblaAccuracy}</p>
                <p className="mt-2 text-sm font-semibold text-primary">
                  {compassAccuracy != null
                    ? `${formatLocalizedNumber(compassAccuracy.toFixed(0), lang)}°`
                    : t.qiblaHoldFlat}
                </p>
              </div>
            </div>

            <div className="rounded-[24px] border border-primary/10 bg-white/70 px-4 py-3 text-center text-sm text-muted-foreground shadow-sm">
              <p>{t.qiblaHoldFlat}</p>
              <p className="mt-1">{t.declination}: {formatLocalizedNumber(magneticDeclination.toFixed(1), lang)}°</p>
              {compassAccuracy != null && compassAccuracy > 25 ? (
                <p className="mt-2 font-medium text-[#DCA15D]">{t.qiblaAccuracyLow}</p>
              ) : null}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  };

  return <>{renderContent()}</>;
}
