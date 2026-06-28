import { render, screen, act } from '@testing-library/react-native';

// Imported here; jest.mock calls below are hoisted above this by babel-jest, so the
// SDK + Constants are already the fakes when AdBannerUnit loads.
import { AdBannerUnit } from './AdBannerUnit';

// Capture the BannerAd props so tests can drive onAdLoaded / onAdFailedToLoad.
const mockBanner: { props: Record<string, unknown> | null } = { props: null };

jest.mock('react-native-google-mobile-ads', () => ({
  __esModule: true,
  BannerAd: (props: Record<string, unknown>) => {
    mockBanner.props = props;
    return null;
  },
  BannerAdSize: { ANCHORED_ADAPTIVE_BANNER: 'ANCHORED_ADAPTIVE_BANNER', BANNER: 'BANNER' },
  TestIds: { BANNER: 'test-banner-id' },
}));

jest.mock('expo-constants', () => ({
  __esModule: true,
  default: { expoConfig: { extra: { admobBannerUnitId: 'prod-unit-id' } } },
}));

jest.mock('@/lib/analytics', () => ({ logAdImpression: jest.fn() }));

// eslint-disable-next-line @typescript-eslint/no-require-imports
const { logAdImpression } = require('@/lib/analytics') as { logAdImpression: jest.Mock };

const fireLoaded = () => act(() => (mockBanner.props?.onAdLoaded as () => void)());
const fireFailed = () => act(() => (mockBanner.props?.onAdFailedToLoad as () => void)());

beforeEach(() => {
  jest.clearAllMocks();
  mockBanner.props = null;
});

describe('AdBannerUnit', () => {
  it('renders zero-height with no "Ad" label before the ad resolves', () => {
    render(<AdBannerUnit testID="ad" />);

    expect(screen.getByTestId('ad').props.style).toEqual({ height: 0, overflow: 'hidden' });
    expect(screen.queryByText('Ad')).toBeNull();
  });

  it('shows the "Ad" label and takes natural height after onAdLoaded', () => {
    render(<AdBannerUnit testID="ad" />);
    fireLoaded();

    expect(screen.getByTestId('ad').props.style).toBeUndefined();
    expect(screen.getByTestId('ad').props.className).toContain('bg-surface');
    expect(screen.queryByText('Ad')).not.toBeNull();
  });

  it('logs a banner ad impression on the success path (onAdLoaded)', () => {
    render(<AdBannerUnit testID="ad" />);
    fireLoaded();

    expect(logAdImpression).toHaveBeenCalledWith('banner');
  });

  it('stays zero-height and silent after onAdFailedToLoad (no throw, no label, no impression)', () => {
    render(<AdBannerUnit testID="ad" />);
    expect(fireFailed).not.toThrow();

    expect(screen.getByTestId('ad').props.style).toEqual({ height: 0, overflow: 'hidden' });
    expect(screen.queryByText('Ad')).toBeNull();
    expect(logAdImpression).not.toHaveBeenCalled();
  });

  it('uses the Google test banner unit ID in development (__DEV__)', () => {
    render(<AdBannerUnit testID="ad" />);
    expect(mockBanner.props?.unitId).toBe('test-banner-id');
  });

  it('uses the configured production unit ID when not in development', () => {
    const g = globalThis as Record<string, unknown>;
    const prevDev = g.__DEV__;
    g.__DEV__ = false; // unit ID is resolved per-render off __DEV__
    try {
      render(<AdBannerUnit testID="ad" />);
      expect(mockBanner.props?.unitId).toBe('prod-unit-id');
    } finally {
      g.__DEV__ = prevDev;
    }
  });
});
