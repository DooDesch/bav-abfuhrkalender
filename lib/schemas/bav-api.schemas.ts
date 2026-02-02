import { z } from 'zod';

// ============================================================================
// BAV API Response Schemas
// These schemas validate and parse responses from the external BAV API
// ============================================================================

/**
 * Schema for a location (Ort) from the BAV API
 */
export const LocationResponseSchema = z.object({
  id: z.number(),
  name: z.string(),
});

export type LocationResponse = z.infer<typeof LocationResponseSchema>;

/**
 * Schema for house number entries in API response
 * The API returns various formats, so we handle multiple field names
 */
export const HouseNumberResponseSchema = z.object({
  id: z.number().optional(),
  name: z.union([z.string(), z.number()]).optional(),
  nummer: z.union([z.string(), z.number()]).optional(),
  hausnummer: z.union([z.string(), z.number()]).optional(),
  value: z.union([z.string(), z.number()]).optional(),
});

export type HouseNumberResponse = z.infer<typeof HouseNumberResponseSchema>;

/**
 * Schema for a street from the BAV API
 * Handles various field name variations from the API
 */
export const StreetResponseSchema = z.object({
  id: z.number(),
  name: z.string(),
  ort: z.object({ id: z.number() }).optional(),
  hausNrList: z.array(HouseNumberResponseSchema).optional(),
  hausnummern: z.array(HouseNumberResponseSchema).optional(),
  hausnummernList: z.array(HouseNumberResponseSchema).optional(),
});

export type StreetResponse = z.infer<typeof StreetResponseSchema>;

/**
 * Schema for a waste fraction from the BAV API
 */
export const FractionResponseSchema = z.object({
  id: z.number(),
  name: z.string(),
  farbeRgb: z.string().optional(),
  iconNr: z.number().optional(),
});

export type FractionResponse = z.infer<typeof FractionResponseSchema>;

/**
 * Schema for a collection appointment from the BAV API
 */
export const AppointmentResponseSchema = z.object({
  datum: z.string(),
  bezirk: z
    .object({
      fraktionId: z.number().optional(),
    })
    .optional(),
});

export type AppointmentResponse = z.infer<typeof AppointmentResponseSchema>;

// ============================================================================
// Array Schemas for API responses
// ============================================================================

export const LocationsArraySchema = z.array(LocationResponseSchema);
export const StreetsArraySchema = z.array(StreetResponseSchema);
export const FractionsArraySchema = z.array(FractionResponseSchema);
export const AppointmentsArraySchema = z.array(AppointmentResponseSchema);

// ============================================================================
// Helper functions to safely parse API responses
// ============================================================================

/**
 * Safely parse locations array, returning empty array on failure
 */
export function parseLocations(data: unknown): LocationResponse[] {
  const result = LocationsArraySchema.safeParse(data);
  return result.success ? result.data : [];
}

/**
 * Safely parse streets array, returning empty array on failure
 */
export function parseStreets(data: unknown): StreetResponse[] {
  const result = StreetsArraySchema.safeParse(data);
  return result.success ? result.data : [];
}

/**
 * Safely parse fractions array, returning empty array on failure
 */
export function parseFractions(data: unknown): FractionResponse[] {
  const result = FractionsArraySchema.safeParse(data);
  return result.success ? result.data : [];
}

/**
 * Safely parse appointments array, returning empty array on failure
 */
export function parseAppointments(data: unknown): AppointmentResponse[] {
  const result = AppointmentsArraySchema.safeParse(data);
  return result.success ? result.data : [];
}
