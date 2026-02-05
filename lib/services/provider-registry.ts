import { ABFALL_IO_ASO_KEY } from '@/lib/config/constants';
import { getBAVApiService } from '@/lib/services/bav-api.service';
import { getAbfallIOService } from '@/lib/services/abfall-io.service';
import type { Location, WasteCalendarResponse } from '@/lib/types/bav-api.types';
import asoMappings from '@/lib/data/aso-location-mappings.json';

// ============================================================================
// Provider Enum and Types
// ============================================================================

/**
 * Available waste collection providers
 */
export enum WasteProvider {
  BAV = 'bav',
  ABFALL_IO_ASO = 'abfall_io_aso',
}

/**
 * Extended Location type with provider information
 */
export interface LocationWithProvider extends Location {
  provider: WasteProvider;
}

/**
 * Provider configuration
 */
export interface ProviderConfig {
  id: WasteProvider;
  name: string;
  description: string;
}

/**
 * Available provider configurations
 */
export const PROVIDERS: Record<WasteProvider, ProviderConfig> = {
  [WasteProvider.BAV]: {
    id: WasteProvider.BAV,
    name: 'BAV',
    description: 'Bergischer Abfallwirtschaftsverband',
  },
  [WasteProvider.ABFALL_IO_ASO]: {
    id: WasteProvider.ABFALL_IO_ASO,
    name: 'ASO',
    description: 'Abfall-Service Osterholz',
  },
};

// ============================================================================
// Location Registry
// ============================================================================

// In-memory cache for location-to-provider mapping
const locationProviderMap = new Map<string, WasteProvider>();

/**
 * Get ASO location names from the mappings file
 */
export function getASOLocationNames(): string[] {
  return Object.keys(asoMappings);
}

/**
 * Check if a location belongs to ASO (Osterholz)
 */
export function isASOLocation(locationName: string): boolean {
  const normalizedName = locationName.trim().toLowerCase();
  return getASOLocationNames().some(
    (name) => name.toLowerCase() === normalizedName
  );
}

/**
 * Register locations for a provider
 * This is called when locations are fetched to build the lookup map
 */
export function registerLocations(
  locations: Location[],
  provider: WasteProvider
): void {
  for (const location of locations) {
    const normalizedName = location.name.trim().toLowerCase();
    locationProviderMap.set(normalizedName, provider);
  }
}

/**
 * Resolve which provider serves a given location
 * @param locationName - Name of the location to look up
 * @returns The provider that serves this location
 * @throws Error if location is not found in any provider
 */
export function resolveProvider(locationName: string): WasteProvider {
  const normalizedName = locationName.trim().toLowerCase();

  // First check in-memory cache
  const cached = locationProviderMap.get(normalizedName);
  if (cached) {
    return cached;
  }

  // Check if it's an ASO location (from static mappings)
  if (isASOLocation(locationName)) {
    return WasteProvider.ABFALL_IO_ASO;
  }

  // Default to BAV for unknown locations
  // This maintains backward compatibility
  return WasteProvider.BAV;
}

// ============================================================================
// Unified Data Fetching
// ============================================================================

/**
 * Get all locations from all providers
 * Locations are tagged with their provider for later resolution
 */
export async function getAllLocations(): Promise<LocationWithProvider[]> {
  const bavService = getBAVApiService();

  // Fetch from both providers in parallel
  const [bavLocations, asoLocationNames] = await Promise.all([
    bavService.getLocations().catch((error) => {
      console.error('Failed to fetch BAV locations:', error);
      return [] as Location[];
    }),
    // ASO locations come from static mappings for now
    // This avoids an extra API call and is more reliable
    Promise.resolve(getASOLocationNames()),
  ]);

  // Register BAV locations
  registerLocations(bavLocations, WasteProvider.BAV);

  // Convert and tag locations
  const taggedBavLocations: LocationWithProvider[] = bavLocations.map((loc) => ({
    ...loc,
    provider: WasteProvider.BAV,
  }));

  // Create ASO locations from mappings
  const taggedAsoLocations: LocationWithProvider[] = asoLocationNames.map(
    (name, index) => ({
      id: 10000 + index, // Use high IDs to avoid collision with BAV
      name,
      provider: WasteProvider.ABFALL_IO_ASO,
    })
  );

  // Register ASO locations
  registerLocations(taggedAsoLocations, WasteProvider.ABFALL_IO_ASO);

  return [...taggedBavLocations, ...taggedAsoLocations];
}

/**
 * Get waste collection data for a location and street
 * Automatically resolves the correct provider
 * 
 * @param locationName - Name of the location
 * @param streetName - Name of the street
 * @param streetId - Optional street ID (if provided, skips expensive street lookup for ASO)
 * @param houseNumberId - Optional house number ID
 */
export async function getWasteCollectionData(
  locationName: string,
  streetName: string,
  streetId?: string,
  houseNumberId?: string
): Promise<WasteCalendarResponse> {
  const provider = resolveProvider(locationName);

  switch (provider) {
    case WasteProvider.BAV: {
      const bavService = getBAVApiService();
      return bavService.getWasteCollectionData(locationName, streetName);
    }

    case WasteProvider.ABFALL_IO_ASO: {
      const asoService = getAbfallIOService(ABFALL_IO_ASO_KEY);

      // Get the mapping for this location
      const mapping = (asoMappings as Record<string, { f_id_kommune: string; f_id_bezirk?: string }>)[locationName];

      if (!mapping) {
        throw new Error(`No mapping found for ASO location: ${locationName}`);
      }

      // If streetId is provided, use it directly (saves an API call!)
      if (streetId) {
        return asoService.getWasteCollectionData(
          mapping,
          streetId,
          locationName,
          streetName,
          houseNumberId
        );
      }

      // Fallback: look up street by name (requires fetching all streets)
      const streets = await asoService.getStreetsWithBezirk(
        mapping.f_id_kommune,
        mapping.f_id_bezirk
      );
      const street = streets.find(
        (s) => s.name.toLowerCase() === streetName.toLowerCase()
      );

      if (!street) {
        throw new Error(
          `Street "${streetName}" not found in ${locationName}`
        );
      }

      return asoService.getWasteCollectionData(
        mapping,
        street.id,
        locationName,
        streetName,
        houseNumberId
      );
    }

    default:
      throw new Error(`Unknown provider: ${provider}`);
  }
}

/**
 * Get available house numbers for a location and street
 * Returns empty array if no house number selection is required (e.g., for BAV)
 * 
 * @param locationName - Name of the location
 * @param streetName - Name of the street
 * @param streetId - Optional street ID (if provided, skips expensive street lookup for ASO)
 */
export async function getHouseNumbers(
  locationName: string,
  streetName: string,
  streetId?: string
): Promise<Array<{ id: string; name: string }>> {
  const provider = resolveProvider(locationName);

  switch (provider) {
    case WasteProvider.BAV: {
      // BAV doesn't require house number selection
      return [];
    }

    case WasteProvider.ABFALL_IO_ASO: {
      const asoService = getAbfallIOService(ABFALL_IO_ASO_KEY);

      // Get the mapping for this location
      const mapping = (asoMappings as Record<string, { f_id_kommune: string; f_id_bezirk?: string }>)[locationName];

      if (!mapping) {
        throw new Error(`No mapping found for ASO location: ${locationName}`);
      }

      // If streetId is provided, use it directly (saves an API call!)
      if (streetId) {
        return asoService.getHouseNumbers(
          mapping.f_id_kommune,
          streetId,
          mapping.f_id_bezirk
        );
      }

      // Fallback: look up street by name (requires fetching all streets)
      const streets = await asoService.getStreetsWithBezirk(
        mapping.f_id_kommune,
        mapping.f_id_bezirk
      );
      const street = streets.find(
        (s) => s.name.toLowerCase() === streetName.toLowerCase()
      );

      if (!street) {
        throw new Error(
          `Street "${streetName}" not found in ${locationName}`
        );
      }

      // Now get house numbers for this street
      return asoService.getHouseNumbers(
        mapping.f_id_kommune,
        street.id,
        mapping.f_id_bezirk
      );
    }

    default:
      throw new Error(`Unknown provider: ${provider}`);
  }
}

/**
 * Get streets for a location
 * Automatically resolves the correct provider
 */
export async function getStreets(
  locationName: string
): Promise<{ id: number | string; name: string }[]> {
  const provider = resolveProvider(locationName);

  switch (provider) {
    case WasteProvider.BAV: {
      const bavService = getBAVApiService();
      const location = await bavService.getLocationByName(locationName);
      return bavService.getStreets(location.id);
    }

    case WasteProvider.ABFALL_IO_ASO: {
      const asoService = getAbfallIOService(ABFALL_IO_ASO_KEY);

      // Get the mapping for this location
      const mapping = (asoMappings as Record<string, { f_id_kommune: string; f_id_bezirk?: string }>)[locationName];

      if (!mapping) {
        throw new Error(`No mapping found for ASO location: ${locationName}`);
      }

      // Use getStreetsWithBezirk to handle both cases (with and without bezirk)
      const streets = await asoService.getStreetsWithBezirk(
        mapping.f_id_kommune,
        mapping.f_id_bezirk
      );
      return streets.map((s) => ({
        id: s.id,
        name: s.name,
      }));
    }

    default:
      throw new Error(`Unknown provider: ${provider}`);
  }
}
