# Story 4.2: normaliseEvent() Utility — Full Implementation

Status: review

## Story

As a developer,
I want `normaliseEvent()` to map raw API payloads to the `NormalisedEvent` schema and generate a deduplication-safe document ID,
so that all sync functions produce consistently shaped Firestore documents and duplicate events are deduplicated across sources.

## Acceptance Criteria

1. `normaliseEvent(raw: unknown, source: EventSource)` returns a `NormalisedEvent` object when all required fields are present
2. Returns `null` if any required field (`name`, `date`, `venue`) is missing or unparseable
3. Document ID is generated as `` `${source}-${slugify(name)}-${isoDate}` `` (e.g. `quicket-jazz-in-the-park-2026-06-07`)
4. `slugify` converts to lowercase, replaces spaces with hyphens, removes non-alphanumeric-non-hyphen characters, collapses consecutive hyphens, trims leading/trailing hyphens
5. `date` is stored as an ISO 8601 date string (`"YYYY-MM-DD"`) — never a Firestore Timestamp or Date object; returns `null` if date is not parseable to this format
6. Optional fields (`imageUrl`, `ticketLink`, `description`, `price`, `time`, `address`) are `null` when absent or empty-string — never `undefined`
7. `category` must be a valid `Category` value; returns `null` if missing or not in `CATEGORY_VALUES`
8. `source` is stored on the document as provided
9. `normaliseEvent.test.ts` covers: valid event returns correct shape + ID, missing required field (`name`, `date`, `venue`) returns null, missing `category` returns null, optional fields default to null when absent, empty-string optional fields coerce to null, slugify handles special characters and unicode

## Tasks / Subtasks

- [x] Task 1 — Export `CATEGORY_VALUES` array from `functions/src/lib/types.ts` (AC: #7)
  - [x] Add `export const CATEGORY_VALUES: readonly Category[] = [...]` to `types.ts` so `normaliseEvent` can validate the category field at runtime

- [x] Task 2 — Implement `slugify` helper (AC: #3, #4)
  - [x] Implement and export `slugify(text: string): string` in `functions/src/lib/normaliseEvent.ts`
  - [x] Lowercase → spaces-to-hyphens → strip non-[a-z0-9-] → collapse `--+` → trim leading/trailing `-`

- [x] Task 3 — Replace placeholder with full `normaliseEvent` implementation (AC: #1–#8)
  - [x] Replace the stub in `functions/src/lib/normaliseEvent.ts` with the real implementation
  - [x] Use a `getString` internal helper that safely reads a non-empty string from `unknown` (returns null on missing/empty/non-string)
  - [x] Validate `name`, `date`, `venue` — return null if any missing
  - [x] Parse date: accept `YYYY-MM-DD` prefix; return null if unparseable
  - [x] Validate `category` against `CATEGORY_VALUES` — return null if missing or invalid
  - [x] Coerce all optional fields to `null` when absent/empty (never `undefined`)
  - [x] Set `lastUpdated` to `new Date().toISOString()` at normalization time
  - [x] Generate `id` as `` `${source}-${slugify(name)}-${isoDate}` ``

- [x] Task 4 — Write comprehensive tests (AC: #9)
  - [x] Create `functions/src/lib/normaliseEvent.test.ts`
  - [x] Test: valid minimal event returns correct shape and ID
  - [x] Test: missing `name` returns null
  - [x] Test: missing `date` returns null
  - [x] Test: missing `venue` returns null
  - [x] Test: missing/invalid `category` returns null
  - [x] Test: optional fields absent → all null (no undefined)
  - [x] Test: empty-string optional fields coerce to null
  - [x] Test: `slugify` handles unicode/accents (e.g. `"Café"` → `"caf"`)
  - [x] Test: `slugify` handles special chars (e.g. `"Jazz & Blues"` → `"jazz-blues"`)
  - [x] Test: `slugify` exported separately (sync functions will use it)

- [x] Task 5 — Validation gates
  - [x] `cd functions && npx tsc --noEmit` passes with 0 errors
  - [x] `cd functions && npm test` — all tests green (includes both `firestoreClient` and `normaliseEvent` suites)
  - [x] Root `npx tsc --noEmit` still passes
  - [x] Root `npm test` — 90 app tests still green

## Dev Notes

### What file to modify

`functions/src/lib/normaliseEvent.ts` already EXISTS as a placeholder from Story 1.3:
```typescript
// current state — replace entirely
export function normaliseEvent(_raw: unknown, _source: unknown): null {
  return null;
}
```
**Replace the whole file.** Do not append to it.

### CATEGORY_VALUES update to types.ts

`functions/src/lib/types.ts` currently exports a union type `Category` but no runtime array. Add the array (needed for `Array.includes()` validation at runtime):

```typescript
export const CATEGORY_VALUES: readonly Category[] = [
  'Music', 'Markets', 'Food & Drink', 'Art & Culture',
  'Sport', 'Comedy', 'Family', 'Nightlife',
] as const;
```

The `as const` on the array is redundant with `readonly` but harmless — either is fine.

### What `raw: unknown` means in practice

The sync functions (4.3–4.5) will translate their source-specific API responses into an intermediate object using the **same field names as `NormalisedEvent`** before calling `normaliseEvent`. This means `raw` will look like:

```typescript
{
  name: 'Jazz in the Park',
  date: '2026-07-05',        // already converted to YYYY-MM-DD by sync fn
  venue: 'Zoo Lake',
  category: 'Music',         // already mapped to canonical Category value by sync fn
  address: 'Parkview, JHB',
  time: '14:00',
  price: 'Free',
  ticketLink: 'https://...',
  imageUrl: 'https://...',
  description: '...',
}
```

`normaliseEvent` does NOT do source-specific field extraction — that is the sync function's job. normaliseEvent's job is: validate, coerce nulls, generate ID.

### Implementation blueprint

```typescript
// functions/src/lib/normaliseEvent.ts
import type { NormalisedEvent, EventSource, Category } from './types';
import { CATEGORY_VALUES } from './types';

export function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9-]/g, '')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
}

function getString(obj: unknown, key: string): string | null {
  if (typeof obj !== 'object' || obj === null) return null;
  const val = (obj as Record<string, unknown>)[key];
  if (typeof val === 'string' && val.trim() !== '') return val.trim();
  return null;
}

export function normaliseEvent(raw: unknown, source: EventSource): NormalisedEvent | null {
  const name  = getString(raw, 'name');
  const date  = getString(raw, 'date');
  const venue = getString(raw, 'venue');

  if (!name || !date || !venue) return null;

  // Accept YYYY-MM-DD prefix; reject anything unparseable
  const isoDateMatch = date.match(/^(\d{4}-\d{2}-\d{2})/);
  if (!isoDateMatch) return null;
  const isoDate = isoDateMatch[1];
  if (isNaN(new Date(isoDate).getTime())) return null;

  const rawCategory = getString(raw, 'category');
  if (!rawCategory || !(CATEGORY_VALUES as readonly string[]).includes(rawCategory)) return null;
  const category = rawCategory as Category;

  return {
    id:          `${source}-${slugify(name)}-${isoDate}`,
    name,
    date:        isoDate,
    time:        getString(raw, 'time'),
    venue,
    address:     getString(raw, 'address'),
    category,
    description: getString(raw, 'description'),
    price:       getString(raw, 'price'),
    ticketLink:  getString(raw, 'ticketLink'),
    imageUrl:    getString(raw, 'imageUrl'),
    source,
    lastUpdated: new Date().toISOString(),
  };
}
```

`getString` returns `null` for missing, non-string, and empty-string values — this satisfies both the "optional fields default to null" and the "empty-string coerces to null" ACs in a single helper.

### Deferred items resolved by this story

From `deferred-work.md`:
- "`normaliseEvent` return type is `null` literal, not `NormalisedEvent | null`" — fixed here
- "`Event.time` format undefined" — normaliseEvent normalises time via getString (sync fns pass "HH:MM")
- "`price: string | null` type allows `''` despite comment contract" — enforced by getString (empty string → null)
- "`EventCard` can display literal 'undefined' if Firestore doc has null name/venue" — normaliseEvent guarantees name/venue non-null in all written docs

### Naming conventions (from architecture)

- `slugify` is a named export — sync functions (4.3–4.5) may need it for other purposes
- No default exports
- File stays at `functions/src/lib/normaliseEvent.ts`

### Test fixture pattern

```typescript
const VALID_RAW = {
  name: 'Jazz in the Park',
  date: '2026-07-05',
  venue: 'Zoo Lake',
  category: 'Music',
};
// Optional fields absent → all null in result
// Extra fields present → ignored silently
```

### Project Structure Notes

Files changed in this story:
- **MODIFY** `functions/src/lib/normaliseEvent.ts` — replace placeholder with full implementation + `slugify` export
- **MODIFY** `functions/src/lib/types.ts` — add `CATEGORY_VALUES` array export
- **NEW** `functions/src/lib/normaliseEvent.test.ts`

No app workspace files are touched. Root `jest.config.js` already excludes `/functions/` (from Story 4.1).

### References

- Epic 4.2 AC [epics.md — Story 4.2]
- Architecture AR-6 deduplication rule [architecture.md]
- `deferred-work.md` — null/undefined field contract notes from prior reviews
- `functions/src/lib/types.ts` — `NormalisedEvent`, `Category`, `EventSource`
- `functions/src/lib/normaliseEvent.ts` — placeholder to replace

## Dev Agent Record

### Agent Model Used

claude-sonnet-4-6

### Debug Log References

No issues encountered. Implementation matched the blueprint exactly — no debugging required.

### Completion Notes List

- Added `CATEGORY_VALUES: readonly Category[]` export to `functions/src/lib/types.ts` for runtime category validation
- Replaced `normaliseEvent.ts` placeholder with full implementation: `slugify` + `getString` helper + `normaliseEvent` function
- `getString` coerces both missing/undefined and empty-string values to `null`, satisfying the null-not-undefined contract in a single helper
- `slugify` exported as a named export for reuse by sync functions (4.3–4.5)
- Date parsing accepts `YYYY-MM-DD` prefix via regex; rejects non-ISO formats like `"05/07/2026"` or free-text
- Category validated at runtime against `CATEGORY_VALUES` — returns `null` for misspelled or wrong-case values (e.g. `"music"` fails, `"Music"` passes)
- 20 tests in `normaliseEvent.test.ts` + 2 existing `firestoreClient.test.ts` = 22 functions tests pass
- 90 app tests unaffected; both workspaces TypeScript-clean

### File List

- functions/src/lib/normaliseEvent.ts (MODIFIED — replaced placeholder with full implementation)
- functions/src/lib/normaliseEvent.test.ts (NEW — 20 tests covering all ACs)
- functions/src/lib/types.ts (MODIFIED — added CATEGORY_VALUES export)

### Change Log

- 2026-06-25: Story 4.2 implemented — normaliseEvent() full implementation with slugify, getString helper, CATEGORY_VALUES runtime validation; 20 new tests green, 90 app tests unaffected
