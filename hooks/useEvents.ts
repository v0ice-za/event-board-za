import { useQuery } from '@tanstack/react-query';
import {
  collection,
  getDocs,
  limit,
  orderBy,
  query,
  where,
} from '@react-native-firebase/firestore';

import { db } from '@/lib/firebase';
import { eventKeys } from '@/lib/queryKeys';
import type { Category, Event } from '@/types';

export interface UseEventsResult {
  events: Event[];
  isLoading: boolean;
  isError: boolean;
  refetch: () => void;
}

// NFR-1 launch cap (architecture.md:662). Hardcoded rather than exposed as a param:
// the query key is eventKeys.list(category) (AC #4), which keys ONLY on category. A
// pageSize param could not be cache-isolated without violating AC #4's key mandate, so
// two calls with the same category but different sizes would serve stale cached data;
// it was also unguarded (0 / negative / NaN flow straight to limit()) and had no caller.
// Reintroduce as a first-class param — with key isolation and input guards — if/when a
// useInfiniteQuery migration actually needs it. (Resolves review Decision 2026-06-21.)
const DEFAULT_PAGE_SIZE = 50;

/**
 * Local (not UTC) ISO date string "YYYY-MM-DD". Johannesburg is UTC+2 (SAST, no DST),
 * so `new Date().toISOString().slice(0,10)` would shift the day at the UTC boundary and
 * could drop events dated "today". Build from local parts instead — matches the
 * local-Date parsing in lib/formatDate.ts.
 */
function localTodayISO(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  const iso = `${year}-${month}-${day}`;
  // Defensive check: validate the constructed ISO string is well-formed.
  if (!/^\d{4}-\d{2}-\d{2}$/.test(iso)) {
    throw new Error(`Invalid localTodayISO construction: ${iso}`);
  }
  return iso;
}

/**
 * Fetches the upcoming event feed from Firestore: `events` ordered by `date` ASC,
 * past events excluded (`date >= today`, today included), optionally filtered to a
 * single `category`. Server state is owned entirely by TanStack Query (errors flow
 * through `isError` — no try/catch). Cached events are returned when offline via
 * Firestore's on-by-default disk persistence in @react-native-firebase on native
 * (NFR-3) — the hook deliberately does not touch persistence settings.
 *
 * **Offline limitation:** When offline with no cached query result (cold start),
 * the hook returns `events: []` indistinguishable from a legitimate zero-event response.
 * The consumer (Story 2.6 feed screen) should use `useNetworkState` to show an
 * `OfflineBanner` when offline, allowing users to disambiguate empty results.
 */
export function useEvents(category: Category | null): UseEventsResult {
  const result = useQuery({
    queryKey: eventKeys.list(category),
    queryFn: async (): Promise<Event[]> => {
      const today = localTodayISO();
      const constraints = [
        where('date', '>=', today),
        ...(category ? [where('category', '==', category)] : []),
        orderBy('date', 'asc'),
        limit(DEFAULT_PAGE_SIZE),
      ];
      const q = query(collection(db, 'events'), ...constraints);
      const snap = await getDocs(q);
      // Type cast `as Event` is safe here: Firestore documents are written via Cloud Function
      // normaliseEvent() (Epic 4) which ensures the Event schema. This is the trust boundary
      // where we assume the backend has already validated the shape.
      //
      // Spread data() FIRST so the Firestore document key (d.id) always wins. A document
      // body field named `id` — plausible from external Quicket/Eventbrite/Howler feeds
      // carrying a provider id — must not clobber the canonical doc id that downstream
      // eventKeys.detail(id) and the detail screen rely on. (Resolves review Patch 2026-06-21.)
      return snap.docs.map((d) => ({ ...d.data(), id: d.id }) as Event);
    },
  });

  return {
    events: result.data ?? [],
    // v5 isLoading = isPending && isFetching → true ONLY on the initial fetch with no
    // cached data. Deliberately NOT isPending here: background refetches must not
    // re-trigger feed skeletons (AC #6).
    isLoading: result.isLoading,
    isError: result.isError,
    refetch: () => {
      void result.refetch();
    },
  };
}
