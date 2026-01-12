/**
 * =============================================================================
 * ETA CALCULATION UTILITIES
 * =============================================================================
 * 
 * Calculates distance and estimated arrival time between two points.
 * Uses Haversine formula for accurate distance on Earth's surface.
 */

/**
 * Calculate distance between two coordinates using Haversine formula
 * @param {number} lat1 - Latitude of point 1
 * @param {number} lon1 - Longitude of point 1
 * @param {number} lat2 - Latitude of point 2
 * @param {number} lon2 - Longitude of point 2
 * @returns {number} Distance in kilometers
 */
export function calculateDistance(lat1, lon1, lat2, lon2) {
  const R = 6371; // Earth's radius in kilometers
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  
  const a = 
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distance = R * c;
  
  return distance;
}

/**
 * Convert degrees to radians
 */
function toRad(deg) {
  return deg * (Math.PI / 180);
}

/**
 * Calculate ETA based on distance and speed
 * @param {number} distanceKm - Distance in kilometers
 * @param {number} speedKmh - Speed in km/h (0 means use default)
 * @returns {object} ETA info { minutes, formatted, distanceFormatted }
 */
export function calculateETA(distanceKm, speedKmh) {
  // Use default average speed if vehicle is stationary or speed unknown
  // Average city traffic speed ~25 km/h
  const effectiveSpeed = speedKmh > 5 ? speedKmh : 25;
  
  // Calculate time in hours, then convert to minutes
  const timeHours = distanceKm / effectiveSpeed;
  const timeMinutes = Math.round(timeHours * 60);
  
  return {
    minutes: timeMinutes,
    formatted: formatETA(timeMinutes),
    distanceFormatted: formatDistance(distanceKm),
    distanceKm,
    isEstimate: speedKmh <= 5, // Flag if using estimated speed
  };
}

/**
 * Format ETA for display
 * @param {number} minutes - Time in minutes
 * @returns {string} Formatted time string
 */
function formatETA(minutes) {
  if (minutes < 1) {
    return 'Less than 1 min';
  } else if (minutes < 60) {
    return `~${minutes} min`;
  } else {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (mins === 0) {
      return `~${hours} hr`;
    }
    return `~${hours} hr ${mins} min`;
  }
}

/**
 * Format distance for display
 * @param {number} km - Distance in kilometers
 * @returns {string} Formatted distance string
 */
function formatDistance(km) {
  if (km < 1) {
    const meters = Math.round(km * 1000);
    return `${meters} m`;
  } else {
    return `${km.toFixed(1)} km`;
  }
}

/**
 * Get ETA info between user location and vehicle
 * @param {object} userLocation - User's location { latitude, longitude }
 * @param {object} vehicleLocation - Vehicle's location { latitude, longitude, speed }
 * @returns {object|null} ETA info or null if locations invalid
 */
export function getVehicleETA(userLocation, vehicleLocation) {
  if (!userLocation || !vehicleLocation) {
    return null;
  }
  
  const distance = calculateDistance(
    userLocation.latitude,
    userLocation.longitude,
    vehicleLocation.latitude,
    vehicleLocation.longitude
  );
  
  // Speed from vehicle (convert m/s to km/h if needed)
  // Most GPS returns speed in m/s, but our app stores in km/h
  const speedKmh = vehicleLocation.speed || 0;
  
  return calculateETA(distance, speedKmh);
}
