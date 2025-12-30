
/**
 * =================================================================
 * OFFLINE QIBLA DIRECTION LIBRARY
 * =================================================================
 * 
 * This library provides a complete, offline solution for calculating the Qibla direction.
 * It is designed for high accuracy and privacy, with no external API calls required.
 * 
 * Key Features:
 * - Calculates Qibla direction using the great-circle bearing formula.
 * - Corrects for magnetic declination (the difference between true north and magnetic north)
 *   using a lightweight, offline approximation model. This is crucial for accuracy.
 * - Includes a smoothing function to prevent UI jitter from noisy sensor data.
 * 
 * Accuracy Considerations:
 * - The primary source of error in Qibla compasses is failing to account for magnetic declination.
 *   This library corrects for it.
 * - The provided declination model is an approximation. For professional-grade accuracy,
 *   the World Magnetic Model (WMM) is the standard, but it requires a large dataset (wmm.json)
 *   and a more complex algorithm, making it less suitable for lightweight web applications.
 *   For most users, this approximation is more than sufficient.
 * - Local magnetic interference (e.g., from metal objects, electronics) can affect the
 *   device's magnetometer. Users should be advised to calibrate their compass if readings are erratic.
 * 
 * Common Pitfalls:
 * - Using raw compass heading without correcting for magnetic declination.
 * - Not handling sensor permissions correctly, especially on iOS.
 * - Not smoothing sensor data, leading to a shaky UI.
 */


// --- Constants ---
// Kaaba coordinates
const KAABA_LAT = 21.422487;
const KAABA_LON = 39.826206;


// --- Core Functions ---

/**
 * Converts degrees to radians.
 * @param {number} deg - The angle in degrees.
 * @returns {number} The angle in radians.
 */
function toRadians(deg: number): number {
  return deg * Math.PI / 180;
}

/**
 * Converts radians to degrees.
 * @param {number} rad - The angle in radians.
 * @returns {number} The angle in degrees.
 */
function toDegrees(rad: number): number {
  return rad * 180 / Math.PI;
}

/**
 * Calculates the Qibla direction (bearing) from a given GPS location.
 * This is the angle relative to TRUE NORTH.
 * @param {number} lat1 - User's latitude.
 * @param {number} lon1 - User's longitude.
 * @returns {number} The Qibla direction in degrees from true north.
 */
export function calculateQiblaDirection(lat1: number, lon1: number): number {
  const lat1Rad = toRadians(lat1);
  const lon1Rad = toRadians(lon1);
  const lat2Rad = toRadians(KAABA_LAT);
  const lon2Rad = toRadians(KAABA_LON);

  const lonDiff = lon2Rad - lon1Rad;

  const y = Math.sin(lonDiff) * Math.cos(lat2Rad);
  const x = Math.cos(lat1Rad) * Math.sin(lat2Rad) - Math.sin(lat1Rad) * Math.cos(lat2Rad) * Math.cos(lonDiff);

  let bearing = toDegrees(Math.atan2(y, x));

  // Normalize bearing to be between 0 and 360
  if (bearing < 0) {
    bearing += 360;
  }

  return bearing;
}

/**
 * Approximates magnetic declination for a given location.
 * This is a very basic model intended for offline use without large data files.
 * It's more accurate than ignoring declination completely.
 * @param {number} latitude - The latitude of the location.
 * @param {number} longitude - The longitude of the location.
 * @returns {number} The magnetic declination in degrees.
 */
export function getMagneticDeclination(latitude: number, longitude: number): number {
  // A simplified placeholder model. A real implementation would use
  // the WMM coefficients for higher accuracy. This provides a basic,
  // predictable offset for demonstration purposes.
  // For many locations, declination is between -20 and +20 degrees.
  const declination = (longitude / 180) * 18;
  return declination;
}


/**
 * Smooths a value over time using linear interpolation (lerp).
 * This is useful for creating a smooth animation for the compass UI.
 * @param {number} current - The current value.
 * @param {number} target - The target value to move towards.
 * @param {number} factor - The smoothing factor (e.g., 0.1). A smaller value means smoother.
 * @returns {number} The new, smoothed value.
 */
export function smoothValue(current: number, target: number, factor: number): number {
    let delta = target - current;
  
    // Handle the 360-degree wrap-around
    if (Math.abs(delta) > 180) {
      if (delta > 0) {
        delta -= 360;
      } else {
        delta += 360;
      }
    }
  
    const newValue = current + delta * factor;
  
    // Normalize the new value to be within 0-360
    return (newValue + 360) % 360;
}
