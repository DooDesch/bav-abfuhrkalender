import { BAV_API_BASE_URL } from '@/lib/config/constants';
import type {
  Location,
  Street,
  HouseNumber,
  Fraction,
  Appointment,
  WasteCalendarResponse,
} from '@/lib/types/bav-api.types';
import { BAVApiError } from '@/lib/types/bav-api.types';
import {
  parseLocations,
  parseStreets,
  parseFractions,
  parseAppointments,
  type StreetResponse,
  type FractionResponse,
  type AppointmentResponse,
} from '@/lib/schemas/bav-api.schemas';

// Singleton instance
let instance: BAVApiService | null = null;

/**
 * Get the singleton BAVApiService instance
 * This ensures we reuse the same instance across all calls
 */
export function getBAVApiService(): BAVApiService {
  if (!instance) {
    instance = new BAVApiService();
  }
  return instance;
}

export class BAVApiService {
  private readonly baseUrl: string;

  constructor(baseUrl: string = BAV_API_BASE_URL) {
    this.baseUrl = baseUrl;
  }

  /**
   * Get all available locations
   */
  async getLocations(): Promise<Location[]> {
    try {
      const response = await fetch(`${this.baseUrl}/orte`, {
        next: { revalidate: 3600 }, // Cache for 1 hour
      });

      if (!response.ok) {
        throw new BAVApiError(
          `Failed to fetch locations: ${response.statusText}`,
          response.status
        );
      }

      const data: unknown = await response.json();
      return parseLocations(data);
    } catch (error) {
      if (error instanceof BAVApiError) {
        throw error;
      }
      throw new BAVApiError(
        `Error fetching locations: ${error instanceof Error ? error.message : 'Unknown error'}`,
        500,
        error
      );
    }
  }

  /**
   * Find a location by name (case-insensitive)
   */
  async getLocationByName(name: string): Promise<Location> {
    const locations = await this.getLocations();
    const location = locations.find(
      (o) => o.name.toLowerCase() === name.toLowerCase()
    );

    if (!location) {
      throw new BAVApiError(`Location "${name}" not found`, 404);
    }

    return location;
  }

  /**
   * Get all streets for a specific location
   */
  async getStreets(locationId: number): Promise<Street[]> {
    try {
      // Use the correct endpoint format: /orte/{locationId}/strassen
      const url = `${this.baseUrl}/orte/${locationId}/strassen`;
      const response = await fetch(url, {
        next: { revalidate: 3600 }, // Cache for 1 hour
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const errorText = await response.text().catch(() => response.statusText);
        throw new BAVApiError(
          `Failed to fetch streets (${response.status}): ${errorText}. URL: ${url}`,
          response.status
        );
      }

      const data: unknown = await response.json();
      const parsedStreets = parseStreets(data);

      // Map the parsed response to our Street type
      return parsedStreets.map((item: StreetResponse) => {
        const rawHouseList = item.hausNrList ?? item.hausnummern ?? item.hausnummernList ?? [];
        const houseNumbers: HouseNumber[] = rawHouseList.map((entry, index) => ({
          id: entry.id ?? index,
          name: String(entry.name ?? entry.nummer ?? entry.hausnummer ?? entry.value ?? entry.id ?? ''),
          streetId: item.id,
        }));
        return {
          id: item.id,
          name: item.name,
          locationId: item.ort?.id ?? locationId,
          houseNumbers: houseNumbers.length > 0 ? houseNumbers : undefined,
        };
      });
    } catch (error) {
      if (error instanceof BAVApiError) {
        throw error;
      }
      throw new BAVApiError(
        `Error fetching streets: ${error instanceof Error ? error.message : 'Unknown error'}`,
        500,
        error
      );
    }
  }

  /**
   * Find a street by location ID and name (case-insensitive)
   */
  async getStreetByLocationAndName(
    locationId: number,
    streetName: string
  ): Promise<Street> {
    const streets = await this.getStreets(locationId);
    const street = streets.find(
      (s) => s.name.toLowerCase() === streetName.toLowerCase()
    );

    if (!street) {
      throw new BAVApiError(
        `Street "${streetName}" not found in location ${locationId}`,
        404
      );
    }

    return street;
  }

  /**
   * Get all house numbers for a specific street
   * Note: The API doesn't provide a separate endpoint for house numbers.
   * They are included in the streets response (hausNrList field), but often empty.
   * For now, we return an empty array as the API structure doesn't require house numbers
   * for fetching collection dates.
   */
  async getHouseNumbersByStreet(
    streetId: number
  ): Promise<HouseNumber[]> {
    // The API doesn't provide house numbers separately
    // Collection dates can be fetched directly by streetId
    // Return empty array for now
    return [];
  }

  /**
   * Get all waste fractions
   */
  async getFractions(): Promise<Fraction[]> {
    try {
      const response = await fetch(`${this.baseUrl}/fraktionen`, {
        next: { revalidate: 3600 }, // Cache for 1 hour
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const errorText = await response.text().catch(() => response.statusText);
        throw new BAVApiError(
          `Failed to fetch fractions (${response.status}): ${errorText}`,
          response.status
        );
      }

      const data: unknown = await response.json();
      const parsedFractions = parseFractions(data);

      // Map the API response to our Fraction type
      // API uses farbeRgb (hex without #), we convert to color with #
      return parsedFractions.map((item: FractionResponse) => ({
        id: item.id,
        name: item.name,
        color: item.farbeRgb ? `#${item.farbeRgb}` : undefined,
        icon: item.iconNr ? String(item.iconNr) : undefined,
      }));
    } catch (error) {
      if (error instanceof BAVApiError) {
        throw error;
      }
      throw new BAVApiError(
        `Error fetching fractions: ${error instanceof Error ? error.message : 'Unknown error'}`,
        500,
        error
      );
    }
  }

  /**
   * Get collection dates for a specific street
   */
  async getCollectionDates(
    streetId: number,
    _houseNumberId?: number
  ): Promise<Appointment[]> {
    try {
      // Use the correct endpoint format: /strassen/{streetId}/termine
      const url = `${this.baseUrl}/strassen/${streetId}/termine`;
      const response = await fetch(url, {
        next: { revalidate: 3600 }, // Cache for 1 hour
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const errorText = await response.text().catch(() => response.statusText);
        throw new BAVApiError(
          `Failed to fetch collection dates (${response.status}): ${errorText}. URL: ${url}`,
          response.status
        );
      }

      const data: unknown = await response.json();
      const parsedAppointments = parseAppointments(data);

      // Map the API response to our Appointment type
      return parsedAppointments.map((item: AppointmentResponse) => ({
        date: item.datum,
        fractionName: '', // Will be filled from fractions
        fractionId: item.bezirk?.fraktionId ?? 0,
      }));
    } catch (error) {
      if (error instanceof BAVApiError) {
        throw error;
      }
      throw new BAVApiError(
        `Error fetching collection dates: ${error instanceof Error ? error.message : 'Unknown error'}`,
        500,
        error
      );
    }
  }

  /**
   * Get complete waste collection calendar data for a specific location and street
   */
  async getWasteCollectionData(
    locationName: string,
    streetName: string
  ): Promise<WasteCalendarResponse> {
    const location = await this.getLocationByName(locationName);
    const street = await this.getStreetByLocationAndName(location.id, streetName);

    // House numbers come from the street object (API may provide hausNrList in streets response)
    const houseNumbers = street.houseNumbers ?? [];

    // Get fractions and collection dates in parallel
    const [fractions, collectionDates] = await Promise.all([
      this.getFractions(),
      this.getCollectionDates(street.id),
    ]);

    // Map fraction names to collection dates
    const fractionsMap = new Map(
      fractions.map((f) => [f.id, f.name])
    );
    const appointmentsWithFraction = collectionDates.map((t) => ({
      ...t,
      fractionName: fractionsMap.get(t.fractionId) || 'Unknown',
    }));

    return {
      location,
      street,
      houseNumbers,
      fractions,
      appointments: appointmentsWithFraction,
    };
  }
}
