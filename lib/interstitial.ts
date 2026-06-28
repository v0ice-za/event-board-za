import { createContext, useContext } from 'react';

/**
 * Interstitial cadence + plumbing — deliberately SDK-free.
 *
 * The AdMob SDK (`react-native-google-mobile-ads`) is imported ONLY by
 * `app/_layout.tsx` (interstitial) and `components/AdBannerUnit.tsx` (banner) per the
 * architecture AdMob boundary. This module just carries a `recordDetailView` callback
 * so screens (e.g. `app/event/[id].tsx`) can signal a detail-view without touching the SDK.
 */

/** Show an interstitial after the user opens this many event-detail screens per session. */
export const INTERSTITIAL_TRIGGER_COUNT = 3;

/** Pure cadence predicate — kept testable and independent of the SDK. */
export function shouldShowInterstitial(count: number): boolean {
  return count >= INTERSTITIAL_TRIGGER_COUNT;
}

/**
 * Carries the `recordDetailView` callback supplied by `app/_layout.tsx`.
 * Default is a no-op so screens render fine without a provider (keeps screen tests simple).
 */
export const InterstitialContext = createContext<() => void>(() => {});

/** Screens call this on mount to register a detail-view toward the interstitial cadence. */
export function useRecordDetailView(): () => void {
  return useContext(InterstitialContext);
}
