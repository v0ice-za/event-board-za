# Story 2.4: Empty/Error/Offline States + useNetworkState Hook

Status: done

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As a user,
I want to see a clear, actionable message when the feed is empty, fails to load, or has no connection,
so that I'm never left on a blank screen with no way forward.

## Acceptance Criteria

1. **`useNetworkState` hook:** `hooks/useNetworkState.ts` wraps `expo-network` and exports (named) `useNetworkState(): { isConnected: boolean }`, updated **reactively** as connectivity changes. Connectivity-unknown (`undefined`) resolves to `true` (never flash "offline" before the first reading).
2. **`EmptyState` — `empty-category` variant:** category emoji (32px) → "No [Category] events right now" (18sp/600, `text-primary`) → "Try a different category or check back later" (13sp/400, `text-secondary`) → **"Clear filter"** pill. Tapping the pill calls the supplied action callback.
3. **`EmptyState` — `no-connection` variant:** signal-off icon (32px, `text-secondary` #8A7E70) → "No connection" (18sp/600) → "Check your signal and try again" (13sp/400, `text-secondary`) → **"Retry"** pill.
4. **`EmptyState` — `general-error` variant:** alert-triangle icon (32px, `error` #FF4D4D) → "Something went wrong" (18sp/600) → "Try again or check back later" (13sp/400, `text-secondary`) → **"Retry"** pill.
5. **Retry/Clear-filter pill styling:** `border` (#2A2420) bg, `text-primary` (#F5F0E8) text, 13sp/500, 20px border-radius, 16px horizontal padding, 36px height — **never full-width** (self-sizing, content-width). Press feedback: `scale: 0.95` (no opacity change). Touch target reaches **44pt** via `hitSlop` despite the 36px visual height.
6. **`OfflineBanner`:** a slim banner (presentational) shown at the top of the feed when offline while cached data is visible. In this story it is built + tested standalone; the feed (Story 2.6) owns the `isConnected && hasCachedData` gating that mounts it.
7. **No blank screens:** every terminal state has a visible, tappable recovery action (a11y `accessibilityRole="button"` on every pill).
8. **Conventions & gates:** all are **named exports** with **co-located tests**; `npx tsc --noEmit`, `npm test`, and `npm run lint` pass with no regressions.

## Tasks / Subtasks

- [x] Task 1: Install `expo-network` (AC: #1)
  - [x] `npx expo install expo-network` (SDK-pinned; **do not** `npm install` a loose version). Architecture-sanctioned — `architecture.md:105`. Confirm it lands in `package.json` `dependencies` and `package-lock.json` is updated. → installed `expo-network@~56.0.5`; `package.json` + `package-lock.json` both updated.
- [x] Task 2: Create `hooks/useNetworkState.ts` (AC: #1)
  - [x] Create the `hooks/` directory if absent (already in `tailwind.config.js` content globs + `@/*` alias).
  - [x] `import * as Network from 'expo-network'`. **Named export** `export function useNetworkState(): { isConnected: boolean }`.
  - [x] Implement by wrapping expo-network's own `Network.useNetworkState()` hook (auto-manages the listener + cleanup). Return `{ isConnected: state.isConnected ?? true }` — `NetworkState.isConnected` is `boolean | undefined`; coerce with `?? true` so unknown state never renders the offline UI.
  - [x] No `useEffect`/manual subscription needed — `Network.useNetworkState()` is reactive. Used the wrapper hook (preferred path).
- [x] Task 3: Create `components/EmptyState.tsx` (AC: #2, #3, #4, #5, #7)
  - [x] **Named export** `export function EmptyState({ variant, category, onAction }: EmptyStateProps)` where `EmptyStateProps = { variant: EmptyStateVariant; category?: Category | null; onAction: () => void }` and `type EmptyStateVariant = 'empty-category' | 'no-connection' | 'general-error'`.
  - [x] Derive per-variant content from a single `as const` config map (heading, subtext, button label). `empty-category` heading interpolates `category` → ``No ${category} events right now``; if `category` is null/absent fall back to "No events right now". Button label: `empty-category` → "Clear filter"; others → "Retry".
  - [x] Layout: centred column — icon → heading → subtext → pill — `items-center justify-center py-12`.
  - [x] Heading: `text-[18px] font-inter-semibold text-text-primary`. Subtext: `text-[13px] font-inter text-text-secondary text-center`.
  - [x] Icons: `empty-category` → category emoji via `<Text className="text-[32px]">` (reuses `CATEGORY_PLACEHOLDERS[category].emoji`, `FALLBACK_PLACEHOLDER` for unmapped). `no-connection` → Feather `wifi-off`, 32px, `COLORS.textSecondary` (#8A7E70). `general-error` → Feather `alert-triangle`, 32px, `COLORS.error` (#FF4D4D). Colours via the icon `color` prop (pulled from `@/constants/theme`).
  - [x] Pill = a `Pressable`: `bg-border`, label `text-text-primary text-[13px] font-inter-medium`, `rounded-[20px]`, `px-4`, `h-9`, `items-center justify-center`, `self-center` (NOT `w-full`). Press scale via documented dynamic-style exception (commented). `hitSlop={{ top: 4, bottom: 4 }}` → 44pt touch target. `accessibilityRole="button"`, `accessibilityLabel` = button label. `onPress={onAction}`.
- [x] Task 4: Create `components/OfflineBanner.tsx` (AC: #6)
  - [x] **Named export** `export function OfflineBanner()` — presentational, no props, no network logic (the feed gates visibility in Story 2.6).
  - [x] Slim full-width strip: `bg-surface` + `border-b border-border`, `py-2`, centred 13sp text "No connection — showing saved events", `text-text-secondary`. `accessible` + `accessibilityRole="alert"` so it's announced.
- [x] Task 5: Co-located tests (AC: #2–#8)
  - [x] `hooks/useNetworkState.test.ts`: mocks `expo-network`. (a) `{ isConnected: false }` → `false`; (b) `{}` (undefined) → `true`; (c) `{ isConnected: true }` → `true`. Uses `renderHook`.
  - [x] `components/EmptyState.test.tsx`: each variant renders heading + subtext + correct button label; `onAction` fires on press; `empty-category` with `category="Music"` renders "No Music events right now"; null-category fallback; pill exposes `accessibilityRole="button"` + label. (Feather mocked to silence async-font `act()` warning — asserts content via text/role, not glyph internals.)
  - [x] `components/OfflineBanner.test.tsx`: renders the offline copy; container exposes the `alert` role.
  - [x] Ran `npm test` — all green; no regression (was 6 suites/34 tests, now 9 suites/45 tests).
- [x] Task 6: Validation (AC: #8)
  - [x] `npx tsc --noEmit`, `npm test`, `npm run lint` — all clean.

## Review Findings

### Decision Needed

- [x] [Review][Decision] Button background color intent — **RESOLVED:** Keep `bg-border`. Dark neutral with `text-primary` (#F5F0E8) provides sufficient contrast per AC #5 spec. (User confirmed 2026-06-17)

### Patches (Code Fixes Applied)

- [x] [Review][Patch] useNetworkState exception safety — Wrapped `Network.useNetworkState()` in try-catch; null-check added; defaults to `{ isConnected: true }` on error. [hooks/useNetworkState.ts:9-16] ✅
- [x] [Review][Patch] VARIANT_CONFIG lookup unguarded — Added exhaustive check with fallback error UI and console warning if variant is invalid. [components/EmptyState.tsx:70-78] ✅
- [x] [Review][Patch] onAction callback validation — Added type guard `typeof onAction === 'function'` before invocation; logs warning if missing. [components/EmptyState.tsx:80-88] ✅
- [x] [Review][Patch] Emoji rendering fallback — Added fallback emoji '📌' if render fails; graceful degradation for older Android. [components/EmptyState.tsx:43-47] ✅
- [x] [Review][Patch] COLORS constants validation — Added defensive checks with fallback hex values for `textSecondary` and `error`. [components/EmptyState.tsx:49-50] ✅
- [x] [Review][Patch] useNetworkState null-check — Explicit null check added: `if (!state) return { isConnected: true }`. [hooks/useNetworkState.ts:11] ✅
- [x] [Review][Patch] OnAction callback error handling — Wrapped invocation in try-catch; logs error and continues gracefully. [components/EmptyState.tsx:80-88] ✅
- [x] [Review][Patch] Emoji icon accessible alt text — Added `accessibilityLabel` with category name (e.g., "Music category icon"). [components/EmptyState.tsx:44] ✅
- [x] [Review][Patch] Hardcoded icon sizes — Extracted to `const ICON_SIZE = 32` constant; used throughout component. [components/EmptyState.tsx:8] ✅
- [x] [Review][Patch] Test coverage gap — Added `jest.mock('@/constants/categories', ...)` in tests; added error-handling test cases (invalid variant, missing onAction, throwing onAction). All 50 tests passing. [components/EmptyState.test.tsx, hooks/useNetworkState.test.ts] ✅

## Dev Notes

### Reuse — do NOT reinvent (critical)

- **Colour tokens already exist** in `tailwind.config.js` + `constants/theme.ts`: `background` #0F0C09, `surface` #1C1814, `text-primary` #F5F0E8, `text-secondary` #8A7E70, `accent` #FF6B35, `border` #2A2420, **`error` #FF4D4D**, `success` #4CAF50. Use className tokens (`bg-border`, `text-text-secondary`, `text-error`) — **never hardcode hex** in `className`. (Icon `color` props are the exception — they take a raw colour string; pull it from `COLORS` in `@/constants/theme` rather than a literal.)
- **Fonts:** `font-inter` (400), `font-inter-medium` (500), `font-inter-semibold` (600), `font-inter-bold` (700). `FONT_SIZE.chipLabel = 13` is the 13sp value (use `text-[13px]`/`text-[18px]` inline sizes as established in `CategoryChip`/`EventCard`).
- **`Category` type + `CATEGORY_VALUES`**: `import type { Category } from '@/types'`; emoji per category live in `CATEGORY_PLACEHOLDERS` (`@/constants/categories`) — reuse `CATEGORY_PLACEHOLDERS[category].emoji` for the `empty-category` icon instead of a new emoji map.
- **`expo-network` API** (verified against current Expo docs): `import * as Network from 'expo-network'`. Exposes `useNetworkState()` (reactive hook, auto cleanup), `addNetworkStateListener(cb)` (returns a subscription with `.remove()`), and `getNetworkStateAsync()`. `NetworkState = { isConnected?: boolean; isInternetReachable?: boolean; type?: NetworkStateType }` — **all fields optional**. Use `isConnected` (not `isInternetReachable`) per AC.

### Canonical naming — architecture is superseded here

- ⚠️ `architecture.md` lists a **separate `ErrorState.tsx`** (lines 195, 297, 417–424, 471) and `project-context.md` references `<ErrorState>`. The **epics + UX spec are canonical** and consolidate error/empty/offline into **one `EmptyState`** with three variants (`empty-category`, `no-connection`, `general-error`) — same pattern as Story 2.3 superseding the architecture's older `FilterChips` name. **Build `EmptyState` (3 variants) + `OfflineBanner`, not a standalone `ErrorState`.** Story 2.6's ACs already consume `EmptyState`/`OfflineBanner`, so this is internally consistent downstream.

### Icon decision — ✅ DECIDED (Voice, 2026-06-17): add `@expo/vector-icons` (Feather)

- `empty-category` uses a **category emoji** (Story 2.1 precedent, AC #2) — no library needed.
- `no-connection` (signal-off, `text-secondary`) and `general-error` (alert-triangle, `error` #FF4D4D) need **recolourable glyph icons** — emoji can't be tinted to the exact spec colours.
- **No icon library is currently installed** (`@expo/vector-icons`, `lucide-react-native` both absent; `expo-symbols` is installed but is iOS-only SF Symbols — unsuitable for an iOS **+ Android** app).
- **Decision (confirmed by Voice 2026-06-17):** add **`@expo/vector-icons`** (`npx expo install @expo/vector-icons`) and use **Feather** `wifi-off` and `alert-triangle` — Expo-standard, JS-only font icons (no native rebuild), supports the `color` prop, and `jest-expo`'s `transformIgnorePatterns` already transpiles `@expo/*`. Set colours from `COLORS.textSecondary` / `COLORS.error`. No longer an open question — install the dep as part of Task 3.

### Component patterns (project-context.md + Story 2.1/2.2/2.3 learnings)

- **`className` only — never `StyleSheet.create()` or `style={{}}`** except the documented dynamic exceptions (the pill press-scale transform — comment it). Icon `color` props are component props, not styles, so they're fine.
- **Named exports**; path alias `@/*`; **controlled/presentational** — these components own no state. `EmptyState` takes `onAction` (the parent binds clear-filter or refetch); `OfflineBanner` is pure UI. This matches the project's "screen owns state, components take callbacks" rule (`project-context.md`).
- **`onAction` design note:** epics AC names `onClearFilter` (empty-category) and a Retry handler (refetch) separately. Since each variant shows exactly one button, a single `onAction: () => void` is the clean API — Story 2.6 passes `clearFilter` for `empty-category` and `refetch` for the retry variants. Documented intentionally; not a deviation.
- **Touch targets:** every `Pressable` must reach 44pt (UX spec line 688). The pill's visual height is 36px per AC #5, so extend the hit area with `hitSlop` rather than growing the visual.
- TypeScript `strict: true` — no `any`, no unused vars. Absent optional props are `null`/omitted per the null-vs-undefined rule, but component props may use optional (`category?`) — keep `?? null`/`?? true` coercions explicit where a default matters.

### Testing standards (Story 2.1/2.2/2.3 precedent)

- **Co-located** tests; `jest-expo` + `@testing-library/react-native`. Patterns: `screen.queryByText(...).not.toBeNull()` for presence; `fireEvent.press(screen.getByRole('button'))` for taps; `getByRole('button').props.accessibilityState`/`.props.className` for state/style assertions.
- **Mock `expo-network`** in the hook test (no native module under Jest): `jest.mock('expo-network', () => ({ useNetworkState: () => ({ isConnected: false }) }))`, varying the return per test. Use `renderHook` from `@testing-library/react-native`.
- If you add `@expo/vector-icons`, the icons render fine under `jest-expo` (font icons) — assert variant content via text/role, not icon internals (avoid brittle glyph assertions, consistent with "no animation-frame assertions" from Story 2.2/2.3).
- **On-device verification deferred to Story 2.6 integration** (no simulator in this env, consistent with prior stories): the actual offline-banner trigger and the empty/error states appearing in the live feed are verified when the feed screen wires them up.

### Project Structure Notes

- **New files:** `hooks/useNetworkState.ts` (+ `.test.ts`), `components/EmptyState.tsx` (+ `.test.tsx`), `components/OfflineBanner.tsx` (+ `.test.tsx`).
- **New deps:** `expo-network` (required, architecture-sanctioned); `@expo/vector-icons` (icon default — see open question). Install both via `npx expo install` so versions match SDK 56.
- `hooks/**` and `components/**` are already in the tailwind `content` array, `tsconfig` `@/*` alias, and CI globs. `jest.config.js` `transformIgnorePatterns` already covers `expo*` / `@expo/*`.
- **Do NOT modify `app/index.tsx`** (Story 1.4 throwaway prototype) — wiring these into the feed is Story 2.6.

### References

- [Source: _bmad-output/planning-artifacts/epics.md#Story 2.4] — BDD acceptance criteria (the 3 variants, pill styling, OfflineBanner)
- [Source: _bmad-output/planning-artifacts/ux-design-specification.md] — lines 396–398 (`EmptyState` variants), 573–591 (3-part layout, signal-off vs alert-triangle icons + colours), 545 (secondary action), 688 (44pt touch targets)
- [Source: _bmad-output/planning-artifacts/architecture.md] — lines 105 (`expo-network` for NFR-3), 168/420 (offline drives banner), 480 (`hooks/useNetworkState.ts` + `OfflineBanner.tsx`), 518–527 (file locations); ⚠️ separate `ErrorState.tsx` superseded by `EmptyState` variants
- [Source: docs/project-context.md] — `className`-only + dynamic-style exceptions, named exports, `@/*` alias, controlled-component/callback pattern, expo-network drives offline UI
- [Source: constants/theme.ts + tailwind.config.js] — `error` #FF4D4D, `text-secondary` #8A7E70, `border` #2A2420 tokens; font families
- [Source: constants/categories.ts] — `CATEGORY_VALUES`, `CATEGORY_PLACEHOLDERS[category].emoji` (reuse for empty-category icon)
- [Source: components/CategoryChip.tsx (Story 2.3)] — Pressable press-scale + `hitSlop`/44pt pattern, className composition, a11y role/label precedent
- [Source: Expo docs — expo-network] — `useNetworkState()` / `addNetworkStateListener()` / `getNetworkStateAsync()`; `NetworkState.isConnected` is `boolean | undefined`

## Dev Agent Record

### Agent Model Used

claude-opus-4-8 (BMad dev-story workflow)

### Debug Log References

- Initial `npm test`: 2 issues surfaced — (1) `OfflineBanner` `getByRole('alert')` could not match the banner because a `View` is not accessible by default; fixed by adding `accessible` alongside `accessibilityRole="alert"`. (2) `@expo/vector-icons` Feather glyph loads its font asynchronously, firing a post-render `setState` (`act()` warning) under Jest; resolved by mocking `@expo/vector-icons` in `EmptyState.test.tsx` (asserts content via text/role, not glyph internals, per the story's testing standards). Re-run: 9 suites / 45 tests green.

### Completion Notes List

- ✅ `useNetworkState` wraps `Network.useNetworkState()` (reactive, auto-cleanup) and coerces `isConnected ?? true` so unknown connectivity never flashes the offline UI (AC #1).
- ✅ `EmptyState` implements all three variants from a single `as const` config map; `empty-category` interpolates `category` and falls back to "No events right now" when null. Recovery pill is self-sizing (`self-center`, never `w-full`), 36px visual height + `hitSlop` → 44pt touch target, press-scale 0.95 via the documented dynamic-style exception, `accessibilityRole="button"` (AC #2–#5, #7).
- ✅ Icons: category emoji (reuses `CATEGORY_PLACEHOLDERS`/`FALLBACK_PLACEHOLDER`) for `empty-category`; Feather `wifi-off` (#8A7E70) and `alert-triangle` (#FF4D4D) tinted via the `color` prop from `@/constants/theme` — installed `@expo/vector-icons` per the confirmed icon decision.
- ✅ `OfflineBanner` is pure presentational (no network logic) with `accessibilityRole="alert"`; the feed owns `isConnected && hasCachedData` gating in Story 2.6 (AC #6).
- ✅ All colour/font tokens via className (no hardcoded hex in `className`); named exports + `@/*` alias + co-located tests throughout. Gates: `tsc --noEmit`, `npm test` (45/45), `expo lint` all clean (AC #8).
- Deferred to Story 2.6 (per Dev Notes): on-device offline-banner trigger and the empty/error states appearing in the live feed (no simulator in this environment).

### File List

- `hooks/useNetworkState.ts` (new)
- `hooks/useNetworkState.test.ts` (new)
- `components/EmptyState.tsx` (new)
- `components/EmptyState.test.tsx` (new)
- `components/OfflineBanner.tsx` (new)
- `components/OfflineBanner.test.tsx` (new)
- `package.json` (modified — added `expo-network`, `@expo/vector-icons`)
- `package-lock.json` (modified — lockfile for the two new deps)

## Change Log

| Date | Change |
|------|--------|
| 2026-06-16 | Story created (ready-for-dev). Defines `useNetworkState` hook (expo-network wrapper), `EmptyState` (3 variants), and `OfflineBanner`, with co-located tests. Resolved: architecture's `ErrorState` superseded by `EmptyState` variants; `expo-network` API verified; icon library decision flagged (default `@expo/vector-icons` Feather). |
| 2026-06-17 | Implemented all 6 tasks. Added `expo-network` + `@expo/vector-icons` (SDK-pinned). New: `useNetworkState` hook, `EmptyState` (3 variants), `OfflineBanner`, all with co-located tests. Gates green: `tsc --noEmit`, `npm test` (9 suites / 45 tests, was 34), `expo lint`. Status → review. |
