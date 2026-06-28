import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { renderHook, waitFor } from '@testing-library/react-native';
import React from 'react';

import { useEventDetail } from './useEventDetail';

const mockDoc = jest.fn((..._a: unknown[]) => ({ _doc: true }));
const mockGetDoc = jest.fn();

jest.mock('@react-native-firebase/firestore', () => ({
  doc: (...a: unknown[]) => mockDoc(...a),
  getDoc: (...a: unknown[]) => mockGetDoc(...a),
}));

jest.mock('@/lib/firebase', () => ({ db: {} }));

// Fresh QueryClient per render. The hook sets its OWN per-query `retry` predicate
// (AC #7), which overrides the client default — so for a transient error the hook
// still retries up to 3×. `retryDelay: 0` collapses that exponential backoff to
// instant so the (c) failure test settles inside waitFor; the not-found error
// short-circuits (retry → false) regardless. createElement (not JSX) keeps this a
// .ts file so `tsc --noEmit` stays clean.
function wrapper({ children }: { children: React.ReactNode }) {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false, retryDelay: 0 } },
  });
  return React.createElement(QueryClientProvider, { client }, children);
}

beforeEach(() => {
  jest.clearAllMocks();
});

describe('useEventDetail', () => {
  it('(a) returns the mapped event on success, attaching doc.id', async () => {
    // exists() is a METHOD in @react-native-firebase v24 modular (verified against
    // types/firestore.d.ts: `exists(): this is QueryDocumentSnapshot`).
    mockGetDoc.mockResolvedValueOnce({
      exists: () => true,
      id: 'e1',
      data: () => ({ name: 'Jazz Night', date: '2026-06-21', category: 'Music' }),
    });

    const { result } = renderHook(() => useEventDetail('e1'), { wrapper });

    // AC #6: isLoading is the cold-load signal — true on the initial fetch with no
    // cached data, before the query settles. (Verifies the deliberate isLoading-over-
    // isPending mapping, not just its transition to false.)
    expect(result.current.isLoading).toBe(true);

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(result.current.event).toEqual({
      id: 'e1',
      name: 'Jazz Night',
      date: '2026-06-21',
      category: 'Music',
    });
    expect(result.current.isError).toBe(false);
  });

  it('(a) doc.id wins over a body field named `id`', async () => {
    // External feeds (Quicket/Eventbrite/Howler) may carry a provider `id` in the
    // document body. The canonical Firestore doc key must always win.
    mockGetDoc.mockResolvedValueOnce({
      exists: () => true,
      id: 'firestore-key',
      data: () => ({
        id: 'provider-id-should-not-win',
        name: 'Jazz Night',
        date: '2026-06-21',
        category: 'Music',
      }),
    });

    const { result } = renderHook(() => useEventDetail('firestore-key'), { wrapper });
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(result.current.event?.id).toBe('firestore-key');
  });

  it('(b) missing document → event null AND isError true', async () => {
    mockGetDoc.mockResolvedValueOnce({
      exists: () => false,
      id: 'missing',
      data: () => undefined,
    });

    const { result } = renderHook(() => useEventDetail('missing'), { wrapper });

    await waitFor(() => expect(result.current.isError).toBe(true));
    expect(result.current.event).toBeNull();
    // AC #7: not-found is permanent — the retry predicate must short-circuit it, so
    // getDoc is called exactly ONCE (no retries). Without retryDelay:0 masking it,
    // this is what actually distinguishes fail-fast from the standard retry path.
    expect(mockGetDoc).toHaveBeenCalledTimes(1);
  });

  it('(c) Firestore failure → isError true and event null', async () => {
    // Transient (non-not-found) errors retry per AC #7; mock every attempt so all
    // 4 tries reject cleanly. retryDelay:0 (wrapper) keeps this fast.
    mockGetDoc.mockRejectedValue(new Error('boom'));

    const { result } = renderHook(() => useEventDetail('e1'), { wrapper });

    await waitFor(() => expect(result.current.isError).toBe(true));
    expect(result.current.event).toBeNull();
    // AC #7: a transient error stays on the standard retry path. The predicate
    // (failureCount < 3, pre-increment) yields 4 total attempts — matching the app's
    // retry:3 default — proving not-found's single attempt above is genuine fail-fast.
    expect(mockGetDoc).toHaveBeenCalledTimes(4);
  });

  it('(d) fetches the doc at events/{id} for the passed id', async () => {
    mockGetDoc.mockResolvedValueOnce({
      exists: () => true,
      id: 'e1',
      data: () => ({ name: 'Jazz Night', date: '2026-06-21', category: 'Music' }),
    });

    renderHook(() => useEventDetail('e1'), { wrapper });
    await waitFor(() => expect(mockGetDoc).toHaveBeenCalled());

    // db mock is {}; eventKeys.detail(id) drives the cache, doc() drives the path.
    expect(mockDoc).toHaveBeenCalledWith({}, 'events', 'e1');
  });
});
