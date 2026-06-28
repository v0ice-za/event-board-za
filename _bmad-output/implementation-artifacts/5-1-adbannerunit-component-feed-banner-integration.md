# Story 5.1: AdBannerUnit Component + Feed Banner Integration

Status: review

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As a user,
I want ads in the feed to look intentional and not break the layout if they fail to load,
so that the app feels polished even when ads are present or absent.

## Acceptance Criteria

1. `AdBannerUnit` is exported from `components/AdBannerUnit.tsx` (named export), wrapping the AdMob `BannerAd` component from `react-native-google-mobile-ads`.
2. The component has a `#1C1814` (`bg-surface`) background and an "Ad" label (9px, `#8A7E70` / `text-secondary`, positioned top-right) to visually distinguish it from event cards (UX-DR9).
3. When the ad fails to load (`onAdFailedToLoad`), the component renders with **zero height** — no empty space, no spinner, no placeholder (UX-DR9). Before load resolves it also occupies zero height (no layout shift).
4. The feed `FlatList` in `app/index.tsx` replaces the placeholder ad slots (every 6th position, `AD_INTERVAL = 6`, seeded in Story 2.6) with live `AdBannerUnit` components (FR-9).
5. The AdMob **banner unit ID** is read from `app.config.ts` `extra` (not hardcoded); a Google **test** banner unit ID is used in development (`__DEV__`).
6. The banner loads asynchronously — it does not block feed rendering (FR-10). The feed renders fully whether or not any ad resolves.
7. No regressions: the existing `app/index.test.tsx` ad-slot test continues to pass (or is updated to assert the new behaviour), and `lib/__stubs__/mobile-ads.js` is extended so the web bundle (`expo export --platform web`) still resolves.

## Tasks / Subtasks

- [x] Task 1 — Add the banner unit ID to config (AC: #5)
  - [x] In `app.config.ts` `extra`, add `admobBannerUnitId: process.env.ADMOB_BANNER_UNIT_ID ?? ''` (production value wired in Story 5.5 release prep; placeholder for now)
  - [x] Do NOT add the unit ID to the `react-native-google-mobile-ads` plugin block — that block is for App IDs only (already present, test App IDs)

- [x] Task 2 — Create `components/AdBannerUnit.tsx` (AC: #1, #2, #3, #5, #6)
  - [x] Named export `AdBannerUnit`, accepting an optional `testID?: string` prop (so the feed can pass `feed-ad-slot` — see Task 4 / regression note)
  - [x] Import `{ BannerAd, BannerAdSize, TestIds }` from `react-native-google-mobile-ads` (AdBannerUnit is the ONLY component permitted to import the SDK — architecture AdMob boundary)
  - [x] Resolve unit ID via `resolveUnitId()` (per-render): `__DEV__ ? TestIds.BANNER : PROD_UNIT_ID` where `PROD_UNIT_ID = Constants.expoConfig?.extra?.admobBannerUnitId ?? ''` (use `expo-constants`). Per-render resolution chosen for testability (lets a test flip `__DEV__` without re-import).
  - [x] Internal `loaded` state, default `false`. Render an outer `<View>` that is zero-height until `loaded` is true: when not loaded, render the `BannerAd` (so it can fetch) inside a container with `height: 0` / `overflow: 'hidden'`; on `onAdLoaded` set `loaded = true` → container takes natural height. On `onAdFailedToLoad` keep `loaded = false` (stays zero-height) — never throw, never log (ad load failures are silent per project rule).
  - [x] When `loaded`, wrap in `bg-surface` (`#1C1814`) container with the "Ad" label: absolutely-positioned top-right `<Text>` `text-[9px] text-text-secondary` reading "Ad"
  - [x] `BannerAd` props: `unitId={resolveUnitId()}`, `size={BannerAdSize.ANCHORED_ADAPTIVE_BANNER}`, `onAdLoaded`, `onAdFailedToLoad`
  - [x] Spread the optional `testID` onto the outer container so the slot is queryable in the feed test

- [x] Task 3 — Extend the web stub (AC: #7)
  - [x] In `lib/__stubs__/mobile-ads.js`, add named exports used by `AdBannerUnit`: `BannerAd` (a component returning `null`), `BannerAdSize` (object with `BANNER`/`ANCHORED_ADAPTIVE_BANNER` string members), `TestIds` (object with `BANNER`), so the web bundle resolves the named imports

- [x] Task 4 — Integrate into the feed `FlatList` (AC: #4, #6, #7)
  - [x] In `app/index.tsx`, replace the placeholder `<View testID="feed-ad-slot" />` with `<AdBannerUnit testID="feed-ad-slot" />` (preserves the existing test's query target)
  - [x] Apply the trailing-ad guard from deferred-work: render the ad slot only when `(index + 1) % AD_INTERVAL === 0 && index + 1 < events.length` so a feed whose length is an exact multiple of 6 does not end on an ad row
  - [x] Update the inline comment that currently says "Story 5.1 swaps this zero-height seam for `<AdBannerUnit/>`"
  - [x] See Dev Notes "FlatList recycling" — keep the conditional render inside `renderItem` for this story (data-array injection is logged as an optional future refinement, not required by the AC)

- [x] Task 5 — Tests (AC: #1, #2, #3, #7)
  - [x] Create `components/AdBannerUnit.test.tsx`. Mock `react-native-google-mobile-ads` with a fake `BannerAd` that exposes `onAdLoaded` / `onAdFailedToLoad` (captures props; tests drive the callbacks via `act`), plus `BannerAdSize` and `TestIds`. Mock `expo-constants` for the production-path unit ID.
  - [x] Test: before any callback → outer container is zero-height (`style === { height: 0, overflow: 'hidden' }`, no "Ad" label)
  - [x] Test: invoking `onAdLoaded` → the "Ad" label renders, style undefined, `bg-surface` applied
  - [x] Test: invoking `onAdFailedToLoad` → container stays zero-height, no throw, "Ad" label not shown
  - [x] Test: in `__DEV__`, `BannerAd` receives `unitId === TestIds.BANNER`; plus a prod-path test (flip `__DEV__`) asserting the configured prod unit ID
  - [x] Update `app/index.test.tsx`: mock the native SDK (`react-native-google-mobile-ads`) rather than the component — the real `AdBannerUnit` renders its `testID` slot (zero-height) without native code, avoiding the NativeWind `_ReactNativeCSSInterop` jest.mock-factory restriction. Test (h) updated for the trailing guard: 5→0, 6→0 (would-be trailing ad suppressed), 7→1 slots.

- [x] Task 6 — Validation gates
  - [x] `npx tsc --noEmit` passes (0 errors)
  - [x] `npm test` — all suites green (16 suites, 95 tests: 5 new AdBannerUnit + updated feed suite + 90 prior)
  - [x] `npx expo lint` passes (0 errors; 1 pre-existing unrelated warning in EmptyState.tsx)
  - [x] `npx expo export --platform web` bundles successfully (web stub resolves the new named imports)

## Dev Notes

### Component naming — resolved variance (read first)

The architecture document calls this component `components/AdBanner.tsx` (§Components, §file structure, §AdMob boundary). **The epics (Story 5.1 AC), the UX spec (UX-DR9 / §Components → `AdBannerUnit`), and the sprint-status key all say `AdBannerUnit.tsx`.** Use **`components/AdBannerUnit.tsx`** — the epics/UX/sprint triad is authoritative and more recent. Wherever the architecture says "AdBanner", read "AdBannerUnit". Do not create both.

### AdMob boundary rule — do not violate

Architecture §Architectural Boundaries: **`AdBannerUnit` is the ONLY component that may import from `react-native-google-mobile-ads`.** Interstitial logic (Story 5.2) lives only in `app/_layout.tsx`. The SDK is already initialised in `app/_layout.tsx` via `MobileAds().initialize()` (through the `@/lib/mobileAds` re-export) — do NOT re-initialise it here. The parent feed never inspects ad state — the component owns its own load/fail state (architecture §AdMob Patterns: "`<AdBanner>` handles its own load/fail state internally — parent never checks ad state").

### Current feed ad-slot seam (the file you are modifying)

`app/index.tsx` already seeds the slot — read it before editing. Relevant block (`renderItem`, ~lines 128–136):

```tsx
renderItem={({ item, index }) => (
  <>
    <EventCard event={item} onPress={() => router.push(`/event/${item.id}`)} />
    {(index + 1) % AD_INTERVAL === 0 && (
      // Story 5.1 swaps this zero-height seam for <AdBannerUnit/>.
      <View testID="feed-ad-slot" />
    )}
  </>
)}
```

`const AD_INTERVAL = 6;` is defined at module top (line 19). Keep the constant. Swap the `<View testID="feed-ad-slot" />` for `<AdBannerUnit testID="feed-ad-slot" />` and add the `index + 1 < events.length` trailing guard.

### Deferred-work items this story owns (from `deferred-work.md`)

Both were explicitly tagged "Story 5.1":
1. **Trailing ad on exact multiples of 6** [app/index.tsx:108] → add `&& index + 1 < events.length` to the slot condition (Task 4). **Required by this story.**
2. **`removeClippedSubviews` + conditional ad-slot in `renderItem` may blank/recycle rows once a real (non-zero-height) ad replaces the zero-height seam** [app/index.tsx:104-111]. The robust fix is to inject ad rows into the `data` array (so each row is a stable FlatList item) rather than conditionally rendering a second child inside `renderItem`. **This is logged as an optional refinement** — the AC only requires swapping the placeholder. For this story, keep the in-`renderItem` conditional but be aware: because `AdBannerUnit` is zero-height until loaded and the feed test mocks it, recycling artefacts won't surface in tests. If you observe row blanking on a real device during QA, escalate to the data-injection approach. Re-log to `deferred-work.md` if not done here.

### Banner unit ID wiring (AC #5)

- Dev: use `TestIds.BANNER` from the SDK (resolves to Google's official test banner unit) — never ship test ads to production, never hardcode a real unit ID in source.
- Production: read `Constants.expoConfig?.extra?.admobBannerUnitId` (added to `app.config.ts` in Task 1). The **real** value stays a placeholder until Story 5.5 (release prep) — consistent with the deferred-work note that the AdMob plugin still ships Google **test App IDs** in the production profile (also a Story 5.5 item). Do not attempt to source a real unit ID in this story.
- `Constants` comes from `expo-constants` (part of the Expo SDK; import `Constants from 'expo-constants'`).

### Zero-height behaviour (AC #3, UX-DR9)

UX-DR9 / UX spec §Ad Units: "renders at zero height until ad content resolves — no blank space, no layout shift". Implementation pattern: outer container collapses to `height: 0` (with `overflow: 'hidden'`) while `loaded === false`; on `onAdLoaded` flip to natural height + show `bg-surface` chrome and the "Ad" label. On `onAdFailedToLoad`, stay collapsed. The `BannerAd` itself should remain mounted while collapsed so it can attempt the fetch. NativeWind `className` is the styling rule; the dynamic `height: 0 ↔ auto` toggle is a documented inline-style exception (mirrors the `paddingTop` exception already used in `app/index.tsx`).

### "Ad" label styling (AC #2)

- Container: `className="bg-surface"` (`#1C1814`).
- Label: `<Text>` absolutely positioned top-right, `className="text-[9px] text-text-secondary"` (`#8A7E70`), copy exactly `Ad`. Tailwind tokens are already defined (`surface`, `text-secondary` in `tailwind.config.js` per UX spec §palette). Use arbitrary value `text-[9px]` for the 9px size.

### Testing patterns (this repo)

- Preset: `jest-expo` (root `jest.config.js`); `functions/` is excluded. Component tests are co-located (`X.test.tsx` next to `X.tsx`).
- The SDK is native — **mock `react-native-google-mobile-ads`** at module level in `AdBannerUnit.test.tsx`. A working pattern: the mock's `BannerAd` captures its props to a shared ref / calls the relevant callback so the test can drive `onAdLoaded` / `onAdFailedToLoad`. Provide `BannerAdSize` and `TestIds` objects from the mock too.
- `app/index.test.tsx` renders **real** child components (EventCard, ChipsRow, etc.) and does not currently mock the ad slot (it was a plain `<View>`). Once the slot becomes the SDK-importing `AdBannerUnit`, the feed test would transitively import the native SDK. **Mock `@/components/AdBannerUnit`** in `app/index.test.tsx` to render `<View testID={props.testID} />` — this keeps test (h) meaningful (it asserts one slot at 6 events, zero at 5) without the SDK. See existing mocks at the top of that file for the established style.
- Use `@testing-library/react-native` (`render`, `screen`, `fireEvent`) — same as every other component test.

### Project-wide rules that apply

- Named export (not default) — `components/*` are named; only `app/*.tsx` screens are default. [Source: docs/project-context.md#Exports]
- `className` only for styling; document the one dynamic-height inline-style exception. [docs/project-context.md#NativeWind]
- Ad load failures are **silent** — no UI change beyond zero-height, no logging. [docs/project-context.md#Error Handling]
- No new dependencies beyond `react-native-google-mobile-ads` (already installed, Story 1.4) and `expo-constants` (Expo SDK, already present). If `expo-constants` is somehow absent, HALT and confirm before adding.

### Project Structure Notes

- NEW: `components/AdBannerUnit.tsx`, `components/AdBannerUnit.test.tsx`
- MODIFY: `app/index.tsx` (swap placeholder + trailing guard), `app/index.test.tsx` (mock AdBannerUnit), `app.config.ts` (extra.admobBannerUnitId), `lib/__stubs__/mobile-ads.js` (named exports)
- Naming variance with architecture (`AdBanner.tsx`) resolved in favour of `AdBannerUnit.tsx` (see above).

### References

- [Source: _bmad-output/planning-artifacts/epics.md#Story 5.1] — AC source
- [Source: _bmad-output/planning-artifacts/ux-design-specification.md#AdBannerUnit] (UX-DR9), §Ad Units
- [Source: _bmad-output/planning-artifacts/architecture.md#Architectural Boundaries] — AdMob boundary; §AdMob Patterns; §file structure
- [Source: _bmad-output/implementation-artifacts/deferred-work.md] — two Story-5.1-tagged items (trailing ad, FlatList recycling)
- [Source: app/index.tsx] — existing ad-slot seam (AD_INTERVAL, renderItem)
- [Source: app/_layout.tsx + lib/mobileAds.ts] — SDK already initialised; do not re-init
- [Source: lib/__stubs__/mobile-ads.js + metro.config.js] — web stub mechanism
- [Source: app.config.ts] — `react-native-google-mobile-ads` plugin (test App IDs); `extra` block
- FR-9 (banner ads), FR-10 (async, non-blocking, dismissible/no-autoplay)

## Dev Agent Record

### Agent Model Used

claude-opus-4-8 (Opus 4.8)

### Debug Log References

Two issues surfaced and were resolved during test bring-up:
1. **Prod-path unit-ID test** initially used `jest.isolateModules` + re-require, which broke React hooks (dual-React: `Cannot read properties of null (reading 'useState')`). Fixed by resolving the unit ID **per-render** in `resolveUnitId()` so the test flips `globalThis.__DEV__` and re-renders the same imported component — no re-import.
2. **Feed-test mock** initially mocked `@/components/AdBannerUnit` with a `View`-returning factory; the NativeWind babel plugin injects an out-of-scope `_ReactNativeCSSInterop` reference into the hoisted `jest.mock` factory → "module factory not allowed to reference out-of-scope variables". Fixed by mocking the **native SDK** (`react-native-google-mobile-ads`) instead — the real `AdBannerUnit` renders its `testID` slot (zero-height) without native code and without any NativeWind component inside the factory.
3. The "Ad" `<Text>` originally had `accessibilityElementsHidden`, which made RNTL exclude it from `queryByText` (hidden elements excluded by default). Removed — the tiny label being accessible is acceptable.

### Completion Notes List

- `AdBannerUnit` (NEW): named export wrapping AdMob `BannerAd`. Owns its own `loaded` state; zero-height (`{ height: 0, overflow: 'hidden' }`) until `onAdLoaded`, stays zero-height on `onAdFailedToLoad` (silent — no log, no throw). On load: `bg-surface` container + absolutely-positioned top-right 9px `text-text-secondary` "Ad" label (UX-DR9). Dynamic height toggle is the documented inline-style exception (mirrors the `paddingTop` exception in `app/index.tsx`).
- Unit ID: dev → `TestIds.BANNER`; prod → `Constants.expoConfig?.extra?.admobBannerUnitId` (placeholder until Story 5.5). Resolved per-render in `resolveUnitId()`.
- AdMob boundary respected: `AdBannerUnit` is the only component importing `react-native-google-mobile-ads`; SDK init stays in `_layout.tsx` (not re-initialised here).
- Feed integration: `app/index.tsx` now renders `<AdBannerUnit testID="feed-ad-slot" />` at every 6th card **with the trailing-ad guard** `index + 1 < events.length` (deferred-work item #1 for Story 5.1 — resolved). Async/non-blocking: the FlatList renders independently of ad load (FR-10).
- Web stub (`lib/__stubs__/mobile-ads.js`) extended with `BannerAd`/`BannerAdSize`/`TestIds` named exports; `expo export --platform web` bundles clean.
- Deferred-work item #2 (FlatList `removeClippedSubviews` recycling with a non-zero-height ad row) was intentionally NOT changed — out of AC scope; conditional-in-`renderItem` retained. Re-logged below for on-device QA / future data-array-injection refinement.
- Gates: tsc 0 errors; 16 suites / 95 tests green; `expo lint` 0 errors (1 pre-existing EmptyState warning); web export bundled.
- ⚠️ Manual/release follow-ups (Story 5.5, not this story): real AdMob **App IDs** (currently Google test IDs in `app.config.ts` plugin) and the real **banner unit ID** value in `extra.admobBannerUnitId`. On-device visual verification of the banner + "Ad" label (no simulator in this environment).

### File List

- `components/AdBannerUnit.tsx` (NEW)
- `components/AdBannerUnit.test.tsx` (NEW)
- `app/index.tsx` (MODIFIED — import + AdBannerUnit slot + trailing guard)
- `app/index.test.tsx` (MODIFIED — SDK mock + test (h) updated for trailing guard)
- `app.config.ts` (MODIFIED — extra.admobBannerUnitId)
- `lib/__stubs__/mobile-ads.js` (MODIFIED — BannerAd/BannerAdSize/TestIds named exports)
- `_bmad-output/implementation-artifacts/sprint-status.yaml` (MODIFIED — status tracking)
- `_bmad-output/implementation-artifacts/deferred-work.md` (MODIFIED — FlatList recycling re-logged)

## Change Log

| Date | Change |
|------|--------|
| 2026-06-26 | Story 5.1 implemented: `AdBannerUnit` component (zero-height-until-loaded AdMob banner, "Ad" label, silent fail), interleaved into the feed at every 6th card with trailing-ad guard, banner unit ID wired through `app.config.ts`, web stub extended. Tests added (AdBannerUnit suite) + feed test updated. All gates green (tsc 0, 95 tests, lint 0 errors, web export OK). Resolved deferred-work item #1 (trailing ad); item #2 (FlatList recycling) re-logged for on-device QA. Status → review. |
