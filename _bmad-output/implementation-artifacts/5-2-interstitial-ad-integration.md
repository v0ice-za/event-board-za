# Story 5.2: Interstitial Ad Integration

Status: done

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As a developer,
I want interstitial ads shown at a sensible frequency during normal app use,
so that the app generates ad revenue without disrupting the user experience.

## Acceptance Criteria

1. An interstitial ad is **preloaded on app start** in `app/_layout.tsx`, using the AdMob **interstitial unit ID** read from `app.config.ts` `extra` (not hardcoded). In development (`__DEV__`) the Google **test** interstitial unit ID (`TestIds.INTERSTITIAL`) is used. (FR-10, epics §Story 5.2)
2. A **session detail-view counter** is tracked through a React Context provided by `app/_layout.tsx`. The interstitial is shown after the user views their **3rd event-detail screen** in a session (`INTERSTITIAL_TRIGGER_COUNT = 3`). The detail screen (`app/event/[id].tsx`) signals each view via the context — it never imports the AdMob SDK. (epics §Story 5.2; architecture §Architectural Boundaries)
3. After the interstitial is **shown** (dismissed/closed), the counter resets to 0 and the **next ad preloads immediately**. (epics §Story 5.2)
4. The interstitial is **dismissible** — AdMob's native close button is not suppressed. No autoplay audio is enabled (no `startMuted`/unmute override; default behaviour relied upon). (FR-10)
5. If the preloaded ad is **not ready** when the trigger fires, the interstitial is **skipped silently** — the user is never blocked, nothing is logged, nothing throws. (FR-10; project rule: ad failures are silent)
6. **AdMob boundary preserved:** `react-native-google-mobile-ads` is imported only by `app/_layout.tsx` (for interstitial) and `components/AdBannerUnit.tsx` (for banner, Story 5.1). No new component or screen imports the SDK. (architecture §Architectural Boundaries)
7. **No regressions:** existing suites stay green; the web bundle (`expo export --platform web`) still resolves (the web stub `lib/__stubs__/mobile-ads.js` is extended with `InterstitialAd` / `AdEventType` / `TestIds.INTERSTITIAL`). The interstitial flow (show-after-3, skip-when-not-ready, reset+preload-after-close) is covered by tests.

## Tasks / Subtasks

- [x] Task 1 — Add the interstitial unit ID to config (AC: #1)
  - [x] In `app.config.ts` `extra`, add `admobInterstitialUnitId: process.env.ADMOB_INTERSTITIAL_UNIT_ID ?? ''` next to the existing `admobBannerUnitId` placeholder. Add a comment mirroring the banner one: real value wired in Story 5.5; dev uses `TestIds.INTERSTITIAL`.
  - [x] Do NOT touch the `react-native-google-mobile-ads` plugin block — App IDs only live there (still Google **test** App IDs until Story 5.5).

- [x] Task 2 — Create the SDK-free context module `lib/interstitial.tsx` (AC: #2, #6)
  - [x] Named exports only (project rule). No import of `react-native-google-mobile-ads` anywhere in this file.
  - [x] `export const INTERSTITIAL_TRIGGER_COUNT = 3;` (SCREAMING_SNAKE_CASE true constant — see deviation note below; `app/index.tsx` already uses `AD_INTERVAL`).
  - [x] `export const InterstitialContext = createContext<() => void>(() => {});` — the value is a `recordDetailView` callback; the **default is a no-op** so screens render fine without a provider (keeps existing `app/event/[id].test.tsx` green without wiring a provider).
  - [x] `export function useRecordDetailView() { return useContext(InterstitialContext); }`
  - [x] (Optional helper, only if it aids the test) a pure `export function shouldShowInterstitial(count: number) { return count >= INTERSTITIAL_TRIGGER_COUNT; }`.

- [x] Task 3 — Wire the interstitial controller into `app/_layout.tsx` (AC: #1, #3, #4, #5, #6)
  - [x] Import `{ InterstitialAd, AdEventType, TestIds }` from `react-native-google-mobile-ads` (this file is one of the two SDK-permitted locations).
  - [x] Resolve the unit ID: `__DEV__ ? TestIds.INTERSTITIAL : (Constants.expoConfig?.extra?.admobInterstitialUnitId as string ?? '')` (import `Constants from 'expo-constants'`).
  - [x] Create the instance **once** (e.g. `useRef`): `InterstitialAd.createForAdRequest(unitId, { requestNonPersonalizedAdsOnly: true })`. Non-personalized is a privacy-safe default until the UMP consent flow lands in Story 5.4 — note this in a comment.
  - [x] Track `loaded` and `count` in refs (not state — these drive imperative SDK calls, not render). In a mount `useEffect`:
    - register listeners (each `addAdEventListener` returns an unsubscribe; collect and return them all from the effect cleanup):
      - `AdEventType.LOADED` → `loaded = true`
      - `AdEventType.CLOSED` → `loaded = false; count = 0; interstitial.load()` (reset + preload next — AC #3)
      - `AdEventType.ERROR` → `loaded = false` (silent — AC #5; the next trigger's "else load()" re-attempts)
    - call `interstitial.load()` once to **preload on app start** (AC #1).
  - [x] Define `recordDetailView`: `count += 1; if (count >= INTERSTITIAL_TRIGGER_COUNT) { count = 0; if (loaded) interstitial.show(); else interstitial.load(); }` — when not ready, reset and kick a fresh load so the next cycle can show (AC #5; never block).
  - [x] Provide it: wrap the existing tree in `<InterstitialContext.Provider value={recordDetailView}>`. Keep the **mandated provider order** intact: `SafeAreaProvider → QueryClientProvider → Stack`; the InterstitialContext.Provider may sit inside QueryClientProvider around `<Stack>` (it has no ordering constraint relative to the others).
  - [x] Do **not** re-initialise the SDK — `MobileAds().initialize()` already runs here (keep it). `show()` only ever after a `LOADED` event.

- [x] Task 4 — Signal detail views from the detail screen (AC: #2, #6)
  - [x] In `app/event/[id].tsx`, `const recordDetailView = useRecordDetailView();` and call it **once per screen view** in `useEffect(() => { recordDetailView(); }, [recordDetailView]);` near the top of the component (after the hooks already there).
  - [x] Do NOT import the AdMob SDK here. Place the effect so it fires on mount regardless of loading/error branch (the early returns are below the hooks — keep the effect above the `if (isLoading)` guard, alongside the other hooks, to satisfy the rules-of-hooks).

- [x] Task 5 — Extend the web stub (AC: #7)
  - [x] In `lib/__stubs__/mobile-ads.js` add: `InterstitialAd = { createForAdRequest: () => ({ addAdEventListener: () => () => {}, load: () => {}, show: () => {} }) }`; `AdEventType = { LOADED: 'loaded', CLOSED: 'closed', ERROR: 'error', OPENED: 'opened' }`; and add `INTERSTITIAL` to the existing `TestIds` object (`'ca-app-pub-3940256099942544/1033173712'`, Google's test interstitial unit).

- [x] Task 6 — Tests (AC: #2, #3, #5, #7)
  - [x] `lib/interstitial.test.tsx` (NEW): render `InterstitialContext.Provider` with a spy callback + a consumer using `useRecordDetailView`; assert the default no-op context doesn't throw; assert `useRecordDetailView` returns the provided value. Cover `shouldShowInterstitial` / `INTERSTITIAL_TRIGGER_COUNT` if the helper is used.
  - [x] `app/_layout.test.tsx` (NEW): mock `react-native-google-mobile-ads` with a controllable `InterstitialAd.createForAdRequest` returning a fake whose `addAdEventListener` captures callbacks (so the test drives LOADED/CLOSED/ERROR via `act`) and whose `load`/`show` are `jest.fn()`. Also mock `@expo-google-fonts/inter` (`useFonts: () => [true, null]`), `expo-splash-screen`, `@/lib/firebase` (side-effect import), and `expo-constants`. Render `RootLayout` wrapping a small consumer that calls `recordDetailView` on demand (or render the real detail screen). Assert:
    - `load()` is called once on mount (preload on start).
    - With the ad LOADED, three `recordDetailView()` calls → `show()` called exactly once; first two calls → `show()` not yet called.
    - Not loaded at the 3rd call → `show()` NOT called (silent skip), and a fresh `load()` was kicked.
    - After a CLOSED event, `count` resets and `load()` is called again (preload next) — a subsequent 3 calls show again.
  - [x] `app/event/[id].test.tsx` (VERIFY/UPDATE): existing tests must stay green — the default no-op context means no provider is needed. Optionally add a test wrapping the screen in `InterstitialContext.Provider value={spy}` asserting the spy fires once on mount.
  - [x] `app/index.test.tsx` (VERIFY): unaffected (feed mocks the SDK already for the banner). Confirm still green.

- [x] Task 7 — Validation gates
  - [x] `npx tsc --noEmit` → 0 errors.
  - [x] `npm test` → all suites green (current baseline: 16 suites / 95 tests + the new interstitial + layout suites).
  - [x] `npx expo lint` → 0 errors (1 pre-existing EmptyState warning is acceptable).
  - [x] `npx expo export --platform web` → bundles clean (web stub resolves the new `InterstitialAd`/`AdEventType` named imports).

## Dev Notes

### AdMob boundary — read first (architecture, restated for this story)

Architecture §Architectural Boundaries: **"Interstitial logic lives exclusively in `app/_layout.tsx`"** and **"`react-native-google-mobile-ads` is imported only by `AdBanner`(Unit) + `_layout`."** This story keeps the SDK import in `app/_layout.tsx` only. The detail screen and the new `lib/interstitial.tsx` are **SDK-free** — the context just carries a `() => void` callback. This is the centralisation the boundary intends: screens/components never touch interstitial/SDK code. (Story 5.1 dev notes reaffirmed this twice — do not add a third SDK import site.)

> **Design decision (testability vs. boundary):** the SDK wiring (instance, listeners, `show()`/`load()`) stays inline in `_layout.tsx` to honour the literal boundary rule; the *plumbing* (context, hook, trigger constant, pure `shouldShowInterstitial`) is extracted to the SDK-free `lib/interstitial.tsx` so the cadence logic is unit-testable and the detail screen stays clean. An alternative (a dedicated `hooks/useInterstitialAd.ts` importing the SDK, used only by `_layout`) would unit-test more cleanly but adds a third SDK import site — rejected to keep the boundary intact. See the open question at the end of this file.

### Files being modified — current state (READ before editing)

- **`app/_layout.tsx`** (Story 1.4): root layout. Already: imports `MobileAds from '@/lib/mobileAds'` and calls `MobileAds().initialize().catch(() => {})` in a mount effect; gates render on fonts (`if (!fontsLoaded && !fontError) return null`); provider order `SafeAreaProvider → QueryClientProvider → <Stack>`. **Preserve all of this.** Add the interstitial controller + `InterstitialContext.Provider` around `<Stack>`. Keep `MobileAds().initialize()` — the interstitial relies on it; do not duplicate init.
- **`app/event/[id].tsx`** (Story 3.3): detail screen. Hooks at top (`useEventDetail`, `useRouter`, `useSafeAreaInsets`, `useQueryClient`, `useState`×, plus an adjust-state-during-render block), then `if (isLoading)` / `if (isError)` early returns. Add `useRecordDetailView()` + the mount effect **above** the early returns (rules-of-hooks). It must NOT import the SDK. This screen owns navigation (`router.back()`); leave that untouched.
- **`app.config.ts`**: `extra` already has `admobBannerUnitId: process.env.ADMOB_BANNER_UNIT_ID ?? ''` with a Story-5.5 comment. Add the interstitial sibling the same way. Plugin block keeps Google **test** App IDs (Story 5.5 swaps to real).
- **`lib/__stubs__/mobile-ads.js`**: web stub. Already exports `default` (MobileAds), `BannerAd`, `BannerAdSize`, `TestIds: { BANNER }`. Add `InterstitialAd`, `AdEventType`, and `TestIds.INTERSTITIAL`. Resolution is wired via `metro.config.js` for `expo export --platform web` — no metro change needed.
- **`lib/mobileAds.ts`**: just `export { default } from 'react-native-google-mobile-ads'` (the init re-export). Leave as-is — the interstitial imports the SDK's **named** exports directly in `_layout.tsx`; do not route named exports through `lib/mobileAds.ts`.

### InterstitialAd API (react-native-google-mobile-ads 16.3.1)

```ts
import { InterstitialAd, AdEventType, TestIds } from 'react-native-google-mobile-ads';

const ad = InterstitialAd.createForAdRequest(unitId, { requestNonPersonalizedAdsOnly: true });
const unsubLoaded = ad.addAdEventListener(AdEventType.LOADED, () => { /* loaded = true */ });
const unsubClosed = ad.addAdEventListener(AdEventType.CLOSED, () => { /* reset + ad.load() */ });
const unsubError  = ad.addAdEventListener(AdEventType.ERROR,  () => { /* loaded = false, silent */ });
ad.load();   // preload
// later, only if loaded:
ad.show();
// cleanup: call unsubLoaded(); unsubClosed(); unsubError();
```

- `createForAdRequest` returns a **reusable instance**, but each loaded ad is **single-use** — after `show()` → `CLOSED`, you must `load()` again before the next `show()` (handled in the `CLOSED` listener → AC #3).
- `addAdEventListener` returns an **unsubscribe function** — collect all three and return them from the effect cleanup to avoid leaks/double-registration on re-render.
- **Never** `show()` without a preceding `LOADED` (it throws / no-ops). The `loaded` ref guards this (AC #5).
- Dismissibility (AC #4): AdMob renders its own close button for interstitials — do not pass any option that suppresses it. No audio option is set, so there is no autoplay-audio override (FR-10).

### Counter / cadence semantics (AC #2, #3, #5)

- "Session" = app process lifetime. The counter is an in-memory ref → naturally resets on cold start; no persistence needed.
- On the trigger view (count hits 3): reset to 0 **whether or not** the ad showed. If loaded → `show()`; if not → `load()` (re-attempt for the next cycle) and skip. This keeps cadence ~every-3 and avoids attempting `show()` on views 4/5/6 / back-to-back ads.
- Use **refs**, not `useState`, for `loaded`/`count`: they gate imperative SDK calls and must not trigger re-renders of the layout.

### OQ-5 (interstitial policy) — scope boundary

OQ-5 is only *partially* resolved (readiness report 2026-05-27): v1 uses the fixed "every 3rd detail view" rule from this story's AC; **no A/B test mechanism in v1**. The architecture also floats a "minimum once per 10 minutes" cap and "request on app foreground" — **both are OUT OF SCOPE here** (the epics AC, which is authoritative, specifies only the 3rd-view trigger). Do not implement a time cap or `AppState` foreground handling. If you want to log them, add to `deferred-work.md` tagged OQ-5 / post-launch tuning. (Precedent: Story 5.1 resolved a similar architecture-vs-epics variance in favour of the epics AC.)

### Privacy / consent (forward note, not this story)

`requestNonPersonalizedAdsOnly: true` is a conservative default until Story 5.4 adds the POPIA privacy work and (if chosen) a UMP consent flow. Do not build consent UI here.

### Naming / convention notes

- `lib/interstitial.tsx` — named exports only (project rule); `.tsx` because it uses JSX context types/Provider. No barrel re-export.
- `INTERSTITIAL_TRIGGER_COUNT` — SCREAMING_SNAKE_CASE true constant, consistent with `AD_INTERVAL` in `app/index.tsx`. [docs/project-context.md#Language-Specific Rules]
- Null-not-undefined and `className`-only styling rules don't materially apply here (no new UI), but keep any incidental code compliant.

### Testing patterns (this repo)

- Preset `jest-expo`; `functions/` excluded; tests co-located. Use `@testing-library/react-native` + `act` for driving the captured SDK callbacks.
- **Mock the native SDK at module level** in `app/_layout.test.tsx` — the same approach `app/index.test.tsx` uses for the banner (mock `react-native-google-mobile-ads`, not the component). Provide a fake `InterstitialAd.createForAdRequest` that captures the event callbacks into a map keyed by `AdEventType.*` so the test can invoke LOADED/CLOSED/ERROR; `load`/`show` are `jest.fn()`.
- `RootLayout` returns `null` until fonts resolve → mock `@expo-google-fonts/inter` so `useFonts` returns `[true, null]`. Also mock `expo-splash-screen` (`preventAutoHideAsync`/`hideAsync` → no-op) and stub the `@/lib/firebase` side-effect import to avoid native Firestore. Mock `expo-constants` for the prod-path unit ID if asserting it.
- Beware NativeWind's jest.mock-factory restriction (Story 5.1 hit `_ReactNativeCSSInterop` "out-of-scope variable"): if a mock factory needs RN primitives, `require('react-native')` **inside** the factory rather than referencing an out-of-scope import.
- Existing `app/event/[id].test.tsx` already mocks `expo-router`, `expo-status-bar`, `react-native-safe-area-context`, `@/components/WebViewModal`, `@tanstack/react-query`, and `@/hooks/useEventDetail`. The new `useRecordDetailView()` resolves to the default no-op context with no provider → tests stay green. Only add a provider wrapper if you want to assert the call.

### Project-wide rules that apply

- AdMob SDK imported only in `_layout.tsx` (interstitial) + `AdBannerUnit.tsx` (banner). [architecture §Architectural Boundaries]
- Ad load/show failures are **silent** — no UI, no logging, no throw. [docs/project-context.md#Error Handling]
- `router.*` only in screen files; the detail screen keeps its navigation. [docs/project-context.md#Expo Router]
- No new dependencies — `react-native-google-mobile-ads` (Story 1.4) and `expo-constants` (Expo SDK) are already present. If `expo-constants` is somehow missing, HALT and confirm before adding.
- Named exports everywhere except `app/*.tsx` screen default exports. [docs/project-context.md#Exports]

### Project Structure Notes

- NEW: `lib/interstitial.tsx`, `lib/interstitial.test.tsx`, `app/_layout.test.tsx`
- MODIFY: `app/_layout.tsx` (interstitial controller + Provider), `app/event/[id].tsx` (record view on mount), `app.config.ts` (`extra.admobInterstitialUnitId`), `lib/__stubs__/mobile-ads.js` (InterstitialAd/AdEventType/TestIds.INTERSTITIAL)
- VERIFY: `app/event/[id].test.tsx`, `app/index.test.tsx` remain green
- Architecture names the banner component `AdBanner` but the SDK boundary list ("AdBanner + _layout only") still governs — `_layout.tsx` is the correct, unambiguous interstitial home.

### References

- [Source: _bmad-output/planning-artifacts/epics.md#Story 5.2] — AC source (preload, 3rd-view trigger, reset+preload, dismissible, no autoplay audio, silent skip)
- [Source: _bmad-output/planning-artifacts/architecture.md#Architectural Boundaries] — "Interstitial logic lives exclusively in app/_layout.tsx"; "AdBanner + _layout only" SDK boundary
- [Source: _bmad-output/planning-artifacts/architecture.md#AdMob Patterns (line 437-439)] — "Interstitial: request on app foreground, show after 3rd detail view open; minimum once per 10 minutes (confirm OQ-5)" — only the 3rd-view trigger is in scope
- [Source: _bmad-output/planning-artifacts/implementation-readiness-report-2026-05-27.md#OQ-5] — partially resolved; "every 3rd detail view"; no A/B test in v1
- [Source: _bmad-output/implementation-artifacts/5-1-adbannerunit-component-feed-banner-integration.md] — SDK boundary reaffirmed; web-stub + NativeWind jest.mock-factory pitfalls; banner unit-ID config precedent
- [Source: app/_layout.tsx] — existing root layout (MobileAds init, provider order, font gate)
- [Source: app/event/[id].tsx] — detail screen to instrument
- [Source: app.config.ts] — `extra` block + `react-native-google-mobile-ads` plugin (test App IDs)
- [Source: lib/__stubs__/mobile-ads.js + metro.config.js] — web stub mechanism
- [Source: docs/project-context.md] — exports, naming, error-handling, NativeWind rules
- FR-10 (interstitials dismissible, async, no autoplay audio)

## Dev Agent Record

### Agent Model Used

claude-opus-4-8 (Opus 4.8)

### Debug Log References

One issue surfaced and was resolved during bring-up:

1. **`app/_layout.test.tsx` broke `expo export --platform web`.** Files named `_layout*` in the Expo Router root are eagerly loaded as **layout wrappers** during server-manifest generation (unlike `index.test.tsx` / `[id].test.tsx`, which are tolerated as leaf routes). At manifest-build time jest mocks don't exist, so the real `react-native-google-mobile-ads` ran and threw. **Fix:** renamed the test to `app/root-layout.test.tsx` (no `_layout` prefix) — it is now ignored/handled like the other co-located test files and the web export passes. The subject import stays `from './_layout'`.

### Completion Notes List

- **`lib/interstitial.ts` (NEW)** — SDK-free plumbing: `INTERSTITIAL_TRIGGER_COUNT = 3`, pure `shouldShowInterstitial(count)`, `InterstitialContext` (default no-op callback), `useRecordDetailView()` hook. No AdMob import, so it is safe to import from screens. **Deviation:** created as `.ts`, not the `.tsx` named in the story — the module contains no JSX (the Provider is used in `_layout.tsx`, the consumer hook just calls `useContext`), so `.ts` is correct. The test remains `lib/interstitial.test.tsx` (it renders JSX).
- **`app/_layout.tsx` (MODIFIED)** — interstitial controller added, honouring the AdMob boundary (SDK imported only here + `AdBannerUnit.tsx`). Instance created once via `useRef`; `loaded`/`detailViewCount` tracked in refs (no re-renders). Mount effect registers LOADED/CLOSED/ERROR listeners (collecting unsubscribes for cleanup) and preloads on app start. `recordDetailView` (stable `useCallback`) increments the counter; on the 3rd view it resets and `show()`s if loaded, else `load()`s (silent skip — user never blocked). CLOSED resets + preloads next; ERROR is silent. `show()` is `.catch(() => {})`'d. Provider added as `SafeAreaProvider → QueryClientProvider → InterstitialContext.Provider → Stack` (mandated order preserved). Existing `MobileAds().initialize()` untouched.
- **`app/event/[id].tsx` (MODIFIED)** — calls `useRecordDetailView()` and fires it once on mount via `useEffect` (above the early returns, rules-of-hooks safe). No SDK import — boundary intact.
- **`app.config.ts` (MODIFIED)** — added `extra.admobInterstitialUnitId` (env-driven placeholder; real value is a Story 5.5 item, mirroring the banner unit ID). Plugin block still ships Google **test** App IDs.
- **`lib/__stubs__/mobile-ads.js` (MODIFIED)** — added inert `InterstitialAd`/`AdEventType` and `TestIds.INTERSTITIAL` so the web bundle resolves the new named imports.
- **Decisions confirmed by Voice before dev:** (1) inline SDK logic in `_layout.tsx` (no 3rd import site); (2) conservative skip cadence — reset + re-load on a not-ready trigger, no back-to-back ads; (3) OQ-5 time-cap / foreground handling deferred to post-launch.
- **Gates:** `tsc --noEmit` 0 errors; `npm test` 18 suites / 106 tests green (was 16/95 — +2 suites, +11 tests); `expo lint` 0 errors (1 pre-existing EmptyState warning); `expo export --platform web` bundles clean.
- ⚠️ **Release follow-ups (Story 5.5, not this story):** real AdMob **App IDs** (currently Google test IDs in `app.config.ts` plugin) and the real **interstitial unit ID** value in `extra.admobInterstitialUnitId`. On-device verification of the interstitial showing after the 3rd detail view (no device/simulator in this environment).
- Note: the jest run prints "A worker process has failed to exit gracefully" — a pre-existing jest-expo teardown nuisance (async handles in stubs), not a test failure; all suites pass.

### File List

- `lib/interstitial.ts` (NEW)
- `lib/interstitial.test.tsx` (NEW)
- `app/root-layout.test.tsx` (NEW — RootLayout interstitial flow tests)
- `app/_layout.tsx` (MODIFIED — interstitial controller + InterstitialContext.Provider)
- `app/event/[id].tsx` (MODIFIED — record detail view on mount)
- `app/event/[id].test.tsx` (MODIFIED — tests (i)/(j): provider-fires-once + no-provider-no-throw)
- `app.config.ts` (MODIFIED — extra.admobInterstitialUnitId)
- `lib/__stubs__/mobile-ads.js` (MODIFIED — InterstitialAd/AdEventType/TestIds.INTERSTITIAL)
- `_bmad-output/implementation-artifacts/sprint-status.yaml` (MODIFIED — status tracking)

## Change Log

| Date | Change |
|------|--------|
| 2026-06-26 | Story 5.2 created (ready-for-dev). Context engine analysis complete: comprehensive interstitial-integration guide — SDK-free context (`lib/interstitial.tsx`) + controller in `app/_layout.tsx`, 3rd-detail-view trigger, reset+preload-after-close, silent skip when not ready, AdMob boundary preserved, web stub + tests specified. |
| 2026-06-26 | Story 5.2 implemented. SDK-free `lib/interstitial.ts` (context + `useRecordDetailView` + trigger constant); interstitial controller in `app/_layout.tsx` (preload on start, show after 3rd detail view, reset+preload on close, silent skip when not ready, all failures silent); detail screen records views on mount; `app.config.ts` interstitial unit ID; web stub extended. Tests: `lib/interstitial.test.tsx` + `app/root-layout.test.tsx` (flow) + detail-screen tests (i)/(j). Renamed the layout test off the `_layout` prefix to fix `expo export` (router treats `_layout*` as a layout wrapper). All gates green (tsc 0, 106 tests, lint 0 errors, web export OK). Status → review. |

## Open Questions / Clarifications (for Voice — answer before or during dev)

1. **Boundary vs. testability:** Story keeps SDK interstitial logic inline in `app/_layout.tsx` (honours the "logic lives exclusively in _layout" rule) and tests it by rendering `RootLayout` with the SDK + fonts mocked. The alternative — a dedicated `hooks/useInterstitialAd.ts` (a 3rd SDK import site) — unit-tests more cleanly but breaks the literal boundary. Confirm you're happy with the inline approach, or approve the hook. (Recommended: inline, as written.)
2. **Counter reset on silent skip:** When the ad isn't ready at the 3rd view, the story resets the counter to 0 and re-loads (next chance ~view 6), rather than retrying `show()` on view 4. Confirm this conservative cadence is what you want (fewer ads, never back-to-back).
3. **Time cap / foreground (OQ-5):** Architecture floats "min once per 10 min" + "request on app foreground" — left OUT of v1 per the epics AC. OK to defer to post-launch OQ-5 tuning?

## Review Findings (Consolidated Epic 5 review — 2026-06-27)

- [x] [Review][Patch] `interstitial.show()` rejection strands `loadedRef = true` with no reload — after a failed `show()` no `CLOSED` fires, so every later 3rd view re-`show()`s the same stale ad and interstitials never recover for the session. Fix: in the `.catch`, set `loadedRef.current = false` and call `interstitial.load()` [app/_layout.tsx:108-112] — FIXED
- [x] [Review][Patch] Banner requests **personalized** ads while the interstitial sets `requestNonPersonalizedAdsOnly: true` — inconsistent with the disclosure-only POPIA posture + `NSPrivacyTracking: false`. Add `requestOptions={{ requestNonPersonalizedAdsOnly: true }}` to `<BannerAd>` [components/AdBannerUnit.tsx:44-52] — FIXED
- [x] [Review][Patch] `lib/mobileAds.ts` is now orphaned (no importers — `_layout.tsx` imports the SDK directly) — dead code + a stray third AdMob-SDK import site weakening the two-file boundary. Delete the file [lib/mobileAds.ts] — FIXED (file deleted)
- [x] [Review][Defer] Banner `onAdLoaded` may setState/log after its FlatList slot unmounts + re-logs `ad_view` on every AdMob refresh (double-count) [components/AdBannerUnit.tsx:47-50] — deferred, ties to known row-recycling deferral
- [x] [Review][Defer] Interstitial detail-view counter increments on loading/error detail views (fires before early returns) [app/event/[id].tsx:32-34] — deferred, minor metric/UX
| 2026-06-28 | Consolidated Epic-5 code review: applied 3 patches — interstitial show()-rejection recovery (reset+reload), banner requestNonPersonalizedAdsOnly, deleted orphaned lib/mobileAds.ts. Status → done. |
