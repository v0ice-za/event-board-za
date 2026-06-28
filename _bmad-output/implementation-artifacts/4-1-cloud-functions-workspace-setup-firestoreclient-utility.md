# Story 4.1: Cloud Functions Workspace Setup + firestoreClient Utility

Status: done

## Story

As a developer,
I want the Cloud Functions workspace scaffolded with TypeScript compilation and a shared Firestore write client,
so that sync functions have a working deploy target and a single, testable upsert primitive.

## Acceptance Criteria

1. `functions/` is a separate npm workspace with its own `package.json` (Node 20, `"main": "lib/index.js"`) and `tsconfig.json` (strict, targeting `lib/`)
2. `firebase.json` references the `functions/` directory and is configured to deploy to the Firebase project from Story 1.3
3. `functions/src/lib/firestoreClient.ts` exports `upsertEvent(event: NormalisedEvent): Promise<void>` — writes to `events/{id}` using Firestore `set` with merge, where `id` is taken from `event.id`
4. `functions/src/index.ts` exists as the entry point and exports at least one placeholder export (no-op) so Firebase deploy succeeds
5. `firebase deploy --only functions` runs without errors against the dev Firebase project
6. `firestoreClient.test.ts` covers: calls Firestore set with correct document ID and merge option

## Tasks / Subtasks

- [x] Task 1 — Bootstrap functions workspace (AC: #1)
  - [x] Create `functions/package.json` with Node 20 engine, `main: "lib/index.js"`, firebase-admin + firebase-functions deps, jest + ts-jest devDeps
  - [x] Create `functions/tsconfig.json` — strict mode, `module: "commonjs"`, `target: "es2017"`, `outDir: "lib"`, `include: ["src"]`
  - [x] Create `functions/.gitignore` excluding `lib/` and `node_modules/`
  - [x] Run `npm install` inside `functions/` to generate `functions/package-lock.json`

- [x] Task 2 — Verify firebase.json is correct (AC: #2)
  - [x] Confirm `firebase.json` already has `"source": "functions"` under the functions config — DO NOT recreate it; file exists from Story 1.3

- [x] Task 3 — Define NormalisedEvent type (AC: #3)
  - [x] Create `functions/src/lib/types.ts` exporting `NormalisedEvent` interface (same shape as app's `Event` type but defined locally — functions workspace cannot import from the app)

- [x] Task 4 — Implement firestoreClient (AC: #3)
  - [x] Create `functions/src/lib/firestoreClient.ts` — imports `getFirestore` from `firebase-admin/firestore`, exports `upsertEvent(event: NormalisedEvent): Promise<void>`
  - [x] `upsertEvent` strips `id` from data before writing (document ID and Firestore field `id` are separate); calls `set(data, { merge: true })` on `events/{event.id}`

- [x] Task 5 — Create entry point (AC: #4)
  - [x] Create `functions/src/index.ts` — imports `initializeApp` from `firebase-admin/app` and calls it at module scope; exports a `_placeholder` no-op scheduled function so Firebase CLI has at least one function to register

- [x] Task 6 — Write tests (AC: #6)
  - [x] Create `functions/src/lib/firestoreClient.test.ts` — mocks `firebase-admin/firestore`, verifies `set` called on `events/{id}` with `{ merge: true }`, verifies `id` is NOT in the document data payload

- [x] Task 7 — Validation gates
  - [x] `cd functions && npx tsc --noEmit` passes with 0 errors
  - [x] `cd functions && npm test` — all tests green
  - [x] Root `npx tsc --noEmit` still passes (no regressions in app workspace)
  - [x] Root `npm test` — all existing app tests still green (90 tests)

## Dev Notes

### Critical: separate workspace — different SDK, different rules

`functions/` is **not** part of the Expo app workspace. Key differences:

| Concern | App workspace | Functions workspace |
|---|---|---|
| Firestore SDK | `@react-native-firebase/firestore` | `firebase-admin/firestore` |
| Path alias | `@/` (Metro) | None — use relative imports |
| Module format | ESM (Metro bundler) | CommonJS (`"module": "commonjs"`) |
| Target runtime | iOS/Android | Node 20 |
| Test runner | `jest-expo` + RNTL | plain `jest` + `ts-jest` |

**Never import from `@react-native-firebase/*` in functions.** Never use `@/` paths.

### firebase.json — DO NOT recreate

`firebase.json` already exists with the correct functions config:
```json
{
  "functions": [{ "source": "functions", "codebase": "default", ... }]
}
```
Story 4.1 must not modify `firebase.json`. Task 2 is a verification step only.

### normaliseEvent.ts — DO NOT modify

`functions/src/lib/normaliseEvent.ts` already exists as a placeholder (returns `null`). Story 4.2 owns its full implementation. Story 4.1 must not change it.

### NormalisedEvent type

Define `NormalisedEvent` in `functions/src/lib/types.ts`. It is identical in shape to the app's `Event` interface (see `types/event.ts` in app workspace). The functions workspace cannot import from the app, so it re-declares the type locally.

### firestoreClient implementation

**Why `id` is stripped from data:** The app reads events with `{ ...d.data(), id: d.id }` (see `hooks/useEvents.ts` and `hooks/useEventDetail.ts`). The `id` comes from the Firestore document key, not from a document field. Storing `id` inside the document data would be redundant.

**Why `merge: true`:** Subsequent syncs may update the same event. `merge: true` updates changed fields without overwriting unrelated fields from other sources. Quicket is authoritative for deduplication (AR-6).

### AC #5 — firebase deploy verification

Requires live Firebase credentials. TypeScript compile (`tsc --noEmit`) is the relevant automated gate. Live deploy verified by Voice manually post-merge.

### Deferred items relevant to this story

- **WebViewModal URL safety**: `normaliseEvent` owns the URL trust boundary. `firestoreClient` is a blind writer — it does not validate URLs.
- **Null field guard**: `firestoreClient` trusts the caller; `normaliseEvent` (Story 4.2) enforces the null contract.

### Project Structure Notes

Files created in this story (all under `functions/`):
- **NEW** `functions/package.json`
- **NEW** `functions/package-lock.json` (generated by `npm install`)
- **NEW** `functions/tsconfig.json`
- **NEW** `functions/.gitignore`
- **NEW** `functions/src/index.ts`
- **NEW** `functions/src/lib/types.ts`
- **NEW** `functions/src/lib/firestoreClient.ts`
- **NEW** `functions/src/lib/firestoreClient.test.ts`
- **EXISTING — DO NOT TOUCH** `functions/src/lib/normaliseEvent.ts` (Story 4.2 owns)
- **EXISTING — DO NOT TOUCH** `firebase.json` (already correct)

### References

- Architecture AR-5, AR-6 [architecture.md — Data Architecture + Decision Impact Analysis]
- `firebase.json` current state at project root
- `functions/src/lib/normaliseEvent.ts` — existing placeholder
- `types/event.ts` in app workspace — canonical `Event` interface shape to mirror in `NormalisedEvent`
- `deferred-work.md` — URL trust boundary note

## Dev Agent Record

### Agent Model Used

claude-sonnet-4-6

### Debug Log References

- `tsconfig.json` needed `"types": ["jest", "node"]` — ts-jest does not auto-inject jest globals without this in TS strict mode
- `tsconfig.json` needed `"ignoreDeprecations": "6.0"` — TypeScript 6 deprecated `moduleResolution: "node"` (node10); silenced for CJS Cloud Functions compatibility
- Added `testPathIgnorePatterns: ["/functions/"]` to root `jest.config.js` — app Jest was picking up `firestoreClient.test.ts` and failing because `firebase-admin` dependencies pull in ESM modules (uuid@10) that jest-expo Babel cannot handle

### Completion Notes List

- Created full `functions/` workspace: `package.json` (Node 20, firebase-admin ^13.10.0, firebase-functions ^6.0.0), `tsconfig.json` (strict, commonjs, es2017, ignoreDeprecations), `.gitignore`
- Defined `NormalisedEvent` type in `functions/src/lib/types.ts` — mirrors app `Event` interface; separate declaration required since functions workspace cannot import from the Expo app workspace
- Implemented `upsertEvent` in `firestoreClient.ts` — strips `id` from document data, uses `set({ merge: true })` for safe upsert
- Created `functions/src/index.ts` with `initializeApp()` at module scope and `_placeholder` no-op scheduled function for Firebase CLI compatibility
- 2 tests pass in functions workspace; 90 app tests unaffected
- AC #5 (live `firebase deploy`) requires live Firebase credentials — TypeScript compile gate verified instead; live deploy deferred to Voice's manual validation

### File List

- functions/package.json (NEW)
- functions/package-lock.json (NEW, generated)
- functions/tsconfig.json (NEW)
- functions/.gitignore (NEW)
- functions/src/index.ts (NEW)
- functions/src/lib/types.ts (NEW)
- functions/src/lib/firestoreClient.ts (NEW)
- functions/src/lib/firestoreClient.test.ts (NEW)
- jest.config.js (MODIFIED — added testPathIgnorePatterns to exclude /functions/ from app Jest run)

### Change Log

- 2026-06-25: Story 4.1 implemented — Cloud Functions workspace bootstrapped, firestoreClient upsertEvent utility created with 2 tests, root jest.config.js updated to exclude functions directory from app test run
