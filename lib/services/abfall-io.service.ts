import {
  ABFALL_IO_BASE_URL,
  ABFALL_IO_MODUS_KEY,
  ABFALL_IO_SESSION_TTL,
} from '@/lib/config/constants';
import type {
  AbfallIOParams,
  AbfallIOSession,
  AbfallIOStreet,
} from '@/lib/types/abfall-io.types';
import { AbfallIOApiError } from '@/lib/types/abfall-io.types';
import type {
  Location,
  Street,
  Fraction,
  Appointment,
  WasteCalendarResponse,
} from '@/lib/types/bav-api.types';
import {
  parseHiddenInputs,
  extractSessionToken,
  parseSelectOptions,
  parseHtmlAppointments,
  extractFractionsFromAppointments,
  type SelectOption,
} from '@/lib/schemas/abfall-io.schemas';
import { cacheService } from '@/lib/services/cache.service';

// User agent to mimic browser requests
const HEADERS = {
  'User-Agent':
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  'Content-Type': 'application/x-www-form-urlencoded',
  Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
};

// Singleton instance
let instance: AbfallIOService | null = null;

/**
 * Get the singleton AbfallIOService instance
 */
export function getAbfallIOService(apiKey: string): AbfallIOService {
  if (!instance || instance.apiKey !== apiKey) {
    instance = new AbfallIOService(apiKey);
  }
  return instance;
}

/**
 * Service for interacting with the AbfallIO API
 * Handles session management, location/street lookup, and calendar data
 */
export class AbfallIOService {
  public readonly apiKey: string;
  private readonly baseUrl: string;
  private readonly modusKey: string;

  constructor(
    apiKey: string,
    baseUrl: string = ABFALL_IO_BASE_URL,
    modusKey: string = ABFALL_IO_MODUS_KEY
  ) {
    this.apiKey = apiKey;
    this.baseUrl = baseUrl;
    this.modusKey = modusKey;
  }

  /**
   * Build URL with query parameters for API requests
   */
  private buildUrl(waction: string): string {
    const params = new URLSearchParams({
      key: this.apiKey,
      modus: this.modusKey,
      waction,
    });
    return `${this.baseUrl}?${params.toString()}`;
  }

  /**
   * Get cache key for session token
   */
  private getSessionCacheKey(): string {
    return `abfall-io:session:${this.apiKey}`;
  }

  /**
   * Initialize a session with the AbfallIO API
   * Returns hidden form fields including session token
   */
  private async initSession(): Promise<AbfallIOSession> {
    const cacheKey = this.getSessionCacheKey();

    // Check cache first
    const cached = cacheService.get<AbfallIOSession>(cacheKey);
    if (cached && Date.now() - cached.createdAt < ABFALL_IO_SESSION_TTL * 1000) {
      return cached;
    }

    try {
      const response = await fetch(this.buildUrl('init'), {
        method: 'POST',
        headers: HEADERS,
      });

      if (!response.ok) {
        throw new AbfallIOApiError(
          `Failed to initialize session: ${response.statusText}`,
          response.status
        );
      }

      const html = await response.text();
      const hiddenInputs = parseHiddenInputs(html);
      const session = extractSessionToken(hiddenInputs);

      // Cache the session
      cacheService.set(cacheKey, session, ABFALL_IO_SESSION_TTL);

      return session;
    } catch (error) {
      if (error instanceof AbfallIOApiError) {
        throw error;
      }
      throw new AbfallIOApiError(
        `Error initializing session: ${error instanceof Error ? error.message : 'Unknown error'}`,
        500,
        error
      );
    }
  }

  /**
   * Get available locations (municipalities) from the init response
   * Note: AbfallIO returns locations as select options in the HTML response
   */
  async getLocations(): Promise<Location[]> {
    try {
      const response = await fetch(this.buildUrl('init'), {
        method: 'POST',
        headers: HEADERS,
      });

      if (!response.ok) {
        throw new AbfallIOApiError(
          `Failed to fetch locations: ${response.statusText}`,
          response.status
        );
      }

      const html = await response.text();

      // Extract select options for kommune/gemeinde
      const options = parseSelectOptions(html, 'f_id_kommune');

      // Convert to Location format
      // The value is used as ID (converted to number via hash for compatibility)
      return options.map((opt, index) => ({
        id: index + 1, // Simple sequential ID for internal use
        name: opt.label,
        // Store the actual kommune ID in a way we can retrieve it
        // This will be handled by the location mappings
      }));
    } catch (error) {
      if (error instanceof AbfallIOApiError) {
        throw error;
      }
      throw new AbfallIOApiError(
        `Error fetching locations: ${error instanceof Error ? error.message : 'Unknown error'}`,
        500,
        error
      );
    }
  }

  /**
   * Get streets for a specific kommune
   * @param kommuneId - The f_id_kommune value
   */
  async getStreets(kommuneId: string): Promise<AbfallIOStreet[]> {
    try {
      const session = await this.initSession();

      const formData = new URLSearchParams();

      // Add session token
      for (const [key, value] of Object.entries(session.token)) {
        formData.append(key, value);
      }

      formData.append('f_id_kommune', kommuneId);

      const response = await fetch(this.buildUrl('auswahl_kommune_set'), {
        method: 'POST',
        headers: HEADERS,
        body: formData.toString(),
      });

      if (!response.ok) {
        throw new AbfallIOApiError(
          `Failed to fetch streets: ${response.statusText}`,
          response.status
        );
      }

      const html = await response.text();

      // Try to parse f_id_strasse first (for kommunen without bezirke)
      let options = parseSelectOptions(html, 'f_id_strasse');

      // If no streets found, this kommune might have bezirke
      // Return bezirke options instead (caller should use getStreetsWithBezirk)
      if (options.length === 0) {
        options = parseSelectOptions(html, 'f_id_bezirk');
      }

      return options.map((opt) => ({
        id: opt.value,
        name: opt.label,
      }));
    } catch (error) {
      if (error instanceof AbfallIOApiError) {
        throw error;
      }
      throw new AbfallIOApiError(
        `Error fetching streets: ${error instanceof Error ? error.message : 'Unknown error'}`,
        500,
        error
      );
    }
  }

  /**
   * Helper method to make a POST request with session token
   * Updates the session token from the response
   */
  private async postWithSession(
    waction: string,
    params: Record<string, string>,
    currentToken: Record<string, string>
  ): Promise<{ html: string; token: Record<string, string> }> {
    const formData = new URLSearchParams();

    // Add session token first
    for (const [key, value] of Object.entries(currentToken)) {
      formData.append(key, value);
    }

    // Add other parameters
    for (const [key, value] of Object.entries(params)) {
      formData.append(key, value);
    }

    const response = await fetch(this.buildUrl(waction), {
      method: 'POST',
      headers: HEADERS,
      body: formData.toString(),
    });

    if (!response.ok) {
      throw new AbfallIOApiError(
        `Request failed for ${waction}: ${response.statusText}`,
        response.status
      );
    }

    const html = await response.text();

    // Extract new session token from response
    const hiddenInputs = parseHiddenInputs(html);
    const newSession = extractSessionToken(hiddenInputs);

    return {
      html,
      token: { ...currentToken, ...newSession.token },
    };
  }

  /**
   * Get collection dates (appointments) for a specific address
   * Navigates through the widget workflow and parses HTML response
   */
  async getCollectionDates(params: AbfallIOParams): Promise<Appointment[]> {
    try {
      // Step 1: Initialize session
      const session = await this.initSession();
      let currentToken = { ...session.token };

      // Step 2: Set Kommune
      const step2 = await this.postWithSession(
        'auswahl_kommune_set',
        {
          f_id_kommune: params.f_id_kommune,
          f_id_bezirk: '',
          f_id_strasse: '',
        },
        currentToken
      );
      currentToken = step2.token;

      // Step 3: Set Bezirk (if provided)
      if (params.f_id_bezirk) {
        const step3 = await this.postWithSession(
          'auswahl_bezirk_set',
          {
            f_id_kommune: params.f_id_kommune,
            f_id_bezirk: params.f_id_bezirk,
            f_id_strasse: '',
          },
          currentToken
        );
        currentToken = step3.token;
      }

      // Step 4: Set Strasse
      const step4 = await this.postWithSession(
        'auswahl_strasse_set',
        {
          f_id_kommune: params.f_id_kommune,
          f_id_bezirk: params.f_id_bezirk || '',
          f_id_strasse: params.f_id_strasse,
        },
        currentToken
      );
      currentToken = step4.token;

      // Check if we need to set house number (if the response contains hnr select)
      let finalHtml = step4.html;
      if (step4.html.includes('name="f_id_strasse_hnr"')) {
        // House number selection is required
        let hnrId = params.f_id_strasse_hnr;

        // If no house number provided, auto-select the first available one
        if (!hnrId) {
          const hnrOptions = parseSelectOptions(step4.html, 'f_id_strasse_hnr');
          if (hnrOptions.length > 0 && hnrOptions[0]) {
            hnrId = hnrOptions[0].value;
          }
        }

        if (hnrId) {
          // Step 5: Set Hausnummer
          const step5 = await this.postWithSession(
            'auswahl_hnr_set',
            {
              f_id_kommune: params.f_id_kommune,
              f_id_bezirk: params.f_id_bezirk || '',
              f_id_strasse: params.f_id_strasse,
              f_id_strasse_hnr: hnrId,
            },
            currentToken
          );
          finalHtml = step5.html;
        }
      }

      // Parse appointments from the HTML response
      return parseHtmlAppointments(finalHtml);
    } catch (error) {
      if (error instanceof AbfallIOApiError) {
        throw error;
      }
      throw new AbfallIOApiError(
        `Error fetching collection dates: ${error instanceof Error ? error.message : 'Unknown error'}`,
        500,
        error
      );
    }
  }

  /**
   * Get bezirke (districts) for a kommune
   * Some kommunen have multiple districts that need to be selected
   */
  async getBezirke(kommuneId: string): Promise<SelectOption[]> {
    try {
      const session = await this.initSession();

      const step = await this.postWithSession(
        'auswahl_kommune_set',
        {
          f_id_kommune: kommuneId,
          f_id_bezirk: '',
          f_id_strasse: '',
        },
        session.token
      );

      // Check if the response contains a bezirk select
      if (step.html.includes('name="f_id_bezirk"')) {
        return parseSelectOptions(step.html, 'f_id_bezirk');
      }

      return [];
    } catch (error) {
      if (error instanceof AbfallIOApiError) {
        throw error;
      }
      throw new AbfallIOApiError(
        `Error fetching bezirke: ${error instanceof Error ? error.message : 'Unknown error'}`,
        500,
        error
      );
    }
  }

  /**
   * Get streets for a specific kommune and optional bezirk
   */
  async getStreetsWithBezirk(
    kommuneId: string,
    bezirkId?: string
  ): Promise<AbfallIOStreet[]> {
    try {
      const session = await this.initSession();
      let currentToken = { ...session.token };

      // Step 1: Set Kommune
      const step1 = await this.postWithSession(
        'auswahl_kommune_set',
        {
          f_id_kommune: kommuneId,
          f_id_bezirk: '',
          f_id_strasse: '',
        },
        currentToken
      );
      currentToken = step1.token;

      // Step 2: Set Bezirk if needed
      let html = step1.html;
      if (bezirkId && step1.html.includes('name="f_id_bezirk"')) {
        const step2 = await this.postWithSession(
          'auswahl_bezirk_set',
          {
            f_id_kommune: kommuneId,
            f_id_bezirk: bezirkId,
            f_id_strasse: '',
          },
          currentToken
        );
        html = step2.html;
      }

      // Parse specifically the f_id_strasse select element
      const options = parseSelectOptions(html, 'f_id_strasse');

      return options.map((opt) => ({
        id: opt.value,
        name: opt.label,
      }));
    } catch (error) {
      if (error instanceof AbfallIOApiError) {
        throw error;
      }
      throw new AbfallIOApiError(
        `Error fetching streets: ${error instanceof Error ? error.message : 'Unknown error'}`,
        500,
        error
      );
    }
  }

  /**
   * Get available house numbers for a street
   * Returns empty array if no house number selection is required
   */
  async getHouseNumbers(
    kommuneId: string,
    streetId: string,
    bezirkId?: string
  ): Promise<Array<{ id: string; name: string }>> {
    try {
      const session = await this.initSession();
      let currentToken = { ...session.token };

      // Step 1: Set Kommune
      const step1 = await this.postWithSession(
        'auswahl_kommune_set',
        {
          f_id_kommune: kommuneId,
          f_id_bezirk: '',
          f_id_strasse: '',
        },
        currentToken
      );
      currentToken = step1.token;

      // Step 2: Set Bezirk if needed
      if (bezirkId && step1.html.includes('name="f_id_bezirk"')) {
        const step2 = await this.postWithSession(
          'auswahl_bezirk_set',
          {
            f_id_kommune: kommuneId,
            f_id_bezirk: bezirkId,
            f_id_strasse: '',
          },
          currentToken
        );
        currentToken = step2.token;
      }

      // Step 3: Set Strasse
      const step3 = await this.postWithSession(
        'auswahl_strasse_set',
        {
          f_id_kommune: kommuneId,
          f_id_bezirk: bezirkId || '',
          f_id_strasse: streetId,
        },
        currentToken
      );

      // Check if house number selection is available
      if (!step3.html.includes('name="f_id_strasse_hnr"')) {
        return []; // No house numbers required for this street
      }

      // Parse house number options
      const options = parseSelectOptions(step3.html, 'f_id_strasse_hnr');

      return options.map((opt) => ({
        id: opt.value,
        name: opt.label,
      }));
    } catch (error) {
      if (error instanceof AbfallIOApiError) {
        throw error;
      }
      throw new AbfallIOApiError(
        `Error fetching house numbers: ${error instanceof Error ? error.message : 'Unknown error'}`,
        500,
        error
      );
    }
  }

  /**
   * Get complete waste collection data for a location and street
   * This is the main method used by the API route
   */
  async getWasteCollectionData(
    locationMapping: { f_id_kommune: string; f_id_bezirk?: string },
    streetId: string,
    locationName: string,
    streetName: string,
    houseNumberId?: string
  ): Promise<WasteCalendarResponse> {
    const params: AbfallIOParams = {
      f_id_kommune: locationMapping.f_id_kommune,
      f_id_strasse: streetId,
      f_id_bezirk: locationMapping.f_id_bezirk,
      f_id_strasse_hnr: houseNumberId,
    };

    const appointments = await this.getCollectionDates(params);
    const fractions = extractFractionsFromAppointments(appointments);

    // Create Location object
    const location: Location = {
      id: hashString(locationName),
      name: locationName,
    };

    // Create Street object
    const street: Street = {
      id: hashString(streetId),
      name: streetName,
      locationId: location.id,
    };

    // Always fetch the full list of available house numbers for this street
    // This allows the calendar page to show a house number selector
    let houseNumbers: { id: number; name: string }[] = [];
    try {
      const hnList = await this.getHouseNumbers(
        locationMapping.f_id_kommune,
        streetId,
        locationMapping.f_id_bezirk
      );
      houseNumbers = hnList.map((h) => ({
        id: parseInt(h.id, 10) || hashString(h.id),
        name: h.name,
      }));
    } catch {
      // Ignore errors fetching house numbers - they're optional
    }

    return {
      location,
      street,
      houseNumbers,
      fractions: fractions.map((f) => ({
        id: f.id,
        name: f.name,
        color: getDefaultFractionColor(f.name),
      })),
      appointments,
    };
  }
}

/**
 * Simple string hash function for generating stable IDs
 */
function hashString(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash = hash & hash;
  }
  return Math.abs(hash);
}

/**
 * Get a default color for a fraction based on its name
 * Used when the API doesn't provide color information
 */
function getDefaultFractionColor(name: string): string {
  const lowerName = name.toLowerCase();

  if (lowerName.includes('gelb') || lowerName.includes('wertstoff')) {
    return '#FFD700'; // Yellow
  }
  if (lowerName.includes('bio') || lowerName.includes('grün')) {
    return '#228B22'; // Green
  }
  if (lowerName.includes('papier') || lowerName.includes('blau')) {
    return '#4169E1'; // Blue
  }
  if (lowerName.includes('rest') || lowerName.includes('grau')) {
    return '#808080'; // Gray
  }
  if (lowerName.includes('glas')) {
    return '#90EE90'; // Light green
  }
  if (lowerName.includes('sperr')) {
    return '#8B4513'; // Brown
  }

  return '#999999'; // Default gray
}
