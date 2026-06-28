import { type ReactNode } from 'react';
import { renderHook } from '@testing-library/react-native';

import {
  INTERSTITIAL_TRIGGER_COUNT,
  InterstitialContext,
  shouldShowInterstitial,
  useRecordDetailView,
} from './interstitial';

describe('interstitial cadence helpers', () => {
  it('triggers after every 3rd detail view', () => {
    expect(INTERSTITIAL_TRIGGER_COUNT).toBe(3);
  });

  it('shouldShowInterstitial is false below the trigger and true at/above it', () => {
    expect(shouldShowInterstitial(0)).toBe(false);
    expect(shouldShowInterstitial(1)).toBe(false);
    expect(shouldShowInterstitial(2)).toBe(false);
    expect(shouldShowInterstitial(3)).toBe(true);
    expect(shouldShowInterstitial(4)).toBe(true);
  });
});

describe('useRecordDetailView', () => {
  it('returns a callable no-op when no provider is present', () => {
    const { result } = renderHook(() => useRecordDetailView());
    expect(typeof result.current).toBe('function');
    expect(() => result.current()).not.toThrow();
  });

  it('returns the callback supplied by InterstitialContext.Provider', () => {
    const spy = jest.fn();
    const wrapper = ({ children }: { children: ReactNode }) => (
      <InterstitialContext.Provider value={spy}>{children}</InterstitialContext.Provider>
    );
    const { result } = renderHook(() => useRecordDetailView(), { wrapper });

    result.current();

    expect(spy).toHaveBeenCalledTimes(1);
  });
});
