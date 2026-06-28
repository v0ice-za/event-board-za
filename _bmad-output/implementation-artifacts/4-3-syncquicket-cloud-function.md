# Story 4.3: syncQuicket Cloud Function

Status: done

## Story

As a developer,
I want a scheduled Cloud Function that syncs JHB events from the Quicket REST API into Firestore every 4 hours,
so that Quicket events appear in the feed automatically without manual intervention.

## Acceptance Criteria

1. `syncQuicket` runs as a scheduled Cloud Function every 4 hours (`timeZone: 'Africa/Johannesburg'`)
2. Authenticates with the Quicket REST API using `QUICKET_API_KEY` stored in Firebase Secret Manager via `defineSecret`
3. Paginates through all result pages until no more events remain — no hardcoded page limit
4. Each raw Quicket event is mapped to a common intermediate shape (NormalisedEvent field names), then passed to `normaliseEvent(mapped, 'quicket')`; `null` results are skipped with a `logger.warn`
5. Each normalised event is written to Firestore via `upsertEvent()` — merge semantics; existing documents updated, new ones created
6. `syncQuicket` is exported from `functions/src/index.ts`; `_placeholder` export is removed
7. Function logs: ISO start timestamp, total events fetched, total events written, each skipped event with reason
8. A single failed `upsertEvent` does not abort the run — error is logged and next event is processed
9. `syncQuicket.test.ts` covers: `mapQuicketEvent` field mapping, pagination followed, null normalised results skipped, upsert failures logged-not-thrown, `dateUtils` helpers

## Tasks / Subtasks

- [ ] Task 1 — Set up `QUICKET_API_KEY` in Firebase Secret Manager (AC: #2) — **MANUAL (Voice): requires live Firebase auth + real dev key; cannot be automated. Code wiring via `defineSecret` is complete.**
  - [ ] Run `firebase functions:secrets:set QUICKET_API_KEY` and enter the dev key value
  - [ ] Verify secret is readable: `firebase functions:secrets:access QUICKET_API_KEY`

- [x] Task 2 — Create `functions/src/lib/dateUtils.ts` (shared by 4.3–4.5)
  - [x] Export `parseIsoDateTime(dt: string | null | undefined): { date: string | null; time: string | null }` — extracts `YYYY-MM-DD` and `HH:MM` from an ISO datetime string like `"2026-07-05T14:00:00"`; returns `{ date: null, time: null }` on any non-matching input
  - [x] Export `todayIso(): string` — returns today's date as `YYYY-MM-DD` (UTC, used as API `startdate` filter)
  - [x] Create `functions/src/lib/dateUtils.test.ts` — tests `parseIsoDateTime` (valid datetime, date-only, empty, null) and `todayIso` (returns YYYY-MM-DD format)

- [x] Task 3 — Create `functions/src/syncQuicket.ts` with mapping helpers (AC: #2, #3, #4)
  - [x] Export `QUICKET_CATEGORY_MAP: Record<string, string>` — maps Quicket category strings to canonical `Category` values
  - [x] Export `mapQuicketEvent(raw: unknown): Record<string, unknown>` — translates Quicket API fields to NormalisedEvent field names; uses `parseIsoDateTime` from `dateUtils`; maps `categoryName` through `QUICKET_CATEGORY_MAP`; formats price to `"Free"` / `"R{n}"` string or `null`
  - [x] Export `syncQuicketHandler(apiKey: string): Promise<void>` — the core sync logic; testable without the Firebase Functions runtime

- [x] Task 4 — Implement `syncQuicket` scheduled export (AC: #1, #5, #6, #7, #8)
  - [x] Define `const quicketApiKey = defineSecret('QUICKET_API_KEY')` using `firebase-functions/params`
  - [x] Export `syncQuicket = onSchedule({ schedule: 'every 4 hours', timeZone: 'Africa/Johannesburg', secrets: [quicketApiKey] }, async () => syncQuicketHandler(quicketApiKey.value()))`
  - [x] `syncQuicketHandler` paginates using `pageIndex` (0-based) until `hasMore` is false
  - [x] Per event: `mapQuicketEvent` → `normaliseEvent(mapped, 'quicket')` → skip null with `logger.warn` → `upsertEvent` in try/catch with `logger.error` on failure
  - [x] Logs start time, total fetched, total written at completion

- [x] Task 5 — Update `functions/src/index.ts` (AC: #6)
  - [x] Remove `_placeholder` export and the `onSchedule` import from this file
  - [x] Import `firebase-admin/app` `initializeApp` stays
  - [x] Re-export `syncQuicket` from `./syncQuicket`

- [x] Task 6 — Write tests (AC: #9)
  - [x] Create `functions/src/syncQuicket.test.ts`
  - [x] Mock `global.fetch` via `jest.fn()`
  - [x] Mock `./lib/normaliseEvent` and `./lib/firestoreClient` via `jest.mock`
  - [x] Test `mapQuicketEvent`: maps `name`, `venueName` → `venue`, `venueAddress` → `address`, `categoryName` → `category`, `saleUrl` → `ticketLink`, `imageUrl`, `description`
  - [x] Test `mapQuicketEvent`: ISO datetime → correct `date` + `time` split
  - [x] Test `mapQuicketEvent`: unmapped `categoryName` → `null` (normaliseEvent will return null)
  - [x] Test `mapQuicketEvent`: `minimumTicketPrice: 0` → `"Free"`, `minimumTicketPrice: 150` → `"R150"`, absent → `null`
  - [x] Test `syncQuicketHandler`: single page → `upsertEvent` called once per valid event
  - [x] Test `syncQuicketHandler`: two pages → fetch called twice, all events processed
  - [x] Test `syncQuicketHandler`: `normaliseEvent` returns null → that event skipped, others still processed
  - [x] Test `syncQuicketHandler`: `upsertEvent` throws → error path taken, remaining events still processed

- [x] Task 7 — Validation gates
  - [x] `cd functions && npx tsc --noEmit` passes with 0 errors
  - [x] `cd functions && npm test` — all tests green (dateUtils + firestoreClient + normaliseEvent + syncQuicket suites)
  - [x] Root `npx tsc --noEmit` still passes
  - [x] Root `npm test` — 90 app tests still green

## Dev Notes

### File locations — critical

Per architecture directory structure (`architecture.md` §Project File Structure):

| Status | Path |
|--------|------|
| NEW | `functions/src/syncQuicket.ts` |
| NEW | `functions/src/syncQuicket.test.ts` |
| NEW | `functions/src/lib/dateUtils.ts` |
| NEW | `functions/src/lib/dateUtils.test.ts` |
| MODIFY | `functions/src/index.ts` |

Sync functions live at **`functions/src/`**, NOT in `functions/src/lib/`. Shared utilities (normaliseEvent, firestoreClient, dateUtils, types) live in `functions/src/lib/`.

### Quicket REST API

⚠️ **Verify field names against `developer.quicket.co.za` before coding** — the below is a best-effort approximation from known patterns; exact names may differ.

**Authentication:**
```
Authorization: api_key {QUICKET_API_KEY}
Content-Type:  application/json
```

**Events endpoint:**
```
GET https://api.quicket.co.za/api/events
  ?location=Johannesburg
  &startdate=YYYY-MM-DD        ← today's date — excludes past events server-side
  &pagesize=100
  &pageIndex=0                 ← 0-based integer; increment each loop
```

**Approximate response shape (verify!):**
```json
{
  "data": [
    {
      "eventId": "123456",
      "name": "Jazz in the Park",
      "description": "A great evening of jazz at Zoo Lake.",
      "startDate": "2026-07-05T14:00:00",
      "endDate": "2026-07-05T20:00:00",
      "venueName": "Zoo Lake",
      "venueAddress": "Parkview, Johannesburg, 2193",
      "categoryName": "Music",
      "imageUrl": "https://cdn.quicket.co.za/images/123456.jpg",
      "saleUrl": "https://www.quicket.co.za/events/123456-jazz-in-the-park",
      "minimumTicketPrice": 0,
      "maximumTicketPrice": 150,
      "isOnline": false
    }
  ],
  "totalCount": 47,
  "pageIndex": 0,
  "pageSize": 100
}
```

**Pagination:**
```typescript
const hasMore = (pageIndex + 1) * pageSize < totalCount;
```

### No new HTTP dependency

Node 20 provides a global `fetch` API natively — no `axios` or `node-fetch` needed. The functions workspace has no HTTP client dependency and none should be added.

### Firebase Secret Manager — NOT EAS Secrets

EAS Secrets are for the Expo app build (`app.config.ts`). Cloud Functions use Google Cloud Secret Manager, accessed via `defineSecret` from `firebase-functions/params`:

```typescript
import { defineSecret } from 'firebase-functions/params';

const quicketApiKey = defineSecret('QUICKET_API_KEY');

export const syncQuicket = onSchedule(
  {
    schedule: 'every 4 hours',
    timeZone: 'Africa/Johannesburg',
    secrets: [quicketApiKey],   // required: binds secret to this function
  },
  async () => syncQuicketHandler(quicketApiKey.value()),
);
```

Secret setup (one-time, run in the project root):
```bash
firebase functions:secrets:set QUICKET_API_KEY
# prompts for the value — enter the real Quicket dev API key
```

For the Firebase Emulator suite, secrets can be set via `.secret.local` file at project root.

Live deploy requires `firebase deploy --only functions` — as with Story 4.1, this requires live Firebase credentials. TypeScript compile is the automated gate; live deploy is Voice's manual post-merge step.

### Category mapping constant

```typescript
export const QUICKET_CATEGORY_MAP: Record<string, string> = {
  'Music': 'Music',
  'Concert': 'Music',
  'Festival': 'Music',
  'Live Music': 'Music',
  'Gig': 'Music',
  'Market': 'Markets',
  'Markets': 'Markets',
  'Craft Market': 'Markets',
  'Food & Drink': 'Food & Drink',
  'Food and Drink': 'Food & Drink',
  'Food': 'Food & Drink',
  'Drinks': 'Food & Drink',
  'Art': 'Art & Culture',
  'Art & Culture': 'Art & Culture',
  'Arts & Culture': 'Art & Culture',
  'Exhibition': 'Art & Culture',
  'Theatre': 'Art & Culture',
  'Film': 'Art & Culture',
  'Dance': 'Art & Culture',
  'Sport': 'Sport',
  'Sports': 'Sport',
  'Fitness': 'Sport',
  'Running': 'Sport',
  'Comedy': 'Comedy',
  'Stand-Up Comedy': 'Comedy',
  'Improv': 'Comedy',
  'Family': 'Family',
  'Kids': 'Family',
  'Children': 'Family',
  'Family Fun': 'Family',
  'Nightlife': 'Nightlife',
  'Club Night': 'Nightlife',
  'Party': 'Nightlife',
  'DJ': 'Nightlife',
};
```

Unmapped category → `null` → `normaliseEvent` returns `null` → event is skipped. This is intentional: only events that map cleanly to our 8 categories are ingested.

### `mapQuicketEvent` blueprint

```typescript
export function mapQuicketEvent(raw: unknown): Record<string, unknown> {
  const e = raw as Record<string, unknown>;

  const { date, time } = parseIsoDateTime(
    typeof e['startDate'] === 'string' ? e['startDate'] : null,
  );

  const categoryName = typeof e['categoryName'] === 'string' ? e['categoryName'] : '';
  const category = QUICKET_CATEGORY_MAP[categoryName] ?? null;

  const minPrice = typeof e['minimumTicketPrice'] === 'number' ? e['minimumTicketPrice'] : undefined;
  let price: string | null = null;
  if (minPrice === 0) price = 'Free';
  else if (minPrice !== undefined) price = `R${minPrice}`;

  return {
    name:        e['name'] ?? null,
    date,
    time,
    venue:       e['venueName'] ?? null,
    address:     e['venueAddress'] ?? null,
    category,
    description: e['description'] ?? null,
    price,
    ticketLink:  e['saleUrl'] ?? null,
    imageUrl:    e['imageUrl'] ?? null,
  };
}
```

### `fetchPage` + `syncQuicketHandler` blueprint

```typescript
async function fetchPage(
  apiKey: string,
  pageIndex: number,
): Promise<{ events: unknown[]; hasMore: boolean }> {
  const url = new URL('https://api.quicket.co.za/api/events');
  url.searchParams.set('location', 'Johannesburg');
  url.searchParams.set('startdate', todayIso());
  url.searchParams.set('pagesize', '100');
  url.searchParams.set('pageIndex', String(pageIndex));

  const res = await fetch(url.toString(), {
    headers: { Authorization: `api_key ${apiKey}` },
  });

  if (!res.ok) throw new Error(`Quicket API ${res.status}: ${res.statusText}`);

  const data = await res.json() as { data?: unknown[]; totalCount?: number; pageSize?: number };
  const events = Array.isArray(data.data) ? data.data : [];
  const totalCount = typeof data.totalCount === 'number' ? data.totalCount : 0;
  const pageSize = typeof data.pageSize === 'number' ? data.pageSize : 100;
  return { events, hasMore: (pageIndex + 1) * pageSize < totalCount };
}

export async function syncQuicketHandler(apiKey: string): Promise<void> {
  const startTime = new Date().toISOString();
  logger.info('syncQuicket started', { startTime });

  let pageIndex = 0;
  let totalFetched = 0;
  let totalWritten = 0;

  while (true) {
    const { events, hasMore } = await fetchPage(apiKey, pageIndex);
    totalFetched += events.length;

    for (const raw of events) {
      const mapped = mapQuicketEvent(raw);
      const normalised = normaliseEvent(mapped, 'quicket');

      if (!normalised) {
        logger.warn('syncQuicket: skipped (normalise returned null)', { raw });
        continue;
      }

      try {
        await upsertEvent(normalised);
        totalWritten++;
      } catch (err) {
        logger.error('syncQuicket: upsert failed', { id: normalised.id, err });
      }
    }

    if (!hasMore) break;
    pageIndex++;
  }

  logger.info('syncQuicket completed', { startTime, totalFetched, totalWritten });
}
```

### `dateUtils.ts` blueprint

```typescript
// functions/src/lib/dateUtils.ts

export function parseIsoDateTime(
  dt: string | null | undefined,
): { date: string | null; time: string | null } {
  if (!dt) return { date: null, time: null };
  const match = dt.match(/^(\d{4}-\d{2}-\d{2})T(\d{2}:\d{2})/);
  if (!match) return { date: null, time: null };
  return { date: match[1], time: match[2] };
}

export function todayIso(): string {
  return new Date().toISOString().slice(0, 10);
}
```

### Test structure

```typescript
// functions/src/syncQuicket.test.ts

import { mapQuicketEvent, syncQuicketHandler, QUICKET_CATEGORY_MAP } from './syncQuicket';
import { normaliseEvent } from './lib/normaliseEvent';
import { upsertEvent } from './lib/firestoreClient';
import * as logger from 'firebase-functions/logger';

jest.mock('./lib/normaliseEvent');
jest.mock('./lib/firestoreClient');
jest.mock('firebase-functions/logger');

const mockFetch = jest.fn();
global.fetch = mockFetch as unknown as typeof fetch;

const MOCK_NORMALISED = {
  id: 'quicket-jazz-in-the-park-2026-07-05',
  name: 'Jazz in the Park',
  date: '2026-07-05',
  time: '14:00',
  venue: 'Zoo Lake',
  address: 'Parkview, JHB',
  category: 'Music' as const,
  description: null,
  price: 'Free',
  ticketLink: 'https://www.quicket.co.za/events/123456',
  imageUrl: null,
  source: 'quicket' as const,
  lastUpdated: '2026-07-01T00:00:00.000Z',
};

const MOCK_QUICKET_EVENT = {
  eventId: '123456',
  name: 'Jazz in the Park',
  description: null,
  startDate: '2026-07-05T14:00:00',
  venueName: 'Zoo Lake',
  venueAddress: 'Parkview, JHB',
  categoryName: 'Music',
  imageUrl: null,
  saleUrl: 'https://www.quicket.co.za/events/123456',
  minimumTicketPrice: 0,
};

function mockApiPage(events: unknown[], totalCount: number, pageIndex: number) {
  mockFetch.mockResolvedValueOnce({
    ok: true,
    json: async () => ({ data: events, totalCount, pageIndex, pageSize: 100 }),
  } as Response);
}
```

**Key pattern**: `syncQuicketHandler` takes `apiKey` as a parameter so it can be called directly in tests without touching the Firebase Functions runtime or `defineSecret`.

### `index.ts` — before and after

**Before (Story 4.1 output):**
```typescript
import { initializeApp } from 'firebase-admin/app';
import { onSchedule } from 'firebase-functions/v2/scheduler';

initializeApp();

export const _placeholder = onSchedule(
  { schedule: 'every 24 hours', timeZone: 'Africa/Johannesburg' },
  async () => { /* no-op */ },
);
```

**After Story 4.3:**
```typescript
import { initializeApp } from 'firebase-admin/app';

initializeApp();

export { syncQuicket } from './syncQuicket';
// Story 4.4: export { syncEventbrite } from './syncEventbrite';
// Story 4.5: export { syncFacebookEvents } from './syncFacebookEvents';
```

Remove `onSchedule` import from `index.ts` entirely — it is now imported in `syncQuicket.ts`.

### firebase-functions/logger usage

Use the Firebase Functions structured logger (already installed, part of `firebase-functions` package):

```typescript
import * as logger from 'firebase-functions/logger';

logger.info('message', { key: value });
logger.warn('message', { key: value });
logger.error('message', { key: value });
```

Do NOT use `console.log` in Cloud Functions — it bypasses structured logging in production.

### Previous story learnings

From Story 4.1:
- `functions/` workspace uses plain `jest` + `ts-jest` with `testEnvironment: 'node'` — no jest-expo, no RNTL
- `jest.mock('module-path')` pattern works cleanly in this workspace
- TypeScript compile `tsc --noEmit` is the automated gate; live Firebase deploy is manual

From Story 4.2:
- Exporting helper functions (`slugify`, `mapQuicketEvent`) separately from the main export makes tests straightforward
- Blueprint-exact implementation works without debugging when the spec is precise
- `global.fetch = jest.fn()` pattern works in Node `testEnvironment`

### Deferred items this story addresses

From `deferred-work.md`:
- "`extra.*ApiKey ?? ''` bakes empty strings into EAS build profiles — real key wiring belongs to Epic 4 (Stories 4.3–4.5)" → Story 4.3 wires `QUICKET_API_KEY` into Firebase Secret Manager (Cloud Functions side)

### References

- Quicket REST API docs: `developer.quicket.co.za` — verify all field names before implementing
- `functions/src/lib/normaliseEvent.ts` — the normaliser (expects NormalisedEvent field names in `raw`)
- `functions/src/lib/firestoreClient.ts` — `upsertEvent(event: NormalisedEvent)`
- `functions/src/lib/types.ts` — `NormalisedEvent`, `Category`, `EventSource`, `CATEGORY_VALUES`
- Architecture §Data Architecture — Cloud Functions schedule intervals, Quicket as authoritative dedup source (AR-6)

## Dev Agent Record

### Agent Model Used

claude-opus-4-8 (Opus 4.8)

### Debug Log References

None — implementation followed the story blueprints exactly; all gates passed on first run (functions tsc 0 errors, functions 46 tests, root tsc 0 errors, root 90 tests).

### Completion Notes List

- Implemented `dateUtils.ts` (`parseIsoDateTime`, `todayIso`) per blueprint; the ISO regex requires a `T{HH:MM}` time component, so date-only strings correctly yield `{ date: null, time: null }`.
- `syncQuicket.ts` implements `QUICKET_CATEGORY_MAP`, `mapQuicketEvent`, internal `fetchPage`, exported `syncQuicketHandler(apiKey)`, and the `syncQuicket` scheduled export bound to the `QUICKET_API_KEY` secret via `defineSecret`. Extracted `QUICKET_EVENTS_URL` / `QUICKET_LOCATION` / `QUICKET_PAGE_SIZE` as named constants.
- `syncQuicketHandler` takes `apiKey` as a parameter so tests run without the Functions runtime or Secret Manager. Pagination uses 0-based `pageIndex` and `(pageIndex + 1) * pageSize < totalCount` to compute `hasMore`. Per-event flow: `mapQuicketEvent` → `normaliseEvent(_, 'quicket')` → skip null with `logger.warn` → `upsertEvent` in try/catch with `logger.error`. Structured `firebase-functions/logger` used throughout (no `console.log`).
- `index.ts` reduced to `initializeApp()` + `export { syncQuicket }`; `_placeholder` and the `onSchedule` import removed (AC #6).
- Tests cover category map, all `mapQuicketEvent` field/date/category/price branches, and `syncQuicketHandler` for single-page, Authorization header, multi-page pagination, null-normalise skip, upsert-failure-continues, and non-ok API response. Used `jest.mocked()` for typed mocks consistent with the existing `firestoreClient.test.ts` pattern.
- ⚠️ **Quicket API field names are unverified against `developer.quicket.co.za`** (story Dev Notes flagged this). Mapping is best-effort from the documented approximation; field names (`startDate`, `venueName`, `categoryName`, `saleUrl`, `minimumTicketPrice`, `totalCount`/`pageSize` response keys) should be confirmed before/at live deploy.
- **Task 1 (secret provisioning) NOT done by agent** — `firebase functions:secrets:set QUICKET_API_KEY` is interactive and needs live Firebase auth + the real dev key. Code wiring (`defineSecret` + `secrets:[quicketApiKey]`) is complete; Voice must run the secret-set + live `firebase deploy --only functions` as the manual post-merge step (consistent with Story 4.1).

### File List

- `functions/src/lib/dateUtils.ts` (NEW)
- `functions/src/lib/dateUtils.test.ts` (NEW)
- `functions/src/syncQuicket.ts` (NEW)
- `functions/src/syncQuicket.test.ts` (NEW)
- `functions/src/index.ts` (MODIFIED)
- `_bmad-output/implementation-artifacts/sprint-status.yaml` (MODIFIED — status tracking)

## Change Log

| Date | Change |
|------|--------|
| 2026-06-25 | Story 4.3 implemented: `dateUtils` helpers, `syncQuicket` scheduled Cloud Function (mapping + pagination + upsert), `index.ts` rewired to export `syncQuicket`. Tests added (dateUtils + syncQuicket). All gates green: functions tsc 0 errors / 46 tests; root tsc 0 errors / 90 tests. Task 1 (secret provisioning) flagged as manual. Status → review. |
