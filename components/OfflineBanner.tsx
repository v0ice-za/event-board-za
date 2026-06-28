import { Text, View } from 'react-native';

/**
 * Slim presentational strip shown atop the feed when offline while cached data
 * is still visible. No network logic of its own — the feed (Story 2.6) owns the
 * `isConnected && hasCachedData` gating that mounts it. `accessibilityRole="alert"`
 * so screen readers announce the degraded state (AC #6).
 */
export function OfflineBanner() {
  return (
    <View
      accessible
      accessibilityRole="alert"
      className="w-full items-center border-b border-border bg-surface py-2"
    >
      <Text className="text-[13px] font-inter text-text-secondary">
        No connection — showing saved events
      </Text>
    </View>
  );
}
