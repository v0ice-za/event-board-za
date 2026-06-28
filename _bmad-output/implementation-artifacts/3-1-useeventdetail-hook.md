# Story 3.1: useEventDetail Hook

Status: done

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As a developer,
I want a `useEventDetail` hook that fetches a single event from Firestore by document ID,
so that the Event Detail screen (Story 3.3) has a typed, cached, single-source data hook with built-in loading and error states — including a clean "event not found" signal.

This is the **first story of Epic 3 (Event Detail & Ticketing)**. It is the near-mirror of Story 2.5's `useEvents`, but for a **single document** (`getDoc`) instead of a query (`getDocs`). The contract is deliberately **smaller** than `useEvents`: it returns `{ event, isLoading, isError }` with **no `refetch`** (per the architecture hook contract). Build + unit-test the hook standalone — wiring it into `app/event/[id].tsx` is Story 3.3.

## Acceptance Criteria

1. **Hook signature & export:** `hooks/useEventDetail.ts` exports (named) `export function useEventDetail(id: string)` returning **exactly** `{ event: Event | null; isLoading: boolean; isError: boolean }`. **No `refetch`** (architecture contract differs from `useEvents` — see Dev Notes). **No `export default`** (`hooks/` is not a screen file).
2. **Single-document fetch (modular v24 API):** fetches the document at `events/{id}` using the **modular** Firestore API: `getDoc(doc(db, 'events', id))`. Import `{ doc, getDoc } from '@react-native-firebase/firestore'` and `{ db } from '@/lib/firebase'`. **Do not** use the deprecated namespaced chain (`db.collection('events').doc(id).get()`).
3. **Query key:** uses `eventKeys.detail(id)` from `lib/queryKeys.ts` as the TanStack Query key — **no ad-hoc string-array keys** (e.g. never `['events', 'detail', id]` inline).
4. **Success mapping (doc key wins):** on a found document, `event` maps to `{ ...snap.data(), id: snap.id } as Event` — **spread `data()` first so the Firestore document key always wins** over any body field named `id` (same external-feed risk resolved in Story 2.5). `event` is `result.data ?? null` — **never `undefined`**.
5. **Missing document → `event: null` AND `isError: true`:** a non-existent document is a *successful* Firestore read (`snap.exists` is falsy, no throw), so the `queryFn` **must throw** when the document does not exist so TanStack Query flips `isError` to `true`. Because the query then has no data, `result.data` stays `undefined` → `event` resolves to `null`. (AC requires **both** `event === null` and `isError === true` for a missing doc.)
6. **Initial-load-only loading flag:** `isLoading` maps to TanStack Query v5's `result.isLoading` (= `isPending && isFetching`) — **true only on the initial fetch with no cached data**; background revalidations must **not** set it true. (Same deliberate `isLoading`-over-`isPending` exception documented in Story 2.5.)
7. **Fail-fast on permanent errors (resolves Story 1.4 deferred item):** the app-level `QueryClient` uses `retry: 3` (`lib/queryClient.ts`). A missing-document / not-found error is **permanent** — retrying it 3× wastes reads and delays the error state. Configure a per-query `retry` predicate so the **not-found** error is **not retried** (returns `false` immediately), while other (transient) failures fall back to the default retry behaviour. Do **not** mutate the shared `QueryClient`.
8. **No `try/catch` in the hook:** errors flow through TanStack Query's `isError` (architecture.md:422-424). The detail screen (Story 3.3) reads `isError` and renders the `general-error` `EmptyState` with back navigation.
9. **Tests:** `hooks/useEventDetail.test.ts` (co-located, `.ts`) covers, at minimum:
   (a) **returns the event on success** — `getDoc` resolves an existing doc; assert `event` maps fields + `id`, `isLoading` false, `isError` false; include a case where the doc **body** carries `id: 'provider-id'` and assert `event.id` is the **Firestore key** (doc-id-wins);
   (b) **missing document** — `getDoc` resolves a snapshot with `exists` falsy; assert `event === null` **and** `isError === true`;
   (c) **Firestore failure** — `getDoc` rejects; assert `isError === true` and `event === null`;
   (d) **fetch target / key** — assert `doc` is called with `(db, 'events', id)` for the passed `id` (verifies the path + that `eventKeys.detail(id)` drives the cache).
10. **Conventions & gates:** named export, `@/*` alias imports, TypeScript `strict` clean (no `any` — the `as Event` map cast is the one sanctioned boundary cast, kept local to the map). **No new dependencies.** `npx tsc --noEmit`, `npm test`, and `npm run lint` all pass with **no regressions** (baseline after Story 2.6: 12 suites / 71 tests green; lint 0 errors / 1 pre-existing `EmptyState.tsx` warning — do not introduce new warnings).

## Tasks / Subtasks

- [x] Task 1: Create `hooks/useEventDetail.ts` (AC: #1–#8)
  - [x] **Named export** `export function useEventDetail(id: string): UseEventDetailResult` where `UseEventDetailResult = { event: Event | null; isLoading: boolean; isError: boolean }`. Declare and export the result interface (mirrors the `UseEventsResult` pattern in `hooks/useEvents.ts`).
  - [x] Imports: `import { useQuery } from '@tanstack/react-query';` · `import { doc, getDoc } from '@react-native-firebase/firestore';` · `import { db } from '@/lib/firebase';` · `import { eventKeys } from '@/lib/queryKeys';` · `import type { Event } from '@/types';`. (No `Category` needed here.)
  - [x] Define a small **tagged not-found error** so the `retry` predicate can identify it, e.g. `class EventNotFoundError extends Error {}` (module-scoped, not exported). Keep it minimal.
  - [x] `queryFn: async (): Promise<Event> => { const snap = await getDoc(doc(db, 'events', id)); if (!snap.exists()) throw new EventNotFoundError(\`Event not found: ${id}\`); return { ...snap.data(), id: snap.id } as Event; }`. **No `try/catch`.** ✅ Verified: RNFB v24 modular exposes `exists()` as a **method** (`getDoc` returns `Promise<DocumentSnapshot>`; `types/firestore.d.ts:245`: `exists(): this is QueryDocumentSnapshot`). Implementation calls `snap.exists()`; test mock returns `exists: () => true/false` to match.
  - [x] `useQuery({ queryKey: eventKeys.detail(id), queryFn, retry: (failureCount, error) => (error instanceof EventNotFoundError ? false : failureCount < 3) })`. The predicate satisfies AC #7 (fail-fast on the permanent not-found error; transient errors still get the standard 3 attempts) without touching the shared `QueryClient`.
  - [x] Return `{ event: result.data ?? null, isLoading: result.isLoading, isError: result.isError }`. **Do not** return `refetch` (AC #1 — the architecture contract for `useEventDetail` omits it).
- [x] Task 2: Co-located test `hooks/useEventDetail.test.ts` (AC: #9)
  - [x] Per-file `jest.mock('@react-native-firebase/firestore', …)` exposing controllable `doc` + `getDoc` mocks; `jest.mock('@/lib/firebase', () => ({ db: {} }))`. (No global Firebase mock exists — mock per file, same as `useEvents.test.ts`.)
  - [x] Wrap `renderHook` in a `QueryClientProvider` with a **fresh** `QueryClient`. Used `{ retry: false, retryDelay: 0 }`: the hook's own per-query `retry` predicate **overrides** the client's `retry: false`, so the transient-error path still retries 3× — `retryDelay: 0` collapses the backoff to instant so the (c) test settles inside `waitFor`. The not-found error short-circuits (`retry → false`) regardless. Wrapper built with `React.createElement` (not JSX) so the `.ts` file stays `tsc --noEmit` clean.
  - [x] Test (a): `getDoc` resolves `{ exists: () => true, id: 'e1', data: () => ({ name: 'Jazz Night', date: '2026-06-21', category: 'Music' }) }`; assert mapped `event` + `event.id === 'e1'`, `isLoading` false, `isError` false. Plus doc-id-wins case: body `data()` returns `{ id: 'provider-id-should-not-win', … }`, snapshot `id: 'firestore-key'` → assert `event.id === 'firestore-key'`.
  - [x] Test (b): `getDoc` resolves `{ exists: () => false, id, data: () => undefined }`; `await waitFor(() => expect(result.current.isError).toBe(true))`; assert `result.current.event` is `null`.
  - [x] Test (c): `getDoc.mockRejectedValue(new Error('boom'))` (every retry attempt rejects); `await waitFor(() => expect(result.current.isError).toBe(true))`; assert `event` is `null`.
  - [x] Test (d): render `useEventDetail('e1')`; after settle, assert `mockDoc` was called with `({}, 'events', 'e1')` (the `db` mock is `{}`).
  - [x] ✅ Mock's `exists` shape matches the implementation: hook reads `snap.exists()` (method), mocks return `exists: () => true/false`.
  - [x] Run `npm test` — all green, no regression to existing suites.
- [x] Task 3: Validation gates (AC: #10)
  - [x] `npx tsc --noEmit`, `npm test`, `npm run lint` — all clean, no new lint warnings, no regressions.

### Review Findings

_Code review 2026-06-22 (inline adversarial: Blind Hunter + Edge Case Hunter + Acceptance Auditor). All 10 ACs implemented correctly; findings are test-coverage gaps. 2 dismissed (empty-`id` guard — declined by design in Dev Notes; mock duplication — cosmetic)._

- [x] [Review][Patch] AC #7 fail-fast retry is unverified — test (b) passes whether the predicate retries or not (retryDelay:0 masks it); assert `mockGetDoc` called once for not-found and 4× for the transient error [hooks/useEventDetail.test.ts:77,90] — **fixed**: added `toHaveBeenCalledTimes(1)` to (b) and `toHaveBeenCalledTimes(4)` to (c).
- [x] [Review][Patch] No test asserts initial `isLoading === true` (AC #6 cold-load signal); add a synchronous assertion before the first `waitFor` [hooks/useEventDetail.test.ts:35] — **fixed**: added synchronous `expect(result.current.isLoading).toBe(true)` in test (a).

## Dev Notes

### Reuse — do NOT reinvent (critical)

Everything below already exists. Import and compose — do **not** rebuild any of it.

| Need | Import | Notes |
|---|---|---|
| Firestore instance | `import { db } from '@/lib/firebase';` | `lib/firebase.ts` exports `export const db = getFirestore();` (modular). **Do not** call `getFirestore()`/`initializeApp()` again — native auto-inits; re-init throws "app already exists". `app/_layout.tsx` already imports `@/lib/firebase` for its init side-effect before any hook runs. |
| Detail query key | `import { eventKeys } from '@/lib/queryKeys';` | Use `eventKeys.detail(id)` **verbatim** — it already exists (`detail: (id) => [...all, 'detail', id]`). Never inline `['events','detail',id]`. |
| Types | `import type { Event } from '@/types';` | `Event` is the exact Firestore document shape (`types/index.ts` re-exports `types/event.ts`). Absent optional fields are `null` (never `undefined`). |
| QueryClient | (inherited) | `lib/queryClient.ts`: `staleTime: 5min`, `retry: 3`, inherited from the app-level `QueryClientProvider`. **Do not** create a second client in the hook; override `retry` only via the per-query predicate (AC #7) and only `retry: false` inside the **test** wrapper. |

- **This hook is the mirror of `hooks/useEvents.ts` (Story 2.5)** — read it first. Same modular-API style, same doc-id-wins mapping (`{ ...d.data(), id: d.id }`), same `isLoading` (v5) mapping, same no-`try/catch` rule, same per-file test mock + fresh-`QueryClient` pattern. The **only** structural differences: single `getDoc` (not `getDocs`), `eventKeys.detail(id)` (not `.list`), the missing-document throw (AC #5), the not-found fail-fast retry (AC #7), and **no `refetch`** in the return (AC #1).

### Architecture hook contract — `useEventDetail` has NO `refetch`

The architecture pins the contract (architecture.md:400-404):
```typescript
function useEventDetail(id: string): {
  event: Event | null;
  isLoading: boolean;
  isError: boolean;
}
```
`useEvents` returns `refetch`; **`useEventDetail` does not.** Detail-screen errors (Story 3.3) are handled with a back-navigation `EmptyState`, not an in-place retry (architecture.md:418 "Detail error: `<ErrorState>` with back navigation option"). Returning an extra `refetch` would diverge from the contract the detail screen is built against — **do not add it.**

### Missing document → must THROW (AC #5 — the key subtlety)

A `getDoc` on a non-existent path **resolves successfully** with a snapshot whose `exists` is falsy — it does **not** reject. If you simply `return snap.data()` for a missing doc, `isError` would stay `false` and `event` would be `undefined`/`null` with no error — violating AC #5, which requires **both** `event === null` **and** `isError === true`. So the `queryFn` must **throw** when the doc is absent. Throwing makes TanStack set `isError: true` and leaves `result.data` `undefined`, so `result.data ?? null` yields `null`. Use the tagged `EventNotFoundError` so the retry predicate (AC #7) can short-circuit it.

### DocumentSnapshot.exists — property vs method (verify before coding)

`@react-native-firebase` is **v24** (modular). There is a real divergence to confirm:
- The **web** Firebase modular SDK exposes `snapshot.exists()` as a **method**.
- RNFB historically exposed `documentSnapshot.exists` as a **boolean property**.

In v24's modular surface this can differ from the web SDK. **Verify** against the installed types (hover/inspect `getDoc(...)`'s return, or check `node_modules/@react-native-firebase/firestore` types) before finalising, then make the **test mock match** (`exists: false` vs `exists: () => false`). This is the v24-modular gotcha most likely to cause a green-tests-but-broken-runtime mismatch — treat it like Story 2.5's `firestore()`→`getFirestore()` type surprise (which is why `lib/firebase.ts` already uses the modular accessor). If `tsc` complains about `snap.exists`, that is the signal it's a method in this version.

### Fail-fast retry (resolves a logged Story 1.4 deferred item)

`_bmad-output/implementation-artifacts/deferred-work.md` ("Deferred from: code review of 1-4…") explicitly states: *"`queryClient retry: 3` default retries permanent Firestore errors (permission denied, not-found) — add per-query `retry: false` or `retry: 0` for known-permanent errors in **Stories 2.5, 3.1**."* This story is where the not-found case lands. Implement the per-query `retry` predicate (AC #7) so a missing event surfaces its error immediately instead of after 3 exponential-backoff attempts. Keep transient errors on the default retry path (`failureCount < 3`). Optionally also short-circuit `permission-denied` if it's trivially detectable from the RNFB error `code`, but not required — not-found is the in-scope permanent case.

### TanStack Query v5 — `isLoading` is correct HERE (the same exception as 2.5)

`project-context.md` says "use `isPending` not `isLoading`" as a general v4→v5 note. **Detail loading is the same deliberate exception as the feed:** the detail screen shows a skeleton layout (architecture.md:413) only on cold load, not on background revalidation. `isLoading` (= `isPending && isFetching`) is true only on the initial fetch with no cached data — exactly the skeleton signal. So map `isLoading: result.isLoading`.

### Optional defensive guard (mention, don't over-build)

`useEventDetail` receives `id` from the `app/event/[id].tsx` route param (Story 3.3), which is effectively always a non-empty string. A `enabled: id.length > 0` guard would avoid a `getDoc(doc(db,'events',''))` on a malformed route, but it adds a 4th return state (idle) the contract doesn't model. **Not required by the ACs** — only add it if it falls out cleanly; do not expand the public contract for it.

### Test mock skeleton (Story 2.5 precedent)

- No global Firebase mock (no `jest.setup`). Mock per-file. `jest-expo` preset; `@testing-library/react-native`; `renderHook` + `waitFor`. Keep the file `.ts` and build the wrapper with `React.createElement` so `tsc --noEmit` stays clean (see `hooks/useEvents.test.ts`).
- Skeleton:
  ```typescript
  import { renderHook, waitFor } from '@testing-library/react-native';
  import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
  import React from 'react';
  import { useEventDetail } from './useEventDetail';

  const mockDoc = jest.fn((..._a: unknown[]) => ({ _doc: true }));
  const mockGetDoc = jest.fn();
  jest.mock('@react-native-firebase/firestore', () => ({
    doc: (...a: unknown[]) => mockDoc(...a),
    getDoc: (...a: unknown[]) => mockGetDoc(...a),
  }));
  jest.mock('@/lib/firebase', () => ({ db: {} }));

  function wrapper({ children }: { children: React.ReactNode }) {
    const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    return React.createElement(QueryClientProvider, { client }, children);
  }

  beforeEach(() => jest.clearAllMocks());
  ```
- Found doc: `mockGetDoc.mockResolvedValueOnce({ exists: true, id: 'e1', data: () => ({ name: 'Jazz Night', date: '2026-06-21', category: 'Music' }) })`.
- Missing doc: `mockGetDoc.mockResolvedValueOnce({ exists: false, id: 'missing', data: () => undefined })` → assert `event` null + `isError` true.
- Failure: `mockGetDoc.mockRejectedValueOnce(new Error('boom'))` (wrapper `retry: false`).
- Path assertion: `expect(mockDoc).toHaveBeenCalledWith({}, 'events', 'e1')`.
- ⚠️ If the implementation reads `snap.exists()` (method), change the mocks to `exists: () => true` / `exists: () => false`.
- Reset mocks in `beforeEach`. Assert content/shape + the `doc(...)` call args only — no brittle internal assertions (consistent with Stories 2.2–2.5).

### Conventions (project-context.md)

- **Named export** (`hooks/` — no `export default`). Path alias `@/*`. `strict: true` — no `any`; the `as Event` cast on the mapped doc is the sanctioned trust-boundary cast (the Cloud Function `normaliseEvent`, Epic 4, owns shape validation) — keep it local to the map.
- **No `try/catch` in the hook** — errors flow through `isError`. **No UI, no state** beyond the query — the detail screen (Story 3.3) owns rendering/skeleton/error/back-nav.
- Server state is TanStack Query only — no Context, no store.

### Project Structure Notes

- **New files:** `hooks/useEventDetail.ts`, `hooks/useEventDetail.test.ts`. `hooks/**` is already in the `tsconfig` `@/*` alias, `tailwind.config.js` content globs (harmless for a hook), and CI globs. `jest.config.js` `transformIgnorePatterns` already covers `@react-native(-community)?` / `expo*`.
- **No deps to install** — `@react-native-firebase/firestore` (v24) and `@tanstack/react-query` (v5) are already in `package.json` (Stories 1.3/1.4). `lib/firebase.ts` already uses the modular `getFirestore()` (Story 2.5) — no change needed here.
- **Do NOT modify** `app/event/[id].tsx` (the Story 1.1 placeholder) — wiring `useEventDetail` into the live detail screen is **Story 3.3**. This story builds + unit-tests the hook standalone.
- **On-device verification deferred to Story 3.3** (no simulator in this env, consistent with Epic 2): real Firestore single-doc reads, the not-found path against live data, and offline cache behaviour are verified when the detail screen consumes the hook.

### References

- [Source: _bmad-output/planning-artifacts/epics.md#Story 3.1] — hook fetches `events/{id}`, returns `{ event: Event | null, isLoading, isError }`, `eventKeys.detail(id)`, initial-load-only `isLoading`, missing doc → `event null` + `isError true`, named export, test coverage (success / missing / failure)
- [Source: _bmad-output/planning-artifacts/architecture.md] — :391-405 (hook contracts — `useEventDetail` has **no** `refetch`), :411-413 (detail loading = skeleton), :418 (detail error = `ErrorState` + back nav), :422-424 (no try/catch, errors via `isError`), :353-355/:459 (ISO-string dates), :376-383 (`eventKeys` factory)
- [Source: docs/project-context.md] — TanStack Query v5 rules (`isPending`/`isLoading` split, no `onSuccess`), `eventKeys` factory mandatory, named exports, `@/*` alias, server-state-only-via-TanStack, errors via `isError`, null-not-undefined
- [Source: hooks/useEvents.ts + hooks/useEvents.test.ts] — the direct precedent: modular v24 query, doc-id-wins map, `isLoading` mapping, per-file Firestore mock, fresh `QueryClient({ retry: false })`, `.ts` test via `React.createElement`
- [Source: _bmad-output/implementation-artifacts/2-5-useevents-hook.md] — review learnings: doc-spread `{ ...d.data(), id: d.id }` (provider-`id` clobber risk), `as Event` trust boundary, modular-API/`getFirestore()` type surprise, removed speculative params (YAGNI)
- [Source: _bmad-output/implementation-artifacts/deferred-work.md] — Story 1.4 deferred item: add per-query `retry: false`/`retry:0` for permanent Firestore errors (not-found, permission-denied) in **Stories 2.5, 3.1** → satisfied by AC #7 here
- [Source: lib/firebase.ts] — `export const db = getFirestore();` (modular; native auto-init, do not re-init)
- [Source: lib/queryKeys.ts] — `eventKeys.detail(id)`
- [Source: lib/queryClient.ts] — `staleTime: 5min`, `retry: 3` (inherited; override via per-query predicate, not by mutating the client)
- [Source: types/event.ts] — `Event` document shape; ISO-string `date`; optional fields `null`

## Dev Agent Record

### Agent Model Used

claude-opus-4-8 (Claude Code, dev-story workflow)

### Debug Log References

- First `npm test` run: test (c) (transient Firestore failure) failed — `isError` stayed `false` inside `waitFor`. Root cause: the hook's per-query `retry` predicate (AC #7) **overrides** the test wrapper's `QueryClient` `retry: false`, so the transient error correctly retried 3× with exponential backoff and did not settle within `waitFor`'s default timeout. Fix (test-only): added `retryDelay: 0` to the wrapper's `defaultOptions.queries` (the hook leaves `retryDelay` at the client default, so this applies) and switched test (c) to `mockRejectedValue` so every retry attempt rejects cleanly. Production retry behaviour unchanged. Re-run: 13 suites / 78 tests green.

### Completion Notes List

- **RNFB v24 `exists` resolved as a METHOD.** Verified against installed types: `getDoc` returns `Promise<DocumentSnapshot>` (`modular/query.d.ts:84`) and `DocumentSnapshot.exists(): this is QueryDocumentSnapshot` (`types/firestore.d.ts:245`). Implementation calls `snap.exists()`; test mocks return `exists: () => true/false`. This was the story's flagged green-tests-but-broken-runtime risk — confirmed before coding, no `tsc` surprise.
- **AC #5 (missing doc):** `queryFn` throws a module-scoped `EventNotFoundError` when `!snap.exists()`, so TanStack flips `isError: true` and leaves `result.data` undefined → `event` resolves to `null`. Test (b) asserts both `event === null` and `isError === true`.
- **AC #7 (fail-fast retry, resolves Story 1.4 deferred item):** per-query `retry` predicate returns `false` for `EventNotFoundError` (permanent), else `failureCount < 3` (transient errors keep the standard path). Shared `QueryClient` untouched.
- **AC #1 contract:** returns exactly `{ event, isLoading, isError }` — **no `refetch`** (architecture.md:400-404). Named export, no `export default`.
- **Doc-id-wins map:** `{ ...snap.data(), id: snap.id } as Event` — spread first so the Firestore key wins over any external-feed body `id`. Covered by the doc-id-wins case in test (a).
- `app/event/[id].tsx` deliberately untouched — wiring the hook into the live detail screen is Story 3.3. On-device verification (real Firestore reads, not-found path, offline cache) deferred to Story 3.3, consistent with Epic 2.
- **Gates:** `npx tsc --noEmit` clean · `npm test` 13 suites / 78 tests (was 12/71; +1 suite, +7 tests) · `npm run lint` 0 errors, 1 pre-existing `EmptyState.tsx` warning (no new warnings). The Jest "worker failed to exit gracefully" notice is pre-existing (present on the baseline suites too), not introduced here.

### File List

- `hooks/useEventDetail.ts` (new) — the hook
- `hooks/useEventDetail.test.ts` (new) — co-located unit tests
- `_bmad-output/implementation-artifacts/sprint-status.yaml` (modified) — status `ready-for-dev` → `in-progress` → `review`

## Change Log

| Date | Change |
|------|--------|
| 2026-06-22 | Story created (ready-for-dev). First story of Epic 3. Defines `useEventDetail(id)`: modular v24 `getDoc(doc(db,'events',id))`, `eventKeys.detail(id)` key, doc-id-wins map, **missing doc → throw → `event null` + `isError true`** (AC #5), per-query fail-fast `retry` predicate for the permanent not-found error (resolves Story 1.4 deferred item), v5 `isLoading` (cold-load-only), **no `refetch`** per architecture contract, co-located `.ts` test with per-file Firestore mock + fresh `QueryClient({ retry:false })`. Flags the RNFB v24 `DocumentSnapshot.exists` property-vs-method verification point. No new deps. |
| 2026-06-22 | Implemented (status → review). `hooks/useEventDetail.ts` + co-located `.ts` test. Verified RNFB v24 `exists()` is a **method** (used `snap.exists()`, mocks `exists: () => …`). All 10 ACs satisfied. Test wrapper uses `retryDelay: 0` (the hook's per-query retry predicate overrides the client `retry: false`, so backoff is collapsed for the transient-error test). Gates: tsc clean, 13 suites / 78 tests green, lint 0 errors / 1 pre-existing warning. No new deps. `app/event/[id].tsx` untouched (Story 3.3). |
| 2026-06-22 | Code review (status → done). 2 patch findings applied (test-coverage only, no production change): added `mockGetDoc` call-count assertions to verify AC #7 fail-fast retry (1 call for not-found, 4 for transient) and a synchronous initial `isLoading === true` assertion for AC #6. 2 findings dismissed (empty-`id` guard declined by design; cosmetic mock duplication). Gates re-run: tsc clean, 13 suites / 78 tests green. No unresolved High/Medium. |
</content>
</invoke>
