import { renderHook } from '@testing-library/react-native';

import { useNetworkState } from './useNetworkState';

const mockNetworkState = jest.fn();
jest.mock('expo-network', () => ({
  useNetworkState: () => mockNetworkState(),
}));

describe('useNetworkState', () => {
  it('returns isConnected false when the platform reports offline', () => {
    mockNetworkState.mockReturnValue({ isConnected: false });
    const { result } = renderHook(() => useNetworkState());
    expect(result.current.isConnected).toBe(false);
  });

  it('coerces unknown connectivity (undefined) to true so offline never flashes', () => {
    mockNetworkState.mockReturnValue({});
    const { result } = renderHook(() => useNetworkState());
    expect(result.current.isConnected).toBe(true);
  });

  it('returns isConnected true when the platform reports online', () => {
    mockNetworkState.mockReturnValue({ isConnected: true });
    const { result } = renderHook(() => useNetworkState());
    expect(result.current.isConnected).toBe(true);
  });

  it('handles null state gracefully and returns true', () => {
    mockNetworkState.mockReturnValue(null);
    const { result } = renderHook(() => useNetworkState());
    expect(result.current.isConnected).toBe(true);
  });

  it('handles exception in useNetworkState gracefully and returns true', () => {
    mockNetworkState.mockImplementation(() => {
      throw new Error('Network module error');
    });
    const { result } = renderHook(() => useNetworkState());
    expect(result.current.isConnected).toBe(true);
  });
});
