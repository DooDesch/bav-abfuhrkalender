import type { Appointment } from '@/lib/types/bav-api.types';

/**
 * Escape special characters in ICS text values (SUMMARY, DESCRIPTION).
 * RFC 5545: backslash, semicolon, comma must be escaped.
 */
function escapeIcsText(value: string): string {
  return value.replace(/\\/g, '\\\\').replace(/;/g, '\\;').replace(/,/g, '\\,');
}

/**
 * Format ISO date YYYY-MM-DD to ICS DATE format YYYYMMDD.
 */
function toIcsDate(isoDate: string): string {
  return isoDate.replace(/-/g, '');
}

export interface IcsGeneratorOptions {
  /** Location name for DESCRIPTION */
  locationName?: string;
  /** Street name for DESCRIPTION */
  streetName?: string;
  /** Used in UID for uniqueness (e.g. street id) */
  calendarId?: string;
  /** Product identifier in VCALENDAR (default: -//Dein Abfuhrkalender//EN) */
  prodId?: string;
}

/**
 * Build an iCalendar (RFC 5545) string from waste collection appointments.
 * Each appointment becomes one all-day VEVENT.
 */
export function buildIcs(
  appointments: Appointment[],
  options: IcsGeneratorOptions = {}
): string {
  const {
    locationName = '',
    streetName = '',
    calendarId = 'default',
    prodId = '-//Dein Abfuhrkalender//EN',
  } = options;

  const now = new Date();
  const dtstamp = now.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');
  const description =
    [locationName, streetName].filter(Boolean).length > 0
      ? escapeIcsText(`Abfuhrtermin – ${[streetName, locationName].filter(Boolean).join(', ')}`)
      : '';

  const lines: string[] = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    `PRODID:${prodId}`,
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
  ];

  for (const appt of appointments) {
    const dateStr = toIcsDate(appt.date);
    // All-day: DTEND is exclusive, so use next day for DTEND
    const endDate = new Date(appt.date);
    endDate.setDate(endDate.getDate() + 1);
    const endStr = endDate.toISOString().slice(0, 10).replace(/-/g, '');

    const uid = `abfuhr-${calendarId}-${appt.date}-${appt.fractionId}@dein-abfuhrkalender`;
    const summary = escapeIcsText(`Abfuhr: ${appt.fractionName}`);

    lines.push(
      'BEGIN:VEVENT',
      `UID:${uid}`,
      `DTSTAMP:${dtstamp}Z`,
      `DTSTART;VALUE=DATE:${dateStr}`,
      `DTEND;VALUE=DATE:${endStr}`,
      `SUMMARY:${summary}`
    );
    if (description) {
      lines.push(`DESCRIPTION:${description}`);
    }
    lines.push('END:VEVENT');
  }

  lines.push('END:VCALENDAR');
  return lines.join('\r\n');
}
