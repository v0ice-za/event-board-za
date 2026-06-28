import { useState } from 'react';
import { View, Text } from 'react-native';
import Constants from 'expo-constants';
import { BannerAd, BannerAdSize, TestIds } from 'react-native-google-mobile-ads';

import { logAdImpression } from '@/lib/analytics';

// AdBannerUnit is the ONLY component permitted to import react-native-google-mobile-ads
// (architecture AdMob boundary). The SDK is already initialised in app/_layout.tsx —
// never re-initialise it here.

// Production reads the real unit ID from app.config.ts `extra` (placeholder until
// Story 5.5 release prep); dev shows Google's official test banner (resolved per-render
// off __DEV__ in resolveUnitId).
const PROD_UNIT_ID =
  (Constants.expoConfig?.extra?.admobBannerUnitId as string | undefined) ?? '';

function resolveUnitId(): string {
  return __DEV__ ? TestIds.BANNER : PROD_UNIT_ID;
}

interface AdBannerUnitProps {
  /** Lets the feed tag the slot (e.g. "feed-ad-slot") for queries/tests. */
  testID?: string;
}

/**
 * AdMob banner wrapper for the feed (FR-9, UX-DR9). Occupies zero height until an ad
 * resolves and stays zero-height if the load fails — no blank space, no spinner, no
 * layout shift. Owns its own load/fail state; the parent never inspects ad state.
 * Ad load failures are silent (no logging) per the project error-handling rule.
 */
export function AdBannerUnit({ testID }: AdBannerUnitProps) {
  const [loaded, setLoaded] = useState(false);

  return (
    // Dynamic height toggle (0 ↔ auto) is the documented inline-style exception: it
    // cannot be expressed as a static className. Chrome (bg + label) shows only once loaded.
    <View
      testID={testID}
      className={loaded ? 'bg-surface' : ''}
      style={loaded ? undefined : { height: 0, overflow: 'hidden' }}
    >
      <BannerAd
        unitId={resolveUnitId()}
        size={BannerAdSize.ANCHORED_ADAPTIVE_BANNER}
        // Non-personalised ads — consistent with the interstitial and the disclosure-only
        // POPIA posture (NSPrivacyTracking: false; no UMP/ATT consent prompt in v1).
        requestOptions={{ requestNonPersonalizedAdsOnly: true }}
        onAdLoaded={() => {
          setLoaded(true);
          logAdImpression('banner'); // success path only — failure stays silent below
        }}
        onAdFailedToLoad={() => setLoaded(false)}
      />
      {loaded && (
        <Text className="absolute right-1 top-1 text-[9px] font-inter text-text-secondary">
          Ad
        </Text>
      )}
    </View>
  );
}
