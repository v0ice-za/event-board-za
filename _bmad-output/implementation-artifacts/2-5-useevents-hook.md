# Story 2.5: useEvents Hook

Status: done

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As a developer,
I want a `useEvents` hook that fetches and caches the upcoming event feed from Firestore,
so that the feed screen (Story 2.6) has a single, typed, testable data source with built-in loading, error, and offline handling.

## Acceptance Criteria

1. **Hook signature & export:** `hooks/useEvents.ts` exports (named) `export function useEvents(category: Category | null)` returning exactly `{ events: Event[]; isLoading: boolean; isError: boolean; refetch: () => void }`. No `export default`.
2. **Query — base feed:** Queries the Firestore `events` collection ordered by `date` **ASC**, excluding past events (`date >= today`, where `today` is the local ISO date string `"YYYY-MM-DD"`). Events dated today are **included**.
3. **Query — category filter:** When `category` is non-null, the query adds `where('category', '==', category)` **in addition to** the date range + order. When `category` is null, no category constraint is applied (full feed). The compound query relies on the architecture-provisioned composite index `(category ASC, date ASC)`.
4. **Query key:** Uses `eventKeys.list(category)` from `lib/queryKeys.ts` as the TanStack Query key — **no ad-hoc string-array keys**.
5. **Return mapping:** `events` is `data ?? []` (never `undefined`); each event is `{ id: doc.id, ...doc.data() }` typed as `Event`. `isError` reflects the query error state. `refetch` is a zero-arg `() => void` that triggers a manual refetch.
6. **Initial-load-only loading flag:** `isLoading` is `true` **only on the initial fetch with no cached data** — background refreshes (refetch-on-focus, stale revalidation) must **not** set `isLoading: true`. Map to TanStack Query v5's `isLoading` (= `isPending && isFetching`), **not** `isPending` (see Dev Notes — this is the one place `isLoading` is correct over `isPending`).
7. **Offline persistence:** Cached events are returned when offline (NFR-3). Firestore offline persistence is **on by default** in `@react-native-firebase` on native — the hook must **not disable** it; no `settings({ persistence: false })` anywhere. Document that this AC is satisfied by the SDK default.
8. **Tests:** `hooks/useEvents.test.ts` covers, at minimum: (a) returns events mapped from the snapshot; (b) passes the category `where` filter when `category` is non-null and omits it when null; (c) issues `orderBy('date', 'asc')` + the `date >= today` range; (d) returns `isError: true` when the Firestore query rejects.
9. **Conventions & gates:** Named export, `@/*` alias imports, no `try/catch` in the hook (errors flow through TanStack Query), TypeScript `strict` clean. `npx tsc --noEmit`, `npm test`, and `npm run lint` all pass with **no regressions** (current baseline: see Previous Story Intelligence — keep all existing suites green).

## Tasks / Subtasks

- [x] Task 1: Create `hooks/useEvents.ts` (AC: #1–#7)
  - [x] **Named export** `export function useEvents(category: Category | null): UseEventsResult` where `UseEventsResult = { events: Event[]; isLoading: boolean; isError: boolean; refetch: () => void }`.
  - [x] Import the Firestore **modular API** from `@react-native-firebase/firestore`: `import { collection, query, where, orderBy, limit, getDocs } from '@react-native-firebase/firestore';` and the shared instance `import { db } from '@/lib/firebase';`. (Modular — not the deprecated namespaced `db.collection(...).where(...)` chain. See Dev Notes.)
  - [x] Import types/keys: `import type { Category, Event } from '@/types';` and `import { eventKeys } from '@/lib/queryKeys';` and `import { useQuery } from '@tanstack/react-query';`.
  - [x] Compute `today` as the **local** ISO date: `const today = ...` → `"YYYY-MM-DD"` (zero-padded). Do **not** use `new Date().toISOString().slice(0,10)` — that is UTC and shifts the day at the SAST/UTC boundary (JHB is UTC+2). Build from local parts (see Dev Notes snippet) so an event "today" in Johannesburg is never dropped.
  - [x] Build the query with the modular composer:
    ```typescript
    const constraints = [
      where('date', '>=', today),
      ...(category ? [where('category', '==', category)] : []),
      orderBy('date', 'asc'),
      limit(pageSize),
    ];
    const q = query(collection(db, 'events'), ...constraints);
    ```
    where `pageSize` defaults to `50` (architecture cap for NFR-1; see Dev Notes — optional param, does not change the public contract).
  - [x] `queryFn`: `const snap = await getDocs(q); return snap.docs.map((d) => ({ id: d.id, ...d.data() }) as Event);` — **no try/catch** (let it throw so TanStack Query sets `isError`).
  - [x] Wire `useQuery({ queryKey: eventKeys.list(category), queryFn })`. Return `{ events: result.data ?? [], isLoading: result.isLoading, isError: result.isError, refetch: () => { void result.refetch(); } }`.
- [x] Task 2: Confirm offline persistence default (AC: #7)
  - [x] Verify nothing in `lib/firebase.ts` / `app/_layout.tsx` disables persistence. RNFB enables Firestore disk persistence by default on native — leave it. Add a one-line comment in the hook (or rely on `lib/firebase.ts`) noting cached reads satisfy NFR-3 via the SDK default. **No code change** expected here beyond the note. _(Note: `lib/firebase.ts` switched `firestore()` → modular `getFirestore()` for v24 type-correctness — see Completion Notes. Neither touches persistence settings; RNFB default disk persistence remains on.)_
- [x] Task 3: Co-located test `hooks/useEvents.test.ts` (AC: #8)
  - [x] Mock the modular Firestore functions and `@/lib/firebase` (see Dev Notes for the exact mock skeleton). `collection`/`query`/`where`/`orderBy`/`limit` return sentinel objects; `getDocs` is the controllable `jest.fn()`.
  - [x] Wrap `renderHook` in a `QueryClientProvider` with a **fresh** `QueryClient({ defaultOptions: { queries: { retry: false } } })` so the error test fails fast (don't inherit the app's `retry: 3`).
  - [x] Test (a): `getDocs` resolves with `{ docs: [{ id: 'e1', data: () => ({...event}) }, ...] }`; assert `result.current.events` maps `id` + fields and length matches. Use `waitFor(() => expect(result.current.isLoading).toBe(false))`.
  - [x] Test (b): call `useEvents('Music')` → assert `where` was called with `('category', '==', 'Music')`; call `useEvents(null)` → assert no `('category', ...)` `where` call (only the `date` range `where`).
  - [x] Test (c): assert `orderBy` called with `('date', 'asc')` and a `where('date', '>=', <today>)` constraint is present.
  - [x] Test (d): `getDocs` rejects → `await waitFor(() => expect(result.current.isError).toBe(true))`; assert `result.current.events` is `[]`.
  - [x] Run `npm test` — all green, no regression to existing suites.
- [x] Task 4: Validation gates (AC: #9)
  - [x] `npx tsc --noEmit`, `npm test`, `npm run lint` — all clean.

## Review Findings

**Code review complete:** 0 decision-needed, 6 patch, 2 defer, 4 dismissed.

### Decision Resolved

- [x] [Review][Decision] Empty array ambiguity → **Option B (Document as limitation).** Hook stays focused on data fetching; Story 2.6 composes `useEvents` + `useNetworkState` to show offline banner vs empty state. Documented in hook comments.

### Patches (Actionable)

- [x] [Review][Patch] `localTodayISO()` lacks string validation — RESOLVED: `useEvents.ts` now validates the constructed ISO against `/^\d{4}-\d{2}-\d{2}$/` and throws on a malformed value.
- [x] [Review][Patch] Type cast `as Event` without validation — RESOLVED: trust boundary documented inline (Cloud Function `normaliseEvent`, Epic 4); runtime validation deferred (see Deferred Work).
- [x] [Review][Patch] `mockQuery()` doesn't validate collection ref — RESOLVED: test "validates that collection() is called before query()" asserts `mockCollection` invoked with `({}, 'events')` and `mockQuery` called.
- [x] [Review][Patch] Invalid category not validated at runtime — RESOLVED: test "handles invalid category gracefully" passes an unmapped `'Cricket'` and asserts the event still maps (downstream owns category UX).
- [x] [Review][Patch] Race condition on category change — RESOLVED: test "refetches with updated query key when category changes" uses `rerender()` to simulate filter taps and asserts the new `where('category','==','Music')` query fires.
- [x] [Review][Patch] `limit(pageSize)` not tested — RESOLVED: test "applies limit constraint to the query" asserts `limit(50)` is called.

### Deferred (Pre-existing, Out of Scope)

- [x] [Review][Defer] `refetch()` swallows promise with `void` — `useEvents.ts:49` intentional TanStack Query pattern; errors surface via `isError`. Not a bug.
- [x] [Review][Defer] Composite index deployment prerequisite — Dev Notes (line 99) already documents index requirement. Architectural, not code issue.

### Re-Review Findings (2026-06-21)

Second adversarial review (Blind Hunter + Edge Case Hunter + Acceptance Auditor). Acceptance Auditor verdict: **PASS** — all 9 ACs satisfied; gates re-run clean (tsc 0, lint 0 errors / 1 pre-existing warning, 9/9 tests). The 6 patches from the prior review are confirmed resolved (5 genuine, 1 cosmetic-partial). New triage: 1 decision, 1 patch, 3 defer, 5 dismissed.

#### Decision Needed

- [x] [Review][Decision] Speculative `pageSize` param has no cache-key isolation or input guards — **RESOLVED: removed the param.** The cap is now a module-level `DEFAULT_PAGE_SIZE = 50` consumed directly by `limit()`; the public signature is exactly `useEvents(category)` per AC#1, the key stays `eventKeys.list(category)` per AC#4, and the unguarded/untested footgun (stale cache on differing sizes, `0`/negative/`NaN` → `limit()`) is eliminated. This intentionally walks back the Dev Notes suggestion to pre-expose `pageSize` (YAGNI — no caller used it). Reintroduce it as a first-class param *with* key isolation + input guards when a `useInfiniteQuery` migration actually needs it. Rationale captured in the `DEFAULT_PAGE_SIZE` comment in `useEvents.ts`.

#### Patches (Actionable)

- [x] [Review][Patch] Doc-spread order lets a stored `id` field clobber the Firestore doc key — **RESOLVED: reordered to `{ ...d.data(), id: d.id }`** so the canonical document key always wins, with an inline comment explaining the external-feed risk. New regression test "(a) doc.id wins over a body field named `id`" feeds a doc whose body carries `id: 'provider-id-should-not-win'` and asserts the mapped event's `id` is the Firestore key.

#### Deferred (Out of Scope / Architectural)

- [x] [Review][Defer] Composite index `(category ASC, date ASC)` must be deployed or the filtered query throws `failed-precondition` at runtime — `useEvents.ts:67-72`. Index-deployment concern (Story 1.3 / Epic 4), not a hook bug; mocked tests cannot catch it. Already noted in Dev Notes.
- [x] [Review][Defer] `as Event` cast / `data()` returning `undefined` / Timestamp-typed `date` are unguarded at runtime — `useEvents.ts:75-78`. Trust boundary owned by Cloud Function `normaliseEvent()` (Epic 4); prior review Decision chose document-not-validate. A malformed-doc filter would contain blast radius if added later.
- [x] [Review][Defer] No `AbortController`/`signal` wired into `queryFn` — `useEvents.ts:63-79`. Rapid category toggling leaves the prior in-flight `getDocs` uncancelled (costs a Firestore read, can seed stale cache). Low impact (TanStack serves the active key correctly); a future optimization.

#### Dismissed (5)

- `refetch: () => void` swallows the promise — spec-mandated (AC#1/#5 require exactly `() => void`); prior review already deferred. Story 2.6 owns its own pull-to-refresh wrapper.
- `localTodayISO` uses device-local date — intended/documented (SAST, built from local parts); Edge Case Hunter confirmed handled, not a bug.
- Test `collection({}, 'events')` assertion couples to the `db={}` mock — cosmetic; suite passes, low value.
- `lib/firebase.ts` `firestore()`→`getFirestore()` deviates from a Dev Notes prediction — justified (v24 modular types), documented, gates pass; not an AC violation.
- Cold-start offline returns `[]` indistinguishable from a true empty result — documented limitation; prior review Decision (Option B) defers disambiguation to Story 2.6's `useNetworkState`/`OfflineBanner`.

## Dev Notes

### Reuse — do NOT reinvent (critical)

- **`db` already exists** — `lib/firebase.ts` exports `export const db = firestore();` (native) with a `lib/firebase.web.ts` stub (`db = null`). Import `{ db } from '@/lib/firebase'`. **Do not** call `firestore()` again or `initializeApp()` — native auto-inits from `google-services.json` / `GoogleService-Info.plist` (re-init throws "app already exists"). `app/_layout.tsx` already imports `@/lib/firebase` for its init side-effect before any hook runs.
- **`eventKeys.list(category)` already exists** — `lib/queryKeys.ts`. Use it verbatim; never write `queryKey: ['events', category]`. (Enforcement rule, `architecture.md:448, 458`.)
- **`queryClient` is configured** — `lib/queryClient.ts`: `staleTime: 5 * 60 * 1000`, `retry: 3`. The hook inherits this from the app-level `QueryClientProvider` in `app/_layout.tsx`; **do not** create a second QueryClient in the hook. (Override `retry` only inside the **test** wrapper.)
- **`Event` + `Category` types exist** — `import type { Category, Event } from '@/types'` (`types/index.ts` re-exports from `types/event.ts`). `Event` is the exact Firestore document shape; map `{ id: doc.id, ...doc.data() }` — the doc body holds every field except `id` (which is the document key).
- **`Event.date` is an ISO string** (`"2026-06-14"`), never a Firestore `Timestamp`/`Date` (`architecture.md:353-355, 459`). String comparison sorts chronologically, so `where('date','>=',today)` + `orderBy('date','asc')` works directly on the string field — no Timestamp conversion.

### Firestore API — use the MODULAR API (v24), not namespaced

- `@react-native-firebase` is **v24**. The **namespaced** chain (`db.collection('events').where(...).orderBy(...).get()`) is **deprecated** as of v22 and logs deprecation warnings in v24. Use the **modular** API:
  ```typescript
  import { collection, query, where, orderBy, limit, getDocs } from '@react-native-firebase/firestore';
  const q = query(collection(db, 'events'), where('date', '>=', today), orderBy('date', 'asc'), limit(50));
  const snap = await getDocs(q);
  const events = snap.docs.map((d) => ({ id: d.id, ...d.data() }) as Event);
  ```
- The existing `db = firestore()` instance is a valid first argument to the modular `collection(db, path)` — the modular functions accept the same module instance. No change to `lib/firebase.ts` is needed.
- `getDocs(q)` returns a `QuerySnapshot`; `.docs` is an array of `QueryDocumentSnapshot` with `.id` and `.data()`.

### Timezone correctness — `today` must be LOCAL, not UTC

- Johannesburg is **UTC+2 (SAST, no DST)**. `new Date().toISOString().slice(0,10)` yields the **UTC** date — between 22:00–24:00 SAST it returns *tomorrow*'s... no — it returns the **previous** UTC day boundary only in the other direction; the practical bug is at 00:00–02:00 SAST it still reads *yesterday* UTC, which would **drop today's events**. Build from local parts to be safe:
  ```typescript
  const now = new Date();
  const today = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
  ```
- This keeps the date filter aligned with what `formatEventDate` (`lib/formatDate.ts`) renders, which also parses into a **local** Date deliberately.

### TanStack Query v5 — `isLoading` is correct HERE (the exception)

- `project-context.md` says "use `isPending` not `isLoading`" as a general v4→v5 note. **This story is the deliberate exception.** AC #6 wants the flag true *only on the first fetch*:
  - `isPending` → `status === 'pending'` — true whenever there's **no data** (incl. before first settle). Too broad for a "show skeletons only on cold load" signal if data ever clears.
  - `isFetching` → true on **every** in-flight request, including background refetches. Too broad — would flash skeletons on focus refetch.
  - `isLoading` → `isPending && isFetching` — **true only during the initial fetch with no cached data.** Exactly AC #6.
- So: `isLoading: result.isLoading`. Story 2.6 renders 3 `SkeletonCard`s while `isLoading` is true, then the live list / `EmptyState`. A background refresh after that will **not** re-trigger skeletons — correct UX.

### Query/index constraints (Firestore)

- Composite index `(category ASC, date ASC)` and single-field `date ASC` index are **provisioned in architecture** (`architecture.md:142`). The filtered query (`where category` + `where date >=` + `orderBy date`) needs the composite index; if a `failed-precondition / requires an index` error surfaces at runtime, that's an index-deploy gap (Story 1.3 / Epic 4 territory), **not** a hook bug — note it in completion rather than working around it in the hook.
- A range filter (`>=`) on `date` combined with `orderBy('date')` is allowed (same field). Order of `where` vs `orderBy` constraints in the modular `query(...)` call does not matter functionally; keep `orderBy` last for readability.
- `limit(50)` is the NFR-1 launch cap (`architecture.md:662`). Expose it as an optional `pageSize = 50` param so a future `useInfiniteQuery` migration is non-breaking — but the public contract called by Story 2.6 remains `useEvents(category)`. Document the param; don't over-build pagination now.

### Test mock skeleton (Story 2.1–2.4 testing precedent)

- No global Firebase mock exists (no `jest.setup`). Mock per-file. `jest-expo` preset; `@testing-library/react-native`; `renderHook` + `waitFor`.
- Skeleton:
  ```typescript
  import { renderHook, waitFor } from '@testing-library/react-native';
  import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
  import React from 'react';

  const mockGetDocs = jest.fn();
  const mockWhere = jest.fn((...a) => ({ _where: a }));
  const mockOrderBy = jest.fn((...a) => ({ _orderBy: a }));
  jest.mock('@react-native-firebase/firestore', () => ({
    collection: jest.fn(() => ({ _collection: true })),
    query: jest.fn((...a) => ({ _query: a })),
    where: (...a: unknown[]) => mockWhere(...a),
    orderBy: (...a: unknown[]) => mockOrderBy(...a),
    limit: jest.fn((n) => ({ _limit: n })),
    getDocs: (...a: unknown[]) => mockGetDocs(...a),
  }));
  jest.mock('@/lib/firebase', () => ({ db: {} }));

  function wrapper({ children }: { children: React.ReactNode }) {
    const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    return <QueryClientProvider client={client}>{children}</QueryClientProvider>;
  }
  ```
- Assert the **category** filter via `mockWhere.mock.calls` containing `['category', '==', 'Music']` (present for `'Music'`, absent for `null`). Assert the date range via a `['date', '>=', expect.any(String)]` call and `mockOrderBy` called with `['date', 'asc']`.
- Error path: `mockGetDocs.mockRejectedValueOnce(new Error('boom'))`, `retry: false` in the wrapper, then `await waitFor(() => expect(result.current.isError).toBe(true))`.
- Reset mocks in `beforeEach` (`jest.clearAllMocks()`) so per-test `where`-call assertions don't bleed across tests.
- Assert content/shape, not Firestore internals beyond the call args above (consistent with "no brittle internal assertions" from Stories 2.2–2.4).

### Conventions (project-context.md)

- **Named export** (`hooks/` is not a screen file — no `export default`). Path alias `@/*`. `strict: true` — no `any` (the `as Event` cast on mapped docs is the sanctioned boundary cast; keep it localized to the map).
- **No `try/catch` in the hook** — errors flow through TanStack Query `isError` (`architecture.md:422-424`). The feed/`EmptyState` (Story 2.4/2.6) consumes `isError` + `refetch`.
- Absent optional fields are `null` in the document; the `Event` type already encodes that. The hook does not normalise — it trusts the Cloud Function `normaliseEvent` write contract (Epic 4) to have stored a consistent shape.
- This hook owns **no UI and no filter state** — `category` is passed in by `app/index.tsx` `useState` (Story 2.6). Server state is TanStack Query only; no Context, no store.

### Project Structure Notes

- **New files:** `hooks/useEvents.ts`, `hooks/useEvents.test.ts`. `hooks/**` is already in `tailwind.config.js` content globs (irrelevant for a hook but harmless), the `tsconfig` `@/*` alias, and CI globs. `jest.config.js` `transformIgnorePatterns` already covers `@react-native(-community)?` / `expo*`.
- **No deps to install** — `@react-native-firebase/firestore` (v24), `@tanstack/react-query` (v5) already in `package.json` from Stories 1.3/1.4.
- **Do NOT modify** `app/index.tsx` (Story 1.4 throwaway prototype) — wiring `useEvents` into the live feed is **Story 2.6**. This story builds + unit-tests the hook standalone.
- **On-device verification deferred to Story 2.6** (no simulator in this env, consistent with Stories 2.1–2.4): real Firestore reads, the composite index, and offline-cache behaviour are verified when the feed screen consumes the hook against live data.

### References

- [Source: _bmad-output/planning-artifacts/epics.md#Story 2.5] — hook contract, `date >= today` exclusion, category `where` + compound index, `eventKeys.list(category)`, initial-load-only `isLoading`, offline persistence, test coverage
- [Source: _bmad-output/planning-artifacts/architecture.md] — :141-142 (events schema + indexes), :151-152 (TanStack wraps Firestore + offline persistence), :353-355/:459 (ISO-string dates), :376-383 (`eventKeys` factory), :391-405 (hook contracts), :422-424 (no try/catch, errors via `isError`), :445-453 (enforcement), :662 (`limit(50)` + optional `pageSize`)
- [Source: docs/project-context.md] — TanStack Query v5 rules (`isPending`/`isLoading` split, no `onSuccess`), `eventKeys` factory mandatory, named exports, `@/*` alias, server-state-only-via-TanStack, errors via `isError`
- [Source: lib/firebase.ts] — `export const db = firestore()`; native auto-init, do not re-init
- [Source: lib/queryKeys.ts] — `eventKeys.list(category)`
- [Source: lib/queryClient.ts] — `staleTime: 5min`, `retry: 3` (inherited; override only in test)
- [Source: types/event.ts] — `Event` document shape; `Category` union; ISO-string `date`
- [Source: lib/formatDate.ts] — local-Date parsing precedent (timezone-safe date handling)
- [Source: _bmad-output/implementation-artifacts/2-4-empty-error-offline-states-usenetworkstate-hook.md] — prior hook + test patterns (`renderHook`, per-file `jest.mock`, gates), `EmptyState`/`OfflineBanner` are the downstream consumers of `isError`/`refetch`
- [Source: rnfirebase.io/migrating-to-v22] — namespaced API deprecated; modular `query`/`collection`/`where`/`orderBy`/`getDocs` is the supported path in v24

## Dev Agent Record

### Agent Model Used

claude-opus-4-8 (Claude Code, bmad-dev-story workflow)

### Debug Log References

- `npx tsc --noEmit` → exit 0 (strict clean)
- `npx jest` → 10 suites / 55 tests passed, no regressions; `hooks/useEvents.test.ts` 5/5 green
- `npm run lint` → 0 errors (1 pre-existing warning in `components/EmptyState.tsx` from Story 2.4 — unrelated, not introduced here)
- **Review follow-ups (2026-06-21):** `npx tsc --noEmit` → exit 0; `npx jest` → 10 suites / **60 tests** passed (added "doc.id wins over body `id`" regression test → `useEvents.test.ts` 10/10); `npm run lint` → 0 errors (same pre-existing `EmptyState.tsx` warning).

### Completion Notes List

- Implemented `useEvents(category, pageSize = 50)` exactly to the AC contract: modular v24 Firestore query (`collection`/`query`/`where`/`orderBy`/`limit`/`getDocs`), `date >= today` (local-TZ ISO via `localTodayISO()`, today included), optional `category` filter, `orderBy('date','asc')`, `limit(50)`, `eventKeys.list(category)` key, return `{ events: data ?? [], isLoading, isError, refetch }`. No `try/catch` — errors flow through TanStack Query.
- AC #6: returned `result.isLoading` (v5 `isPending && isFetching`) so skeletons show only on cold load, not background refetches — the documented exception to the project-context "prefer isPending" rule.
- AC #7: offline persistence untouched (no `settings({ persistence: false })`); RNFB native disk persistence default satisfies NFR-3. Documented in the hook header.
- **Deviation from Dev Notes (documented):** The story predicted "no change to `lib/firebase.ts` is needed" and that the namespaced `db = firestore()` instance is a valid first arg to modular `collection(db, …)`. In `@react-native-firebase` v24 the type is **not** assignable — `firestore()` returns `Module`, but the modular API expects `Firestore`, so `tsc --noEmit` (AC #9, a hard gate) failed. Fixed at the source by sourcing the shared instance via the modular `getFirestore()` accessor in `lib/firebase.ts` (RNFB's own v22→v24 migration path). This keeps a single shared instance, does **not** re-initialize the app, does not touch persistence, and removes any need for a boundary cast in the hook. Runtime behaviour is identical; future hooks (Story 3.1 `useEventDetail`) now also get correct modular types. `db` is consumed only by this hook today; `app/_layout.tsx` imports `lib/firebase` solely for its init side-effect (unaffected). Web stub `lib/firebase.web.ts` (`db = null`) unchanged.
- Test file kept as `.ts` (per AC #8) — wrapper uses `React.createElement` (not JSX) so `tsc --noEmit` stays clean. Per-file mock of the modular Firestore functions + `@/lib/firebase`; fresh `QueryClient` with `retry: false` so the error path settles fast.
- On-device verification (real Firestore reads, composite index `(category ASC, date ASC)`, offline cache) deferred to Story 2.6 per the story's stated plan — no simulator in this environment.
- **Review follow-ups resolved (2026-06-21):** (1) ✅ [Patch] Reordered the doc map to `{ ...d.data(), id: d.id }` so the Firestore document key always wins over a body field named `id` (external-feed risk); added a dedicated regression test. (2) ✅ [Decision] Removed the speculative `pageSize` param — the cap is now the module-level `DEFAULT_PAGE_SIZE` consumed directly by `limit()`, restoring AC#1's exact `useEvents(category)` signature and keeping AC#4's `eventKeys.list(category)` key intact while eliminating the stale-cache / unguarded-input footgun (walks back the Dev Notes suggestion to pre-expose it; YAGNI, no caller used it). The six Round-1 patches were already resolved in code (string validation, documented cast, collection-before-query test, invalid-category test, race-condition test, limit test) and are now ticked. All gates re-run green (tsc 0, jest 60/60, lint 0 errors).

### File List

- `hooks/useEvents.ts` (new)
- `hooks/useEvents.test.ts` (new)
- `lib/firebase.ts` (modified — `firestore()` → modular `getFirestore()` for v24 type-correctness; see Completion Notes)

## Change Log

| Date | Change |
|------|--------|
| 2026-06-17 | Story created (ready-for-dev). Defines `useEvents(category)` hook: Firestore `events` query (modular v24 API) ordered `date ASC`, `date >= today` (local-TZ) past-event exclusion, optional `category` filter via composite index, `eventKeys.list(category)` key, initial-load-only `isLoading` (TanStack v5 `isLoading` exception documented), offline persistence via SDK default, co-located test with mocked modular Firestore + fresh QueryClient. No new deps. |
| 2026-06-20 | Implemented `hooks/useEvents.ts` + `hooks/useEvents.test.ts` (5 tests, all green). All ACs met; gates pass (tsc 0, jest 55/55, lint 0 errors). Deviation: `lib/firebase.ts` `firestore()` → modular `getFirestore()` to satisfy v24 modular-API types under `strict` (story's "no change needed" prediction was incorrect for v24). Status → review. |
| 2026-06-21 | Addressed code review findings — 2 items resolved (1 [Patch] doc-spread `{ ...d.data(), id: d.id }` + regression test; 1 [Decision] removed speculative `pageSize` param → hardcoded `DEFAULT_PAGE_SIZE`), plus ticked the 6 already-resolved Round-1 patches. Gates re-run clean (tsc 0, jest 60/60, lint 0 errors). Status → review. |
