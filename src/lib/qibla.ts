import geomagnetism from 'geomagnetism';

// Kaaba location (exact per spec)
const KAABA_LAT = 21.4225;
const KAABA_LON = 39.8262;

// Function to convert degrees to radians
function toRadians(degrees: number): number {
  return (degrees * Math.PI) / 180;
}

// Function to convert radians to degrees
function toDegrees(radians: number): number {
  return (radians * 180) / Math.PI;
}

/**
 * Calculates the Qibla bearing (direction) from a given latitude and longitude.
 * @param lat - User's latitude.
 * @param lon - User's longitude.
 * @returns The Qibla bearing in degrees from true north.
 */
export function calculateQibla(lat: number, lon: number): number {
  const userLatRad = toRadians(lat);
  const userLonRad = toRadians(lon);
  const kaabaLatRad = toRadians(KAABA_LAT);
  const kaabaLonRad = toRadians(KAABA_LON);

  const lonDiff = kaabaLonRad - userLonRad;

  const y = Math.sin(lonDiff);
  const x = Math.cos(userLatRad) * Math.tan(kaabaLatRad) - Math.sin(userLatRad) * Math.cos(lonDiff);

  let bearing = toDegrees(Math.atan2(y, x));
  bearing = (bearing + 360) % 360; // Normalize to 0-360

  return bearing;
}

/**
 * Provides a simple, offline approximation of magnetic declination.
 * This is a placeholder for a more complex model like WMM if higher accuracy is needed.
 * For many locations, this provides a "good enough" correction.
 * @returns An estimated magnetic declination in degrees. For simplicity, this returns 0.
 * A real implementation would have a more complex calculation or a lookup table.
 */
export function getMagneticDeclination(lat: number, lon: number): number {
  // Offline WMM-based declination (east-positive), best-effort.
  // If the model fails for any reason, fall back to 0.
  try {
    const model = geomagnetism.model(new Date());
    const point = model.point([lat, lon]);
    const decl = (point as unknown as { decl?: number })?.decl;
    return typeof decl === 'number' && Number.isFinite(decl) ? decl : 0;
  } catch {
    return 0;
  }
}

export function circularStdDevDeg(anglesDeg: number[]): number {
  if (anglesDeg.length === 0) return 0;
  const anglesRad = anglesDeg.map((a) => (a * Math.PI) / 180);
  const sinSum = anglesRad.reduce((s, a) => s + Math.sin(a), 0);
  const cosSum = anglesRad.reduce((s, a) => s + Math.cos(a), 0);
  const R = Math.sqrt(sinSum * sinSum + cosSum * cosSum) / anglesRad.length;
  // Circular standard deviation (radians): sqrt(-2 ln R)
  const stdRad = Math.sqrt(Math.max(0, -2 * Math.log(Math.max(R, 1e-12))));
  return (stdRad * 180) / Math.PI;
}

/**
 * Smooths compass data using a simple moving average.
 * @param newAngle - The latest angle reading from the compass.
 * @param buffer - The buffer of recent angle readings.
 * @param bufferSize - The size of the moving average buffer.
 * @returns The smoothed compass angle.
 */
export function smoothCompass(newAngle: number, buffer: number[], bufferSize: number): number {
  // Handle the circular nature of angles (e.g., 359 -> 1 degree)
  if (buffer.length > 0) {
    const lastAngle = buffer[buffer.length - 1];
    if (Math.abs(newAngle - lastAngle) > 180) {
      if (newAngle > lastAngle) {
        newAngle -= 360;
      } else {
        newAngle += 360;
      }
    }
  }

  buffer.push(newAngle);
  if (buffer.length > bufferSize) {
    buffer.shift();
  }

  const sum = buffer.reduce((acc, val) => acc + val, 0);
  const average = sum / buffer.length;

  return (average + 360) % 360; // Normalize back to 0-360
}
