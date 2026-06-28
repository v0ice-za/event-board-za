import {
  getAnalytics,
  logEvent,
  logScreenView as fbLogScreenView,
  setAnalyticsCollectionEnabled,
} from '@react-native-firebase/analytics';
import {
  getCrashlytics,
  setCrashlyticsCollectionEnabled,
} from '@react-native-firebase/crashlytics';

import type { Category } from '@/types';

export type AdType = 'banner' | 'interstitial';

// All wrappers are fire-and-forget: an analytics failure must never break a screen or a
// tap. Takes a thunk (not a Promise) so a SYNCHRONOUS throw from getAnalytics()/logEvent()
// (e.g. Firebase default app not ready) is caught too — a bare `.catch` only handles async
// rejection, which would otherwise let a sync throw abort the caller (e.g. a tap handler).
function fireAndForget(run: () => Promise<unknown>): void {
  try {
    run().catch(() => {});
  } catch {
    // synchronous failure — stay silent, never break the caller
  }
}

/** Screen-view event. Uses the dedicated screen-view API (not logEvent — `screen_view` is reserved). */
export function logScreenView(screenName: string): void {
  fireAndForget(() =>
    fbLogScreenView(getAnalytics(), { screen_name: screenName, screen_class: screenName }),
  );
}

/** A category chip was tapped in the feed. Logs the tapped category only (never the All reset). */
export function logCategoryFilter(category: Category): void {
  fireAndForget(() => logEvent(getAnalytics(), 'category_filter', { category }));
}

/** The Tickets CTA was tapped on a detail screen. */
export function logTicketLinkTapped(eventId: string): void {
  fireAndForget(() => logEvent(getAnalytics(), 'ticket_link_tapped', { event_id: eventId }));
}

/**
 * An ad was shown (banner loaded / interstitial loaded) — success path only.
 * NOTE: the event name is `ad_view`, NOT `ad_impression` — the latter is a GA4-reserved
 * event name that `logEvent` rejects.
 */
export function logAdImpression(adType: AdType): void {
  fireAndForget(() => logEvent(getAnalytics(), 'ad_view', { ad_type: adType }));
}

/**
 * Enable/disable Analytics + Crashlytics collection. Disabled in dev (`__DEV__`) so local
 * sessions never pollute production data; enabled in production. Called once at app start.
 */
export function initInstrumentation(): void {
  fireAndForget(() => setAnalyticsCollectionEnabled(getAnalytics(), !__DEV__));
  fireAndForget(() => setCrashlyticsCollectionEnabled(getCrashlytics(), !__DEV__));
}
