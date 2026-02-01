// BAV API Type Definitions

export interface Ort {
  id: number;
  name: string;
}

export interface Strasse {
  id: number;
  name: string;
  ortId?: number;
}

export interface Hausnummer {
  id: number;
  name: string;
  strasseId?: number;
}

export interface Fraktion {
  id: number;
  name: string;
  color?: string;
  icon?: string;
}

export interface Termin {
  datum: string; // ISO date string (YYYY-MM-DD)
  fraktion: string;
  fraktionId: number;
}

export interface AbfuhrkalenderResponse {
  ort: Ort;
  strasse: Strasse;
  hausnummern: Hausnummer[];
  fraktionen: Fraktion[];
  termine: Termin[];
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
