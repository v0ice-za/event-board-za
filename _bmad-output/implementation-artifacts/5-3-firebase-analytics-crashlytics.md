# Story 5.3: Firebase Analytics + Crashlytics

Status: done

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As a developer,
I want Firebase Analytics event tracking and Crashlytics crash reporting enabled,
so that I can understand user behaviour and be alerted to crashes in production.

## Acceptance Criteria

1. **Packages installed & linked (AR-8).** `@react-native-firebase/analytics` and `@react-native-firebase/crashlytics` are added at the **same major as the existing Firebase SDKs** (`^24.0.0`, matching `@react-native-firebase/app` + `/firestore`). No native config files are hand-edited beyond what the libraries require (Crashlytics needs the build-tooling that `@react-native-firebase/app`'s config plugin already wires via `expo prebuild`). [epics §Story 5.3; architecture §Monitoring]
2. **Typed analytics wrapper module `lib/analytics.ts` (NEW).** Named exports only. Exposes exactly these typed wrappers, each a thin, never-throwing call into the modular Analytics API:
   - `logScreenView(screenName: string)`
   - `logCategoryFilter(category: Category)`
   - `logTicketLinkTapped(eventId: string)`
   - `logAdImpression(adType: 'banner' | 'interstitial')`
   Plus an `initInstrumentation()` (or equivalently named) function that enables/disables collection (see AC #6). [epics §Story 5.3]
3. **`logScreenView` is called on mount** in `app/index.tsx` (feed → `'Feed'`) and `app/event/[id].tsx` (detail → `'EventDetail'`). The call sits **above** each screen's early returns so it is rules-of-hooks safe (the feed has a cold-load early return; the detail screen has loading/error early returns). [epics §Story 5.3]
4. **`logCategoryFilter` is called when a category chip is tapped** — wired into the feed's `handleSelect` in `app/index.tsx` (the single funnel for All + the 8 category chips). It logs the **tapped** category; on a toggle-off-to-All tap, log the category the user tapped (not `null`), or skip the log on toggle-off — see Dev Notes for the chosen rule. [epics §Story 5.3]
5. **`logTicketLinkTapped` is called when the Tickets CTA is tapped** — wired into the "Get tickets" `Pressable.onPress` in `app/event/[id].tsx`, passing `event.id`. [epics §Story 5.3]
6. **Collection gated on `__DEV__`.** Both Analytics and Crashlytics collection are **disabled when `__DEV__` is true** and **enabled in production**, set once at app start from `app/_layout.tsx` (alongside the existing `MobileAds().initialize()` effect) via `setAnalyticsCollectionEnabled(!__DEV__)` and `setCrashlyticsCollectionEnabled(!__DEV__)`. Local dev sessions never pollute production data. [epics §Story 5.3]
7. **Crashlytics reports crashes.** With collection enabled (production), unhandled JS errors and native crashes are reported to the Firebase console. This is the library's default behaviour once collection is on — no custom global error handler is required for v1. The wrapper module does **not** swallow or intercept unhandled errors. [epics §Story 5.3; AR-8]
8. **No regressions; web + tests green.** Web export (`expo export --platform web`) still resolves — the two new native packages are stubbed for web (Metro) **and** mapped for Jest so existing screen tests that now call `logScreenView` on mount stay green. `tsc --noEmit` 0 errors; `expo lint` 0 errors (the 1 pre-existing EmptyState warning is acceptable); full Jest suite green. New unit tests cover the wrapper and the three call sites. [project rules; precedent: Story 5.2]

## Tasks / Subtasks

- [x] **Task 1 — Install the two Firebase modules (AC: #1)**
  - [x] `npx expo install @react-native-firebase/analytics @react-native-firebase/crashlytics` — this resolves Expo-SDK-56-compatible versions and should land on `^24.x` to match `app`/`firestore`. If it resolves to a different major than 24, **HALT and confirm** before proceeding (mismatched majors break the modular types — see project-context).
  - [x] Confirm `package.json` + `package-lock.json` updated. Do **not** run `expo prebuild` here (no native dirs are checked in for this story's scope — EAS/dev-client builds run prebuild). Native verification of crash reporting is a Story 5.5 / on-device item.

- [x] **Task 2 — Create `lib/analytics.ts` (NEW) (AC: #2)**
  - [x] Named exports only (project rule). Import the **modular** API (v24): `import { getAnalytics, logEvent, logScreenView as fbLogScreenView, setAnalyticsCollectionEnabled } from '@react-native-firebase/analytics';` and `import { getCrashlytics, setCrashlyticsCollectionEnabled } from '@react-native-firebase/crashlytics';`. Import `Category` from `@/types`.
  - [x] `export function logScreenView(screenName: string)` → `fbLogScreenView(getAnalytics(), { screen_name: screenName, screen_class: screenName })`.
  - [x] `export function logCategoryFilter(category: Category)` → `logEvent(getAnalytics(), 'category_filter', { category })`.
  - [x] `export function logTicketLinkTapped(eventId: string)` → `logEvent(getAnalytics(), 'ticket_link_tapped', { event_id: eventId })`.
  - [x] `export function logAdImpression(adType: 'banner' | 'interstitial')` → `logEvent(getAnalytics(), 'ad_view', { ad_type: adType })`. **Do NOT name the event `ad_impression`** — that is a GA4-reserved event name and `logEvent` will reject it. Use `ad_view` (see Dev Notes). Define `type AdType = 'banner' | 'interstitial'` and export it if convenient.
  - [x] `export function initInstrumentation()` → `setAnalyticsCollectionEnabled(getAnalytics(), !__DEV__); setCrashlyticsCollectionEnabled(getCrashlytics(), !__DEV__);`.
  - [x] **Never throw:** these are fire-and-forget. The modular `logEvent`/`logScreenView` return Promises — do not `await`; either ignore the returned promise or attach `.catch(() => {})`. An analytics failure must never break a screen or a tap. (Consistent with the project's silent-failure posture for non-critical SDK calls.)
  - [x] TypeScript `strict` — no `any`. Param objects are inferred; that is fine.

- [x] **Task 3 — Enable/disable collection at app start (AC: #6, #7)**
  - [x] In `app/_layout.tsx`, import `initInstrumentation` from `@/lib/analytics`.
  - [x] Call it once from a mount `useEffect` (add a new effect, or extend the existing `MobileAds().initialize()` effect — keep them readable). It must run regardless of the font gate (the existing init effect already runs before the `if (!fontsLoaded …) return null` because effects are above the guard — keep the new call in the same position).
  - [x] Do **not** add a custom global JS error handler — library defaults satisfy AC #7. Do not touch the interstitial controller, provider order, or `MobileAds().initialize()`.

- [x] **Task 4 — Instrument the feed screen `app/index.tsx` (AC: #3, #4)**
  - [x] Add `import { logScreenView, logCategoryFilter } from '@/lib/analytics';`.
  - [x] `useEffect(() => { logScreenView('Feed'); }, []);` placed **above** the `if (isLoading && activeCategory === null) return …` early return (rules-of-hooks — match where the existing AppState effects live).
  - [x] In `handleSelect`, call `logCategoryFilter(category)` when `category !== null` (a real category was tapped). See Dev Notes for the toggle-off decision — default: log only non-null taps; do not log the "All"/toggle-off reset. Keep the existing `setActiveCategory` toggle logic exactly as-is.

- [x] **Task 5 — Instrument the detail screen `app/event/[id].tsx` (AC: #3, #5)**
  - [x] Add `import { logScreenView, logTicketLinkTapped } from '@/lib/analytics';`.
  - [x] `useEffect(() => { logScreenView('EventDetail'); }, []);` placed **above** the `if (isLoading)` / `if (isError || !event)` early returns, alongside the existing `recordDetailView` effect.
  - [x] In the "Get tickets" `Pressable.onPress`, call `logTicketLinkTapped(event.id)` **before** `setShowTickets(true)`. (At that point `event` is non-null — it's inside the loaded branch.)

- [x] **Task 6 — Wire `logAdImpression` on the success paths only (AC: #2; see decision)**
  - [x] **Banner:** in `components/AdBannerUnit.tsx`, call `logAdImpression('banner')` inside the existing `onAdLoaded` handler (the success path), e.g. `onAdLoaded={() => { setLoaded(true); logAdImpression('banner'); }}`. Leave `onAdFailedToLoad` **silent** (no log) — the failure-silence rule (architecture line 424; project error-handling rule) applies to *failures*, not impressions.
  - [x] **Interstitial:** in `app/_layout.tsx`, call `logAdImpression('interstitial')` from the existing `AdEventType.LOADED` listener (success), not from `ERROR`. Keep `ERROR`/skip paths silent.
  - [x] Adding `@/lib/analytics` to these two files is allowed — the AdMob **SDK** boundary ("only `AdBannerUnit` + `_layout` import `react-native-google-mobile-ads`") is unaffected; analytics is a separate, unrestricted module. Add a one-line comment noting analytics is logged on the success path only.

- [x] **Task 7 — Web stub + Jest mapping for the two new packages (AC: #8)**
  - [x] Create `lib/__stubs__/firebase-analytics.js` exporting inert no-ops: `getAnalytics: () => ({}), logEvent: () => Promise.resolve(), logScreenView: () => Promise.resolve(), setAnalyticsCollectionEnabled: () => Promise.resolve()` (CommonJS `module.exports`, mirroring `firebase-app.js`/`mobile-ads.js`).
  - [x] Create `lib/__stubs__/firebase-crashlytics.js` exporting `getCrashlytics: () => ({}), setCrashlyticsCollectionEnabled: () => Promise.resolve(), recordError: () => {}, log: () => {}`.
  - [x] **Metro (web):** in `metro.config.js`, add both packages to the `nativeOnlyStubs` map pointing at the two new stub files (same mechanism as the existing three entries).
  - [x] **Jest:** add a `moduleNameMapper` in `jest.config.js` mapping `^@react-native-firebase/analytics$` and `^@react-native-firebase/crashlytics$` to the two stub files. This is required because feed + detail screens now call `logScreenView` on mount, so their existing tests would otherwise load the native modules. (The Firestore stub is web-only because tests mock the hooks; here the wrapper is imported transitively, so Jest needs the mapping.)

- [x] **Task 8 — Tests (AC: #2, #3, #4, #5, #8)**
  - [x] `lib/analytics.test.ts` (NEW): `jest.mock('@react-native-firebase/analytics')` + `jest.mock('@react-native-firebase/crashlytics')` with `jest.fn()`s (or rely on the stub via moduleNameMapper and spy on it). Assert: `logScreenView('Feed')` calls the underlying `logScreenView` with `{ screen_name: 'Feed', screen_class: 'Feed' }`; `logCategoryFilter('Music')` → `logEvent(_, 'category_filter', { category: 'Music' })`; `logTicketLinkTapped('e1')` → `logEvent(_, 'ticket_link_tapped', { event_id: 'e1' })`; `logAdImpression('banner')` → `logEvent(_, 'ad_view', { ad_type: 'banner' })`; `initInstrumentation()` calls both `setAnalyticsCollectionEnabled`/`setCrashlyticsCollectionEnabled` with `!__DEV__`. Assert none throw.
  - [x] `app/index.test.tsx` (UPDATE): mock `@/lib/analytics` (`jest.mock('@/lib/analytics')`); assert `logScreenView` fired once with `'Feed'` on mount; simulate a category-chip select and assert `logCategoryFilter` fired with that category; assert a toggle-off does not log (or logs per the chosen rule). Keep all existing assertions green.
  - [x] `app/event/[id].test.tsx` (UPDATE): mock `@/lib/analytics`; assert `logScreenView('EventDetail')` on mount; simulate the "Get tickets" press and assert `logTicketLinkTapped(event.id)`. Keep existing tests (incl. Story 5.2's interstitial provider tests) green.
  - [x] `components/AdBannerUnit.test.tsx` (UPDATE): mock `@/lib/analytics`; drive `onAdLoaded` and assert `logAdImpression('banner')`; drive `onAdFailedToLoad` and assert `logAdImpression` is **not** called.
  - [x] `app/root-layout.test.tsx` (UPDATE, if present): assert `initInstrumentation` is invoked on mount; optionally assert the interstitial `LOADED` path calls `logAdImpression('interstitial')`. Reuse the existing SDK/font mocks; add `jest.mock('@/lib/analytics')`.

- [x] **Task 9 — Validation gates (AC: #8)**
  - [x] `npx tsc --noEmit` → 0 errors.
  - [x] `npm test` → all suites green (current baseline before this story: 18 suites / 106 tests; expect +1 wrapper suite plus the updated screen suites).
  - [x] `npx expo lint` → 0 errors (1 pre-existing EmptyState warning acceptable).
  - [x] `npx expo export --platform web` → bundles clean (web stubs resolve the new analytics/crashlytics named imports).

## Dev Notes

### Files being modified — current state (READ before editing)

- **`lib/analytics.ts`** — NEW. The single typed funnel for all analytics. Nothing imports it yet.
- **`app/_layout.tsx`** (Stories 1.4 + 5.2): root layout. Already imports the AdMob SDK (interstitial), `MobileAds from 'react-native-google-mobile-ads'` runs `MobileAds().initialize().catch(() => {})` in a mount effect, gates render on fonts, and provides `SafeAreaProvider → QueryClientProvider → InterstitialContext.Provider → Stack`. **Preserve all of this.** Add only: `initInstrumentation()` call (mount effect) and `logAdImpression('interstitial')` inside the existing `AdEventType.LOADED` listener.
- **`app/index.tsx`** (Story 2.6): feed. Has a **cold-load early return** (`if (isLoading && activeCategory === null) return …`) before the main return — the `logScreenView('Feed')` effect must sit with the other top-level hooks/effects, above that return. `handleSelect` is the single category-tap funnel; add `logCategoryFilter` there. Leave the AppState foreground-refresh effects and `AD_INTERVAL` logic untouched.
- **`app/event/[id].tsx`** (Stories 3.3 + 5.2): detail. Hooks at top including the Story-5.2 `recordDetailView` mount effect, then `if (isLoading)` / `if (isError || !event)` early returns. Add the `logScreenView('EventDetail')` effect next to `recordDetailView`. The "Get tickets" `Pressable` (loaded branch) gets the `logTicketLinkTapped(event.id)` call in `onPress`. Do **not** touch navigation (`router.back()`).
- **`components/AdBannerUnit.tsx`** (Story 5.1): banner wrapper, imports the AdMob SDK (permitted). Add the `logAdImpression('banner')` call in `onAdLoaded` only. Keep `onAdFailedToLoad` silent.
- **`metro.config.js`** / **`jest.config.js`**: extend the existing `nativeOnlyStubs` map (Metro) and add `moduleNameMapper` (Jest) for the two new packages.
- **`lib/firebase.ts`**: side-effect `@react-native-firebase/app` import + `getFirestore()`. **Leave as-is** — analytics/crashlytics use the same auto-initialised default app; do not add init calls here.

### Reserved GA4 event names — do not use `ad_impression` (critical)

Firebase Analytics reserves a set of event names; `ad_impression` is one of them (it is an automatically-collected event). Calling `logEvent(_, 'ad_impression', …)` is rejected/ignored by the SDK. The wrapper is named `logAdImpression` (per the AC's function-name list) but it must emit a **non-reserved** event name — use **`ad_view`**. Likewise avoid other reserved names (`screen_view`, `session_start`, `app_open`, etc.); `logScreenView` correctly uses the dedicated screen-view API rather than `logEvent`, so it is fine. `category_filter`, `ticket_link_tapped`, `ad_view` are all safe custom names. Snake_case event + param names follow the GA4 convention.

### Modular v24 API shapes (react-native-firebase 24)

```ts
// analytics
import {
  getAnalytics, logEvent, logScreenView, setAnalyticsCollectionEnabled,
} from '@react-native-firebase/analytics';
const a = getAnalytics();
logScreenView(a, { screen_name: 'Feed', screen_class: 'Feed' });   // Promise
logEvent(a, 'category_filter', { category: 'Music' });             // Promise
setAnalyticsCollectionEnabled(a, false);                           // Promise

// crashlytics
import { getCrashlytics, setCrashlyticsCollectionEnabled } from '@react-native-firebase/crashlytics';
setCrashlyticsCollectionEnabled(getCrashlytics(), false);          // Promise
```

- v24 is the **modular** API the rest of the app already uses (`getFirestore()` in `lib/firebase.ts`). Do **not** use the deprecated namespaced `analytics().logEvent(...)` form — it triggers v24 deprecation warnings and is inconsistent with the codebase. [docs/project-context.md — "@react-native-firebase v24 changed TypeScript types from v23 — always use v24+ types"]
- All these calls return Promises; treat as fire-and-forget (don't `await`; ignore or `.catch(() => {})`).

### Crashlytics collection toggle — why runtime `setCrashlyticsCollectionEnabled` is enough

`setCrashlyticsCollectionEnabled(getCrashlytics(), !__DEV__)` at app start satisfies AC #6/#7 for v1: in dev nothing is collected; in production native crashes + unhandled JS errors are auto-reported. You do **not** need to add `crashlytics_auto_collection_enabled: false` to a `firebase.json` for this story — the runtime call governs collection. If a future story wants collection **off until consent** (POPIA, Story 5.4), that's where the `firebase.json` opt-out default belongs. Note this linkage but do not implement consent here.

### Category-filter toggle-off decision (AC #4)

`handleSelect` both *selects* a category and *toggles it off* (tapping the active chip resets to All). Default rule for this story: **log only real category selections** — call `logCategoryFilter(category)` when `category !== null`. Do not emit an event for the toggle-off / "All" reset (it isn't a category, and `logCategoryFilter` is typed `Category`, not `Category | null`). This keeps the funnel clean (which categories users browse) without a synthetic "all" value. If Voice later wants "All" tracked, add a separate event — out of scope here.

### `logAdImpression` wiring — scope decision

The AC lists `logAdImpression(adType)` among the exported wrappers but (unlike the other three) does **not** explicitly mandate a call site. Decision for this story: **wire it on the success paths** — banner `onAdLoaded` and interstitial `AdEventType.LOADED` — because (a) it gives a basic ad-funnel signal for free, (b) it's a success event, so it doesn't conflict with the "ad **failures** are silent / no logging" rule, and (c) both call sites already exist. If Voice prefers to ship the wrapper unwired in v1, dropping Task 6 is a clean no-op (the wrapper + its unit test stay). Flagged in Open Questions.

### Testing patterns (this repo)

- Preset `jest-expo`; `functions/` excluded; tests co-located. `@testing-library/react-native` + `act`.
- For screen/component tests, **`jest.mock('@/lib/analytics')`** is the simplest isolation — assert the wrapper functions fire with the right args without touching the native SDK. The `moduleNameMapper` from Task 7 is the safety net for any test that imports a screen without mocking the wrapper (it resolves the stub instead of the native module).
- For `lib/analytics.test.ts`, mock the two `@react-native-firebase/*` packages directly (jest.fn()s) and assert the wrappers forward the correct event names/params — this is the test that pins the `ad_view` (not `ad_impression`) name and the `!__DEV__` collection toggle.
- Beware NativeWind's jest.mock-factory restriction seen in Stories 5.1/5.2 (`_ReactNativeCSSInterop` out-of-scope): if a mock factory needs RN primitives, `require('react-native')` **inside** the factory.
- The "A worker process has failed to exit gracefully" message is a known jest-expo teardown nuisance, not a failure (noted in Story 5.2).

### Project-wide rules that apply

- Named exports everywhere except `app/*.tsx` screen defaults. [docs/project-context.md#Exports]
- Modular Firebase v24 API only; no namespaced calls. [docs/project-context.md#Technology Stack]
- Ad **failures** are silent — no UI, no log, no throw. Impression (success) logging is separate and permitted. [docs/project-context.md#Error Handling; architecture line 424]
- AdMob **SDK** import boundary unchanged (`AdBannerUnit` + `_layout` only). Analytics is not part of that boundary. [architecture §Architectural Boundaries]
- `router.*` only in screen files. [docs/project-context.md#Expo Router]
- Absent optional fields are `null` not `undefined` (not directly relevant here — no new data model). [docs/project-context.md#Null vs Undefined]

### Project Structure Notes

- NEW: `lib/analytics.ts`, `lib/analytics.test.ts`, `lib/__stubs__/firebase-analytics.js`, `lib/__stubs__/firebase-crashlytics.js`
- MODIFY: `app/_layout.tsx` (initInstrumentation + interstitial impression log), `app/index.tsx` (screen view + category filter log), `app/event/[id].tsx` (screen view + ticket-tap log), `components/AdBannerUnit.tsx` (banner impression log), `metro.config.js` (web stubs), `jest.config.js` (moduleNameMapper), `package.json` + `package-lock.json` (two deps)
- UPDATE tests: `app/index.test.tsx`, `app/event/[id].test.tsx`, `components/AdBannerUnit.test.tsx`, `app/root-layout.test.tsx` (if present)
- VERIFY green: all other suites

### References

- [Source: _bmad-output/planning-artifacts/epics.md#Story 5.3] — AC source (packages, wrapper functions + call sites, Crashlytics, `__DEV__` gating)
- [Source: _bmad-output/planning-artifacts/architecture.md#Monitoring (lines 122, 218-220, 236)] — Firebase Crashlytics + Analytics via react-native-firebase, both free, replaces Sentry
- [Source: _bmad-output/planning-artifacts/architecture.md (line 255)] — implementation sequence item 11: "Firebase Crashlytics + Analytics wiring"
- [Source: _bmad-output/planning-artifacts/architecture.md (line 424)] — "Ad load failure: silent — no Crashlytics log" (applies to failures)
- [Source: _bmad-output/implementation-artifacts/5-2-interstitial-ad-integration.md] — `_layout.tsx` current state, web-stub + Jest-mapping precedent, NativeWind jest-factory pitfall, gate baseline (18 suites/106 tests)
- [Source: _bmad-output/implementation-artifacts/5-1-adbannerunit-component-feed-banner-integration.md] — AdBannerUnit success/failure handlers, SDK boundary
- [Source: app/_layout.tsx] — init effects, provider order, interstitial LOADED listener
- [Source: app/index.tsx] — cold-load early return, `handleSelect` funnel
- [Source: app/event/[id].tsx] — early returns, `recordDetailView` effect, Get-tickets Pressable
- [Source: components/AdBannerUnit.tsx] — `onAdLoaded` / `onAdFailedToLoad`
- [Source: metro.config.js + lib/__stubs__/*] — web-stub mechanism
- [Source: jest.config.js] — jest-expo preset, ignore patterns
- [Source: docs/project-context.md] — exports, modular-v24, error-handling, AdMob boundary rules
- AR-8 (Crashlytics + Analytics integrated via react-native-firebase); NFR (free monitoring)

## Dev Agent Record

### Agent Model Used

claude-opus-4-8 (Opus 4.8)

### Debug Log References

1. **Dependency resolution — pinned to `24.0.0`, not `expo install` latest.** `npx expo install @react-native-firebase/analytics @react-native-firebase/crashlytics` resolved to `25.1.0`, which peers `@react-native-firebase/app@25` — but the project is on `app`/`firestore@24.0.0` (firestore peers `app@24.0.0` **exactly**). Installing `25.x` or even `24.1.1` failed `ERESOLVE`. Installed `@react-native-firebase/analytics@24.0.0` + `/crashlytics@24.0.0` explicitly to match the existing suite. This is the intended "stay on major 24" path (story Task 1), not the HALT-worthy "auto-resolved to a different major" case.
2. **v24 modular package layout.** The modular functions live in `dist/module/modular.js` (re-exported from the package main `dist/module/index.js`). Verified the exact named exports exist: `getAnalytics`, `logEvent`, `logScreenView`, `setAnalyticsCollectionEnabled` (analytics) and `getCrashlytics`, `setCrashlyticsCollectionEnabled` (crashlytics). Note `getCrashlytics()` takes **no** args; `setCrashlyticsCollectionEnabled(crashlytics, enabled)` takes the instance. `logScreenView` is internally flagged deprecated by the lib but is the API the AC names and works correctly — kept as specified.
3. **Toggle-off logging fix (test (m) caught it).** First pass guarded `logCategoryFilter` with `category !== null`, but `ChipsRow` emits the tapped category itself even on a toggle-off (tapping the active `Music` chip passes `'Music'`, not `null`). That double-logged. Corrected the guard to `category !== null && category !== activeCategory` so only a *new* selection logs — toggle-off back to All is silent, matching the story's decision.
4. Pre-existing jest-expo nuisances unchanged: "A worker process has failed to exit gracefully" teardown message and an "Icon update not wrapped in act()" console.error from `@expo/vector-icons` in the detail-screen suite — neither is a test failure (all 120 pass).

### Completion Notes List

- **`lib/analytics.ts` (NEW)** — single typed funnel for analytics. Named exports: `logScreenView`, `logCategoryFilter`, `logTicketLinkTapped`, `logAdImpression`, `initInstrumentation`, plus `AdType`. All wrappers are fire-and-forget via a `fireAndForget(promise)` helper that swallows rejections — an analytics failure can never break a screen or a tap. Uses the **modular v24** API throughout (no namespaced calls), consistent with `lib/firebase.ts`.
- **`ad_view`, not `ad_impression`** — `logAdImpression` emits `ad_view` because `ad_impression` is a GA4-reserved event name `logEvent` rejects. Pinned by a unit-test assertion.
- **Collection gating** — `initInstrumentation()` calls `setAnalyticsCollectionEnabled(_, !__DEV__)` + `setCrashlyticsCollectionEnabled(_, !__DEV__)`, invoked once from the existing `MobileAds().initialize()` mount effect in `app/_layout.tsx`. Dev sessions collect nothing; production enables both. Crashlytics' default behaviour (native + unhandled-JS reporting) satisfies AC #7 — no custom global error handler added.
- **Call sites** — `logScreenView('Feed')`/`logScreenView('EventDetail')` fire once on mount (effects above each screen's early returns, rules-of-hooks safe); `logCategoryFilter` on a new category selection only; `logTicketLinkTapped(event.id)` before opening the ticket webview; `logAdImpression('banner')` in the banner `onAdLoaded` and `logAdImpression('interstitial')` in the interstitial `LOADED` listener — **success paths only**, ad failures stay silent (architecture line 424).
- **AdMob SDK boundary intact** — `react-native-google-mobile-ads` is still imported only by `AdBannerUnit.tsx` + `app/_layout.tsx`. Adding `@/lib/analytics` to those two files does not touch that boundary (analytics is unrestricted).
- **Web + Jest stubs** — `lib/__stubs__/firebase-analytics.js` + `firebase-crashlytics.js` (inert no-ops). Wired into `metro.config.js` `nativeOnlyStubs` (web export) and `jest.config.js` `moduleNameMapper` (so screen tests that now call `logScreenView` on mount don't load native code).
- **Gates:** `tsc --noEmit` 0 errors · `npm test` **19 suites / 120 tests** green (was 18/106 — +1 suite, +14 tests) · `expo lint` 0 errors (1 pre-existing EmptyState warning) · `expo export --platform web` bundles clean.
- ⚠️ **Release / on-device follow-ups (not this story):** native verification that Crashlytics reports a real crash + Analytics events land in the Firebase console requires a dev-client/EAS build (no device in this environment) — fold into Story 5.5 device QA. Consent-gated collection (off until POPIA acceptance) is deferred to Story 5.4.

### File List

- `lib/analytics.ts` (NEW — typed analytics/crashlytics wrapper)
- `lib/analytics.test.ts` (NEW — wrapper unit tests)
- `lib/__stubs__/firebase-analytics.js` (NEW — web/Jest stub)
- `lib/__stubs__/firebase-crashlytics.js` (NEW — web/Jest stub)
- `app/_layout.tsx` (MODIFIED — initInstrumentation on mount + interstitial impression log on LOADED)
- `app/index.tsx` (MODIFIED — logScreenView('Feed') on mount + logCategoryFilter on new selection)
- `app/event/[id].tsx` (MODIFIED — logScreenView('EventDetail') on mount + logTicketLinkTapped on CTA)
- `components/AdBannerUnit.tsx` (MODIFIED — logAdImpression('banner') on onAdLoaded)
- `metro.config.js` (MODIFIED — web stubs for analytics/crashlytics)
- `jest.config.js` (MODIFIED — moduleNameMapper for analytics/crashlytics)
- `package.json` + `package-lock.json` (MODIFIED — added analytics + crashlytics @24.0.0)
- `app/index.test.tsx` (MODIFIED — tests (l) screen view, (m) category filter + toggle-off)
- `app/event/[id].test.tsx` (MODIFIED — tests (k) screen view, (l) ticket-tap)
- `components/AdBannerUnit.test.tsx` (MODIFIED — banner impression on success / silent on failure)
- `app/root-layout.test.tsx` (MODIFIED — tests (f) initInstrumentation, (g) interstitial impression)
- `_bmad-output/implementation-artifacts/sprint-status.yaml` (MODIFIED — status tracking)

## Change Log

| Date | Change |
|------|--------|
| 2026-06-27 | Story 5.3 created (ready-for-dev). Context engine analysis complete: typed `lib/analytics.ts` wrapper (screen view / category filter / ticket tap / ad view), `initInstrumentation` collection toggle gated on `__DEV__`, Crashlytics via library default reporting, success-path-only ad-impression logging, web stubs + Jest moduleNameMapper for the two new Firebase modules. Flagged the GA4 `ad_impression` reserved-name pitfall (use `ad_view`) and the category toggle-off / `logAdImpression`-wiring decisions. |
| 2026-06-27 | Story 5.3 implemented. Installed `@react-native-firebase/analytics`+`/crashlytics@24.0.0` (pinned to match the existing v24 suite — `expo install` latest 25.x conflicts). New `lib/analytics.ts` typed wrapper (fire-and-forget; modular v24 API); `initInstrumentation` gates both collections on `!__DEV__` from `_layout.tsx`; screen-view/category/ticket/ad-impression call sites wired; `ad_view` used instead of reserved `ad_impression`; toggle-off category taps excluded from logging; web + Jest stubs for the two native modules. All gates green (tsc 0, 120 tests/19 suites, lint 0 errors, web export clean). Status → review. |

## Open Questions / Clarifications (for Voice — answer before or during dev)

1. **`logAdImpression` wiring:** the AC exports the wrapper but doesn't name a call site. This story wires it on the **success** paths (banner `onAdLoaded`, interstitial `LOADED`) — cheap ad-funnel signal, no conflict with the silent-failure rule. OK, or ship the wrapper unwired in v1? (Recommended: wire on success, as written.)
2. **Category toggle-off:** logging only real category taps (not the "All"/toggle-off reset). Confirm you don't want an explicit "All" / clear-filter event in v1.
3. **Reserved event name:** the emitted ad event is `ad_view` (not `ad_impression`, which GA4 reserves). Fine, or do you want a different custom name (e.g. `ad_shown`)?
4. **Consent/POPIA linkage:** collection is gated only on `__DEV__` here; a consent-gated default (collection off until accepted) is deferred to Story 5.4. Confirm that's the right split.

## Review Findings (Consolidated Epic 5 review — 2026-06-27)

- [x] [Review][Decision→Patch] Interstitial `ad_view` is logged on `AdEventType.LOADED` (preload), not on display (`OPENED`) — over-counts impressions. **Resolved: switch to `OPENED`** (true display semantics; banner stays on load). [app/_layout.tsx:77-83] — FIXED (added OPENED listener; LOADED only sets `loadedRef`; root-layout test (g) updated)
- [x] [Review][Patch] Analytics wrappers only swallow **async** rejection — a **synchronous** throw from `getAnalytics()`/`logEvent()` escapes the `.catch` and can abort the caller (e.g. ticket-tap `onPress` never reaches `setShowTickets`), violating the "must never break a screen or a tap" contract. Fix: `fireAndForget` now takes a thunk and wraps it in `try/catch` [lib/analytics.ts:18-55] — FIXED
- [x] [Review][Patch] `@react-native-firebase/crashlytics` Expo **config plugin** missing from `app.config.ts` `plugins` — native crash reporting/symbolication (AC #7) at risk on a real build. Add `'@react-native-firebase/crashlytics'` to `plugins` [app.config.ts plugins array] — FIXED
| 2026-06-28 | Consolidated Epic-5 code review: applied 3 patches — interstitial impression now on OPENED (not LOADED), analytics fireAndForget made sync-throw safe (thunk+try/catch), added @react-native-firebase/crashlytics config plugin. root-layout test (g) updated. Status → done. |
