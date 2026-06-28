# Story 3.3: Event Detail Screen

Status: review

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As a user,
I want to see the full details of an event after tapping a card, and be able to book tickets without leaving the app,
so that I have all the information I need to decide whether to attend, and can book immediately if I want to.

This is the **capstone of Epic 3 (Event Detail & Ticketing)**. It replaces the Story 1.1 placeholder at `app/event/[id].tsx` with the real detail screen, **wiring together the two components already built this epic**: `useEventDetail` (Story 3.1, the data hook) and `WebViewModal` (Story 3.2, the ticket webview). It also reuses `CategoryPlaceholder`, `EmptyState`, `expo-image`, and the safe-area + navigation patterns established by the feed screen (`app/index.tsx`). After this story, the full UJ-1 journey works end-to-end: feed â†’ tap card â†’ detail â†’ tap Tickets â†’ in-app webview â†’ back â†’ detail â†’ back â†’ feed (exact scroll position).

## Acceptance Criteria

1. **Screen contract:** `app/event/[id].tsx` is the route screen (Expo Router). It keeps `export default function EventDetailScreen()` (screen files are the **only** default-export exception) and reads the route param via `const { id } = useLocalSearchParams<{ id: string }>()`. It calls `useEventDetail(id)` (Story 3.1) for its data â€” no direct Firestore access, no `try/catch`.
2. **Hero image (220px) with placeholder fallback:** a **220px**-tall, full-width hero renders at the top using `expo-image` (`contentFit="cover"`). On `imageUrl === null` **or** image load error, it falls back to `<CategoryPlaceholder category={event.category} />` (reuse the exact `imageUrl && !imageError` + `onError`/`setImageError` pattern from `components/EventCard.tsx`, including the adjust-state-during-render reset when the url changes). (UX-DR10)
3. **Back pill (top-left, always reachable):** a semi-transparent dark pill back button is overlaid at the top-left, respecting the safe-area top inset (`useSafeAreaInsets()`), with a `Feather name="chevron-left"` glyph â€” same visual treatment as `WebViewModal`'s back pill (`rounded-full bg-background/60`, `min-h-[44px] min-w-[44px]`, chevron `COLORS.textPrimary`). It is rendered as a **fixed overlay at the screen root (outside/above the ScrollView)** so it stays reachable while the body scrolls. Tapping it calls `router.back()`. `accessibilityRole="button"`, `accessibilityLabel="Back"`. (UX-DR10, FR-6)
4. **Back restores feed scroll position (FR-6):** tapping back returns to the feed at its **exact prior scroll position**. This is inherent to the Expo Router **native stack** (the feed screen is not unmounted on push â€” architecture.md:474 "Expo Router stack â€” automatic"); the screen must use `router.back()` (a stack pop), **never** `router.push('/')` (which would mount a fresh feed and lose scroll + filter state).
5. **Scrollable body, exact field order (FR-4):** below the hero, a scrollable body (`ScrollView`) renders in this order: **category tag** (`event.category`, accent colour `text-accent`, 13sp/500 `font-inter-medium`) â†’ **event name** (18sp/700 `font-inter-bold`, `text-text-primary`) â†’ **metadata block**: date+time, venue+address, price â†’ **description**. Date+time = `formatEventDate(event.date)` (reuse `lib/formatDate.ts`) plus the time when `event.time` is non-null (e.g. `Sat 30 May Â· 19:00`). Venue (`event.venue`, always present) plus the address line only when `event.address` is non-null.
6. **Absent optional fields omitted entirely (FR-4):** when `event.address`, `event.price`, or `event.description` is `null`, that line/block is **omitted** â€” no "N/A", no blank row, no empty label. `price` and `description` render verbatim only when non-null (`event.price` is already `"R150"` / `"Free"` / `null`; no transformation).
7. **Sticky Tickets CTA when ticketLink present (FR-5):** when `event.ticketLink` is non-null, a **sticky** bottom CTA renders: full-width, **48px** height, accent background (`bg-accent` #FF6B35), label text `text-text-primary` 16sp/600 (`font-inter-semibold`), 8px radius, pinned to the screen bottom with the safe-area **bottom** inset applied. Tapping it opens `WebViewModal` with `url={event.ticketLink}` (Story 3.2). `accessibilityRole="button"`, `accessibilityLabel={`Get tickets for ${event.name}`}` (UX:538).
8. **No-ticket state retains the CTA area (UX-DR11):** when `event.ticketLink` is `null`, the sticky bottom area is **retained** (never disappears) but renders a **non-interactive** label "No tickets required" (`text-text-secondary` #8A7E70, 13sp/400 `font-inter`, centred) â€” not a disabled button, not removed.
9. **WebViewModal integration (mount-controlled):** the screen holds `const [showTickets, setShowTickets] = useState(false)`. The CTA sets it `true`; `WebViewModal` is rendered only when `showTickets && event.ticketLink` (`<WebViewModal url={event.ticketLink} onClose={() => setShowTickets(false)} />`). Closing returns to the detail view (the modal unmounts), per the 3.2 mount-controlled contract.
10. **Loading state â€” detail skeleton (not a spinner):** while `isLoading` is true (cold load), render a skeleton layout matching the detail shape â€” a 220px `bg-surface` hero placeholder + a few `bg-surface` body placeholder bars (category/name/meta). **No spinner.** Give it `accessibilityLabel="Loading event"`. (architecture.md:413)
11. **Error state â€” general-error EmptyState + Retry + back (FR-3):** when `isError` is true, render the `general-error` `EmptyState` (reuse `components/EmptyState.tsx`, variant `"general-error"`) with the back pill still present so the user can leave. `EmptyState`'s Retry (`onAction`) re-fetches the detail query via `useQueryClient().invalidateQueries({ queryKey: eventKeys.detail(id) })` (uses the `eventKeys` factory; `useEventDetail` exposes no `refetch` by design â€” Story 3.1). See Dev Notes "Detail error: Retry vs back (resolved conflict)".
12. **Accessibility (NFR-4):** every interactive element has `accessibilityLabel` + `accessibilityRole` â€” the back pill ("Back"/button), the Tickets CTA ("Get tickets for {name}"/button). `EmptyState` and `CategoryPlaceholder` carry their own (decorative placeholder is `accessible={false}`).
13. **Conventions & gates:** default export (screen-file exception) â€” everything else named; `@/*` alias imports; NativeWind `className` for static styles, inline `style` only for documented dynamic exceptions (safe-area insets); no `try/catch`; no `any`; TypeScript `strict` clean. **No new dependencies.** `npx tsc --noEmit`, `npm test`, `npm run lint` all pass with **no regressions** (baseline after Story 3.2: 14 suites / 82 tests green; lint 0 errors / 1 pre-existing `EmptyState.tsx` warning â€” do not add new warnings).
14. **Tests:** `app/event/[id].test.tsx` (co-located) covers, at minimum: (a) loading â†’ skeleton (`Loading event`), no body; (b) loaded â†’ name, category, formatted date+time, venue, address, price, description all render, hero image present; (c) null `address`/`price`/`description` are omitted (no blank/"N/A"); (d) null `imageUrl` â†’ `CategoryPlaceholder` fallback; (e) `ticketLink` non-null â†’ "Get tickets" CTA present, pressing it mounts `WebViewModal` (mocked) with the url; (f) `ticketLink` null â†’ "No tickets required" label, no CTA; (g) back pill press calls `router.back()` once; (h) `isError` â†’ general-error `EmptyState` renders and Retry calls `invalidateQueries` with `eventKeys.detail(id)`.


  # Story 3.3: Event Detail Screen

Status: ready-for-dev

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As a user,
I want to see the full details of an event after tapping a card, and be able to book tickets without leaving the app,
so that I have all the information I need to decide whether to attend, and can book immediately if I want to.

This is the **capstone of Epic 3 (Event Detail & Ticketing)**. It replaces the Story 1.1 placeholder at `app/event/[id].tsx` with the real detail screen, **wiring together the two components already built this epic**: `useEventDetail` (Story 3.1, the data hook) and `WebViewModal` (Story 3.2, the ticket webview). It also reuses `CategoryPlaceholder`, `EmptyState`, `expo-image`, and the safe-area + navigation patterns established by the feed screen (`app/index.tsx`). After this story, the full UJ-1 journey works end-to-end: feed â†’ tap card â†’ detail â†’ tap Tickets â†’ in-app webview â†’ back â†’ detail â†’ back â†’ feed (exact scroll position).

## Acceptance Criteria

1. **Screen contract:** `app/event/[id].tsx` is the route screen (Expo Router). It keeps `export default function EventDetailScreen()` (screen files are the **only** default-export exception) and reads the route param via `const { id } = useLocalSearchParams<{ id: string }>()`. It calls `useEventDetail(id)` (Story 3.1) for its data â€” no direct Firestore access, no `try/catch`.
2. **Hero image (220px) with placeholder fallback:** a **220px**-tall, full-width hero renders at the top using `expo-image` (`contentFit="cover"`). On `imageUrl === null` **or** image load error, it falls back to `<CategoryPlaceholder category={event.category} />` (reuse the exact `imageUrl && !imageError` + `onError`/`setImageError` pattern from `components/EventCard.tsx`, including the adjust-state-during-render reset when the url changes). (UX-DR10)
3. **Back pill (top-left, always reachable):** a semi-transparent dark pill back button is overlaid at the top-left, respecting the safe-area top inset (`useSafeAreaInsets()`), with a `Feather name="chevron-left"` glyph â€” same visual treatment as `WebViewModal`'s back pill (`rounded-full bg-background/60`, `min-h-[44px] min-w-[44px]`, chevron `COLORS.textPrimary`). It is rendered as a **fixed overlay at the screen root (outside/above the ScrollView)** so it stays reachable while the body scrolls. Tapping it calls `router.back()`. `accessibilityRole="button"`, `accessibilityLabel="Back"`. (UX-DR10, FR-6)
4. **Back restores feed scroll position (FR-6):** tapping back returns to the feed at its **exact prior scroll position**. This is inherent to the Expo Router **native stack** (the feed screen is not unmounted on push â€” architecture.md:474 "Expo Router stack â€” automatic"); the screen must use `router.back()` (a stack pop), **never** `router.push('/')` (which would mount a fresh feed and lose scroll + filter state).
5. **Scrollable body, exact field order (FR-4):** below the hero, a scrollable body (`ScrollView`) renders in this order: **category tag** (`event.category`, accent colour `text-accent`, 13sp/500 `font-inter-medium`) â†’ **event name** (18sp/700 `font-inter-bold`, `text-text-primary`) â†’ **metadata block**: date+time, venue+address, price â†’ **description**. Date+time = `formatEventDate(event.date)` (reuse `lib/formatDate.ts`) plus the time when `event.time` is non-null (e.g. `Sat 30 May Â· 19:00`). Venue (`event.venue`, always present) plus the address line only when `event.address` is non-null.
6. **Absent optional fields omitted entirely (FR-4):** when `event.address`, `event.price`, or `event.description` is `null`, that line/block is **omitted** â€” no "N/A", no blank row, no empty label. `price` and `description` render verbatim only when non-null (`event.price` is already `"R150"` / `"Free"` / `null`; no transformation).
7. **Sticky Tickets CTA when ticketLink present (FR-5):** when `event.ticketLink` is non-null, a **sticky** bottom CTA renders: full-width, **48px** height, accent background (`bg-accent` #FF6B35), label text `text-text-primary` 16sp/600 (`font-inter-semibold`), 8px radius, pinned to the screen bottom with the safe-area **bottom** inset applied. Tapping it opens `WebViewModal` with `url={event.ticketLink}` (Story 3.2). `accessibilityRole="button"`, `accessibilityLabel={`Get tickets for ${event.name}`}` (UX:538).
8. **No-ticket state retains the CTA area (UX-DR11):** when `event.ticketLink` is `null`, the sticky bottom area is **retained** (never disappears) but renders a **non-interactive** label "No tickets required" (`text-text-secondary` #8A7E70, 13sp/400 `font-inter`, centred) â€” not a disabled button, not removed.
9. **WebViewModal integration (mount-controlled):** the screen holds `const [showTickets, setShowTickets] = useState(false)`. The CTA sets it `true`; `WebViewModal` is rendered only when `showTickets && event.ticketLink` (`<WebViewModal url={event.ticketLink} onClose={() => setShowTickets(false)} />`). Closing returns to the detail view (the modal unmounts), per the 3.2 mount-controlled contract.
10. **Loading state â€” detail skeleton (not a spinner):** while `isLoading` is true (cold load), render a skeleton layout matching the detail shape â€” a 220px `bg-surface` hero placeholder + a few `bg-surface` body placeholder bars (category/name/meta). **No spinner.** Give it `accessibilityLabel="Loading event"`. (architecture.md:413)
11. **Error state â€” general-error EmptyState + Retry + back (FR-3):** when `isError` is true, render the `general-error` `EmptyState` (reuse `components/EmptyState.tsx`, variant `"general-error"`) with the back pill still present so the user can leave. `EmptyState`'s Retry (`onAction`) re-fetches the detail query via `useQueryClient().invalidateQueries({ queryKey: eventKeys.detail(id) })` (uses the `eventKeys` factory; `useEventDetail` exposes no `refetch` by design â€” Story 3.1). See Dev Notes "Detail error: Retry vs back (resolved conflict)".
12. **Accessibility (NFR-4):** every interactive element has `accessibilityLabel` + `accessibilityRole` â€” the back pill ("Back"/button), the Tickets CTA ("Get tickets for {name}"/button). `EmptyState` and `CategoryPlaceholder` carry their own (decorative placeholder is `accessible={false}`).
13. **Conventions & gates:** default export (screen-file exception) â€” everything else named; `@/*` alias imports; NativeWind `className` for static styles, inline `style` only for documented dynamic exceptions (safe-area insets); no `try/catch`; no `any`; TypeScript `strict` clean. **No new dependencies.** `npx tsc --noEmit`, `npm test`, `npm run lint` all pass with **no regressions** (baseline after Story 3.2: 14 suites / 82 tests green; lint 0 errors / 1 pre-existing `EmptyState.tsx` warning â€” do not add new warnings).
14. **Tests:** `app/event/[id].test.tsx` (co-located) covers, at minimum: (a) loading â†’ skeleton (`Loading event`), no body; (b) loaded â†’ name, category, formatted date+time, venue, address, price, description all render, hero image present; (c) null `address`/`price`/`description` are omitted (no blank/"N/A"); (d) null `imageUrl` â†’ `CategoryPlaceholder` fallback; (e) `ticketLink` non-null â†’ "Get tickets" CTA present, pressing it mounts `WebViewModal` (mocked) with the url; (f) `ticketLink` null â†’ "No tickets required" label, no CTA; (g) back pill press calls `router.back()` once; (h) `isError` â†’ general-error `EmptyState` renders and Retry calls `invalidateQueries` with `eventKeys.detail(id)`.

## Tasks / Subtasks

- [x] Task 1: Replace `app/event/[id].tsx` placeholder with the detail screen (AC: #1â€“#12)
  - [x] Imports: `useState` (react); `ScrollView`, `View`, `Text`, `Pressable` (react-native); `Image` (expo-image); `useLocalSearchParams`, `useRouter` (expo-router); `useSafeAreaInsets` (react-native-safe-area-context); `StatusBar` (expo-status-bar); `Feather` (@expo/vector-icons); `useQueryClient` (@tanstack/react-query); `CategoryPlaceholder`, `EmptyState`, `WebViewModal` (`@/components/*`); `useEventDetail` (`@/hooks/useEventDetail`); `formatEventDate` (`@/lib/formatDate`); `eventKeys` (`@/lib/queryKeys`); `COLORS` (`@/constants/theme`).
  - [x] `export default function EventDetailScreen()`; `const { id } = useLocalSearchParams<{ id: string }>();`; `const { event, isLoading, isError } = useEventDetail(id);`; `const router = useRouter();`; `const insets = useSafeAreaInsets();`; `const queryClient = useQueryClient();`; `const [showTickets, setShowTickets] = useState(false);` and the hero `imageError` state (mirror EventCard).
  - [x] **Loading branch** (`if (isLoading)`): return the detail skeleton (220px `bg-surface` hero block + 2â€“3 `bg-surface` placeholder bars), `accessibilityLabel="Loading event"`, `paddingTop: insets.top` (dynamic-style exception), `<StatusBar style="light" />`. No spinner (AC #10).
  - [x] **Error branch** (`if (isError || !event)`): return a `bg-background` screen with the back pill (top-left, `router.back()`) + a centred `<EmptyState variant="general-error" onAction={() => queryClient.invalidateQueries({ queryKey: eventKeys.detail(id) })} />` (AC #11). (`!event` is covered here too: a found-but-null event only occurs alongside `isError` per 3.1's missing-doc contract, but guarding `!event` also satisfies the `Event | null` type before the loaded branch.)
  - [x] **Loaded branch:** `<View className="flex-1 bg-background">` containing: (1) a `<ScrollView>` with the hero (expo-image 220px / `CategoryPlaceholder` fallback) then the body (category tag â†’ name â†’ metadata â†’ description, omitting null fields per AC #5/#6) â€” add bottom contentContainer padding so the sticky CTA never overlaps the last content; (2) the fixed back pill overlay (AC #3); (3) the sticky bottom CTA area (AC #7/#8) with `paddingBottom: insets.bottom`; (4) `{showTickets && event.ticketLink && <WebViewModal url={event.ticketLink} onClose={() => setShowTickets(false)} />}`. Include `<StatusBar style="light" />`.
  - [x] Back pill: factor a small inline element/segment used by BOTH the error and loaded branches (same markup) to avoid divergence â€” `Pressable onPress={() => router.back()} accessibilityRole="button" accessibilityLabel="Back" style={{ top: insets.top + 8, left: 16 }} className="absolute z-10 min-h-[44px] min-w-[44px] items-center justify-center rounded-full bg-background/60"` with `<Feather name="chevron-left" size={24} color={COLORS.textPrimary} />`.
  - [x] Metadata block: date line = `formatEventDate(event.date)` + (`event.time` ? ` Â· ${event.time}` : ''); venue line = `event.venue`; address line only if `event.address`; price line only if `event.price`; description block only if `event.description`. Use `text-text-primary`/`text-text-secondary` tokens and the `font-inter*` families already used across components.
  - [x] CTA: ticketLink non-null â†’ `<Pressable onPress={() => setShowTickets(true)} accessibilityRole="button" accessibilityLabel={`Get tickets for ${event.name}`} className="h-12 w-full items-center justify-center rounded-lg bg-accent">` with `<Text className="text-[16px] font-inter-semibold text-text-primary">Get tickets</Text>`. ticketLink null â†’ `<View className="h-12 w-full items-center justify-center"><Text className="text-[13px] font-inter text-text-secondary">No tickets required</Text></View>` (non-interactive).
  - [x] **Do not** add navigation/analytics beyond `router.back()` + the modal toggle. `logTicketLinkTapped` (analytics) is **Story 5.3**, not here.
- [x] Task 2: Co-located test `app/event/[id].test.tsx` (AC: #14)
  - [x] Mocks (mirror `app/index.test.tsx`): `jest.mock('@/hooks/useEventDetail', () => ({ useEventDetail: jest.fn() }))`; `expo-router` â†’ `useLocalSearchParams: () => ({ id: 'e1' })`, `useRouter: () => ({ back: mockBack })`; `expo-status-bar` â†’ `{ StatusBar: () => null }`; `react-native-safe-area-context` â†’ `useSafeAreaInsets: () => ({ top:0,bottom:0,left:0,right:0 })`; `@/components/WebViewModal` â†’ a stub that renders a `testID="webview-modal"` View exposing `url` (so the test asserts it mounts with the right url without pulling react-native-webview); `@tanstack/react-query` â†’ `useQueryClient: () => ({ invalidateQueries: mockInvalidate })`. Do **not** mock `expo-image`, `expo-linear-gradient`, `EmptyState`, or `CategoryPlaceholder` â€” render them real (jest-expo handles the native ones; the EventCard/EmptyState suites already do this).
  - [x] A `makeEvent(overrides)` fixture (mirror `app/index.test.tsx`'s) so each test sets `event`, `isLoading`, `isError` via the mocked hook's return.
  - [x] Write tests (a)â€“(h) per AC #14. For (d) assert the `CategoryPlaceholder` fallback (e.g. its emoji glyph for the event's category) when `imageUrl` is null; for (e) `fireEvent.press(getByLabelText(/Get tickets/))` then assert `getByTestId('webview-modal')` and its `url`; for (h) `fireEvent.press(getByText('Retry'))` then `expect(mockInvalidate).toHaveBeenCalledWith({ queryKey: eventKeys.detail('e1') })`.
  - [x] Run `npm test` â€” all green, no regressions.
- [x] Task 3: Validation gates (AC: #13)
  - [x] `npx tsc --noEmit`, `npm test`, `npm run lint` â€” all clean, no new lint warnings, no regressions.

## Dev Notes

### Reuse â€” do NOT reinvent (critical)

Everything below already exists. Import and compose â€” do **not** rebuild any of it.

| Need | Import | Notes |
|---|---|---|
| Detail data | `import { useEventDetail } from '@/hooks/useEventDetail';` | Story 3.1. Returns `{ event: Event \| null, isLoading, isError }` â€” **no `refetch`** (deliberate; see AC #11 retry approach). `isLoading` is cold-load-only. |
| Ticket webview | `import { WebViewModal } from '@/components/WebViewModal';` | Story 3.2. Props `{ url: string; onClose: () => void }`. Mount-controlled (render it to open; it dismisses itself via `onClose`). |
| Image fallback | `import { CategoryPlaceholder } from '@/components/CategoryPlaceholder';` | Story 2.1. Full-bleed gradient+emoji; `accessible={false}`. Same fallback the EventCard uses. |
| Error UI | `import { EmptyState } from '@/components/EmptyState';` | Story 2.4. Use variant `"general-error"` (heading "Something went wrong", "Retry" button â†’ `onAction`). |
| Hero image | `import { Image } from 'expo-image';` | Same `contentFit="cover"` + `onError`â†’`setImageError` pattern as `EventCard.tsx`. |
| Date format | `import { formatEventDate } from '@/lib/formatDate';` | Story 2.2. `"2026-05-30"` â†’ `"Sat 30 May"`. Returns raw input on malformed dates (defensive). Time is separate (`event.time`). |
| Query key (retry) | `import { eventKeys } from '@/lib/queryKeys';` | `eventKeys.detail(id)` â€” the same key `useEventDetail` uses; drives the Retry invalidation. Never inline `['events','detail',id]`. |
| Safe-area inset | `import { useSafeAreaInsets } from 'react-native-safe-area-context';` | Top inset for the back pill, bottom inset for the sticky CTA. Hook only â€” no `<SafeAreaView>` (matches `app/index.tsx`). Provider lives in `app/_layout.tsx`. |
| Back chevron / colour | `@expo/vector-icons` `Feather`, `@/constants/theme` `COLORS` | `Feather name="chevron-left"`, `COLORS.textPrimary`. Same as WebViewModal's pill. |
| Navigation | `import { useRouter } from 'expo-router';` | `router.back()` only. Screen-only navigation boundary (project-context.md). |

### This screen is an UPDATE â€” current state of `app/event/[id].tsx`

It is the Story 1.1 **placeholder**:
```tsx
import { useLocalSearchParams } from 'expo-router';
import { View, Text } from 'react-native';
export default function EventDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  return (<View style={...}><Text>Event {id}</Text></View>);
}
```
Replace it entirely. The route already exists and the feed navigates to it (`app/index.tsx:130` â†’ `router.push(`/event/${item.id}`)`), so no routing wiring is needed â€” only the screen body. Preserve the default export and the `useLocalSearchParams<{ id: string }>()` param read.

### Detail error: Retry vs back (resolved conflict) â€” READ THIS

The planning docs conflict on the detail **error** action:
- **architecture.md:418** â€” "Detail error: `<ErrorState>` with back navigation option."
- **epics.md:392 (this story's binding AC)** â€” "if `isError` is true, the `general-error` `EmptyState` renders **with a Retry button**."
- **Story 3.1** deliberately gave `useEventDetail` **no `refetch`**, citing the architecture's back-navigation framing.

**Resolution (AC #11):** the epic AC is the binding contract, and the built `EmptyState` `general-error` variant's button is literally labelled "Retry" (copy is fixed in the component) â€” so honour **Retry**. Implement it **without** a hook `refetch` by invalidating the query from the screen: `useQueryClient().invalidateQueries({ queryKey: eventKeys.detail(id) })`. To also satisfy architecture's "back navigation option," keep the **back pill present on the error screen** so the user can leave too. This needs **no change to `useEventDetail`** (3.1 stays as-is). _Flagged as a question at the end for confirmation._

### Back pill is a fixed overlay, not in the ScrollView (deliberate)

UX-DR10 says the back pill is "overlaid top-left" on the hero. Rendering it **inside** the ScrollView would scroll it off-screen â€” and with `headerShown: false` (app/_layout.tsx:43) and no hardware back on iOS, the user could be stranded. So render it as an **absolute overlay at the screen root**, above the ScrollView (`absolute z-10`, positioned by `insets.top`). It stays "overlaid top-left" while remaining reachable at any scroll offset. Use the **same** back-pill markup in the error branch.

### Scroll restoration is free (native stack) â€” don't break it (FR-6)

`app/_layout.tsx` mounts `<Stack>` (native stack). Pushing the detail route does **not** unmount the feed, so its FlatList scroll offset and the session `activeCategory` filter survive automatically. The only requirement: leave via `router.back()` (stack pop). **Never** `router.push('/')` or `router.replace('/')` â€” those mount a fresh feed and lose both scroll and filter (FR-6 + FR-8). On-device verification of the exact pixel restoration is deferred to the on-device pass (no simulator here), but it is inherent to the native stack, not custom code.

### Metadata composition specifics

- **Date+time:** `formatEventDate(event.date)` gives `"Sat 30 May"`. Append time only when present: `event.time ? `${dateStr} Â· ${event.time}` : dateStr`. `event.time` is `"19:00"` or `null`.
- **Venue+address:** `event.venue` is always present (required field). `event.address` is `string | null` â€” render the address line only when non-null.
- **Price:** `event.price` is already `"R150"` / `"Free"` / `null`. Render verbatim when non-null; omit when null. **No** "Free"-defaulting logic (a free event is stored as the string `"Free"`, not `null` â€” null means unknown, so omit).
- **Description:** render only when `event.description` is non-null.
- Absent fields are omitted with `{event.address && (<Textâ€¦/>)}`-style conditionals â€” never a blank `<Text/>` or "N/A" (FR-4 / AC #6).

### Loading skeleton (inline, no new component)

The AC needs "a skeleton layout matching the detail shape." Build it **inline** in the loading branch (no new `SkeletonDetail` component required for one consumer): a `h-[220px] w-full bg-surface` hero block + 2â€“3 rounded `bg-surface` bars (varying widths) for category/name/meta, wrapped in a `bg-background` screen with `paddingTop: insets.top` and `accessibilityLabel="Loading event"`. A static `bg-surface` skeleton is sufficient (the animated shimmer in `SkeletonCard` is a feed-specific nicety; matching it here is optional, not required). No spinner (architecture.md:414, AC #10).

### Testing notes (precedent: app/index.test.tsx)

- Mock the data hook (`useEventDetail`) and drive each scenario via its return value â€” exactly how `app/index.test.tsx` mocks `useEvents`. Mock `expo-router` (`useLocalSearchParams` + `useRouter().back`), `expo-status-bar`, and `react-native-safe-area-context` (hook â†’ zeros) the same way.
- **Mock `@/components/WebViewModal`** to a `testID`-bearing stub exposing `url` â€” this keeps the screen test from pulling in `react-native-webview` (a native module) and isolates the assertion to "modal mounts with the right url on CTA tap." (WebViewModal has its own suite from Story 3.2.)
- **Mock `useQueryClient`** (`@tanstack/react-query`) to `{ invalidateQueries: jest.fn() }` and assert the Retry path calls it with `eventKeys.detail('e1')`.
- Do **not** mock `expo-image`, `expo-linear-gradient`, `EmptyState`, or `CategoryPlaceholder` â€” render them real (jest-expo transforms the native modules; the EventCard/EmptyState suites already render these without mocks).
- `fireEvent.press` + `getByLabelText`/`getByText` for interactions (CategoryChip/EventCard test precedent). Assert content + handler wiring; no brittle style/animation assertions.

### Conventions (project-context.md / architecture.md)

- **Default export** is allowed here â€” `app/*.tsx` screen files are the sole exception to the named-export rule. Everything imported is a named export.
- `className` for static styles; inline `style` only for the safe-area insets (`paddingTop`/`paddingBottom`/pill `top`/`left`) â€” runtime values, the documented dynamic-style exception, comment each.
- **No `try/catch`** â€” errors arrive via `useEventDetail`'s `isError`. **No store/context** â€” local `useState` only (`showTickets`, `imageError`). `router.*` only in this screen file (navigation boundary).
- Null-not-undefined: optional fields are `null` when absent; the omit-on-null conditionals rely on that.

### Project Structure Notes

- **Modified:** `app/event/[id].tsx` (placeholder â†’ full screen). **New:** `app/event/[id].test.tsx`. Both paths are already inside the `tsconfig` `@/*` alias, `tailwind.config.js` content globs, and CI globs.
- **No new dependencies** â€” `useEventDetail` (3.1), `WebViewModal` + `react-native-webview` (3.2), `expo-image`, `expo-linear-gradient`, `@expo/vector-icons`, `react-native-safe-area-context`, `@tanstack/react-query` are all already installed.
- **On-device verification deferred** (no iOS/Android simulator in this env, consistent with Epic 2 / Stories 3.1â€“3.2): exact scroll-position restoration (FR-6), the native push/pop transitions, the real hero image load, the live ticket webview round-trip, and sticky-CTA safe-area insets on notched devices are verified on a real device during release/QA.

### Naming / doc discrepancies (resolved)

- **`ErrorState` â†’ `EmptyState`:** architecture.md (FR-3 table:471, :417-418) names a `components/ErrorState.tsx`. No such component exists â€” it was consolidated into `EmptyState` (variant `general-error`) in Story 2.4. Use `EmptyState variant="general-error"`.
- **`TicketWebView` â†’ `WebViewModal`:** architecture.md:473 names `TicketWebView.tsx`; the built component (Story 3.2, per the epic) is `WebViewModal`. Use `WebViewModal`.
- **`FilterChips` â†’ `ChipsRow`:** not used by this screen, but for consistency note the same rename (Epic 2). N/A here.
- **Detail error Retry vs back:** resolved above ("Detail error: Retry vs back").

### References

- [Source: _bmad-output/planning-artifacts/epics.md#Story 3.3 (lines 375-393)] â€” binding ACs: 220px hero (expo-image â†’ CategoryPlaceholder fallback) + back pill restoring feed scroll (FR-6); body order category tag â†’ name â†’ metadata (date+time, venue+address, price/"Free") â†’ description; absent optional fields omitted (FR-4); sticky 48px #FF6B35 Tickets CTA with SafeAreaView bottom inset opening WebViewModal (FR-5); no-ticket "No tickets required" label retained (UX-DR11); loading skeleton; general-error EmptyState with Retry; accessibility on all interactive elements (NFR-4)
- [Source: _bmad-output/planning-artifacts/architecture.md] â€” :391-405 (hook contracts â€” `useEventDetail` has **no** `refetch`), :411-414 (detail loading = skeleton matching shape, no spinner), :416-419 (detail error â€” note Retry-vs-back conflict resolved in Dev Notes), :422-430 (no try/catch; className-only with documented exceptions), :456-457 (default-export only on screens; no inline styles), :472-474 (FR-4 `app/event/[id].tsx`+`useEventDetail`; FR-6 back nav automatic via stack)
- [Source: _bmad-output/planning-artifacts/ux-design-specification.md] â€” :271-275 (detail layout: 220px hero, semi-transparent back pill top-left, body field order, sticky 48px #FF6B35 CTA), :294-302 (UJ-1: back = exact scroll position; webview back = returns to detail), :530-538 (Tickets CTA visual/behaviour/`accessibilityLabel="Get tickets for {name}"`), :577-591 (general-error EmptyState copy/Retry)
- [Source: app/index.tsx] â€” screen composition precedent: `useSafeAreaInsets` (hook, not SafeAreaView) + `paddingTop` dynamic-style exception, `<StatusBar style="light" />`, `router` navigation boundary, render-precedence branching, native-stack scroll behaviour
- [Source: app/index.test.tsx] â€” screen test precedent: mock the data hook + `expo-router` + `expo-status-bar` + safe-area hook; `makeEvent` fixture; `fireEvent.press` + `getByLabelText`/`getByText`
- [Source: components/EventCard.tsx] â€” `expo-image` + `imageError`/`onError` + adjust-state-during-render reset pattern to mirror for the hero; `formatEventDate` usage; `accessibilityLabel` composition
- [Source: components/WebViewModal.tsx (Story 3.2)] â€” back-pill markup to mirror (`rounded-full bg-background/60`, `min-h/min-w-[44px]`, Feather chevron, `COLORS.textPrimary`); modal props `{ url, onClose }`
- [Source: components/EmptyState.tsx (Story 2.4)] â€” `variant="general-error"` (heading "Something went wrong", "Retry" button â†’ `onAction`)
- [Source: hooks/useEventDetail.ts + 3-1-useeventdetail-hook.md] â€” `{ event, isLoading, isError }`, no `refetch`, `eventKeys.detail(id)` key; the missing-doc â†’ `event null` + `isError true` contract
- [Source: lib/formatDate.ts] â€” `formatEventDate(iso)` â†’ `"Sat 30 May"`; time handled separately
- [Source: lib/queryKeys.ts] â€” `eventKeys.detail(id)` (for the Retry invalidation)
- [Source: types/event.ts] â€” `Event` shape: `time`/`address`/`price`/`description`/`ticketLink`/`imageUrl` are `string | null`; `venue`/`name`/`category`/`date` always present
- [Source: docs/project-context.md] â€” screen default-export exception, className-only styling, `@/*` alias, no try/catch in components, server-state-via-TanStack, navigation only in screen files, null-not-undefined

## Dev Agent Record

### Agent Model Used

claude-sonnet-4-6

### Debug Log References

None — no blockers encountered.

### Completion Notes List

- Replaced `app/event/[id].tsx` placeholder with the full detail screen wiring `useEventDetail`, `WebViewModal`, `CategoryPlaceholder`, `EmptyState`, and `expo-image`.
- Back pill factored as an inline JSX constant shared by the error and loaded branches to prevent divergence.
- Loading branch: 220px `bg-surface` hero + 3 placeholder bars, `accessibilityLabel="Loading event"`, no spinner.
- Error branch: back pill + centred `EmptyState variant="general-error"`; Retry invalidates `eventKeys.detail(id)` via `useQueryClient` (no hook `refetch` per 3.1 contract).
- Loaded branch: ScrollView hero (expo-image / CategoryPlaceholder fallback with adjust-state-during-render imageError reset) + body (category tag, name, metadata, optional description), fixed back-pill overlay, sticky bottom CTA (48px accent when ticketLink present; "No tickets required" label when null), mount-controlled WebViewModal.
- `app/event/[id].test.tsx` covers 8 scenarios (a)-(h) from AC #14; 15 suites / 90 tests green (was 14/82).
- TypeScript strict: clean. Lint: 0 errors, 1 pre-existing EmptyState.tsx warning (unchanged).

### File List

- app/event/[id].tsx (modified — replaced Story 1.1 placeholder)
- app/event/[id].test.tsx (new)

## Change Log

| Date | Change |
|------|--------|
| 2026-06-25 | Story 3.3 implemented. `app/event/[id].tsx` placeholder replaced with full detail screen. New `app/event/[id].test.tsx` with 8 tests (a)-(h). All 90 tests pass, tsc clean, lint 0 errors. |
| 2026-06-22 | Story created (ready-for-dev). Capstone of Epic 3. |
