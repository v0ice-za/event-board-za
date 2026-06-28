# Story 2.6: Event Feed Screen

Status: done

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As a user,
I want to open the app and immediately see a scrollable feed of upcoming JHB events that I can filter by category,
so that I can discover what's on this weekend in under 10 seconds.

This is the **capstone of Epic 2** — the screen that composes every component (2.1–2.4) and the hook (2.5) built so far into the live feed. It replaces the throwaway prototype in `app/index.tsx` (Story 1.4) entirely.

## Acceptance Criteria

1. **Screen shell:** `app/index.tsx` exports a **default** `FeedScreen` (Expo Router screen exception to the named-export rule). The throwaway prototype (local `EVENTS`, local `EventCard`, `CATEGORY_META`, all inline `style={{}}`) is **deleted**; styling is `className`-only. Root is a `SafeAreaView` (top edge) with `bg-background`, full height.
2. **Chips at top:** `ChipsRow` renders at the top of the screen with **"All" selected by default** (`activeCategory === null`). It sits above the feed and does **not** scroll away with the list.
3. **Feed list:** a `FlatList` of `EventCard` items renders below the chips, fed by `useEvents(activeCategory)`. Order (date ASC) and past-event exclusion are owned by the hook (FR-1) — the screen does not re-sort. `keyExtractor` uses `item.id`. The list has `accessible={false}` (screen reader navigates individual cards, not the container).
4. **Card tap → detail:** tapping a card calls `router.push('/event/{id}')` using the event's `id`. Navigation lives in the screen (boundary rule); `EventCard` receives an `onPress` callback.
5. **Loading state:** while `isLoading` is true (cold load only), render **exactly 3 `SkeletonCard`** in the list area **and** a skeleton chips strip in place of the interactive `ChipsRow` (chips also shimmer on first load). No spinner anywhere.
6. **Filter behaviour (FR-7):** tapping a category chip narrows the feed to that category immediately (re-runs `useEvents` with the new category); tapping the **active** chip again, or "All", resets to all events. The active-chip-toggle-off logic lives in the screen's `onSelect` handler (`ChipsRow` always emits the tapped category / `null` for All — it does not self-toggle).
7. **Session-scoped filter (FR-8):** the active category is held in `useState<Category | null>` local to the screen. It persists while the app is foregrounded/backgrounded (in-memory state survives) and resets to "All" only on a true app close/relaunch (component remount). No Context, no store, no persistence.
8. **Foreground refresh (UX-DR12):** when the app returns to the foreground (`AppState` → `'active'`), the feed **scrolls to top** (`FlatList` ref, not animated) **and** a soft background refresh is triggered via `refetch()`. The refresh must **not** flip the feed back to skeletons (relies on `useEvents` `isLoading` being cold-load-only — do not gate skeletons on `isFetching`).
9. **Empty category (FR-3):** when not loading, online, no error, and `events.length === 0`, render `EmptyState` variant `empty-category` with the active category (heading interpolates to "No {Category} events right now"; with All active it reads "No events right now"). Its `onAction` clears the filter (`setActiveCategory(null)`).
10. **Error, no cache (FR-3):** when `isError` is true and `events.length === 0` while **online**, render `EmptyState` variant `general-error`; its `onAction` calls `refetch()`.
11. **Offline, no cache (NFR-3):** when **offline** (`!isConnected`) and `events.length === 0`, render `EmptyState` variant `no-connection`; its `onAction` calls `refetch()`.
12. **Offline, with cache (NFR-3):** when **offline** and `events.length > 0` (cached events showing), render `OfflineBanner` above the list and still render the cached `FlatList`. No blank screen, ever.
13. **Ad slot seam (FR-9 prep):** an ad placeholder slot is rendered at **every 6th position** in the list (after the 6th, 12th, … card). It renders **nothing visible** now (zero height) and carries a stable `testID="feed-ad-slot"` so Story 5.1 can swap in `AdBannerUnit`. No AdMob import in this story.
14. **Accessibility (NFR-4):** every interactive element has an `accessibilityLabel`/`accessibilityRole` (inherited from `EventCard`/`CategoryChip`); the `FlatList` is `accessible={false}`; status bar is light (`expo-status-bar` `style="light"`).
15. **Performance (NFR-1):** `FlatList` is configured for smooth scroll (`initialNumToRender`, `windowSize`, `removeClippedSubviews`, `keyExtractor`) so initial content paints quickly; `expo-image` caching (already in `EventCard`) is relied on for images. (On-device ≤2s/4G verification is a Story-2.6 release/QA item — no simulator in this env.)
16. **Tests:** `app/index.test.tsx` covers, at minimum: (a) cold load renders 3 `SkeletonCard` + chips skeleton; (b) loaded state renders one card per event and a card tap calls `router.push('/event/{id}')`; (c) selecting a chip calls `useEvents` with that category and re-selecting it resets to `null`; (d) `empty-category` renders the category-specific heading and its action clears the filter; (e) `general-error` renders when `isError` + empty + online and its action calls `refetch`; (f) `no-connection` renders when offline + empty; (g) `OfflineBanner` shows when offline + cached events present; (h) an ad slot (`testID="feed-ad-slot"`) appears at the 6th position given ≥6 events; (i) returning to foreground triggers `refetch`.
17. **Gates:** `npx tsc --noEmit`, `npm test`, and `npm run lint` all pass with **no regressions** (current baseline: 10 suites / 60 tests green; lint 0 errors / 1 pre-existing `EmptyState.tsx` warning — do not introduce new warnings).

## Tasks / Subtasks

- [x] Task 1: Replace the prototype `app/index.tsx` with the real feed screen shell (AC: #1, #2, #3, #14)
  - [x] Delete all prototype code (`EVENTS`, local `EventCard`, `CATEGORY_META`, `CATEGORIES`, inline styles).
  - [x] `export default function FeedScreen()`. Wrap in `SafeAreaView` (`react-native-safe-area-context`, `edges={['top']}`) with `className="flex-1 bg-background"`. Add `<StatusBar style="light" />` from `expo-status-bar`.
  - [x] `const [activeCategory, setActiveCategory] = useState<Category | null>(null);`
  - [x] Call hooks: `const { events, isLoading, isError, refetch } = useEvents(activeCategory);` and `const { isConnected } = useNetworkState();`
  - [x] `const router = useRouter();` (from `expo-router`).
  - [x] Render `ChipsRow` (top, fixed) + a content area (below) holding the `FlatList`/state views. `FlatList` props: `data={events}`, `keyExtractor={(item) => item.id}`, `accessible={false}`, `showsVerticalScrollIndicator={false}`.
- [x] Task 2: Card rendering, navigation, and the ad slot seam (AC: #4, #13)
  - [x] `renderItem={({ item, index }) => (...)}` → render `<EventCard event={item} onPress={() => router.push(\`/event/${item.id}\`)} />`, and when `(index + 1) % 6 === 0` also render the ad placeholder beneath it.
  - [x] Ad placeholder: a zero-height `View` with `testID="feed-ad-slot"` and a comment `// Story 5.1 swaps this for <AdBannerUnit/>`. Renders nothing visible now.
- [x] Task 3: Filter selection + toggle-off (AC: #6, #7)
  - [x] `const handleSelect = (category: Category | null) => setActiveCategory((prev) => (prev === category ? null : category));` — passed to `ChipsRow` as `onSelect`. (Tapping the active chip emits its own category → toggles back to `null`. "All" emits `null`.)
- [x] Task 4: Loading state — skeleton feed + skeleton chips (AC: #5)
  - [x] When `isLoading`, render a skeleton chips strip in place of `ChipsRow` and exactly 3 `<SkeletonCard />` in the list area (do not mount the `FlatList`).
  - [x] Add `components/SkeletonChipsRow.tsx` (named export) — a presentational row of ~5 rounded shimmer pills reusing the SkeletonCard shimmer pattern (lazy `useState(() => new Animated.Value(0.3))`, `Animated.loop` opacity 0.3→0.6→0.3 over 1.2s, `useNativeDriver: true`), `accessibilityLabel="Loading filters"`. Co-locate `components/SkeletonChipsRow.test.tsx` (renders, has the loading label).
- [x] Task 5: Empty / error / offline states (AC: #9, #10, #11, #12)
  - [x] Implement the render-precedence decision (see Dev Notes "Render precedence") below the chips: no-connection-empty → general-error-empty → empty-category → list (+ OfflineBanner when offline with cached events).
  - [x] `EmptyState` callback is the single `onAction` prop (NOT `onClearFilter`/`onRetry`): empty-category → `() => setActiveCategory(null)`; general-error & no-connection → `refetch`.
- [x] Task 6: Foreground reset + soft refresh (AC: #8)
  - [x] `const listRef = useRef<FlatList<Event>>(null);` set on the `FlatList`.
  - [x] `useEffect` subscribing to `AppState.addEventListener('change', handler)`; on transition to `'active'`, call `listRef.current?.scrollToOffset({ offset: 0, animated: false })` then `refetch()`. Clean up the subscription on unmount. Guard against firing on the initial mount.
- [x] Task 7: Co-located tests `app/index.test.tsx` (AC: #16)
  - [x] Mock `@/hooks/useEvents` and `@/hooks/useNetworkState` (per-test return values to drive each state). Mock `expo-router` to provide `useRouter: () => ({ push })` AND `useFocusEffect: (cb) => cb()` (ChipsRow needs the latter).
  - [x] Cover AC #16 (a)–(i). For foreground (i): spy on `AppState.addEventListener`, capture the handler, invoke it with `'active'`, assert `refetch` called.
- [x] Task 8: Validation gates (AC: #17)
  - [x] `npx tsc --noEmit`, `npm test`, `npm run lint` — all clean, no regressions, no new lint warnings.

### Review Findings (code review 2026-06-22)

- [x] [Review][Decision→Patch] Foreground trigger fires on iOS `inactive` blips — **RESOLVED: Option 2, restrict to `background` only.** `AppState` handler will match `prev === 'background'` (not `/inactive|background/`) so Control Center / notification shade / biometric prompts (`active → inactive → active`) no longer yank the feed to top + refetch. Deviates from Dev Notes line 109 by design; update the AC #8 test (i) to drive `background → active` only (already does). [app/index.tsx:45]
- [x] [Review][Decision→Patch] Category switch shows full-screen skeleton that hides ChipsRow — **RESOLVED: Option 2, gate full skeleton to initial mount.** The `if (isLoading)` full-screen skeleton (SkeletonChipsRow + 3 SkeletonCard) applies only on initial cold load (`activeCategory === null`); for a per-category cold load (`activeCategory !== null`) keep the interactive `ChipsRow` mounted and skeleton only the list region (3 SkeletonCard below the chips). Preserves the user's chip anchor on a filter tap. [app/index.tsx:59]
- [x] [Review][Patch] AppState effect re-subscribes the listener on every render (unstable `refetch` identity) [app/index.tsx:41-52] — RESOLVED: `refetch` held in `refetchRef`, updated in a `[refetch]` effect (canonical latest-ref pattern, lint-clean); the subscribe effect now uses `[]` deps so the `AppState` listener subscribes exactly once.
- [x] [Review][Patch] Tighten the ad-slot test [app/index.test.tsx] — RESOLVED: test (h) now asserts 5 events → 0 slots (rules out index-0 / `% 5` regressions) and 6 events → exactly 1 slot. (12-event → 2-slot omitted: the 12th row is beyond `initialNumToRender=6` and would not paint synchronously under RNTL — noted in the test.)
- [x] [Review][Patch] Replace the white-box `row.props.children.length` assertion [components/SkeletonChipsRow.test.tsx] — RESOLVED: each pill carries `testID="skeleton-chip-pill"`; the test asserts `getAllByTestId(...)` has length 5 (rendered-output query, survives structure refactors).
- [x] [Review][Patch] Add a state-transition test via RNTL `rerender` [app/index.test.tsx] — RESOLVED: new test (j) drives general-error → recovered list → no-connection across `rerender`s; new test (k) covers the per-category cold-load behaviour (ChipsRow stays mounted, list-only skeletons).
- [x] [Review][Defer] `removeClippedSubviews` + interleaved conditional ad-slot may blank/recycle rows once a live ad lands [app/index.tsx:104-111] — deferred to Story 5.1 (zero-height now; revisit when `AdBannerUnit` replaces the seam — consider injecting ad rows into the data array)
- [x] [Review][Defer] Trailing ad rendered when `events.length % 6 === 0` (ad as the last row) [app/index.tsx:108] — deferred to Story 5.1 (harmless zero-height now; product call whether a terminal ad is wanted)
- [x] [Review][Defer] `EventCard` can render literal "undefined" for a doc with null `name`/`venue` [hooks/useEvents.ts:84] — deferred, pre-existing (useEvents trust-boundary / backend validation, not this screen)
- [x] [Review][Defer] Online error-with-cached-events shows a stale list with no error/stale indicator [app/index.tsx:80] — deferred (spec deliberately serves cached data on error; optional future UX enhancement)

## Dev Notes

### Reuse — do NOT reinvent (critical)

Everything below already exists and is tested. Import and compose — do **not** rebuild any of it.

| Need | Import | Public contract |
|---|---|---|
| Feed data | `import { useEvents } from '@/hooks/useEvents';` | `useEvents(category: Category \| null) → { events: Event[]; isLoading: boolean; isError: boolean; refetch: () => void }` |
| Connectivity | `import { useNetworkState } from '@/hooks/useNetworkState';` | `() → { isConnected: boolean }` (coerces unknown → `true`, never flashes offline) |
| Filter row | `import { ChipsRow } from '@/components/ChipsRow';` | props `{ activeCategory: Category \| null; onSelect: (c: Category \| null) => void }` — "All" pinned, 8 chips scroll, focus-pulse built in |
| Card | `import { EventCard } from '@/components/EventCard';` | props `{ event: Event; onPress: () => void }` — image/placeholder fallback, gradient, a11y label all internal |
| Loading card | `import { SkeletonCard } from '@/components/SkeletonCard';` | no props; ~200px shimmer; `accessibilityLabel="Loading events"` |
| Terminal states | `import { EmptyState } from '@/components/EmptyState';` | props `{ variant: 'empty-category' \| 'no-connection' \| 'general-error'; category?: Category \| null; onAction: () => void }` — **single `onAction` callback**, not separate retry/clear |
| Offline strip | `import { OfflineBanner } from '@/components/OfflineBanner';` | no props; presentational; `accessibilityRole="alert"` |
| Types | `import type { Category, Event } from '@/types';` | — |

- **`EmptyState` has ONE callback: `onAction`.** Wire clear-filter or refetch into it depending on variant. Do not invent `onClearFilter`/`onRetry` props — they don't exist.
- **`ChipsRow` does NOT toggle.** Tapping a category chip always emits that category; the screen decides whether that means "select" or "deselect" (toggle-off). See Task 3.
- **The screen never touches Firestore.** All data flows through `useEvents`. No `@react-native-firebase/*` import here.
- **Navigation is screen-only.** `router.push` lives here; components get callbacks. Route target is `app/event/[id].tsx` → `router.push(\`/event/${id}\`)`.

### Render precedence (single source of truth for the body region)

Decide what to render **below the chips** in this exact order (first match wins):

```
if (isLoading)                          → SkeletonChipsRow + 3× SkeletonCard   (skip ChipsRow + FlatList)
else render ChipsRow, then:
  if (!isConnected && events.length===0) → <EmptyState variant="no-connection" onAction={refetch} />
  else if (isError && events.length===0) → <EmptyState variant="general-error" onAction={refetch} />
  else if (events.length===0)            → <EmptyState variant="empty-category" category={activeCategory} onAction={() => setActiveCategory(null)} />
  else                                    → [ !isConnected && <OfflineBanner /> ]  +  <FlatList ... />
```

Rationale: offline-with-no-cache is distinct from a generic error (NFR-3 wants a connection-specific message); offline-with-cache shows the banner + stale data rather than an error (Firestore disk persistence serves cached docs). `events.length === 0` is the only "empty" signal the hook exposes — there is no separate empty flag.

### State management (architecture §State + project-context)

- UI state = `useState` in the screen; server state = TanStack Query via `useEvents`. **No Context, no Zustand/Redux** (architecture.md:181-185, 386-390).
- `activeCategory: Category | null` — `null` is the canonical "All". `ChipsRow` already renders "All" active when `activeCategory === null`.
- Session persistence (FR-8) is automatic: the state lives in memory and is recreated on a fresh app launch. Do **not** add AsyncStorage/persistence — "resets on app close" is the requirement, not "persists across launches".

### Foreground behaviour (UX-DR12 / architecture cross-cutting)

- Use React Native core `AppState` (`import { AppState } from 'react-native'`). Track the previous state in a ref; act only on `inactive|background → active` transitions (avoid firing on first mount).
- `refetch()` is a **background** refresh — because `useEvents` maps v5 `isLoading` (`isPending && isFetching`), an established list will **not** drop back to skeletons during the refetch (verified in Story 2.5). Do not gate skeletons on `isFetching`.
- `listRef.current?.scrollToOffset({ offset: 0, animated: false })` resets scroll to top. Guard for `null` (list may be unmounted in an empty/error state).

### FlatList configuration (NFR-1 performance)

- `keyExtractor={(item) => item.id}`, `initialNumToRender={4}`, `windowSize={7}`, `maxToRenderPerBatch={6}`, `removeClippedSubviews` (Android benefit; safe on iOS), `showsVerticalScrollIndicator={false}`, `accessible={false}`.
- Each `EventCard` is ~200px full-bleed and full-width — give list rows no extra horizontal padding so the full-bleed look is preserved (the prototype's `paddingHorizontal:16` + `borderRadius` is gone; cards are edge-to-edge per UX-DR2).
- Do not wrap each row in extra `View`s with inline styles; if vertical spacing between cards is wanted, use a `className` gap on a small wrapper or `ItemSeparatorComponent` (a `className`-styled `View`). Keep it `className`-only.

### NativeWind / styling rules (project-context, architecture §Format)

- `className` only. The **only** allowed inline `style` are the documented dynamic exceptions already used in child components (press scale, animated opacity) — the screen itself should need **no** inline styles except possibly the `FlatList` `contentContainerStyle` if a className can't express it (prefer `contentContainerClassName` / wrapper). Document any exception with a comment.
- Colours via tokens: `bg-background` (#0F0C09), `bg-surface`, `text-text-primary`, `text-text-secondary`, `border-border`, `bg-accent`. Do not hardcode hex in the screen.
- If `className` does not apply to `SafeAreaView`/`FlatList` from a library in your setup, fall back to a `bg-background` wrapper `View` (`flex-1`) inside — note it with a comment. NativeWind v4 `cssInterop` covers RN core components; `SafeAreaView` from `react-native-safe-area-context` accepts `className` in this project's config.

### Testing notes (Stories 2.1–2.5 precedent)

- `jest-expo` preset, `@testing-library/react-native`, co-located, **per-file `jest.mock`**, no global setup. `expo-image` / `expo-linear-gradient` render fine under `jest-expo` (no manual mock needed — see `EventCard.test.tsx`).
- **Mock the hooks** to drive states deterministically:
  ```typescript
  const mockRefetch = jest.fn();
  let mockUseEvents = { events: [] as Event[], isLoading: false, isError: false, refetch: mockRefetch };
  jest.mock('@/hooks/useEvents', () => ({ useEvents: jest.fn(() => mockUseEvents) }));
  let mockNet = { isConnected: true };
  jest.mock('@/hooks/useNetworkState', () => ({ useNetworkState: jest.fn(() => mockNet) }));
  ```
  Reassign the module-scoped objects (or use `mockReturnValue`) per test, then `render(<FeedScreen />)`.
- **Mock `expo-router` once** to satisfy BOTH the screen (`useRouter().push`) and `ChipsRow` (`useFocusEffect`):
  ```typescript
  const push = jest.fn();
  jest.mock('expo-router', () => ({
    useRouter: () => ({ push }),
    useFocusEffect: (cb: () => void) => cb(),
  }));
  ```
- Assert chip-driven filtering by spying on `useEvents`: after `fireEvent.press(screen.getByText('Music'))`, assert the latest `useEvents` mock call arg is `'Music'`; press 'Music' again → arg back to `null`.
- Card tap: `fireEvent.press(screen.getAllByRole('button')[n])` then assert `push` called with `/event/{id}`. (Chips are also role "button" — target cards via their `accessibilityLabel` `{name}, {date}, {venue}` to disambiguate, e.g. `screen.getByLabelText(/Jazz/)`.)
- Foreground (AC #16i): `const addSpy = jest.spyOn(AppState, 'addEventListener')`, render, grab the captured handler `addSpy.mock.calls[0][1]`, call `handler('active')`, assert `mockRefetch` toHaveBeenCalled. (Returning a `{ remove }` subscription from the spy may be needed so cleanup doesn't throw.)
- Ad slot: build ≥6 events, assert `screen.getAllByTestId('feed-ad-slot').length >= 1`.
- Reset state objects + `jest.clearAllMocks()` in `beforeEach` so per-test states don't bleed.

### Conventions (project-context.md)

- Screen file = **default export** (the one place it's allowed). New `SkeletonChipsRow` is a component → **named export**.
- Path alias `@/*`. `strict: true`, no `any` (use `Category | null`, `Event`). No `try/catch` in the screen — errors arrive via `useEvents.isError`.
- No new dependencies — `react-native` (`FlatList`, `AppState`, `Animated`), `expo-router`, `expo-status-bar`, `react-native-safe-area-context` are all already installed (see `package.json`).

### Project Structure Notes

- **Modified:** `app/index.tsx` (prototype → real feed screen).
- **New:** `app/index.test.tsx`, `components/SkeletonChipsRow.tsx`, `components/SkeletonChipsRow.test.tsx`.
- `app/**`, `components/**`, `hooks/**` are already in `tailwind.config.js` content globs, the `@/*` alias, and CI globs. `jest.config`/`jest-expo` `transformIgnorePatterns` already cover `expo*` / `@react-native(-community)?`.
- **Do not** modify `app/_layout.tsx` (providers/fonts/AdMob init already correct) or any of the 2.1–2.5 components/hooks. If a child genuinely lacks a needed prop, prefer composing in the screen over editing the child (raise it if truly blocked).
- On-device verification (real Firestore feed, ≤2s/4G, offline cache, foreground refresh, scroll restoration on back which is Epic 3) is deferred to release/QA — no simulator in this environment, consistent with Stories 2.1–2.5.

### References

- [Source: _bmad-output/planning-artifacts/epics.md#Story 2.6] — ChipsRow at top + "All" default, FlatList date-asc, 3 skeletons + chip shimmer, filter narrow/reset (FR-7), session `useState` (FR-8), foreground reset + soft refresh, empty-category / general-error / OfflineBanner states, ≤2s/4G (NFR-1), a11y (NFR-4), ad slot every 6th position
- [Source: _bmad-output/planning-artifacts/architecture.md] — :181-185, :386-390 (useState UI state, no store), :391-405 (hook contracts), :411-424 (loading/error/skeleton-not-spinner, no try/catch), :427-431 (className-only), :585-587 (navigation only in screens), :597-614 (loading + foreground), :609-614 (offline path), :661-672 (pagination/limit, a11y pattern)
- [Source: _bmad-output/planning-artifacts/ux-design-specification.md] — :555-567 (initial feed load: 3 skeletons + chip shimmer; ad zero-height), :571-593 (empty/error/no-connection variants + "no blank screens" rule), :597-614 (navigation + foreground/background), :618-639 (chip layout, single-select toggle, session persistence), :699 (FlatList `accessible={false}`)
- [Source: docs/project-context.md] — Expo Router default-export exception, `className`-only, `eventKeys` factory, server-state-only-via-TanStack, errors via `isError`, null-not-undefined, `@/*` alias
- [Source: app/index.tsx] — prototype being replaced (delete local `EVENTS`/`EventCard`/`CATEGORY_META`)
- [Source: components/ChipsRow.tsx, EventCard.tsx, SkeletonCard.tsx, EmptyState.tsx, OfflineBanner.tsx] — exact prop contracts composed by this screen
- [Source: hooks/useEvents.ts, hooks/useNetworkState.ts] — data + connectivity contracts
- [Source: _bmad-output/implementation-artifacts/2-5-useevents-hook.md] — `isLoading` is cold-load-only (background refetch won't re-skeleton); offline-cold returns `[]` (Story 2.6 disambiguates via `useNetworkState`/`OfflineBanner` — this story closes that loop)

## Dev Agent Record

### Agent Model Used

claude-opus-4-8 (Claude Code, bmad-dev-story workflow)

### Debug Log References

- `npx tsc --noEmit` → exit 0 (strict clean)
- `npx jest` → 12 suites / 71 tests passed, no regressions (`app/index.test.tsx` 9/9, `components/SkeletonChipsRow.test.tsx` 2/2; prior baseline 10 suites / 60 tests)
- `npm run lint` → 0 errors, 1 pre-existing warning (`components/EmptyState.tsx` `fallbackConfig`, Story 2.4 — not introduced here)

### Completion Notes List

- Replaced the Story 1.4 prototype `app/index.tsx` entirely with the real feed screen composing `ChipsRow` + `useEvents(activeCategory)` + `EventCard`/`SkeletonCard` + `EmptyState`/`OfflineBanner` + `useNetworkState`. `className`-only; default export (Expo Router screen).
- All 17 ACs implemented: "All"-default chips, FlatList (`accessible={false}`, `keyExtractor=id`), card-tap `router.push('/event/{id}')`, cold-load 3 `SkeletonCard` + skeleton chips, filter toggle-off in the screen handler (FR-7), session `useState` (FR-8), foreground `AppState`→top-scroll + soft `refetch` (UX-DR12), full empty/error/offline render-precedence (FR-3/NFR-3), ad-slot seam at every 6th position (`testID="feed-ad-slot"`, Story 5.1 prep), light status bar.
- **Deviation (documented): top safe-area inset via `useSafeAreaInsets()` hook + `style={{ paddingTop: insets.top }}` on a plain `View`, instead of the story's prescribed `<SafeAreaView>`.** Reason: NativeWind's safe-area-context cssInterop (`react-native-css-interop/.../react-native-safe-area-context.native.tsx`) crashes under jest-expo when `SafeAreaView`/`SafeAreaProvider` render (`maybeHijackSafeAreaProvider` reads `displayName` off an undefined type via the JSX wrapper). The hook approach yields the identical visual result (respects the top inset), keeps `className` styling everywhere else, and the `paddingTop` inline style is the project's sanctioned dynamic-style exception. `SafeAreaProvider` already lives in `app/_layout.tsx`, so the hook resolves correctly on device.
- **Minor deviation:** `FlatList initialNumToRender={6}` (story Dev Notes suggested 4) so the every-6th ad-slot seam paints on the first screen without a scroll and is unit-testable; still a reasonable first-screen budget for ~200px cards.
- Added `components/SkeletonChipsRow.tsx` (named export) for the cold-load chip shimmer (AC #5), reusing SkeletonCard's Animated opacity-loop pattern; co-located test.
- Test mocking: per-file `jest.mock` of `@/hooks/useEvents`, `@/hooks/useNetworkState`, `expo-router` (one factory serves both the screen's `useRouter` and ChipsRow's `useFocusEffect`), `expo-status-bar`, and `react-native-safe-area-context` (`useSafeAreaInsets` only). Foreground test drives a captured `AppState` `change` handler `background`→`active`. The `act()` console lines are async font-loading noise from `@expo/vector-icons` icons inside `EmptyState` — not failures.
- On-device verification (real Firestore feed, ≤2s/4G NFR-1, offline disk-cache behaviour, foreground refresh, and scroll-restoration on back which is Epic 3) deferred to release/QA — no simulator in this environment, consistent with Stories 2.1–2.5.

### File List

- `app/index.tsx` (modified — Story 1.4 prototype replaced with the real feed screen)
- `app/index.test.tsx` (new)
- `components/SkeletonChipsRow.tsx` (new)
- `components/SkeletonChipsRow.test.tsx` (new)

## Change Log

| Date | Change |
|------|--------|
| 2026-06-21 | Story created (ready-for-dev). Capstone of Epic 2: replaces the `app/index.tsx` prototype with the real feed screen composing `ChipsRow` + `useEvents` + `EventCard`/`SkeletonCard` + `EmptyState`/`OfflineBanner` + `useNetworkState`. Defines filter toggle (FR-7), session state (FR-8), foreground reset + soft refresh (UX-DR12), full render-precedence for empty/error/offline states, ad-slot seam at every 6th position (Story 5.1 prep), FlatList perf + a11y, and a new `SkeletonChipsRow` for the cold-load chip shimmer. No new deps. |
| 2026-06-21 | Implemented all 17 ACs + `SkeletonChipsRow`. Gates green (tsc 0, jest 12 suites/71 tests, lint 0 errors). Deviation: top inset via `useSafeAreaInsets()` hook instead of `<SafeAreaView>` (NativeWind safe-area cssInterop crashes under jest-expo); `FlatList initialNumToRender=6` for ad-slot paint/testability. Status → review. |
| 2026-06-22 | Code review complete (2 decisions + 4 patches resolved, 4 deferred, 5 dismissed). Decisions: foreground refresh restricted to `background→active` only (drop iOS `inactive` blips); full-screen skeleton gated to initial mount (`activeCategory === null`) — per-category cold loads keep ChipsRow mounted and skeleton only the list. Patches: stabilised the AppState listener via latest-ref + `[]` deps; tightened ad-slot test (5→0, 6→1); replaced white-box SkeletonChipsRow assertion with `testID` query; added transition test (j) + per-category-skeleton test (k). Gates re-run green (tsc 0, jest 12 suites/73 tests, lint 0 errors / 1 pre-existing warning). Status → done. |
