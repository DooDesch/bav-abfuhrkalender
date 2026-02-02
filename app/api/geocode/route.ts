import { NextRequest, NextResponse } from 'next/server';
import { promises as fs } from 'fs';
import path from 'path';

// Path to the permanent coordinates cache file
const COORDS_CACHE_PATH = path.join(process.cwd(), 'lib/data/location-coords.json');

// In-memory cache for faster access during runtime
let memoryCache: Record<string, { lat: number; lng: number }> | null = null;

/**
 * Load coordinates cache from file
 */
async function loadCache(): Promise<Record<string, { lat: number; lng: number }>> {
  if (memoryCache) {
    return memoryCache;
  }

  try {
    const data = await fs.readFile(COORDS_CACHE_PATH, 'utf-8');
    memoryCache = JSON.parse(data);
    return memoryCache ?? {};
  } catch {
    // File doesn't exist or is invalid - start fresh
    memoryCache = {};
    return memoryCache;
  }
}

/**
 * Save coordinates to permanent cache file
 */
async function saveCache(cache: Record<string, { lat: number; lng: number }>): Promise<void> {
  memoryCache = cache;
  await fs.writeFile(COORDS_CACHE_PATH, JSON.stringify(cache, null, 2), 'utf-8');
}

/**
 * Fetch coordinates from OpenStreetMap Nominatim API
 */
async function fetchFromNominatim(locationName: string): Promise<{ lat: number; lng: number } | null> {
  // Add ", Germany" to improve accuracy for German locations
  const query = encodeURIComponent(`${locationName}, Germany`);
  const url = `https://nominatim.openstreetmap.org/search?q=${query}&format=json&limit=1`;

  try {
    const response = await fetch(url, {
      headers: {
        // Nominatim requires a valid User-Agent
        'User-Agent': 'Dein-Abfuhrkalender/1.0 (https://github.com/DooDesch)',
      },
    });

    if (!response.ok) {
      console.error(`Nominatim API error: ${response.status}`);
      return null;
    }

    const data = await response.json();
    
    if (data && data.length > 0) {
      return {
        lat: parseFloat(data[0].lat),
        lng: parseFloat(data[0].lon),
      };
    }

    return null;
  } catch (error) {
    console.error('Error fetching from Nominatim:', error);
    return null;
  }
}

/**
 * GET /api/geocode?location=LocationName
 * Returns coordinates for a location, using permanent cache
 */
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const locationName = searchParams.get('location');

  if (!locationName) {
    return NextResponse.json(
      { success: false, error: 'Location parameter is required' },
      { status: 400 }
    );
  }

  try {
    const cache = await loadCache();
    
    // Check cache first
    if (cache[locationName]) {
      return NextResponse.json({
        success: true,
        data: cache[locationName],
        cached: true,
      });
    }

    // Fetch from Nominatim
    const coords = await fetchFromNominatim(locationName);
    
    if (!coords) {
      return NextResponse.json(
        { success: false, error: `Could not geocode location: ${locationName}` },
        { status: 404 }
      );
    }

    // Save to permanent cache
    cache[locationName] = coords;
    await saveCache(cache);

    return NextResponse.json({
      success: true,
      data: coords,
      cached: false,
    });
  } catch (error) {
    console.error('Geocode error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to geocode location' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/geocode/batch
 * Batch geocode multiple locations at once
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const locations: string[] = body.locations;

    if (!locations || !Array.isArray(locations)) {
      return NextResponse.json(
        { success: false, error: 'Locations array is required' },
        { status: 400 }
      );
    }

    const cache = await loadCache();
    const results: Record<string, { lat: number; lng: number } | null> = {};
    const uncached: string[] = [];

    // First pass: check cache
    for (const loc of locations) {
      if (cache[loc]) {
        results[loc] = cache[loc];
      } else {
        uncached.push(loc);
      }
    }

    // Fetch uncached locations (with 1s delay between requests for rate limiting)
    for (const loc of uncached) {
      const coords = await fetchFromNominatim(loc);
      results[loc] = coords;
      
      if (coords) {
        cache[loc] = coords;
      }

      // Rate limit: 1 request per second for Nominatim
      if (uncached.indexOf(loc) < uncached.length - 1) {
        await new Promise(resolve => setTimeout(resolve, 1100));
      }
    }

    // Save updated cache
    if (uncached.length > 0) {
      await saveCache(cache);
    }

    return NextResponse.json({
      success: true,
      data: results,
      newlyCached: uncached.filter(loc => results[loc] !== null).length,
    });
  } catch (error) {
    console.error('Batch geocode error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to batch geocode locations' },
      { status: 500 }
    );
  }
}
