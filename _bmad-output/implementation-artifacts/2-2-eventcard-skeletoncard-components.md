# Story 2.2: EventCard + SkeletonCard Components

Status: done

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As a user,
I want each event card to show the event image (or category placeholder), name, date, and venue at a glance,
so that I can make a 1-second yes/no decision while scrolling without tapping.

## Acceptance Criteria

1. **EventCard image:** Given an `Event` is passed to `EventCard`, when the card renders, a full-bleed `expo-image` fills the card at **~200px height, full screen width**.
2. **Gradient overlay:** A `LinearGradient` overlay is absolutely positioned over the image, opaque at the **bottom** (`rgba(15,12,9,0.95)`) fading to **transparent** at the top — so bottom-left text stays legible over any image.
3. **Event name:** Renders bottom-left in the overlay at **18sp / weight 700** (`font-inter-bold`, `text-text-primary`), with `numberOfLines={2}` + `ellipsizeMode="tail"`.
4. **Date · venue line:** Renders below the name at **13sp**, with the **date in weight 500** (`font-inter-medium`) and **venue in weight 400** (`font-inter`), separated by ` · `, on a single line (`numberOfLines={1}`). The date is **human-readable** (e.g. `Sat 30 May`) per FR-2 — not the raw ISO string.
5. **Image fallback:** When `imageUrl` is `null` **or** the image fails to load, `CategoryPlaceholder` (Story 2.1) renders full-bleed in place of the `expo-image`.
6. **Press feedback:** A `Pressable` wraps the card with a **`scale: 0.93` pressed transform and no opacity change**; pressing calls the `onPress` callback prop.
7. **Accessibility:** The card sets `accessibilityRole="button"` and `accessibilityLabel="{name}, {formattedDate}, {venue}"` (uses the same human-readable date as the visible text).
8. **SkeletonCard:** `components/SkeletonCard.tsx` exists, matching `EventCard` dimensions exactly (**~200px height, full width**), with a **pulsing shimmer** (opacity `0.3 → 0.6 → 0.3`, **1.2s `Animated` loop**) animating between `#1C1814` (`surface`) and `#2A2420` (`border`).
9. **SkeletonCard accessibility:** Its container sets `accessibilityLabel="Loading events"`; shimmer children set `importantForAccessibility="no"`.
10. **Conventions & gates:** Both components are **named exports**, have **co-located tests**, and the implementation passes `npx tsc --noEmit`, `npm test`, and `npm run lint` with no regressions.

## Tasks / Subtasks

- [x] Task 1: Create `lib/formatDate.ts` date utility (AC: #4, #7)
  - [x] Add **named export** `export function formatEventDate(isoDate: string): string` returning the FR-2 format `"Sat 30 May"` (short weekday, day-of-month, short month — no comma, no year)
  - [x] **Parse the ISO date from its parts** (`'2026-05-30'.split('-')`) and build a **local** `Date(y, m-1, d)` — do NOT pass the ISO string straight to `new Date('2026-05-30')`, which parses as UTC midnight and can render the **wrong day** in UTC+2 (JHB) once a time component is involved. Use fixed `WEEKDAYS`/`MONTHS` lookup arrays for deterministic, locale-independent output (avoids `toLocaleDateString` comma/locale variance).
  - [x] `lib/` is the home for client utilities (architecture file structure); naming is camelCase `formatDate.ts`
- [x] Task 2: Create `components/EventCard.tsx` (AC: #1, #2, #3, #4, #5, #6, #7)
  - [x] **Named export** `export function EventCard({ event, onPress }: EventCardProps)` where `EventCardProps = { event: Event; onPress: () => void }`. Import `Event` via `import type { Event } from '@/types'`.
  - [x] Navigation is **callback-only** — the card never calls `router.*`. The feed screen (Story 2.6) passes `onPress` that runs `router.push`. (project-context: components receive callback props for navigation.)
  - [x] Track local `imageError` state (`useState(false)`). Render `CategoryPlaceholder` (from `@/components/CategoryPlaceholder`) when `event.imageUrl === null || imageError`; otherwise render `expo-image` with `onError={() => setImageError(true)}` and the `placeholder`/`contentFit="cover"` props.
  - [x] Card root: `Pressable` with `accessibilityRole="button"` and `accessibilityLabel={`${event.name}, ${formatEventDate(event.date)}, ${event.venue}`}`. Apply the pressed `scale: 0.93` via the `Pressable` `style`/`className` press state (this is the **documented dynamic-style exception** — pressed transform is state-driven and cannot be a static class; add an inline comment).
  - [x] Image area: ~200px height, full width, `overflow-hidden`. Gradient overlay: `LinearGradient` `colors={['transparent', 'rgba(15,12,9,0.95)']}` (top→bottom default direction puts the opaque stop at the bottom), `className="absolute inset-0"`, `accessible={false}`.
  - [x] Text overlay bottom-left: name `Text` (`text-[18px] font-inter-bold text-text-primary`, `numberOfLines={2}`, `ellipsizeMode="tail"`); below it the meta line — date `Text` (`text-[13px] font-inter-medium text-text-primary`) + `" · "` + venue `Text` (`text-[13px] font-inter text-text-primary`), wrapper `numberOfLines={1}`.
  - [x] **`className` only** — no `StyleSheet.create()` / `style={{}}` except the documented dynamic press-scale exception. All colours/fonts use the existing tailwind tokens (`surface`, `border`, `text-primary`, `accent`, `font-inter*`).
- [x] Task 3: Create `components/SkeletonCard.tsx` (AC: #8, #9)
  - [x] **Named export** `export function SkeletonCard()` — no props.
  - [x] Container: same dimensions as `EventCard` (~200px height, full width), `bg-surface`, `overflow-hidden`, `accessibilityLabel="Loading events"`.
  - [x] Shimmer: an `Animated.View` looping opacity `0.3 → 0.6 → 0.3` over **1.2s** (`Animated.loop(Animated.sequence([...]))`, `useNativeDriver: true`), colour alternating between `#1C1814` and `#2A2420` (border-coloured overlay pulsing over the surface bg). Start the loop in a `useEffect`. Set `importantForAccessibility="no"` on the shimmer child.
  - [x] Animated transform/opacity is the **documented dynamic-style exception** (cannot be a static className) — comment it. Static layout still uses `className`.
- [x] Task 4: Co-located tests (AC: #4, #5, #6, #7, #8, #9, #10)
  - [x] `lib/formatDate.test.ts`: `formatEventDate('2026-05-30')` → `'Sat 30 May'`; assert a date that would shift under UTC parsing stays on the correct day (timezone-safety regression).
  - [x] `components/EventCard.test.tsx`: renders name/venue text; renders the **formatted** date (`Sat 30 May`, not `2026-05-30`); renders `CategoryPlaceholder` when `imageUrl` is `null` and renders `expo-image` (`UNSAFE_queryByType(Image)`) when a URL is present; image-error fallback covered; `onPress` fires on press; `accessibilityLabel` equals `"{name}, {formattedDate}, {venue}"`.
  - [x] `components/SkeletonCard.test.tsx`: renders without crashing; container has `accessibilityLabel="Loading events"`. Structural assertion only — no animation-frame assertions.
- [x] Task 5: Validation (AC: #10)
  - [x] Run `npx tsc --noEmit`, `npm test`, `npm run lint` — all clean. Confirm no regression in `CategoryPlaceholder` tests.

## Dev Notes

### Reuse — do NOT reinvent (critical)

- **`CategoryPlaceholder` already exists** (`components/CategoryPlaceholder.tsx`, Story 2.1) — it is the image fallback. Import and render it; do **not** rebuild gradient/emoji logic. It is full-bleed (`absolute inset-0`) and expects a positioned parent with explicit height — `EventCard`'s ~200px image area supplies that. It accepts a single `category: Category` prop, so pass `event.category`.
- **`Event` type** is `import type { Event } from '@/types'` (`types/event.ts`). Fields used here: `name`, `date` (ISO `"2026-06-14"`), `venue`, `imageUrl: string | null`, `category`. Optional fields are always `null`, never `undefined`.
- **Design tokens already defined** in `tailwind.config.js`: colours `background`/`surface`/`text-primary`/`text-secondary`/`accent`/`border`/`error`/`success`; fonts `font-inter` (400), `font-inter-medium` (500), `font-inter-semibold` (600), `font-inter-bold` (700). `constants/theme.ts` mirrors these as TS constants (`COLORS`, `FONT_FAMILY`, `FONT_SIZE`) if needed for non-className contexts. Use the className tokens; do not hardcode hex except where a value isn't a token (the gradient `rgba(15,12,9,0.95)` and shimmer `#1C1814`/`#2A2420` are dynamic `LinearGradient`/`Animated` props, which is the allowed exception).
- **`expo-image` (~56.0.9) and `expo-linear-gradient` (~56.0.4) are already installed** — no new dependencies. `Animated` is from `react-native` core.
- ⚠️ **`app/index.tsx` is a throwaway Story 1.4 prototype** with an inline, inline-styled "EventCard" and a local `CATEGORY_META`/`type Event`. Do **not** import from it or copy its patterns. `app/index.tsx` is **out of scope** for this story (Story 2.6 rebuilds the feed). Do not modify it.

### Component patterns (project-context.md + architecture)

- **`className` only — never `StyleSheet.create()` or `style={{}}`** in components. Documented exceptions for this story (add an inline comment at each): the `Pressable` pressed `scale: 0.93` transform (state-driven), the `LinearGradient` `colors` prop (dynamic value), and the `SkeletonCard` `Animated` opacity (runtime-driven). These mirror the precedent set in `CategoryPlaceholder` (dynamic `colors` prop).
- **Named exports everywhere** — `export function EventCard(...)`, `export function SkeletonCard(...)`, `export function formatEventDate(...)`. Only Expo Router screens (`app/*.tsx`) use default exports.
- **Path alias `@/*`** → project root. Use `@/types`, `@/components/CategoryPlaceholder`, `@/lib/formatDate`.
- **Navigation via callback props** — `EventCard` takes `onPress`; it never imports `expo-router`. (architecture + project-context)
- TypeScript `strict: true` — no `any`, no unused vars. `Event` fields are fully typed.
- **Press feedback is `scale` only — no opacity change on images** (opacity flicker on images is a known RN issue; UX spec UX-DR2 + architecture both call this out).

### Gradient overlay direction (gotcha)

UX-DR2 specifies `linear-gradient to-top: rgba(15,12,9,0.95) 0% → transparent 100%` — i.e. **opaque at the bottom, transparent at the top**. `expo-linear-gradient` defaults to a **top→bottom** sweep, so pass `colors={['transparent', 'rgba(15,12,9,0.95)']}` (first stop = top = transparent, last stop = bottom = opaque). `rgba(15,12,9,...)` is the `background` token `#0F0C09` at 95% alpha.

### Date formatting (gotcha — timezone)

FR-2 requires `"Sat 30 May"`. Build the date from ISO parts into a **local** `Date(y, m-1, d)` and format with fixed `WEEKDAYS`/`MONTHS` arrays. Do **not** use `new Date('2026-05-30')` (UTC midnight) nor `toLocaleDateString` (adds a comma and is locale/host dependent — breaks deterministic tests). Suggested shape:

```ts
const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

export function formatEventDate(isoDate: string): string {
  const [year, month, day] = isoDate.split('-').map(Number);
  const d = new Date(year, month - 1, day); // local — no UTC day-shift
  return `${WEEKDAYS[d.getDay()]} ${day} ${MONTHS[month - 1]}`;
}
```

### Testing standards (architecture §Test File Placement + Story 2.1 precedent)

- **Co-located** tests next to each file. Stack: Jest (`jest-expo` preset) + `@testing-library/react-native` (`render`, `screen`, `UNSAFE_getByType`). Run with `npm test`.
- Story 2.1 established: assert rendered text via `screen.queryByText(...).not.toBeNull()` (load-bearing, not `getByText(...).toBeTruthy()`); inspect third-party native component props (e.g. `LinearGradient`, `Image`) via `screen.UNSAFE_getByType(Component)`. `jest-expo` preserves these components' props.
- For `EventCard`'s fallback test: with `imageUrl: null`, assert the `CategoryPlaceholder`'s `LinearGradient` is present (or that no `expo-image` is rendered). With a URL, assert `expo-image` is present and `CategoryPlaceholder` is not.
- For `SkeletonCard`: assert it renders and exposes `accessibilityLabel="Loading events"`. **Do not** assert animation frame values — `Animated.loop` + native driver doesn't advance deterministically in jsdom; structural assertions only (use `jest.useFakeTimers()` only if a timer warning appears).
- Provide a small `Event` test fixture (all required fields, `imageUrl` toggled per test). Remember `null` (not `undefined`) for optional fields.

### Previous story intelligence (Story 2.1 — just completed)

- `CategoryPlaceholder` ships with a `FALLBACK_PLACEHOLDER` guard in `constants/categories.ts` for unmapped categories — so passing `event.category` is safe even for unexpected category strings.
- Test infra is wired: `jest-env.d.ts` (`/// <reference types="jest" />`) is in `tsconfig.json` include; `@types/jest@^29.5.14` and `jest@~29.7.0` are pinned to align with `jest-expo@56`. No test-tooling changes needed for this story.
- CI (`.github/workflows/ci.yml`) now runs **Lint → tsc → Jest** on every push/PR — keep all three green before marking review.
- NativeWind `className` confirmed to flow through to `expo-linear-gradient` via babel `jsxImportSource: 'nativewind'` — the same applies to `expo-image` and `Pressable`; no `StyleSheet` fallback was needed in 2.1.

### Project Structure Notes

- New files: `components/EventCard.tsx`, `components/EventCard.test.tsx`, `components/SkeletonCard.tsx`, `components/SkeletonCard.test.tsx`, `lib/formatDate.ts`, `lib/formatDate.test.ts`.
- No changes to existing components, `constants/`, `types/`, `tailwind.config.js`, or config files expected. No new dependencies.
- `components/**` and `lib/**` are already in the tailwind `content` array — classes will not be purged.
- All six files sit in dirs already covered by `tsconfig.json` include and the CI lint/test globs.

### References

- [Source: _bmad-output/planning-artifacts/epics.md#Story 2.2: EventCard + SkeletonCard Components] — full BDD acceptance criteria
- [Source: _bmad-output/planning-artifacts/ux-design-specification.md#EventCard] (UX-DR2) and [#SkeletonCard] (UX-DR6) — anatomy, states, shimmer spec, accessibility
- [Source: _bmad-output/planning-artifacts/ux-design-specification.md] lines 557–560 (3 fixed skeletons, fade transition, dimensions match), 694/741 (text overflow `numberOfLines`)
- [Source: _bmad-output/planning-artifacts/prds/.../prd-distillate.md#FR-2] — human-readable date "Sat 30 May", image else category placeholder
- [Source: _bmad-output/planning-artifacts/architecture.md#Implementation Patterns] — naming (`EventCard.tsx`, `formatDate.ts`), named exports, co-located tests, `className`-only, scale-not-opacity press feedback
- [Source: docs/project-context.md] — `expo-image` + placeholder, callback-prop navigation, `@/*` alias, null-not-undefined, NativeWind rules
- [Source: components/CategoryPlaceholder.tsx + constants/categories.ts] — fallback component to reuse, `FALLBACK_PLACEHOLDER`
- [Source: tailwind.config.js + constants/theme.ts] — design tokens (colours, fonts, sizes)
- [Source: types/event.ts] — `Event` interface

## Review Findings

_Code review 2026-06-16 (Blind Hunter + Edge Case Hunter + Acceptance Auditor). 1 decision-needed, 4 patch, 1 deferred, ~10 dismissed as noise. All 10 ACs assessed PASS by the Acceptance Auditor; findings are robustness/test-quality, not AC failures._

- [x] [Review][Patch] (resolved from decision) Guard `formatEventDate` input — empty/malformed/out-of-range/timestamp ISO strings render as `"undefined undefined undefined"` or a wrong day. **Decision: guard the util (option 1).** Validate parsed parts (3 numeric parts, month 1–12, the `Date` round-trips to the same y/m/d); on invalid input **return the raw `isoDate` string** (never "undefined"). Also fix the misleading "timezone-safe" test + add an invalid-input test. [lib/formatDate.ts]
- [x] [Review][Patch] EventCard image guard uses `event.imageUrl !== null`, so an empty-string `imageUrl` renders a broken `<Image source={{uri:''}}>` instead of the placeholder — use a truthiness check (`event.imageUrl && !imageError`). [components/EventCard.tsx:34]
- [x] [Review][Patch] `imageError` never resets — if a card's `event.imageUrl` changes in place (TanStack Query refetch, or index-keyed FlatList recycling) a stale error keeps showing the placeholder for a good image. Add `useEffect(() => setImageError(false), [event.imageUrl])`. [components/EventCard.tsx]
- [x] [Review][Patch] SkeletonCard test does not verify AC #9's `importantForAccessibility="no"` on the shimmer child — add that assertion (the one untested AC for this story). [components/SkeletonCard.test.tsx]
- [x] [Review][Patch] AC #2 gradient direction relies on `expo-linear-gradient`'s implicit top→bottom default — add explicit `start`/`end` props (or a comment) to lock the opaque-at-bottom intent. [components/EventCard.tsx:45]
- [x] [Review][Defer] SkeletonCard ignores reduced-motion — a constantly pulsing element should respect `AccessibilityInfo.isReduceMotionEnabled`. Out of AC scope; a future a11y polish (relevant to NFR-4). [components/SkeletonCard.tsx] — deferred, enhancement

## Dev Agent Record

### Agent Model Used

claude-opus-4-8 (Claude Opus 4.8)

### Debug Log References

- `npx jest lib/formatDate.test.ts` → RED (module not found) then GREEN: 3/3.
- `npx jest components/EventCard.test.tsx` → GREEN: 6/6 (image render, null + onError fallbacks, onPress, a11y label).
- `npx jest components/SkeletonCard.test.tsx` → GREEN: 1/1.
- First full `npx tsc --noEmit` + `npm run lint` surfaced 2 issues, both fixed (see Completion Notes); re-run clean.
- Final: `npx tsc --noEmit` clean; `npx jest` 4 suites / 15 tests passing; `npm run lint` clean.

### Completion Notes List

- `formatEventDate` parses ISO date parts into a **local** `Date` (no `new Date(iso)` UTC day-shift) and formats via fixed `WEEKDAYS`/`MONTHS` arrays → deterministic `"Sat 30 May"`, locale-independent. Timezone-safety covered by a dedicated test.
- `EventCard` renders `expo-image` when `imageUrl` is non-null and not errored, else `CategoryPlaceholder` (reused from Story 2.1). Gradient overlay `colors={['transparent','rgba(15,12,9,0.95)']}` keeps the opaque stop at the bottom (expo-linear-gradient sweeps top→bottom). Press scale 0.93 via the `Pressable` `style` function (documented dynamic-style exception, no opacity change). Navigation is callback-only (`onPress`).
- `SkeletonCard` pulses a border-coloured (`#2A2420`) overlay opacity 0.3→0.6→0.3 over a 1.2s `Animated.loop` on a surface (`#1C1814`) bg; `accessibilityLabel="Loading events"` on the container, `importantForAccessibility="no"` on the shimmer.
- **Two validation fixes:** (1) `tsc` — narrowed `event.imageUrl` by inlining the `imageUrl !== null && !imageError` condition in the JSX ternary so the `Image` `source.uri` is `string`, not `string | null`. (2) `lint` (`react-hooks/refs`) — replaced `useRef(new Animated.Value()).current` with lazy `useState(() => new Animated.Value(0.3))` to avoid reading a ref during render.
- No new dependencies. `app/index.tsx` (Story 1.4 throwaway prototype) left untouched per scope.
- **AC #1/#2/#3/#8 visual fidelity (200px sizing, gradient look, shimmer animation) is verified structurally + via tests; on-device eyeball deferred to QA — no simulator in this environment** (consistent with Story 2.1's AC #4 handling).

### File List

- `lib/formatDate.ts` (new)
- `lib/formatDate.test.ts` (new)
- `components/EventCard.tsx` (new)
- `components/EventCard.test.tsx` (new)
- `components/SkeletonCard.tsx` (new)
- `components/SkeletonCard.test.tsx` (new)

## Change Log

| Date | Change |
|------|--------|
| 2026-06-16 | Implemented Story 2.2: `EventCard` + `SkeletonCard` components and `formatEventDate` utility, each with co-located tests (15 tests, all green). tsc + lint clean. Status → review. On-device visual QA outstanding (no simulator in env). |
| 2026-06-16 | Addressed code review: 1 decision + 4 patches applied (formatEventDate input guard w/ raw-string fallback + invalid-input tests; EventCard empty-imageUrl truthiness guard; render-time `imageError` reset on source change; SkeletonCard AC#9 a11y assertion; explicit gradient `start`/`end`). 1 item deferred (reduced-motion). Tests now 21/21; tsc + lint clean. |
