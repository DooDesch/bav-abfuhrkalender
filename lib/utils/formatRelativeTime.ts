/**
 * Formats a future date as relative time in German (e.g. "in 2 Stunden", "morgen").
 * Uses Intl.RelativeTimeFormat with no extra dependencies.
 * Returns a fallback string for invalid or past dates.
 */
const rtf = new Intl.RelativeTimeFormat('de-DE', { numeric: 'auto' });

export function formatRelativeTime(
  dateInput: string | Date
): string {
  const date = typeof dateInput === 'string' ? new Date(dateInput) : dateInput;
  if (isNaN(date.getTime())) {
    return typeof dateInput === 'string' ? dateInput : '';
  }

  const now = Date.now();
  const diffMs = date.getTime() - now;

  if (diffMs <= 0) {
    return 'abgelaufen';
  }

  const diffSeconds = Math.round(diffMs / 1000);
  const diffMinutes = Math.round(diffMs / (1000 * 60));
  const diffHours = Math.round(diffMs / (1000 * 60 * 60));
  const diffDays = Math.round(diffMs / (1000 * 60 * 60 * 24));

  if (diffSeconds < 60) {
    return rtf.format(diffSeconds, 'second');
  }
  if (diffMinutes < 60) {
    return rtf.format(diffMinutes, 'minute');
  }
  if (diffHours < 24) {
    return rtf.format(diffHours, 'hour');
  }
  return rtf.format(diffDays, 'day');
}

/**
 * Formats a date as locale string (de-DE) for tooltips or fallback display.
 */
export function formatExactDateTime(dateInput: string | Date): string {
  const date = typeof dateInput === 'string' ? new Date(dateInput) : dateInput;
  if (isNaN(date.getTime())) {
    return typeof dateInput === 'string' ? dateInput : '';
  }
  return date.toLocaleString('de-DE', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });
}
