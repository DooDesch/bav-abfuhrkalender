// RSAG API response types

/** Single street from GET /api/street/filter/{locationId} */
export interface RsagStreetFilterItem {
  street_id: number;
  name: string;
  zip: number;
}

export type RsagStreetFilterResponse = RsagStreetFilterItem[];

// Pickup filter endpoint

export interface RsagPickupItem {
  pickupdate: string;
  pickuptimestamp: number;
  wastetype_id: number;
  wastetype_name: string;
  wastetype_icon?: string;
  selected_default?: boolean;
  pickupdateObject?: number;
}

export interface RsagPickupMonth {
  name: string;
  items: RsagPickupItem[];
}

export type RsagPickupFilterResponse = RsagPickupMonth[];

export class RSAGApiError extends Error {
  constructor(
    message: string,
    public statusCode: number = 500,
    public originalError?: unknown
  ) {
    super(message);
    this.name = 'RSAGApiError';
  }
}
