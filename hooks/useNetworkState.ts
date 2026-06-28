import * as Network from 'expo-network';

/**
 * Reactive connectivity hook wrapping expo-network's own `useNetworkState`,
 * which auto-manages the listener + cleanup. `NetworkState.isConnected` is
 * `boolean | undefined`; unknown state coerces to `true` so the offline UI
 * never flashes before the first reading (Story 2.4 AC #1).
 */
export function useNetworkState(): { isConnected: boolean } {
  try {
    const state = Network.useNetworkState();
    if (!state) return { isConnected: true };
    return { isConnected: state.isConnected ?? true };
  } catch {
    return { isConnected: true };
  }
}
