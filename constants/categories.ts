export const CATEGORY_VALUES = [
  'Music',
  'Markets',
  'Food & Drink',
  'Art & Culture',
  'Sport',
  'Comedy',
  'Family',
  'Nightlife',
] as const;

// Inline type avoids circular dependency with types/event.ts
type CategoryKey = typeof CATEGORY_VALUES[number];

// Gradient config consumed by CategoryPlaceholder (Story 2.1).
// AC says "asset path" but UX spec UX-DR3 + Story 2.1 use LinearGradient — gradient config
// is what that component needs. No PNG assets exist yet (assets/placeholders/ is .gitkeep).
export const CATEGORY_PLACEHOLDERS: Record<CategoryKey, { colors: [string, string]; emoji: string }> = {
  'Music':        { colors: ['#1a0a1e', '#3d1459'], emoji: '🎵' },
  'Markets':      { colors: ['#1a1200', '#4a3000'], emoji: '🛍️' },
  'Food & Drink': { colors: ['#1a0800', '#4a1a00'], emoji: '🍽️' },
  'Art & Culture':{ colors: ['#001a1a', '#004040'], emoji: '🎨' },
  'Sport':        { colors: ['#001a00', '#003300'], emoji: '⚽' },
  'Comedy':       { colors: ['#1a1500', '#3d3000'], emoji: '😂' },
  'Family':       { colors: ['#001a0d', '#003320'], emoji: '👨‍👩‍👧' },
  'Nightlife':    { colors: ['#0d0020', '#200040'], emoji: '🌃' },
};

// Neutral fallback for categories not present in CATEGORY_PLACEHOLDERS.
// CategoryPlaceholder uses this when an event arrives (from external feeds) with an
// unmapped/unknown category, so the card never crashes on a missing map entry.
export const FALLBACK_PLACEHOLDER: { colors: [string, string]; emoji: string } = {
  colors: ['#1a1a1a', '#333333'],
  emoji: '🎟️',
};
