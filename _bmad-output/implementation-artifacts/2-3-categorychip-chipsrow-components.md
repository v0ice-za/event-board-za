# Story 2.3: CategoryChip + ChipsRow Components

Status: done

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As a user,
I want to filter the event feed by category using a horizontal chip row,
so that I can narrow the feed to events matching my current mood in one tap.

## Acceptance Criteria

1. **ChipsRow layout:** Renders a horizontal `ScrollView` with the scroll indicator hidden (`showsHorizontalScrollIndicator={false}`), containing an **"All" chip followed by 8 category chips** (one per `CATEGORY_VALUES`, in that order).
2. **Sticky "All":** The "All" chip is always visible at the **left edge and never scrolls off-screen** (render it fixed/pinned, outside the scrolling area; the 8 category chips scroll beside it).
3. **CategoryChip inactive state:** `surface` (#1C1814) background, `text-primary` (#F5F0E8) text, **1px `border` (#2A2420)** border.
4. **CategoryChip active state:** `accent` (#FF6B35) background, `background` (#0F0C09) text, **no border**.
5. **Press feedback:** Pressing any chip plays a **`scale: 0.95` transform** (no opacity change).
6. **Accessibility:** Each chip sets `accessibilityRole="button"` and `accessibilityState={{ selected: isActive }}`.
7. **Touch target:** Minimum touch-target **height is 44pt** on every chip.
8. **ChipsRow props:** Accepts `activeCategory: Category | null` and `onSelect: (category: Category | null) => void`. The "All" chip maps to `null`; each category chip maps to its `Category`. Tapping a chip calls `onSelect` with the corresponding value.
9. **Return-from-detail pulse:** When the screen regains focus while a **category filter is active** (`activeCategory !== null`), the active chip plays a scale pulse **1.0 → 1.05 → 1.0 over 200ms**, implemented via an `Animated` sequence triggered on focus (`useFocusEffect`).
10. **Conventions & gates:** Both components are **named exports** with **co-located tests**; `npx tsc --noEmit`, `npm test`, and `npm run lint` all pass with no regressions.

## Tasks / Subtasks

- [x] Task 1: Create `components/CategoryChip.tsx` (AC: #3, #4, #5, #6, #7)
  - [x] **Named export** `export function CategoryChip({ label, isActive, onPress, pulseValue }: CategoryChipProps)` where `CategoryChipProps = { label: string; isActive: boolean; onPress: () => void; pulseValue?: Animated.Value }`.
  - [x] Root is an `Animated.View` whose `style` applies the optional pulse transform (`pulseValue ? { transform: [{ scale: pulseValue }] } : undefined`) — animated transform is the documented dynamic-style exception. Inside it, a `Pressable`.
  - [x] `Pressable`: `accessibilityRole="button"`, `accessibilityState={{ selected: isActive }}`, `onPress`, press scale via `style={({ pressed }) => (pressed ? { transform: [{ scale: 0.95 }] } : undefined)}` (documented exception; no opacity change), and `className` for layout: `min-h-[44px]`, horizontal padding (`px-4`), `items-center justify-center`, `rounded-full`.
  - [x] Conditional styling via `className`: **inactive** → `bg-surface border border-border` + label `text-text-primary`; **active** → `bg-accent` + label `text-background` (no border). Compose the className string from `isActive` (e.g. a template literal or `clsx`-style concat — no new dependency, plain string is fine).
  - [x] Label `Text`: `text-[13px] font-inter-medium` (chip label size per `FONT_SIZE.chipLabel`), color per active/inactive above.
- [x] Task 2: Create `components/ChipsRow.tsx` (AC: #1, #2, #8, #9)
  - [x] **Named export** `export function ChipsRow({ activeCategory, onSelect }: ChipsRowProps)` where `ChipsRowProps = { activeCategory: Category | null; onSelect: (category: Category | null) => void }`. Import `Category`/`CATEGORY_VALUES` from `@/types` and `@/constants/categories`.
  - [x] Layout: an outer `View className="flex-row"`. **"All" chip pinned first** (outside the ScrollView). Then a horizontal `ScrollView` (`horizontal`, `showsHorizontalScrollIndicator={false}`) mapping `CATEGORY_VALUES` → `CategoryChip` (each wrapped in `mr-2` spacing View).
  - [x] Pulse: `const [pulse] = useState(() => new Animated.Value(1))` — lazy `useState`. On focus, if `activeCategory !== null`, runs `Animated.sequence([→1.05 (100ms), →1.0 (100ms)])` (200ms). `pulse` passed only to the active category chip.
  - [x] Trigger via `useFocusEffect` from `expo-router`, `useCallback` keyed to `[activeCategory, pulse]`. No `setState` in the callback (animation `.start()` only).
- [x] Task 3: Co-located tests (AC: #3, #4, #5, #6, #8, #9, #10)
  - [x] `components/CategoryChip.test.tsx`: label render; `onPress` fires; `accessibilityState.selected` reflects `isActive` (both states); active → `className` contains `bg-accent`, inactive → `bg-surface` + `border-border`. (6 tests)
  - [x] `components/ChipsRow.test.tsx`: renders "All" + all 8 labels; "All" tap → `onSelect(null)`; category tap → `onSelect(category)`; exactly the active chip has `selected` (via `getAllByRole('button', { selected: true })` + `within`); "All" selected when `activeCategory` null. `useFocusEffect` mocked to invoke the callback. (5 tests)
  - [x] Run `npm test` — all green.
- [x] Task 4: Validation (AC: #10)
  - [x] `npx tsc --noEmit`, `npm test`, `npm run lint` — all clean; no regression in existing suites (CategoryPlaceholder, EventCard, SkeletonCard, formatDate).

### Review Findings

_Code review 2026-06-16 (Blind Hunter + Edge Case Hunter + Acceptance Auditor). 3 patch, 0 decision-needed, 0 deferred, 5 dismissed as noise._

- [x] [Review][Patch] AC #9 pulse is wired but no test asserts it — add an assertion that the active category chip receives a `pulseValue`/Animated transform [components/ChipsRow.test.tsx]. **Fixed:** added 2 tests (`passes the pulse transform to the active category chip only`, `does not pulse any chip when the "All" filter is active`) that walk the tree for the Animated.View transform on the active chip and confirm its absence on inactive chips / when "All" is active. (sources: blind+auditor)
- [x] [Review][Patch] Focus-pulse has no cleanup/cancellation [components/ChipsRow.tsx:24]. **Fixed:** the `useFocusEffect` callback now `return () => pulse.stopAnimation()` and calls `pulse.stopAnimation()` before `setValue(1)`, so an in-flight sequence is cancelled on unmount/blur and overlapping runs can't stutter. (source: edge)
- [x] [Review][Patch] AC #2 sticky-"All" layout robustness [components/ChipsRow.tsx:46]. **Fixed:** added `className="flex-1"` to the horizontal `ScrollView` so its viewport is bounded to the remaining width beside the pinned "All". On-device confirmation still occurs during Story 2.6 integration. (source: auditor)

## Dev Notes

### Reuse — do NOT reinvent (critical)

- **`Category` type + `CATEGORY_VALUES`** already exist — `import type { Category } from '@/types'`; `import { CATEGORY_VALUES } from '@/constants/categories'`. The 8 chips are `CATEGORY_VALUES` in order (Music, Markets, Food & Drink, Art & Culture, Sport, Comedy, Family, Nightlife). "All" = the `null` filter.
- **Design tokens already defined** in `tailwind.config.js`: `bg-surface` (#1C1814), `bg-accent` (#FF6B35), `bg-background`/`text-background` (#0F0C09), `border-border` / `border` color (#2A2420), `text-text-primary` (#F5F0E8); fonts `font-inter` / `font-inter-medium`. Use these className tokens — do not hardcode hex.
- **`expo-router` is already a dependency** (`~56.2.7`) and re-exports `useFocusEffect` (from `@react-navigation/native`). No new dependency. No third-party UI/chip library — all components are bespoke RN primitives (UX spec is explicit on this).
- ⚠️ The architecture file lists an older `FilterChips.tsx` name — **superseded** by `CategoryChip` + `ChipsRow` (epics + UX spec are canonical). Build the two named components.
- ⚠️ **`app/index.tsx` is the Story 1.4 throwaway prototype** — out of scope. The feed screen (Story 2.6) will own the filter state (`useState` for `activeCategory`) and wire `ChipsRow`. Do not modify `app/index.tsx`.

### Component patterns (project-context.md + Story 2.1/2.2 learnings)

- **`className` only — never `StyleSheet.create()` or `style={{}}`** except the documented dynamic exceptions: the `Pressable` press-scale transform and the `Animated` pulse transform (comment each).
- **Named exports**; path alias `@/*`; navigation/state via props — `ChipsRow` is controlled (`activeCategory` + `onSelect`), it owns no filter state itself.
- **Animated learnings carried from Story 2.2 (these caused lint failures there — do not repeat):**
  - Create `Animated.Value` with **lazy `useState(() => new Animated.Value(1))`**, NOT `useRef(new Animated.Value(1)).current` (trips `react-hooks/refs`).
  - **Never call `setState` inside `useEffect`/`useFocusEffect`** (trips `react-hooks/set-state-in-effect`). The pulse only calls `Animated.timing(...).start()` — no state updates needed.
  - Press scale via the `Pressable` `style={({ pressed }) => ...}` function works cleanly alongside `className` (proven in `EventCard`).
- TypeScript `strict: true` — no `any`, no unused vars.

### Focus-pulse implementation + testing caveat (AC #9)

- `useFocusEffect` requires a navigation context at runtime — it works because `ChipsRow` renders inside the Expo Router screen (Story 2.6). In **Jest there is no navigation container**, so the test **must mock** `expo-router`'s `useFocusEffect` (invoke or no-op the callback) or the render throws. Suggested: `jest.mock('expo-router', () => ({ useFocusEffect: (cb: () => void) => cb() }))`.
- Assert the pulse **does not crash** and is wired (callback runs, active chip receives `pulseValue`). The **subjective "satisfying pulse" + actual return-from-detail trigger is verified on-device** during Story 2.6 integration — no simulator in this environment (consistent with prior stories' on-device visual deferrals).
- `useFocusEffect` callback must be wrapped in `useCallback` (React Navigation requirement) keyed to `activeCategory`, else it re-subscribes every render.

### Testing standards (Story 2.1/2.2 precedent)

- **Co-located** tests; Jest (`jest-expo`) + `@testing-library/react-native`. Patterns established: `screen.queryByText(...).not.toBeNull()` for presence; `fireEvent.press(screen.getByRole('button'))` for taps; `screen.getByRole('button').props.accessibilityState` for selected state; `UNSAFE_getByProps`/inspecting `props.className` for style assertions.
- Multiple buttons in `ChipsRow` (9 chips) → `getByRole('button')` returns many; use `getAllByRole('button')` or query by label (`getByText('Music')`'s parent) / `getByLabelText`. Prefer tapping via the label text node's enclosing pressable, or give the test the specific chip via its label.
- No animation-frame assertions (proven brittle); structural + behavioral only.

### Project Structure Notes

- New files: `components/CategoryChip.tsx`, `components/CategoryChip.test.tsx`, `components/ChipsRow.tsx`, `components/ChipsRow.test.tsx`.
- No changes to existing components, `constants/`, `types/`, `tailwind.config.js`, or config files. No new dependencies.
- `components/**` is already in the tailwind `content` array and tsconfig/CI globs.
- Chip shape: `rounded-full` (pill) is the conventional chip; note the UX "consistent radius across cards/chips/modal" goal isn't yet pinned to a single value (`EventCard` shipped without a radius) — a global radius pass is a future consideration, not this story.

### References

- [Source: _bmad-output/planning-artifacts/epics.md#Story 2.3: CategoryChip + ChipsRow Components] — BDD acceptance criteria
- [Source: _bmad-output/planning-artifacts/ux-design-specification.md#CategoryChip / #ChipsRow] — single-select, active/inactive states, pressed scale, accessibility; lines 45/62/162/175/342–345 (one-tap filter, unambiguous active state, back preserves filter, session-scoped state)
- [Source: docs/project-context.md] — `className`-only, named exports, `@/*` alias, controlled-component/callback pattern
- [Source: components/EventCard.tsx, components/SkeletonCard.tsx (Story 2.2)] — Pressable press-scale pattern; Animated.Value via lazy `useState`; no setState-in-effect
- [Source: tailwind.config.js + constants/theme.ts] — colour tokens, `FONT_SIZE.chipLabel = 13`
- [Source: types/event.ts, constants/categories.ts] — `Category`, `CATEGORY_VALUES`

## Dev Agent Record

### Agent Model Used

claude-opus-4-8 (Claude Opus 4.8)

### Debug Log References

- `npx jest components/CategoryChip.test.tsx` → GREEN: 6/6 (label, onPress, selected state both ways, active `bg-accent` / inactive `bg-surface`+`border-border` className).
- `npx jest components/ChipsRow.test.tsx` → GREEN: 5/5 (All + 8 chips, onSelect(null), onSelect(category), exactly-one-selected via `getAllByRole('button',{selected:true})`, All selected when null). `useFocusEffect` mocked.
- Final: `npx tsc --noEmit` clean; `npx jest` 6 suites / 32 tests passing; `npm run lint` clean — no validation errors on first pass (carried Story 2.2 Animated/lint learnings forward).

### Completion Notes List

- `CategoryChip` — controlled presentational chip. Active → `bg-accent` + `text-background` (no border); inactive → `bg-surface border border-border` + `text-text-primary`. `min-h-[44px]` touch target, `rounded-full`. Press scale 0.95 via Pressable `style` function; optional `pulseValue` applied as an `Animated.View` transform. `accessibilityRole="button"` + `accessibilityState={{ selected }}`.
- `ChipsRow` — pinned "All" chip (outside the ScrollView, never scrolls off) + horizontal `ScrollView` (indicator hidden) of the 8 `CATEGORY_VALUES`. Controlled via `activeCategory`/`onSelect` ("All" = `null`). Return-from-detail pulse: `useFocusEffect` runs a 200ms `1→1.05→1` sequence on the active category chip when `activeCategory !== null`.
- **Animated/lint discipline (from Story 2.2):** `Animated.Value` via lazy `useState(() => …)`, never `useRef().current`; no `setState` inside the focus effect (animation `.start()` only). Result: zero lint/tsc errors on first run.
- `className` is inspectable on rendered props under this NativeWind setup, so active/inactive styling is asserted directly in tests.
- **On-device verification outstanding:** the actual return-from-detail pulse trigger + chip "satisfying feedback" feel needs a device (no simulator here); unit tests mock `useFocusEffect` and confirm the path runs without error. Verified during Story 2.6 integration.
- Out of scope / untouched: `app/index.tsx` (Story 1.4 prototype); filter state will be owned by the feed screen (Story 2.6).

### File List

- `components/CategoryChip.tsx` (new)
- `components/CategoryChip.test.tsx` (new)
- `components/ChipsRow.tsx` (new)
- `components/ChipsRow.test.tsx` (new)

## Change Log

| Date | Change |
|------|--------|
| 2026-06-16 | Implemented Story 2.3: `CategoryChip` + `ChipsRow` components with co-located tests (11 new tests; full suite 32 green). Single-select filter row with pinned "All", active/inactive states, press scale, 44pt targets, a11y selected state, and a focus-triggered pulse on the active chip. tsc + lint clean. Status → review. On-device pulse/feel QA outstanding (no simulator in env). |
| 2026-06-16 | Code review (Blind + Edge + Acceptance layers): 3 patches applied — added pulse-transform wiring tests (+2 tests), added `pulse.stopAnimation()` cleanup/cancellation in `useFocusEffect`, and `flex-1` width bound on the horizontal `ScrollView`. 5 findings dismissed as noise. tsc + lint clean; full suite 34 green. Status → done. On-device pulse/feel + sticky-"All" layout still verified during Story 2.6 integration. |
