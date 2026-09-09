// Haversine distance in kilometers
export const calculateHaversineDistanceKm = (
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number => {
  const R = 6371; // Earth radius in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const d = R * c;
  return Math.round(d * 10) / 10; // 1 decimal place
};

// Realistic driving distance (road distance ~1.25x haversine in urban clusters)
export const calculateDrivingDistanceKm = (straightDistanceKm: number): number => {
  return Math.round(straightDistanceKm * 1.28 * 10) / 10;
};

// Driving ETA in minutes assuming average urban commercial speed ~22 km/h + 5 min buffer
export const calculateDrivingEtaMins = (drivingKm: number): number => {
  const hours = drivingKm / 22;
  return Math.max(8, Math.round(hours * 60 + 5));
};

// Get current collector location with fallback to Mumbai hub
export const getCurrentCollectorLocation = (): Promise<{
  lat: number;
  lng: number;
  areaName: string;
  source: 'gps' | 'fallback';
}> => {
  return new Promise((resolve) => {
    // Default Mumbai scrap hub
    const defaultLocation = {
      lat: 19.0415,
      lng: 72.8538,
      areaName: 'Dharavi Kabadi Cluster, Mumbai',
      source: 'fallback' as const,
    };

    if (typeof window === 'undefined' || !('geolocation' in navigator)) {
      resolve(defaultLocation);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        resolve({
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
          areaName: 'Current GPS Location',
          source: 'gps',
        });
      },
      () => {
        // Fallback on timeout or denied permission
        resolve(defaultLocation);
      },
      { timeout: 6000, enableHighAccuracy: true }
    );
  });
};

// Generate Google Maps navigation deep link
export const getGoogleMapsDirectionsUrl = (destLat: number, destLng: number, destName?: string): string => {
  const query = destName ? `${destLat},${destLng}+(${encodeURIComponent(destName)})` : `${destLat},${destLng}`;
  return `https://www.google.com/maps/dir/?api=1&destination=${query}&travelmode=driving`;
};

// Cleanly format address and city without redundancy (e.g. avoiding "Gangapur Varanasi Uttar Pradesh, Mumbai")
export const formatDisplayAddress = (address?: string, city?: string): string => {
  const addr = (address || '').trim();
  const c = (city || '').trim();
  if (!c) return addr;
  if (!addr) return c;
  if (addr.toLowerCase().includes(c.toLowerCase())) return addr;
  
  // If the address explicitly mentions another Indian city/state and city is default Mumbai, do not append Mumbai
  const otherLocations = [
    'varanasi', 'uttar pradesh', 'up', 'delhi', 'ncr', 'noida', 'gurugram', 
    'lucknow', 'pune', 'bengaluru', 'bangalore', 'chennai', 'kolkata', 
    'hyderabad', 'ahmedabad', 'surat', 'jaipur', 'kanpur', 'nagpur', 'indore', 'patna'
  ];
  const addrLower = addr.toLowerCase();
  const hasOtherLocation = otherLocations.some((loc) => addrLower.includes(loc));
  if (hasOtherLocation && c.toLowerCase() === 'mumbai') {
    return addr;
  }
  return `${addr}, ${c}`;
};

