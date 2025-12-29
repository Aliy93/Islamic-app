// Kaaba location
const KAABA_LAT = 21.4225;
const KAABA_LON = 39.8262;

function toRadians(degrees: number): number {
  return degrees * (Math.PI / 180);
}

function toDegrees(radians: number): number {
  return radians * (180 / Math.PI);
}

export function calculateQiblaDirection(lat: number, lon: number): number {
  const userLatRad = toRadians(lat);
  const userLonRad = toRadians(lon);
  const kaabaLatRad = toRadians(KAABA_LAT);
  const kaabaLonRad = toRadians(KAABA_LON);

  const lonDiff = kaabaLonRad - userLonRad;

  const y = Math.sin(lonDiff) * Math.cos(kaabaLatRad);
  const x = Math.cos(userLatRad) * Math.sin(kaabaLatRad) - 
            Math.sin(userLatRad) * Math.cos(kaabaLatRad) * Math.cos(lonDiff);

  let angle = toDegrees(Math.atan2(y, x));
  
  // Normalize to 0-360
  return (angle + 360) % 360;
}
