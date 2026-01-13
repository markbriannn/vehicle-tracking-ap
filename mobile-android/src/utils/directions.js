/**
 * =============================================================================
 * DIRECTIONS UTILITY
 * =============================================================================
 * 
 * Fetches route directions using OSRM (free, no API key needed)
 * Falls back to straight line if service unavailable
 */

/**
 * Decode polyline from OSRM response
 * OSRM uses polyline encoding (similar to Google's)
 */
function decodePolyline(encoded) {
  const points = [];
  let index = 0;
  let lat = 0;
  let lng = 0;

  while (index < encoded.length) {
    let shift = 0;
    let result = 0;
    let byte;

    do {
      byte = encoded.charCodeAt(index++) - 63;
      result |= (byte & 0x1f) << shift;
      shift += 5;
    } while (byte >= 0x20);

    const dlat = result & 1 ? ~(result >> 1) : result >> 1;
    lat += dlat;

    shift = 0;
    result = 0;

    do {
      byte = encoded.charCodeAt(index++) - 63;
      result |= (byte & 0x1f) << shift;
      shift += 5;
    } while (byte >= 0x20);

    const dlng = result & 1 ? ~(result >> 1) : result >> 1;
    lng += dlng;

    points.push({
      latitude: lat / 1e5,
      longitude: lng / 1e5,
    });
  }

  return points;
}

/**
 * Get route between two points using OSRM
 * @param {Object} start - { latitude, longitude }
 * @param {Object} end - { latitude, longitude }
 * @returns {Object} - { coordinates, distance, duration, summary }
 */
export async function getRoute(start, end) {
  try {
    // OSRM public demo server (free, no API key)
    const url = `https://router.project-osrm.org/route/v1/driving/${start.longitude},${start.latitude};${end.longitude},${end.latitude}?overview=full&geometries=polyline`;
    
    const response = await fetch(url);
    const data = await response.json();
    
    if (data.code !== 'Ok' || !data.routes || data.routes.length === 0) {
      console.warn('OSRM returned no routes, using fallback');
      return getFallbackRoute(start, end);
    }
    
    const route = data.routes[0];
    const coordinates = decodePolyline(route.geometry);
    
    return {
      coordinates,
      distance: route.distance, // meters
      duration: route.duration, // seconds
      summary: formatRouteSummary(route.distance, route.duration),
    };
  } catch (error) {
    console.error('Failed to get route from OSRM:', error);
    return getFallbackRoute(start, end);
  }
}

/**
 * Fallback: straight line between points
 */
function getFallbackRoute(start, end) {
  const distance = calculateDistance(
    start.latitude, start.longitude,
    end.latitude, end.longitude
  );
  
  // Estimate duration at 40 km/h average
  const duration = (distance / 1000) / 40 * 3600;
  
  return {
    coordinates: [
      { latitude: start.latitude, longitude: start.longitude },
      { latitude: end.latitude, longitude: end.longitude },
    ],
    distance,
    duration,
    summary: formatRouteSummary(distance, duration),
    isFallback: true,
  };
}

/**
 * Calculate distance between two points (Haversine formula)
 */
function calculateDistance(lat1, lon1, lat2, lon2) {
  const R = 6371000; // Earth's radius in meters
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

function toRad(deg) {
  return deg * (Math.PI / 180);
}

/**
 * Format route summary
 */
function formatRouteSummary(distanceMeters, durationSeconds) {
  const km = (distanceMeters / 1000).toFixed(1);
  const hours = Math.floor(durationSeconds / 3600);
  const minutes = Math.round((durationSeconds % 3600) / 60);
  
  let timeStr = '';
  if (hours > 0) {
    timeStr = `${hours}h ${minutes}min`;
  } else {
    timeStr = `${minutes} min`;
  }
  
  return `${km} km • ${timeStr}`;
}

export { calculateDistance, formatRouteSummary };
