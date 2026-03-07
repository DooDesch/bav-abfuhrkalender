/**
 * RSAG (Rhein-Sieg-Abfallwirtschaftsgesellschaft) – own API on rsag.de.
 * Each provider has its own service; this one is independent of BAV and AbfallIO.
 */

import { RSAG_API_BASE_URL } from '@/lib/config/constants';
import type {
  Location,
  Street,
  Fraction,
  Appointment,
  WasteCalendarResponse,
} from '@/lib/types/bav-api.types';
import type {
  RsagPickupFilterResponse,
  RsagPickupItem,
  RsagStreetFilterResponse,
} from '@/lib/types/rsag.types';
import { RSAGApiError } from '@/lib/types/rsag.types';

// 19 cities/municipalities in Rhein-Sieg-Kreis (from rsag.de/abfallkalender)
const RSAG_LOCATION_NAMES = [
  'Alfter',
  'Bad Honnef',
  'Bornheim',
  'Eitorf',
  'Hennef',
  'Königswinter',
  'Lohmar',
  'Meckenheim',
  'Much',
  'Neunkirchen-Seelscheid',
  'Niederkassel',
  'Rheinbach',
  'Ruppichteroth',
  'Sankt Augustin',
  'Siegburg',
  'Swisttal',
  'Troisdorf',
  'Wachtberg',
  'Windeck',
] as const;

const RSAG_ID_OFFSET = 20000; // avoid clashing with BAV/ASO ids
/** All RSAG Behälter filters – same as rsag.de (1,2,3,4,6,7,8 + Container 9–17) */
const ALL_RSAG_WASTETYPE_IDS = '1,2,3,4,6,7,8,9,10,11,12,13,14,15,16,17';
const ALL_MONTHS = '1,2,3,4,5,6,7,8,9,10,11,12';

let instance: RSAGService | null = null;

export function getRSAGService(): RSAGService {
  if (!instance) {
    instance = new RSAGService();
  }
  return instance;
}

export function getRSAGLocationNames(): string[] {
  return [...RSAG_LOCATION_NAMES];
}

export class RSAGService {
  private readonly baseUrl: string;

  constructor(baseUrl: string = RSAG_API_BASE_URL) {
    this.baseUrl = baseUrl.replace(/\/$/, '');
  }

  /**
   * Get all RSAG locations (static list of 19 municipalities).
   */
  async getLocations(): Promise<Location[]> {
    return RSAG_LOCATION_NAMES.map((name, index) => ({
      id: RSAG_ID_OFFSET + index,
      name,
    }));
  }

  /**
   * Get streets for a location via RSAG API: GET /api/street/filter/{locationId}.
   * locationId is 1-based index (1=Alfter, 2=Bad Honnef, … 17=Troisdorf).
   */
  async getStreets(locationName: string): Promise<{ id: string; name: string }[]> {
    const index = RSAG_LOCATION_NAMES.findIndex(
      (n) => n.toLowerCase() === locationName.trim().toLowerCase()
    );
    if (index < 0) return [];

    const locationId = index + 1;
    const url = `${this.baseUrl}/api/street/filter/${locationId}`;
    const response = await fetch(url, {
      next: { revalidate: 86400 },
      headers: { Accept: 'application/json' },
    });

    if (!response.ok) {
      throw new RSAGApiError(
        `RSAG street filter failed: ${response.statusText}`,
        response.status
      );
    }

    const data: unknown = await response.json();
    if (!Array.isArray(data)) {
      throw new RSAGApiError('Invalid RSAG street filter response', 502);
    }
    const list = data as RsagStreetFilterResponse;
    return list.map((item) => ({
      id: String(item.street_id),
      name: item.name,
    }));
  }

  /**
   * Fetch pickup dates from RSAG API.
   * Requests all wastetype IDs (1–18) so fractions match the full Behälter list on rsag.de.
   */
  private async fetchPickupFilter(
    streetId: string,
    wastetypeIds: string = ALL_RSAG_WASTETYPE_IDS,
    months: string = ALL_MONTHS
  ): Promise<RsagPickupFilterResponse> {
    const url = `${this.baseUrl}/api/pickup/filter/${encodeURIComponent(streetId)}/${wastetypeIds}/${months}`;
    const response = await fetch(url, {
      next: { revalidate: 3600 },
      headers: { Accept: 'application/json' },
    });

    if (!response.ok) {
      throw new RSAGApiError(
        `RSAG pickup API failed: ${response.statusText}`,
        response.status
      );
    }

    const data: unknown = await response.json();
    if (!Array.isArray(data)) {
      throw new RSAGApiError('Invalid RSAG pickup response', 502);
    }
    return data as RsagPickupFilterResponse;
  }

  /**
   * Map RSAG pickup response to appointments and unique fractions.
   */
  private mapPickupToAppointmentsAndFractions(
    response: RsagPickupFilterResponse
  ): { appointments: Appointment[]; fractions: Fraction[] } {
    const appointments: Appointment[] = [];
    const fractionMap = new Map<number, string>();

    for (const month of response) {
      for (const item of month.items as RsagPickupItem[]) {
        appointments.push({
          date: item.pickupdate,
          fractionName: item.wastetype_name,
          fractionId: item.wastetype_id,
        });
        if (!fractionMap.has(item.wastetype_id)) {
          fractionMap.set(item.wastetype_id, item.wastetype_name);
        }
      }
    }

    const fractions: Fraction[] = Array.from(fractionMap.entries()).map(
      ([id, name]) => ({
        id,
        name,
        color: getRSAGFractionColor(name),
      })
    );

    return { appointments, fractions };
  }

  /**
   * Get full waste collection data for a location and street.
   * streetId must be provided (from getStreets when available, or from client).
   */
  async getWasteCollectionData(
    locationName: string,
    streetName: string,
    streetId?: string,
    _houseNumberId?: string
  ): Promise<WasteCalendarResponse> {
    if (!streetId) {
      throw new RSAGApiError(
        'RSAG requires streetId; streets API not yet available – use browser DevTools on rsag.de/abfallkalender/abfuhrtermine to discover the streets endpoint',
        501
      );
    }

    const response = await this.fetchPickupFilter(streetId);
    const { appointments, fractions } =
      this.mapPickupToAppointmentsAndFractions(response);

    const streetIdNum = parseInt(streetId, 10) || RSAG_ID_OFFSET + 999;
    const locIndex = RSAG_LOCATION_NAMES.findIndex(
      (n) => n.toLowerCase() === locationName.toLowerCase()
    );
    const location: Location = {
      id: RSAG_ID_OFFSET + (locIndex >= 0 ? locIndex : 0),
      name: locationName,
    };
    const street: Street = {
      id: streetIdNum,
      name: streetName,
      locationId: location.id,
    };

    return {
      location,
      street,
      houseNumbers: [],
      fractions,
      appointments,
    };
  }

  /**
   * RSAG API does not expose house numbers; return empty array.
   */
  async getHouseNumbers(
    _locationName: string,
    _streetName: string,
    _streetId?: string
  ): Promise<Array<{ id: string; name: string }>> {
    return [];
  }
}

/**
 * Default color for a fraction by name (same mapping as ASO/abfall-io).
 * Used when the RSAG API does not provide color information.
 */
function getRSAGFractionColor(name: string): string {
  const lower = name.toLowerCase();
  if (lower.includes('gelb') || lower.includes('wertstoff')) return '#FFD700';
  if (lower.includes('bio') || lower.includes('grün')) return '#228B22';
  if (lower.includes('papier') || lower.includes('blau')) return '#4169E1';
  if (lower.includes('rest') || lower.includes('grau')) return '#808080';
  if (lower.includes('glas')) return '#90EE90';
  if (lower.includes('sperr')) return '#8B4513';
  return '#999999';
}
