import '../global.css';
import { Stack } from 'expo-router';
import { QueryClientProvider } from '@tanstack/react-query';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import Constants from 'expo-constants';
import MobileAds, {
  InterstitialAd,
  AdEventType,
  TestIds,
} from 'react-native-google-mobile-ads';
import {
  useFonts,
  Inter_400Regular,
  Inter_500Medium,
  Inter_600SemiBold,
  Inter_700Bold,
} from '@expo-google-fonts/inter';
import * as SplashScreen from 'expo-splash-screen';
import { useCallback, useEffect, useRef } from 'react';
import { queryClient } from '@/lib/queryClient';
import { InterstitialContext, INTERSTITIAL_TRIGGER_COUNT } from '@/lib/interstitial';
import { initInstrumentation, logAdImpression } from '@/lib/analytics';
import '@/lib/firebase'; // side-effect: ensures Firebase auto-init fires before any Firestore hook

SplashScreen.preventAutoHideAsync();

// AdMob boundary: app/_layout.tsx is the ONLY place interstitial logic lives, and one of
// the two files (with components/AdBannerUnit.tsx) permitted to import the AdMob SDK.
// Production reads the real unit ID from app.config.ts `extra` (placeholder until Story 5.5);
// dev uses Google's official test interstitial. requestNonPersonalizedAdsOnly is a privacy-safe
// default until the POPIA/consent work in Story 5.4.
const PROD_INTERSTITIAL_UNIT_ID =
  (Constants.expoConfig?.extra?.admobInterstitialUnitId as string | undefined) ?? '';

function resolveInterstitialUnitId(): string {
  return __DEV__ ? TestIds.INTERSTITIAL : PROD_INTERSTITIAL_UNIT_ID;
}

export default function RootLayout() {
  const [fontsLoaded, fontError] = useFonts({
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
    Inter_700Bold,
  });

  // Created once for the session. Single-use per load: after show()→CLOSED we reload.
  const interstitialRef = useRef<InterstitialAd | null>(null);
  if (interstitialRef.current === null) {
    interstitialRef.current = InterstitialAd.createForAdRequest(resolveInterstitialUnitId(), {
      requestNonPersonalizedAdsOnly: true,
    });
  }

  // Refs (not state): these gate imperative SDK calls and must not trigger re-renders.
  const loadedRef = useRef(false);
  const detailViewCountRef = useRef(0);

  useEffect(() => {
    if (fontsLoaded || fontError) {
      SplashScreen.hideAsync().catch(() => {});
    }
  }, [fontsLoaded, fontError]);

  useEffect(() => {
    MobileAds().initialize().catch(() => {});
    // Enable/disable Analytics + Crashlytics collection (disabled in __DEV__). Never throws.
    initInstrumentation();
  }, []);

  // Preload the interstitial on app start and keep one ready for the next cycle.
  // All ad failures are silent (no log, no throw) per the project error-handling rule.
  useEffect(() => {
    const interstitial = interstitialRef.current;
    if (!interstitial) return;

    const unsubLoaded = interstitial.addAdEventListener(AdEventType.LOADED, () => {
      loadedRef.current = true;
    });
    const unsubOpened = interstitial.addAdEventListener(AdEventType.OPENED, () => {
      // Impression = the ad was actually displayed (not merely preloaded). Success path only.
      logAdImpression('interstitial');
    });
    const unsubClosed = interstitial.addAdEventListener(AdEventType.CLOSED, () => {
      loadedRef.current = false;
      detailViewCountRef.current = 0;
      interstitial.load(); // preload the next ad immediately
    });
    const unsubError = interstitial.addAdEventListener(AdEventType.ERROR, () => {
      loadedRef.current = false; // silent; the next trigger's "else load()" re-attempts
    });

    interstitial.load(); // preload on app start

    return () => {
      unsubLoaded();
      unsubOpened();
      unsubClosed();
      unsubError();
    };
  }, []);

  // Signalled by the detail screen on each view. After every 3rd view, show the ad if it is
  // ready; otherwise reset and re-load so the next cycle can show — the user is never blocked.
  const recordDetailView = useCallback(() => {
    const interstitial = interstitialRef.current;
    if (!interstitial) return;

    detailViewCountRef.current += 1;
    if (detailViewCountRef.current >= INTERSTITIAL_TRIGGER_COUNT) {
      detailViewCountRef.current = 0;
      if (loadedRef.current) {
        interstitial.show().catch(() => {
          // show() failed → no CLOSED event fires; reset and reload so the next
          // cycle can recover instead of re-showing the same stale ad forever.
          loadedRef.current = false;
          interstitial.load();
        });
      } else {
        interstitial.load();
      }
    }
  }, []);

  if (!fontsLoaded && !fontError) return null;

  return (
    <SafeAreaProvider>
      <QueryClientProvider client={queryClient}>
        <InterstitialContext.Provider value={recordDetailView}>
          <Stack screenOptions={{ headerShown: false }} />
        </InterstitialContext.Provider>
      </QueryClientProvider>
    </SafeAreaProvider>
  );
}
