import { useQuery } from '@tanstack/react-query';
import { doc, getDoc } from '@react-native-firebase/firestore';

import { db } from '@/lib/firebase';
import { eventKeys } from '@/lib/queryKeys';
import type { Event } from '@/types';

export interface UseEventDetailResult {
  event: Event | null;
  isLoading: boolean;
  isError: boolean;
}

// Tagged error so the per-query retry predicate can identify the permanent
// "document does not exist" case and short-circuit retries (AC #7). Module-scoped,
// not exported — its only consumer is the retry predicate below.
class EventNotFoundError extends Error {}

/**
 * Fetches a single event from Firestore by document id (`events/{id}`) using the
 * modular v24 API. Server state is owned entirely by TanStack Query — errors flow
 * through `isError` (no try/catch). The contract is deliberately smaller than
 * `useEvents`: it returns `{ event, isLoading, isError }` with NO `refetch`
 * (architecture.md:400-404 — detail-screen errors use a back-navigation EmptyState,
 * not in-place retry).
 *
 * A missing document is a *successful* Firestore read (`snap.exists()` is false, no
 * throw), so the queryFn throws so TanStack Query flips `isError` to true; with no
 * data, `result.data` stays undefined → `event` resolves to `null` (AC #5).
 */
export function useEventDetail(id: string): UseEventDetailResult {
  const result = useQuery({
    queryKey: eventKeys.detail(id),
    queryFn: async (): Promise<Event> => {
      // exists() is a METHOD in @react-native-firebase v24 modular (verified against
      // types/firestore.d.ts: `exists(): this is QueryDocumentSnapshot`) — NOT the
      // boolean property older RNFB exposed.
      const snap = await getDoc(doc(db, 'events', id));
      if (!snap.exists()) {
        throw new EventNotFoundError(`Event not found: ${id}`);
      }
      // Type cast `as Event` is the sanctioned trust-boundary cast: Firestore documents
      // are written via Cloud Function normaliseEvent() (Epic 4) which enforces the shape.
      // Spread data() FIRST so the Firestore doc key (snap.id) always wins over any body
      // field named `id` — plausible from external Quicket/Eventbrite/Howler feeds.
      return { ...snap.data(), id: snap.id } as Event;
    },
    // Fail-fast on the permanent not-found error (resolves Story 1.4 deferred item):
    // retrying it 3× wastes reads and delays the error state. Transient failures still
    // get the app default (failureCount < 3). Does NOT mutate the shared QueryClient.
    retry: (failureCount, error) =>
      error instanceof EventNotFoundError ? false : failureCount < 3,
  });

  return {
    event: result.data ?? null,
    // v5 isLoading = isPending && isFetching → true ONLY on the initial fetch with no
    // cached data. Deliberately NOT isPending: background revalidations must not
    // re-trigger the detail skeleton (AC #6).
    isLoading: result.isLoading,
    isError: result.isError,
  };
}
