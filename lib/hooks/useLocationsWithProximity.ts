'use client';

import { useState, useEffect, useMemo } from 'react';
import { useLocations } from './useLocations';
import type { Location, LocationWithCoords, Coordinates } from '@/lib/types/bav-api.types';

// Session storage keys for caching
const USER_COORDS_CACHE_KEY = 'bav-user-coords';
const LOCATION_COORDS_CACHE_KEY = 'bav-location-coords';
const CACHE_TTL_MS = 10 * 60 * 1000; // 10 minutes

// Module-level cache to prevent re-fetching across component remounts
let moduleUserCoords: Coordinates | null = null;
let moduleUserCoordsLoaded = false;
let moduleLocationCoords: Record<string, Coordinates | null> = {};
let moduleLocationCoordsLoaded = false;
// Pending request promise to prevent duplicate concurrent fetches
let pendingCoordsRequest: Promise<Record<string, Coordinates | null>> | null = null;

interface CachedData<T> {
  data: T;
  timestamp: number;
}

/**
 * Get cached data from sessionStorage
 */
function getCachedData<T>(key: string): T | null {
  if (typeof window === 'undefined') return null;
  try {
    const cached = sessionStorage.getItem(key);
    if (!cached) return null;
    const { data, timestamp } = JSON.parse(cached) as CachedData<T>;
    // Check if cache is still valid
    if (Date.now() - timestamp < CACHE_TTL_MS) {
      return data;
    }
    sessionStorage.removeItem(key);
    return null;
  } catch {
    return null;
  }
}

/**
 * Save data to sessionStorage cache
 */
function setCachedData<T>(key: string, data: T): void {
  if (typeof window === 'undefined') return;
  try {
    const cached: CachedData<T> = { data, timestamp: Date.now() };
    sessionStorage.setItem(key, JSON.stringify(cached));
  } catch {
    // Ignore storage errors
  }
}

/**
 * Calculate distance between two coordinates using Haversine formula
 * @returns Distance in kilometers
 */
function getDistanceKm(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371; // Earth radius in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

/**
 * Fetch coordinates for multiple locations via batch API
 * Returns cached data if available, prevents duplicate concurrent requests
 */
async function fetchCoordinates(
  locations: Location[]
): Promise<Record<string, Coordinates | null>> {
  // Check module cache first
  if (moduleLocationCoordsLoaded && Object.keys(moduleLocationCoords).length > 0) {
    return moduleLocationCoords;
  }

  // Check sessionStorage cache
  const cached = getCachedData<Record<string, Coordinates | null>>(LOCATION_COORDS_CACHE_KEY);
  if (cached && Object.keys(cached).length > 0) {
    moduleLocationCoords = cached;
    moduleLocationCoordsLoaded = true;
    return cached;
  }

  // If there's already a pending request, wait for it
  if (pendingCoordsRequest) {
    return pendingCoordsRequest;
  }

  // Create and store the pending request
  pendingCoordsRequest = (async () => {
    try {
      const response = await fetch('/api/geocode', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ locations: locations.map((l) => l.name) }),
      });

      const data = await response.json();
      if (data.success) {
        // Cache the results
        moduleLocationCoords = data.data;
        moduleLocationCoordsLoaded = true;
        setCachedData(LOCATION_COORDS_CACHE_KEY, data.data);
        return data.data;
      }
      return {};
    } catch (error) {
      console.error('Failed to fetch coordinates:', error);
      return {};
    } finally {
      pendingCoordsRequest = null;
    }
  })();

  return pendingCoordsRequest;
}

/**
 * Get user's current position via Browser Geolocation API
 * Returns cached position if available
 */
async function getUserPosition(): Promise<Coordinates | null> {
  // Check module cache first (avoids repeated geolocation prompts)
  if (moduleUserCoordsLoaded) {
    return moduleUserCoords;
  }

  // Check sessionStorage cache
  const cached = getCachedData<Coordinates>(USER_COORDS_CACHE_KEY);
  if (cached) {
    moduleUserCoords = cached;
    moduleUserCoordsLoaded = true;
    return cached;
  }

  return new Promise((resolve) => {
    if (typeof navigator === 'undefined' || !navigator.geolocation) {
      moduleUserCoordsLoaded = true;
      resolve(null);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const coords: Coordinates = {
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        };
        // Cache the results
        moduleUserCoords = coords;
        moduleUserCoordsLoaded = true;
        setCachedData(USER_COORDS_CACHE_KEY, coords);
        resolve(coords);
      },
      (error) => {
        console.log('Geolocation denied or failed:', error.message);
        moduleUserCoordsLoaded = true;
        resolve(null);
      },
      {
        enableHighAccuracy: false,
        timeout: 5000,
        maximumAge: 300000, // Browser cache for 5 minutes
      }
    );
  });
}

interface UseLocationsWithProximityReturn {
  /** Locations sorted by proximity (nearest first), with nearest 5 repeated */
  locations: LocationWithCoords[];
  /** Original locations without proximity sorting */
  originalLocations: Location[];
  /** The nearest location to the user (if geolocation available) */
  nearestLocation: LocationWithCoords | null;
  /** Whether location data is still loading */
  isLoading: boolean;
  /** Whether geolocation is being fetched */
  isGeolocating: boolean;
  /** User's coordinates if available */
  userCoords: Coordinates | null;
  /** Error if request failed */
  error: Error | undefined;
  /** Trigger geolocation request (only needed if autoRequest is false) */
  requestGeolocation: () => void;
}

interface UseLocationsWithProximityOptions {
  /** Whether to automatically request geolocation on mount (default: false) */
  autoRequestGeolocation?: boolean;
}

/**
 * Hook that returns locations sorted by proximity to user
 * Falls back to alphabetical order if geolocation is denied
 * Uses module-level and sessionStorage caching to prevent re-fetching on navigation
 */
export function useLocationsWithProximity(
  options: UseLocationsWithProximityOptions = {}
): UseLocationsWithProximityReturn {
  const { autoRequestGeolocation = false } = options;
  
  const { locations: originalLocations, isLoading, error } = useLocations();
  // Initialize from module cache if available
  const [userCoords, setUserCoords] = useState<Coordinates | null>(() => moduleUserCoords);
  const [locationCoords, setLocationCoords] = useState<Record<string, Coordinates | null>>(
    () => moduleLocationCoords
  );
  const [isGeolocating, setIsGeolocating] = useState(false);
  const [coordsLoaded, setCoordsLoaded] = useState(() => moduleLocationCoordsLoaded);
  const [geolocationRequested, setGeolocationRequested] = useState(false);

  // Function to manually trigger geolocation
  const requestGeolocation = () => {
    // If already loaded from cache, just use cached data
    if (moduleUserCoordsLoaded) {
      setUserCoords(moduleUserCoords);
      return;
    }
    setGeolocationRequested(true);
  };

  // Get user's position when requested (or auto-request, or from cache)
  useEffect(() => {
    // If already loaded from module cache, use it immediately
    if (moduleUserCoordsLoaded) {
      setUserCoords(moduleUserCoords);
      setIsGeolocating(false);
      return;
    }

    // Only fetch if auto-request is enabled or manually requested
    if (!autoRequestGeolocation && !geolocationRequested) {
      return;
    }

    let mounted = true;
    setIsGeolocating(true);

    getUserPosition().then((coords) => {
      if (mounted) {
        setUserCoords(coords);
        setIsGeolocating(false);
      }
    });

    return () => {
      mounted = false;
    };
  }, [autoRequestGeolocation, geolocationRequested]);

  // Fetch coordinates for all locations once they're loaded (uses cache if available)
  useEffect(() => {
    if (originalLocations.length === 0) return;

    // Skip if already loaded from module cache
    if (moduleLocationCoordsLoaded && Object.keys(moduleLocationCoords).length > 0) {
      setLocationCoords(moduleLocationCoords);
      setCoordsLoaded(true);
      return;
    }

    if (coordsLoaded) return;

    let mounted = true;

    fetchCoordinates(originalLocations).then((coords) => {
      if (mounted) {
        setLocationCoords(coords);
        setCoordsLoaded(true);
      }
    });

    return () => {
      mounted = false;
    };
  }, [originalLocations, coordsLoaded]);

  // Calculate sorted locations with distances
  const { sortedLocations, nearestLocation } = useMemo(() => {
    if (originalLocations.length === 0) {
      return { sortedLocations: [], nearestLocation: null };
    }

    // Add coordinates and distances to locations
    const locationsWithCoords: LocationWithCoords[] = originalLocations.map((loc) => {
      const coords = locationCoords[loc.name];
      let distance: number | undefined;

      if (coords && userCoords) {
        distance = getDistanceKm(userCoords.lat, userCoords.lng, coords.lat, coords.lng);
      }

      return {
        ...loc,
        coords: coords ?? undefined,
        distance,
      };
    });

    // If no user coords, return alphabetically sorted (original order)
    if (!userCoords) {
      return { sortedLocations: locationsWithCoords, nearestLocation: null };
    }

    // If coords aren't loaded yet, don't calculate nearest (avoid race condition)
    // Return alphabetical order temporarily, nearestLocation will be null
    if (!coordsLoaded) {
      return { sortedLocations: locationsWithCoords, nearestLocation: null };
    }

    // Sort by distance (locations without coords go to end)
    const sorted = [...locationsWithCoords].sort((a, b) => {
      if (a.distance === undefined && b.distance === undefined) return 0;
      if (a.distance === undefined) return 1;
      if (b.distance === undefined) return -1;
      return a.distance - b.distance;
    });

    // Get nearest location (only if it has a valid distance)
    const nearest = sorted[0]?.distance !== undefined ? sorted[0] : null;

    // Get nearest 5 locations
    const nearest5 = sorted.slice(0, 5);
    const rest = sorted.slice(5);

    // Create final array: nearest 5 repeated 4 times, then the rest
    // This ensures the user sees their nearby locations prominently
    const repeated = [...nearest5, ...nearest5, ...nearest5, ...nearest5];
    
    return { 
      sortedLocations: [...repeated, ...rest], 
      nearestLocation: nearest 
    };
  }, [originalLocations, locationCoords, userCoords, coordsLoaded]);

  return {
    locations: sortedLocations,
    originalLocations,
    nearestLocation,
    isLoading: isLoading || (!coordsLoaded && originalLocations.length > 0),
    isGeolocating,
    userCoords,
    error,
    requestGeolocation,
  };
}
