import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { renderHook, waitFor } from '@testing-library/react-native';
import React from 'react';

import { useEvents } from './useEvents';

const mockGetDocs = jest.fn();
const mockCollection = jest.fn((..._a: unknown[]) => ({ _collection: true }));
const mockQuery = jest.fn((...a: unknown[]) => ({ _query: a }));
const mockWhere = jest.fn((...a: unknown[]) => ({ _where: a }));
const mockOrderBy = jest.fn((...a: unknown[]) => ({ _orderBy: a }));
const mockLimit = jest.fn((n: number) => ({ _limit: n }));

jest.mock('@react-native-firebase/firestore', () => ({
  collection: (...a: unknown[]) => mockCollection(...a),
  query: (...a: unknown[]) => mockQuery(...a),
  where: (...a: unknown[]) => mockWhere(...a),
  orderBy: (...a: unknown[]) => mockOrderBy(...a),
  limit: (n: number) => mockLimit(n),
  getDocs: (...a: unknown[]) => mockGetDocs(...a),
}));

jest.mock('@/lib/firebase', () => ({ db: {} }));

// Fresh QueryClient per render with retry:false so the error test fails fast
// (does not inherit the app's retry:3). createElement (not JSX) keeps this a .ts file
// so `tsc --noEmit` stays clean per AC #9.
function wrapper({ children }: { children: React.ReactNode }) {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return React.createElement(QueryClientProvider, { client }, children);
}

const sampleDoc = (id: string, fields: Record<string, unknown>) => ({
  id,
  data: () => fields,
});

beforeEach(() => {
  jest.clearAllMocks();
});

describe('useEvents', () => {
  it('(a) maps events from the snapshot, attaching doc.id', async () => {
    mockGetDocs.mockResolvedValueOnce({
      docs: [
        sampleDoc('e1', { name: 'Jazz Night', date: '2026-06-21', category: 'Music' }),
        sampleDoc('e2', { name: 'Food Fest', date: '2026-06-22', category: 'Food & Drink' }),
      ],
    });

    const { result } = renderHook(() => useEvents(null), { wrapper });

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(result.current.events).toHaveLength(2);
    expect(result.current.events[0]).toEqual({
      id: 'e1',
      name: 'Jazz Night',
      date: '2026-06-21',
      category: 'Music',
    });
    expect(result.current.isError).toBe(false);
  });

  it('(a) doc.id wins over a body field named `id`', async () => {
    // External feeds (Quicket/Eventbrite/Howler) may carry a provider `id` in the
    // document body. The canonical Firestore doc key must always win so downstream
    // eventKeys.detail(id) / detail-screen lookups resolve correctly.
    mockGetDocs.mockResolvedValueOnce({
      docs: [
        sampleDoc('firestore-key', {
          id: 'provider-id-should-not-win',
          name: 'Jazz Night',
          date: '2026-06-21',
          category: 'Music',
        }),
      ],
    });

    const { result } = renderHook(() => useEvents(null), { wrapper });
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(result.current.events[0].id).toBe('firestore-key');
  });

  it('(b) adds the category where-filter when category is non-null', async () => {
    mockGetDocs.mockResolvedValueOnce({ docs: [] });

    const { result } = renderHook(() => useEvents('Music'), { wrapper });
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    const categoryCall = mockWhere.mock.calls.find(
      (call) => call[0] === 'category',
    );
    expect(categoryCall).toEqual(['category', '==', 'Music']);
  });

  it('(b) omits the category where-filter when category is null', async () => {
    mockGetDocs.mockResolvedValueOnce({ docs: [] });

    const { result } = renderHook(() => useEvents(null), { wrapper });
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    const categoryCall = mockWhere.mock.calls.find(
      (call) => call[0] === 'category',
    );
    expect(categoryCall).toBeUndefined();
    // The only where() applied is the date range.
    expect(mockWhere).toHaveBeenCalledTimes(1);
  });

  it('(c) orders by date asc and applies the date >= today range', async () => {
    mockGetDocs.mockResolvedValueOnce({ docs: [] });

    const { result } = renderHook(() => useEvents(null), { wrapper });
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(mockOrderBy).toHaveBeenCalledWith('date', 'asc');

    const dateCall = mockWhere.mock.calls.find((call) => call[0] === 'date');
    expect(dateCall).toBeDefined();
    expect(dateCall?.[1]).toBe('>=');
    // Local ISO date "YYYY-MM-DD" (not UTC) — see localTodayISO.
    expect(dateCall?.[2]).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });

  it('(d) surfaces isError and returns [] when the query rejects', async () => {
    mockGetDocs.mockRejectedValueOnce(new Error('boom'));

    const { result } = renderHook(() => useEvents(null), { wrapper });

    await waitFor(() => expect(result.current.isError).toBe(true));
    expect(result.current.events).toEqual([]);
  });

  it('validates that collection() is called before query()', async () => {
    mockGetDocs.mockResolvedValueOnce({ docs: [] });

    renderHook(() => useEvents(null), { wrapper });
    await waitFor(() => expect(mockGetDocs).toHaveBeenCalled());

    // Ensure collection is invoked (patch #7: mockQuery fidelity).
    expect(mockCollection).toHaveBeenCalledWith({}, 'events');
    expect(mockQuery).toHaveBeenCalled();
  });

  it('handles invalid category gracefully (unmapped category)', async () => {
    mockGetDocs.mockResolvedValueOnce({
      docs: [
        sampleDoc('e1', { name: 'Test Event', date: '2026-06-21', category: 'Cricket' }),
      ],
    });

    const { result } = renderHook(() => useEvents('Cricket' as any), { wrapper });
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    // Should still map the event, even with unmapped category (downstream handles it).
    expect(result.current.events).toHaveLength(1);
    expect(result.current.events[0].category).toBe('Cricket');
  });

  it('refetches with updated query key when category changes', async () => {
    mockGetDocs.mockResolvedValueOnce({ docs: [] });

    const { result, rerender } = renderHook(
      ({ cat }: { cat: any }) => useEvents(cat),
      { wrapper, initialProps: { cat: null } },
    );
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    const firstCallCount = mockQuery.mock.calls.length;

    // Rerender with different category.
    rerender({ cat: 'Music' });
    await waitFor(() => expect(mockQuery).toHaveBeenCalledTimes(firstCallCount + 1));

    // Verify the new query was triggered with category filter.
    const lastCall = mockWhere.mock.calls[mockWhere.mock.calls.length - 1];
    expect(lastCall).toEqual(['category', '==', 'Music']);
  });

  it('applies limit constraint to the query', async () => {
    mockGetDocs.mockResolvedValueOnce({ docs: [] });

    renderHook(() => useEvents(null), { wrapper });
    await waitFor(() => expect(mockGetDocs).toHaveBeenCalled());

    // Verify limit(50) is called (patch #12).
    expect(mockLimit).toHaveBeenCalledWith(50);
  });
});
