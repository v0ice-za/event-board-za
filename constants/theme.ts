export const COLORS = {
  background:    '#0F0C09',
  surface:       '#1C1814',
  textPrimary:   '#F5F0E8',
  textSecondary: '#8A7E70',
  accent:        '#FF6B35',
  border:        '#2A2420',
  error:         '#FF4D4D',
  success:       '#4CAF50',
} as const;

export const FONT_FAMILY = {
  regular:   'Inter_400Regular',
  medium:    'Inter_500Medium',
  semiBold:  'Inter_600SemiBold',
  bold:      'Inter_700Bold',
} as const;

// Typography scale per UX-DR1 (values are React Native fontSize in sp)
export const FONT_SIZE = {
  eventName: 18,   // Card + detail event name (weight: bold)
  body:      15,   // Event description
  cta:       16,   // Tickets CTA (weight: semiBold)
  chipLabel: 13,   // Category chips (weight: medium)
  cardMeta:  13,   // Date + venue on card overlay (weight: medium/regular)
  adLabel:   9,    // Ad unit "Ad" label
} as const;
