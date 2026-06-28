const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

/**
 * Formats an ISO 8601 date string ("2026-05-30") as a human-readable feed date
 * ("Sat 30 May") per FR-2 — short weekday, day-of-month (no leading zero), short month.
 *
 * Parses from the ISO parts into a LOCAL Date so the rendered day never shifts under
 * UTC parsing (`new Date('2026-05-30')` is UTC midnight). Uses fixed lookup arrays
 * rather than `toLocaleDateString` for deterministic, locale-independent output.
 *
 * Defensive: event dates come from external feeds, so a malformed/empty/timestamp
 * string (e.g. `''`, `'2026-13-45'`, `'2026-06-14T19:00:00Z'`, `'2026-02-30'`) returns
 * the raw input unchanged rather than rendering "undefined undefined undefined".
 */
export function formatEventDate(isoDate: string): string {
  const parts = isoDate.split('-');
  if (parts.length === 3) {
    const [year, month, day] = parts.map(Number);
    const valid =
      Number.isInteger(year) &&
      Number.isInteger(month) &&
      Number.isInteger(day) &&
      month >= 1 &&
      month <= 12 &&
      day >= 1 &&
      day <= 31;
    if (valid) {
      const date = new Date(year, month - 1, day);
      // Reject calendar rollover (e.g. 2026-02-30 → Mar 2) by requiring a round-trip.
      if (
        date.getFullYear() === year &&
        date.getMonth() === month - 1 &&
        date.getDate() === day
      ) {
        return `${WEEKDAYS[date.getDay()]} ${day} ${MONTHS[month - 1]}`;
      }
    }
  }
  return isoDate;
}
