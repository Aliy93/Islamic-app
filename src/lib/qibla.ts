// Kaaba location
const KAABA_LAT = 21.422487;
const KAABA_LON = 39.826206;

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
  // This is a highly simplified placeholder. A real implementation would use a model
  // like the World Magnetic Model (WMM) or a lookup table for better accuracy.
  // For this example, we will return 0, which means we are assuming magnetic north
  // is the same as true north. This can lead to inaccuracies.
  return 0;
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

  let sum = buffer.reduce((acc, val) => acc + val, 0);
  let average = sum / buffer.length;

  return (average + 360) % 360; // Normalize back to 0-360
}
