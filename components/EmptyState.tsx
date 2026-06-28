import { Pressable, Text, View } from 'react-native';
import { Feather } from '@expo/vector-icons';

import { CATEGORY_PLACEHOLDERS, FALLBACK_PLACEHOLDER } from '@/constants/categories';
import { COLORS } from '@/constants/theme';
import type { Category } from '@/types';

const ICON_SIZE = 32;

export type EmptyStateVariant = 'empty-category' | 'no-connection' | 'general-error';

type EmptyStateProps = {
  variant: EmptyStateVariant;
  category?: Category | null;
  onAction: () => void;
};

/**
 * Per-variant copy + button label. Icons are derived separately (the
 * empty-category icon depends on the `category` prop). Headings for the
 * static variants live here; empty-category interpolates `category` below.
 */
const VARIANT_CONFIG = {
  'empty-category': {
    heading: 'No events right now',
    subtext: 'Try a different category or check back later',
    buttonLabel: 'Clear filter',
  },
  'no-connection': {
    heading: 'No connection',
    subtext: 'Check your signal and try again',
    buttonLabel: 'Retry',
  },
  'general-error': {
    heading: 'Something went wrong',
    subtext: 'Try again or check back later',
    buttonLabel: 'Retry',
  },
} as const;

function VariantIcon({ variant, category }: { variant: EmptyStateVariant; category?: Category | null }) {
  if (variant === 'empty-category') {
    // Reuse the category emoji (Story 2.1 precedent) — no library glyph needed.
    const placeholder = (category && CATEGORY_PLACEHOLDERS[category]) || FALLBACK_PLACEHOLDER;
    const { emoji } = placeholder || { emoji: '📌' };
    return (
      <Text accessibilityLabel={category ? `${category} category icon` : 'Category icon'} className={`text-[${ICON_SIZE}px]`}>
        {emoji || '📌'}
      </Text>
    );
  }
  const textSecondaryColor = COLORS.textSecondary || '#8A7E70';
  const errorColor = COLORS.error || '#FF4D4D';
  // Recolourable Feather glyphs — colours come from the theme `color` prop (not className).
  if (variant === 'no-connection') {
    return <Feather name="wifi-off" size={ICON_SIZE} color={textSecondaryColor} />;
  }
  return <Feather name="alert-triangle" size={ICON_SIZE} color={errorColor} />;
}

/**
 * Terminal-state placeholder for the feed: empty category, no connection, or a
 * general error. Centred icon → heading → subtext → self-sizing recovery pill.
 * Presentational — the parent binds `onAction` (clear-filter or refetch). The
 * pill always offers a visible, tappable recovery action (AC #7).
 */
export function EmptyState({ variant, category, onAction }: EmptyStateProps) {
  const config = VARIANT_CONFIG[variant];
  if (!config) {
    console.warn(`EmptyState: invalid variant "${variant}" — falling back to general-error`);
    const fallbackConfig = VARIANT_CONFIG['general-error'];
    return (
      <View className="items-center justify-center py-12">
        <Text className="text-[13px] font-inter text-text-secondary">Error rendering state</Text>
      </View>
    );
  }

  const heading =
    variant === 'empty-category' && category
      ? `No ${category} events right now`
      : config.heading;

  const handlePress = () => {
    if (typeof onAction === 'function') {
      try {
        onAction();
      } catch (error) {
        console.error('EmptyState onAction error:', error);
      }
    } else {
      console.warn('EmptyState: onAction is not a function');
    }
  };

  return (
    <View className="items-center justify-center py-12">
      <VariantIcon variant={variant} category={category} />

      <Text className="mt-3 text-[18px] font-inter-semibold text-text-primary">{heading}</Text>
      <Text className="mt-1 text-center text-[13px] font-inter text-text-secondary">
        {config.subtext}
      </Text>

      <Pressable
        onPress={handlePress}
        accessibilityRole="button"
        accessibilityLabel={config.buttonLabel}
        // 36px visual height + 4px top/bottom hitSlop → 44pt touch target (AC #5).
        hitSlop={{ top: 4, bottom: 4 }}
        // Press scale is a state-driven transform — documented dynamic-style
        // exception (cannot be a static className). No opacity change per AC #5.
        style={({ pressed }) => (pressed ? { transform: [{ scale: 0.95 }] } : undefined)}
        className="mt-4 h-9 items-center justify-center self-center rounded-[20px] bg-border px-4"
      >
        <Text className="text-[13px] font-inter-medium text-text-primary">{config.buttonLabel}</Text>
      </Pressable>
    </View>
  );
}
