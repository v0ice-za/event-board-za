import { formatEventDate } from './formatDate';

describe('formatEventDate', () => {
  it('formats an ISO date as "Wkd D Mon" (FR-2)', () => {
    expect(formatEventDate('2026-05-30')).toBe('Sat 30 May');
  });

  it('formats single-digit days without a leading zero', () => {
    expect(formatEventDate('2026-12-05')).toBe('Sat 5 Dec');
  });

  it('maps a year-boundary date to the correct weekday', () => {
    // Parsing from ISO parts into a local Date keeps this on Jan 1 regardless of the
    // host timezone (new Date('2026-01-01') would be UTC midnight and could shift).
    expect(formatEventDate('2026-01-01')).toBe('Thu 1 Jan');
  });

  it.each([
    ['', ''],
    ['not-a-date', 'not-a-date'],
    ['2026-13-45', '2026-13-45'], // out-of-range month/day
    ['2026-02-30', '2026-02-30'], // calendar rollover
    ['2026-06-14T19:00:00Z', '2026-06-14T19:00:00Z'], // full timestamp, unsupported
  ])('returns the raw string for invalid input %p', (input, expected) => {
    expect(formatEventDate(input)).toBe(expected);
  });
});
