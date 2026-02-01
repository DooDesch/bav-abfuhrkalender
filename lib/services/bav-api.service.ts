import {
  BAV_API_BASE_URL,
  ORT_ID_WERMELSKIRCHEN,
} from '@/lib/config/constants';
import type {
  Ort,
  Strasse,
  Hausnummer,
  Fraktion,
  Termin,
  AbfuhrkalenderResponse,
} from '@/lib/types/bav-api.types';
import { BAVApiError } from '@/lib/types/bav-api.types';

export class BAVApiService {
  private baseUrl: string;

  constructor(baseUrl: string = BAV_API_BASE_URL) {
    this.baseUrl = baseUrl;
  }

  /**
   * Get all available locations (Orte)
   */
  async getLocations(): Promise<Ort[]> {
    try {
      const response = await fetch(`${this.baseUrl}/orte`, {
        next: { revalidate: 3600 }, // Cache for 1 hour
      });

      if (!response.ok) {
        throw new BAVApiError(
          `Failed to fetch Orte: ${response.statusText}`,
          response.status
        );
      }

      return await response.json();
    } catch (error) {
      if (error instanceof BAVApiError) {
        throw error;
      }
      throw new BAVApiError(
        `Error fetching Orte: ${error instanceof Error ? error.message : 'Unknown error'}`,
        500,
        error
      );
    }
  }

  /**
   * Find a location by name (case-insensitive)
   */
  async getLocationByName(name: string): Promise<Ort> {
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
  async getStreets(locationId: number): Promise<Strasse[]> {
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

      const data = await response.json();
      if (!Array.isArray(data)) {
        throw new BAVApiError(
          `Invalid response format from streets endpoint: expected array, got ${typeof data}`,
          500
        );
      }

      // Map the response to our Strasse type (API returns more fields)
      return data.map((item: any) => ({
        id: item.id,
        name: item.name,
        ortId: item.ort?.id || locationId,
      }));
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
  ): Promise<Strasse> {
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
  ): Promise<Hausnummer[]> {
    // The API doesn't provide house numbers separately
    // Collection dates can be fetched directly by streetId
    // Return empty array for now
    return [];
  }

  /**
   * Get all waste fractions
   */
  async getFractions(): Promise<Fraktion[]> {
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

      const data = await response.json();
      if (!Array.isArray(data)) {
        throw new BAVApiError(
          `Invalid response format from fractions endpoint: expected array, got ${typeof data}`,
          500
        );
      }

      // Map the API response to our Fraktion type
      // API uses farbeRgb (hex without #), we convert to color with #
      return data.map((item: any) => ({
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
    houseNumberId?: number
  ): Promise<Termin[]> {
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

      const data = await response.json();
      if (!Array.isArray(data)) {
        throw new BAVApiError(
          `Invalid response format from collection dates endpoint: expected array, got ${typeof data}`,
          500
        );
      }

      // Map the API response to our Termin type
      return data.map((item: any) => ({
        datum: item.datum,
        fraktion: '', // Will be filled from fractions
        fraktionId: item.bezirk?.fraktionId || 0,
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
    locationId: number,
    streetName: string
  ): Promise<AbfuhrkalenderResponse> {
    // Get location
    const location = await this.getLocationByName('Wermelskirchen');
    if (location.id !== locationId) {
      throw new BAVApiError(
        `Location ID mismatch: expected ${locationId}, got ${location.id}`,
        400
      );
    }

    // Get street
    const street = await this.getStreetByLocationAndName(locationId, streetName);

    // Get all related data in parallel
    const [houseNumbers, fractions, collectionDates] = await Promise.all([
      this.getHouseNumbersByStreet(street.id),
      this.getFractions(),
      this.getCollectionDates(street.id),
    ]);

    // Map fraction names to collection dates
    const fractionsMap = new Map(
      fractions.map((f) => [f.id, f.name])
    );
    const appointmentsWithFraction = collectionDates.map((t) => ({
      ...t,
      fraktion: fractionsMap.get(t.fraktionId) || 'Unknown',
    }));

    return {
      ort: location,
      strasse: street,
      hausnummern: houseNumbers,
      fraktionen: fractions,
      termine: appointmentsWithFraction,
    };
  }
}
