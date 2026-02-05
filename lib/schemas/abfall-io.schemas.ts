import { z } from 'zod';
import type { Appointment } from '@/lib/types/bav-api.types';
import type { AbfallIOSession } from '@/lib/types/abfall-io.types';

// ============================================================================
// AbfallIO HTML Parser
// Extracts hidden form fields from init response
// ============================================================================

/**
 * Regular expression to extract hidden input fields from HTML
 * Matches: <input type="hidden" name="..." value="...">
 */
const HIDDEN_INPUT_REGEX =
  /<input[^>]+type=["']hidden["'][^>]+name=["']([^"']+)["'][^>]+value=["']([^"']*)["'][^>]*>/gi;

/**
 * Alternative regex for different attribute order
 * Matches: <input name="..." value="..." type="hidden">
 */
const HIDDEN_INPUT_REGEX_ALT =
  /<input[^>]+name=["']([^"']+)["'][^>]+value=["']([^"']*)["'][^>]+type=["']hidden["'][^>]*>/gi;

/**
 * Parse hidden input fields from HTML response
 * @param html - HTML string from AbfallIO init response
 * @returns Object with field names as keys and values
 */
export function parseHiddenInputs(html: string): Record<string, string> {
  const fields: Record<string, string> = {};

  // Try both regex patterns
  let match: RegExpExecArray | null;

  // Reset regex lastIndex
  HIDDEN_INPUT_REGEX.lastIndex = 0;
  while ((match = HIDDEN_INPUT_REGEX.exec(html)) !== null) {
    const key = match[1];
    const value = match[2];
    if (key !== undefined && value !== undefined) {
      fields[key] = value;
    }
  }

  HIDDEN_INPUT_REGEX_ALT.lastIndex = 0;
  while ((match = HIDDEN_INPUT_REGEX_ALT.exec(html)) !== null) {
    const key = match[1];
    const value = match[2];
    if (key !== undefined && value !== undefined && !fields[key]) {
      fields[key] = value;
    }
  }

  return fields;
}

/**
 * Extract session token from parsed hidden inputs
 * The token is a UUID key-value pair used for subsequent requests
 */
export function extractSessionToken(
  hiddenInputs: Record<string, string>
): AbfallIOSession {
  // Filter out known field names to find the session token
  const knownFields = new Set([
    'f_id_kommune',
    'f_id_strasse',
    'f_id_bezirk',
    'f_id_strasse_hnr',
    'f_abfallarten',
    'f_abfallarten_index_max',
    'f_zeitraum',
  ]);

  const token: Record<string, string> = {};

  for (const [key, value] of Object.entries(hiddenInputs)) {
    // Session tokens are typically UUID-like strings
    if (!knownFields.has(key) && key.length === 32 && /^[a-f0-9]+$/i.test(key)) {
      token[key] = value;
    }
  }

  return {
    token,
    createdAt: Date.now(),
  };
}

// ============================================================================
// AbfallIO Select Option Parser
// Extracts options from select elements in HTML
// ============================================================================

/**
 * Schema for a select option
 */
export const SelectOptionSchema = z.object({
  value: z.string(),
  label: z.string(),
});

export type SelectOption = z.infer<typeof SelectOptionSchema>;

/**
 * Regular expression to extract option elements
 * Matches: <option value="...">...</option>
 */
const OPTION_REGEX = /<option[^>]+value=["']([^"']*)["'][^>]*>([^<]*)<\/option>/gi;

/**
 * Parse select options from HTML
 * @param html - HTML string containing select element
 * @param selectName - Optional: specific select element name to target (e.g., 'f_id_strasse')
 * @returns Array of options with value and label
 */
export function parseSelectOptions(
  html: string,
  selectName?: string
): SelectOption[] {
  let targetHtml = html;

  // If a specific select name is provided, extract only that select's content
  if (selectName) {
    const selectRegex = new RegExp(
      `<select[^>]*name=["']${selectName}["'][^>]*>([\\s\\S]*?)<\\/select>`,
      'i'
    );
    const selectMatch = html.match(selectRegex);
    if (selectMatch && selectMatch[1]) {
      targetHtml = selectMatch[1];
    } else {
      // Select element not found
      return [];
    }
  }

  const options: SelectOption[] = [];

  let match: RegExpExecArray | null;
  OPTION_REGEX.lastIndex = 0;

  while ((match = OPTION_REGEX.exec(targetHtml)) !== null) {
    const rawValue = match[1];
    const rawLabel = match[2];

    // Ensure both capture groups exist
    if (rawValue === undefined || rawLabel === undefined) {
      continue;
    }

    const value = rawValue.trim();
    const label = rawLabel.trim();

    // Skip empty or placeholder options
    if (value && label && !label.toLowerCase().includes('bitte auswählen')) {
      options.push({ value, label });
    }
  }

  return options;
}

// ============================================================================
// ICS Parser
// Parses iCalendar (RFC 5545) format to extract appointments
// ============================================================================

/**
 * Regular expression to extract VEVENT blocks
 */
const VEVENT_REGEX = /BEGIN:VEVENT([\s\S]*?)END:VEVENT/gi;

/**
 * Regular expression to extract ICS properties
 * Handles both simple properties and properties with parameters
 */
const ICS_PROPERTY_REGEX = /^([A-Z-]+)(?:;[^:]+)?:(.*)$/;

/**
 * Parse a single VEVENT block into an appointment
 */
function parseVEvent(veventContent: string): Appointment | null {
  const lines = veventContent.split(/\r?\n/).map((line) => line.trim());
  const properties: Record<string, string> = {};

  for (const line of lines) {
    if (!line) continue;

    const match = line.match(ICS_PROPERTY_REGEX);
    if (match) {
      const key = match[1];
      const value = match[2];
      if (key !== undefined && value !== undefined) {
        properties[key] = value;
      }
    }
  }

  // Extract date from DTSTART
  const dtstart = properties['DTSTART'];
  if (!dtstart) return null;

  // Parse date (format: YYYYMMDD or YYYYMMDDTHHMMSS)
  const dateMatch = dtstart.match(/^(\d{4})(\d{2})(\d{2})/);
  if (!dateMatch) return null;

  const year = dateMatch[1];
  const month = dateMatch[2];
  const day = dateMatch[3];
  if (year === undefined || month === undefined || day === undefined) return null;

  const date = `${year}-${month}-${day}`;

  // Extract summary (waste type name)
  let summary = properties['SUMMARY'] || 'Unknown';

  // Remove common prefixes like "Abfuhr: "
  summary = summary.replace(/^Abfuhr:\s*/i, '').trim();

  // Unescape ICS text
  summary = summary
    .replace(/\\,/g, ',')
    .replace(/\\;/g, ';')
    .replace(/\\\\/g, '\\');

  // Generate a stable fraction ID from the summary
  // Using a simple hash function
  const fractionId = hashString(summary);

  return {
    date,
    fractionName: summary,
    fractionId,
  };
}

/**
 * Simple string hash function for generating stable IDs
 */
function hashString(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash = hash & hash; // Convert to 32-bit integer
  }
  return Math.abs(hash);
}

/**
 * Parse ICS content into appointments
 * @param icsContent - Raw ICS file content
 * @returns Array of appointments
 */
export function parseIcsContent(icsContent: string): Appointment[] {
  const appointments: Appointment[] = [];

  // Remove any HTML warnings that might be in the response
  const cleanedContent = icsContent.replace(/<br.*?>|<b.*?>/gi, '\r\n');

  let match: RegExpExecArray | null;
  VEVENT_REGEX.lastIndex = 0;

  while ((match = VEVENT_REGEX.exec(cleanedContent)) !== null) {
    const veventContent = match[1];
    if (veventContent === undefined) continue;
    
    const appointment = parseVEvent(veventContent);
    if (appointment) {
      appointments.push(appointment);
    }
  }

  // Sort by date
  appointments.sort((a, b) => a.date.localeCompare(b.date));

  return appointments;
}

/**
 * Extract unique fractions from appointments
 * @param appointments - Array of appointments
 * @returns Array of unique fractions
 */
export function extractFractionsFromAppointments(
  appointments: Appointment[]
): { id: number; name: string }[] {
  const fractionsMap = new Map<number, string>();

  for (const appointment of appointments) {
    if (!fractionsMap.has(appointment.fractionId)) {
      fractionsMap.set(appointment.fractionId, appointment.fractionName);
    }
  }

  return Array.from(fractionsMap.entries()).map(([id, name]) => ({
    id,
    name,
  }));
}

// ============================================================================
// HTML Appointment Parser
// Extracts appointments directly from AbfallIO widget HTML response
// ============================================================================

/**
 * German month names to numeric values
 */
const GERMAN_MONTHS: Record<string, string> = {
  Januar: '01',
  Februar: '02',
  März: '03',
  April: '04',
  Mai: '05',
  Juni: '06',
  Juli: '07',
  August: '08',
  September: '09',
  Oktober: '10',
  November: '11',
  Dezember: '12',
};

/**
 * Regular expression to match month headers in the widget HTML
 */
const MONTH_HEADER_REGEX =
  /<div class="awk-ui-widget-html-monat">([^<]+)<\/div>/g;

/**
 * Regular expression to match appointment entries in the widget HTML
 */
const APPOINTMENT_REGEX =
  /<div class="awk-ui-widget-html-termin[^"]*">[\s\S]*?<div class="awk-ui-widget-html-termin-tag">([^<]+)<\/div>[\s\S]*?<div class="awk-ui-widget-html-termin-farbe awk-ui-widget-html-termin-farbe-(\d+)">[\s\S]*?<div class="awk-ui-widget-html-termin-bez">([^<]+)<\/div><\/div>/g;

/**
 * Parse appointments directly from AbfallIO widget HTML response
 * This is more reliable than ICS export which may return 404
 * @param html - HTML string from AbfallIO widget response
 * @returns Array of appointments
 */
export function parseHtmlAppointments(html: string): Appointment[] {
  const appointments: Appointment[] = [];

  // First, build a list of all month headers with their positions
  const monthPositions: Array<{
    position: number;
    month: string;
    year: string;
  }> = [];

  MONTH_HEADER_REGEX.lastIndex = 0;
  let monthMatch: RegExpExecArray | null;

  while ((monthMatch = MONTH_HEADER_REGEX.exec(html)) !== null) {
    const headerText = monthMatch[1];
    if (headerText === undefined) continue;

    const parts = headerText.trim().split(' ');
    if (parts.length !== 2) continue;

    const monthName = parts[0];
    const year = parts[1];

    if (
      monthName === undefined ||
      year === undefined ||
      !GERMAN_MONTHS[monthName]
    ) {
      continue;
    }

    monthPositions.push({
      position: monthMatch.index,
      month: GERMAN_MONTHS[monthName],
      year,
    });
  }

  if (monthPositions.length === 0) {
    return appointments;
  }

  // Now find all appointments and map them to the correct month
  APPOINTMENT_REGEX.lastIndex = 0;
  let appointmentMatch: RegExpExecArray | null;

  while ((appointmentMatch = APPOINTMENT_REGEX.exec(html)) !== null) {
    const dayRaw = appointmentMatch[1];
    const fractionIdRaw = appointmentMatch[2];
    const fractionNameRaw = appointmentMatch[3];

    if (
      dayRaw === undefined ||
      fractionIdRaw === undefined ||
      fractionNameRaw === undefined
    ) {
      continue;
    }

    const position = appointmentMatch.index;

    // Find the correct month for this appointment (last month header before this position)
    let monthInfo = monthPositions[0];
    for (const mp of monthPositions) {
      if (mp.position < position) {
        monthInfo = mp;
      } else {
        break;
      }
    }

    if (!monthInfo) continue;

    // Parse the day (remove trailing dot and pad)
    const day = dayRaw.replace('.', '').trim().padStart(2, '0');
    const fractionId = parseInt(fractionIdRaw, 10);
    const fractionName = fractionNameRaw.trim();

    appointments.push({
      date: `${monthInfo.year}-${monthInfo.month}-${day}`,
      fractionId,
      fractionName,
    });
  }

  // Sort by date
  appointments.sort((a, b) => a.date.localeCompare(b.date));

  return appointments;
}

/**
 * Extract waste type checkboxes from HTML (for determining available fractions)
 * Returns array of { id, name } pairs
 */
export function parseWasteTypeCheckboxes(
  html: string
): Array<{ id: number; name: string }> {
  const wasteTypes: Array<{ id: number; name: string }> = [];

  // Match checkbox inputs and their labels
  const checkboxRegex =
    /<input[^>]*type="checkbox"[^>]*name="f_id_abfalltyp_\d+"[^>]*value="(\d+)"[^>]*>[\s\S]*?<\/span>\s*<\/div>\s*<div class="awk-ui-input-tr">\s*<label[^>]*>(?:<span[^>]*>[^<]*<\/span>)?([^<]+)/gi;

  // Simpler approach: find labels that contain waste type names
  const labelRegex =
    /<label[^>]*for="f_id_abfalltyp_(\d+)_[^"]*"[^>]*>(?:<span[^>]*>[^<]*<\/span>)?([^<]+)</gi;

  labelRegex.lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = labelRegex.exec(html)) !== null) {
    const idRaw = match[1];
    const nameRaw = match[2];

    if (idRaw === undefined || nameRaw === undefined) continue;

    const id = parseInt(idRaw, 10);
    const name = nameRaw.trim().replace(/<[^>]*>/g, '');

    if (id && name && !name.toLowerCase().includes('verwenden')) {
      wasteTypes.push({ id, name });
    }
  }

  return wasteTypes;
}

// ============================================================================
// Zod Schemas for validation
// ============================================================================

/**
 * Schema for AbfallIO location mapping
 */
export const AbfallIOLocationMappingSchema = z.object({
  name: z.string(),
  f_id_kommune: z.string(),
  f_id_bezirk: z.string().optional(),
});

/**
 * Schema for ASO location mappings file
 */
export const ASOLocationMappingsSchema = z.record(
  z.string(),
  z.object({
    f_id_kommune: z.string(),
    f_id_bezirk: z.string().optional(),
  })
);

export type ASOLocationMappings = z.infer<typeof ASOLocationMappingsSchema>;
