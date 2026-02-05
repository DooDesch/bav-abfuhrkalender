// AbfallIO API Type Definitions
// Used for ASO (Abfall-Service Osterholz) and other abfall.io providers

/**
 * Parameters required for AbfallIO API requests
 */
export interface AbfallIOParams {
  /** Municipality/Kommune ID */
  f_id_kommune: string;
  /** Street ID */
  f_id_strasse: string;
  /** District/Bezirk ID (optional, some municipalities require this) */
  f_id_bezirk?: string;
  /** House number ID (optional) */
  f_id_strasse_hnr?: string;
  /** Waste type IDs (optional, fetches all if not specified) */
  f_abfallarten?: number[];
}

/**
 * Mapping for an AbfallIO location (municipality)
 * Used to map location names to their API IDs
 */
export interface AbfallIOLocationMapping {
  /** Display name of the location */
  name: string;
  /** Kommune ID for API requests */
  f_id_kommune: string;
  /** Bezirk ID if required by this municipality */
  f_id_bezirk?: string;
}

/**
 * Street data from AbfallIO API
 */
export interface AbfallIOStreet {
  /** Street ID (may be numeric string or combined with name) */
  id: string;
  /** Street display name */
  name: string;
  /** House number ID if specific house number was selected */
  hnrId?: string;
}

/**
 * Session data from AbfallIO init response
 * Contains hidden form fields needed for subsequent requests
 */
export interface AbfallIOSession {
  /** Session token (UUID key-value pair from hidden input) */
  token: Record<string, string>;
  /** Timestamp when session was created */
  createdAt: number;
}

/**
 * Configuration for an AbfallIO provider
 */
export interface AbfallIOProviderConfig {
  /** Unique identifier for this provider */
  id: string;
  /** Display name */
  name: string;
  /** API key for this provider */
  apiKey: string;
  /** Website URL */
  url: string;
}

/**
 * Error specific to AbfallIO API operations
 */
export class AbfallIOApiError extends Error {
  constructor(
    message: string,
    public statusCode: number = 500,
    public originalError?: unknown
  ) {
    super(message);
    this.name = 'AbfallIOApiError';
  }
}
