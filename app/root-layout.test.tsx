import { act, render } from '@testing-library/react-native';

import { initInstrumentation, logAdImpression } from '@/lib/analytics';

import RootLayout from './_layout';

// --- Mocks -------------------------------------------------------------------

// NativeWind global stylesheet — no transformer for .css in jest, so stub it.
jest.mock('../global.css', () => ({}));

// Firebase side-effect import — avoid pulling in native Firestore.
jest.mock('@/lib/firebase', () => ({}));

jest.mock('@/lib/analytics', () => ({
  initInstrumentation: jest.fn(),
  logAdImpression: jest.fn(),
}));

jest.mock('@/lib/queryClient', () => ({ queryClient: {} }));

// Fonts resolve immediately so RootLayout renders its tree (not the null gate).
jest.mock('@expo-google-fonts/inter', () => ({
  useFonts: () => [true, null],
  Inter_400Regular: 'Inter_400Regular',
  Inter_500Medium: 'Inter_500Medium',
  Inter_600SemiBold: 'Inter_600SemiBold',
  Inter_700Bold: 'Inter_700Bold',
}));

jest.mock('expo-splash-screen', () => ({
  preventAutoHideAsync: jest.fn(() => Promise.resolve()),
  hideAsync: jest.fn(() => Promise.resolve()),
}));

jest.mock('expo-constants', () => ({
  __esModule: true,
  default: { expoConfig: { extra: { admobInterstitialUnitId: 'prod-interstitial-id' } } },
}));

jest.mock('react-native-safe-area-context', () => ({
  SafeAreaProvider: ({ children }: { children: React.ReactNode }) => children,
}));

jest.mock('@tanstack/react-query', () => ({
  QueryClientProvider: ({ children }: { children: React.ReactNode }) => children,
}));

// Stack is a leaf in this test. It consumes the REAL InterstitialContext so the test can
// reach the recordDetailView callback RootLayout supplies (stored on globalThis because a
// jest.mock factory may not reference out-of-scope variables).
jest.mock('expo-router', () => {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const React = require('react');
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { InterstitialContext } = require('@/lib/interstitial');
  return {
    Stack: () => {
      (globalThis as Record<string, unknown>).__recordDetailView =
        React.useContext(InterstitialContext);
      return null;
    },
  };
});

// AdMob SDK — a controllable interstitial whose event callbacks the test can drive.
jest.mock('react-native-google-mobile-ads', () => {
  const listeners: Record<string, () => void> = {};
  const fakeInterstitial = {
    __listeners: listeners,
    load: jest.fn(),
    show: jest.fn(() => Promise.resolve()),
    addAdEventListener: jest.fn((type: string, cb: () => void) => {
      listeners[type] = cb;
      return jest.fn(); // unsubscribe
    }),
  };
  return {
    __esModule: true,
    default: () => ({ initialize: () => Promise.resolve([]) }),
    InterstitialAd: { createForAdRequest: jest.fn(() => fakeInterstitial) },
    AdEventType: { LOADED: 'loaded', ERROR: 'error', OPENED: 'opened', CLOSED: 'closed' },
    TestIds: { INTERSTITIAL: 'test-interstitial-id', BANNER: 'test-banner-id' },
    __fake: fakeInterstitial,
  };
});

// --- Helpers -----------------------------------------------------------------

type FakeInterstitial = {
  __listeners: Record<string, () => void>;
  load: jest.Mock;
  show: jest.Mock;
  addAdEventListener: jest.Mock;
};

const getFake = (): FakeInterstitial =>
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  (require('react-native-google-mobile-ads') as { __fake: FakeInterstitial }).__fake;

const recordView = () =>
  act(() => {
    ((globalThis as Record<string, unknown>).__recordDetailView as () => void)();
  });

const fireEvent = (type: 'loaded' | 'opened' | 'closed' | 'error') =>
  act(() => {
    getFake().__listeners[type]?.();
  });

beforeEach(() => {
  jest.clearAllMocks();
});

// --- Tests -------------------------------------------------------------------

describe('RootLayout interstitial', () => {
  it('(a) preloads an interstitial on app start', () => {
    render(<RootLayout />);
    expect(getFake().load).toHaveBeenCalledTimes(1);
  });

  it('(b) shows the interstitial only after the 3rd detail view (when loaded)', () => {
    render(<RootLayout />);
    fireEvent('loaded');

    recordView();
    expect(getFake().show).not.toHaveBeenCalled();
    recordView();
    expect(getFake().show).not.toHaveBeenCalled();
    recordView();
    expect(getFake().show).toHaveBeenCalledTimes(1);
  });

  it('(c) skips silently when the ad is not ready, and re-loads for the next cycle', () => {
    render(<RootLayout />);
    // No "loaded" event fired → ad not ready.
    recordView();
    recordView();
    recordView();

    expect(getFake().show).not.toHaveBeenCalled();
    // load: once on mount + once re-attempt at the (skipped) trigger.
    expect(getFake().load).toHaveBeenCalledTimes(2);
  });

  it('(d) resets the counter and preloads the next ad after the interstitial closes', () => {
    render(<RootLayout />);
    fireEvent('loaded');

    recordView();
    recordView();
    recordView();
    expect(getFake().show).toHaveBeenCalledTimes(1);

    fireEvent('closed'); // dismissed → reset + preload next
    expect(getFake().load).toHaveBeenCalledTimes(2); // mount + preload-next

    // Next cycle: ad loads again, 3 more views → shows again.
    fireEvent('loaded');
    recordView();
    recordView();
    recordView();
    expect(getFake().show).toHaveBeenCalledTimes(2);
  });

  it('(e) an ad error is silent and does not show or throw', () => {
    render(<RootLayout />);
    expect(() => fireEvent('error')).not.toThrow();

    recordView();
    recordView();
    recordView();
    // After an error the ad is not loaded → skip (no show), re-load attempted.
    expect(getFake().show).not.toHaveBeenCalled();
  });

  it('(f) enables/disables instrumentation once on mount', () => {
    render(<RootLayout />);
    expect(initInstrumentation).toHaveBeenCalledTimes(1);
  });

  it('(g) logs an interstitial impression on the OPENED (display) event, not on LOADED', () => {
    render(<RootLayout />);
    expect(logAdImpression).not.toHaveBeenCalled();

    // Preload is NOT an impression — loading the ad must not log a view.
    fireEvent('loaded');
    expect(logAdImpression).not.toHaveBeenCalled();

    // The ad is actually shown → impression logged once.
    fireEvent('opened');
    expect(logAdImpression).toHaveBeenCalledWith('interstitial');

    // Error path stays silent — no impression.
    (logAdImpression as jest.Mock).mockClear();
    fireEvent('error');
    expect(logAdImpression).not.toHaveBeenCalled();
  });
});
