// BAV API Type Definitions (English)

/**
 * Available waste collection providers
 * Re-exported from provider-registry for convenience
 */
export type WasteProviderType = 'bav' | 'abfall_io_aso';

export interface Location {
  id: number;
  name: string;
  /** Provider identifier - indicates which API serves this location */
  provider?: WasteProviderType;
}

export interface Coordinates {
  lat: number;
  lng: number;
}

export interface LocationWithCoords extends Location {
  coords?: Coordinates;
  distance?: number; // Distance in km from user
}

export interface Street {
  id: number;
  name: string;
  locationId?: number;
  /** House numbers from API (e.g. hausNrList), when provided */
  houseNumbers?: HouseNumber[];
}

export interface HouseNumber {
  id: number;
  name: string;
  streetId?: number;
}

export interface Fraction {
  id: number;
  name: string;
  color?: string;
  icon?: string;
}

export interface Appointment {
  date: string; // ISO date string (YYYY-MM-DD)
  fractionName: string;
  fractionId: number;
}

export interface WasteCalendarResponse {
  location: Location;
  street: Street;
  houseNumbers: HouseNumber[];
  fractions: Fraction[];
  appointments: Appointment[];
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  cached?: boolean;
  cacheExpiresAt?: string;
  timestamp?: string;
}

export class BAVApiError extends Error {
  constructor(
    message: string,
    public statusCode: number = 500,
    public originalError?: unknown
  ) {
    super(message);
    this.name = 'BAVApiError';
  }
}
