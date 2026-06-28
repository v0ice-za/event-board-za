# Story 3.2: WebViewModal Component

Status: done

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As a user,
I want ticket links to open inside the app in a full-screen modal,
so that I can browse ticket options and return to the event detail without leaving the app.

This is the **second story of Epic 3 (Event Detail & Ticketing)**. It builds the `WebViewModal` presentational component **standalone** — a full-screen modal that slides up from the bottom, renders a `WebView` at the passed `url`, and exposes a single pill back button that always dismisses the whole modal. **Wiring it into the detail screen** (the Tickets CTA that opens it, and returning to the detail view on close) is **Story 3.3** — do not touch `app/event/[id].tsx` here. The component owns no data, no navigation, and no analytics: it takes `url` + `onClose` and renders.

⚠️ **This story introduces ONE new dependency: `react-native-webview`** (not yet in `package.json`). See Dev Notes "New dependency". The dev-story workflow will pause for approval when it hits the install step — that is expected.

## Acceptance Criteria

1. **Component contract & export:** `components/WebViewModal.tsx` exports (named) `export function WebViewModal({ url, onClose }: WebViewModalProps)` where `WebViewModalProps = { url: string; onClose: () => void }`. **No `export default`** (`components/` is not a screen file — only `app/*.tsx` screens use default export). No other props (no `visible` — the parent mounts/unmounts the component to show/hide it; see Dev Notes "Visibility is mount-controlled").
2. **Full-screen bottom-up modal:** renders a React Native `<Modal>` with `animationType="slide"` (slides up from the bottom — UX-DR8 sheet pattern) and full-screen presentation. When the component is mounted it is visible (`visible` is hardcoded `true` / `visible={true}`).
3. **WebView loads the URL — no custom loading UI:** renders `<WebView source={{ uri: url }} />` filling the modal. **Do not** add a custom spinner, `startInLoadingState` overlay, blank placeholder, or `renderLoading` — the AC requires native webview loading behaviour only.
4. **Pill back button, overlaid top-left:** a `Pressable` overlaid at the top-left of the modal (absolutely positioned over the WebView), respecting the safe-area top inset (`useSafeAreaInsets()` — same pattern as `app/index.tsx`). Pill-shaped (rounded-full), semi-transparent dark background, containing a chevron-left glyph (`Feather name="chevron-left"` from `@expo/vector-icons` — already used by `EmptyState.tsx`, **not a new dependency**). Minimum **44pt** touch target (`min-h-[44px] min-w-[44px]`, or `hitSlop` to reach 44pt — match the `EmptyState`/`CategoryChip` precedent).
5. **Back always dismisses the ENTIRE modal (never webview history):** pressing the back button calls `onClose()` — it must **not** call the WebView's `goBack()` or navigate within browser history (UX-DR8). Android hardware back is wired the same way: `<Modal onRequestClose={onClose}>` so the system back button also dismisses the whole modal, not a webview step-back.
6. **Accessibility (NFR-4):** the back button sets `accessibilityRole="button"` and `accessibilityLabel="Back"`.
7. **Conventions & gates:** named export, `@/*` alias imports where applicable, NativeWind `className` for static styles (inline `style` only for the documented dynamic/semi-transparent exception — see Dev Notes), TypeScript `strict` clean (no `any`). **`react-native-webview` is the only new dependency** — installed via `npx expo install` (SDK-pinned). `npx tsc --noEmit`, `npm test`, and `npm run lint` all pass with **no regressions** (baseline after Story 3.1: 13 suites / 78 tests green; lint 0 errors / 1 pre-existing `EmptyState.tsx` `fallbackConfig` warning — do not introduce new warnings, and do **not** reproduce that unused-var pattern).
8. **Tests:** `components/WebViewModal.test.tsx` (co-located, `.tsx`) covers, at minimum:
   (a) **renders the WebView at the passed URL** — mock `react-native-webview`, assert the mock receives `source={{ uri: url }}` for the given `url`;
   (b) **back button accessibility** — a button with `accessibilityLabel="Back"` and `accessibilityRole="button"` is present;
   (c) **back dismisses the modal** — `fireEvent.press` on the back button calls `onClose` exactly once;
   (d) **back does NOT drive webview history** — pressing back calls `onClose` and does not call any WebView `goBack` (assert via the absence of webview-history interaction / that `onClose` is the handler). Keep assertions to content + handler wiring, not brittle internals (consistent with Stories 2.2–3.1).

## Tasks / Subtasks

- [x] Task 1: Install the `react-native-webview` dependency (AC: #3, #7)
  - [x] Ran `npx expo install react-native-webview` (user-approved) — Expo pinned **`react-native-webview@13.16.1`** (the SDK 56.0.0-compatible version). Not `@latest`.
  - [x] Verified it landed in `package.json` `dependencies` (`"react-native-webview": "13.16.1"`) and `package-lock.json` updated. No `metro.config.js` change (autolinked native module).
  - [x] Note: native rebuild deferred to **Story 3.3** on-device verification — this story builds + unit-tests the component with `react-native-webview` mocked in Jest.
- [x] Task 2: Create `components/WebViewModal.tsx` (AC: #1–#6)
  - [x] Imports: `Feather` (`@expo/vector-icons`), `Modal`/`Pressable`/`View` (`react-native`), `useSafeAreaInsets` (`react-native-safe-area-context`), `WebView` (`react-native-webview`), `COLORS` (`@/constants/theme`).
  - [x] **Named export** `export function WebViewModal({ url, onClose }: WebViewModalProps)`; `type WebViewModalProps = { url: string; onClose: () => void }`.
  - [x] `<Modal visible animationType="slide" onRequestClose={onClose}>` wrapping `<View className="flex-1 bg-background">`.
  - [x] `<WebView source={{ uri: url }} style={{ flex: 1 }} />` — bare, no custom loading UI.
  - [x] Back pill: `<Pressable onPress={onClose} accessibilityRole="button" accessibilityLabel="Back" className="absolute min-h-[44px] min-w-[44px] items-center justify-center rounded-full bg-background/60" style={{ top: insets.top + 8, left: 16 }}>` with `<Feather name="chevron-left" size={24} color={COLORS.textPrimary} />`. Used `bg-background/60` (NativeWind opacity modifier) — resolved fine, no inline-rgba fallback needed. Inset offset is the documented dynamic-style exception.
  - [x] Both `onPress` and `onRequestClose` call `onClose` directly — no WebView `goBack()`, no WebView ref.
- [x] Task 3: Co-located test `components/WebViewModal.test.tsx` (AC: #8)
  - [x] Per-file `jest.mock('react-native-webview', ...)` returning a stub that forwards `source`. Also mocked `react-native-safe-area-context` `useSafeAreaInsets` → zero insets (no `<SafeAreaProvider>` in the test tree — same pattern as `app/index.test.tsx`; see Debug Log).
  - [x] Test (a): asserts the WebView mock received `source={{ uri: 'https://tickets.example/e1' }}`.
  - [x] Test (b): `getByLabelText('Back')` exists with `accessibilityRole === 'button'`.
  - [x] Test (c): `fireEvent.press` the back button → `onClose` called once.
  - [x] Test (d): pressing back drives `onClose` (mock exposes no `goBack`; asserts no `ref` plumbed to the webview) — proves full dismissal, never in-page history.
  - [x] `npm test` — 14 suites / 82 tests green, no regression.
- [x] Task 4: Validation gates (AC: #7)
  - [x] `npx tsc --noEmit` clean, `npm test` 14/82 green, `npm run lint` 0 errors / 1 pre-existing `EmptyState.tsx` warning (no new warnings).

### Review Findings

_Code review 2026-06-22 (inline adversarial: Blind Hunter + Edge Case Hunter + Acceptance Auditor). All 8 ACs implemented correctly. 1 decision-needed, 1 patch, 1 deferred, 0 dismissed._

- [x] [Review][Decision→Patch] Safe-area inset may be 0 inside the RN `<Modal>` (separate window, outside `SafeAreaProvider` — documented react-native-safe-area-context caveat, esp. Android) — the back pill at `top: insets.top + 8` could sit under the status bar/notch, weakening AC #4. [components/WebViewModal.tsx] — **User chose fix-now. Applied:** nested a `<SafeAreaProvider>` inside the `<Modal>` and extracted the pill into a `BackButton` child that consumes `useSafeAreaInsets()` from that nested provider; added `SafeAreaProvider` (pass-through) to the test mock.
- [x] [Review][Patch] Test (d)'s `expect(...props).not.toHaveProperty('ref')` is tautological — React never exposes `ref` in `props`, so it can't fail; (d) only re-tested (c). [components/WebViewModal.test.tsx] — **Applied:** (d) now asserts the webview receives no `onNavigationStateChange` (a history-back feature would need it) plus the press→`onClose`-once guarantee. (Note: `back.props.onPress` is not host-exposed by Pressable, so the assertion targets the webview's prop surface instead.)
- [x] [Review][Defer] No URL-scheme allowlist on the WebView (`onShouldStartLoadWithRequest`) — an unexpected `ticketLink` scheme would load. Mitigated by curated Firestore data (Epic 4 `normaliseEvent`) and out of this story's ACs. [components/WebViewModal.tsx:31] — deferred, logged in deferred-work.md (future security hardening)

## Dev Notes

### Reuse — do NOT reinvent (critical)

Everything below already exists. Import and compose — do **not** rebuild any of it.

| Need | Import | Notes |
|---|---|---|
| Chevron icon | `import { Feather } from '@expo/vector-icons';` | v15.1.1, already used in `EmptyState.tsx` (`Feather name="wifi-off"` etc.). **Not a new dependency.** Use `Feather name="chevron-left"`. Colour comes from the `color` prop (theme), not `className`. |
| Theme colours | `import { COLORS } from '@/constants/theme';` | `COLORS.textPrimary` (#F5F0E8) for the chevron glyph — same accessor `EmptyState.tsx` uses for Feather colours. |
| Safe-area inset | `import { useSafeAreaInsets } from 'react-native-safe-area-context';` | Installed (`~5.7.0`), used in `app/index.tsx` / `app/_layout.tsx`. Use `insets.top` to keep the back pill below the notch/status bar. |
| Design tokens | NativeWind `className` | `bg-background` (#0F0C09), `bg-background/60` (semi-transparent pill), `rounded-full`, `min-h-[44px]` — tokens defined in `tailwind.config.js`. |
| Touch-target precedent | — | `CategoryChip` (`min-h-[44px]`) and `EmptyState` (`h-9` + `hitSlop`) both hit the 44pt rule (NFR-4 / UX accessibility §687-688). Match one of them. |

### New dependency — `react-native-webview` (the only one)

`react-native-webview` is **not** in `package.json` (verified). It is the sole new dependency for this story and is explicitly listed in the architecture stack (`architecture.md:102, 205-207`). Install with **`npx expo install react-native-webview`** — Expo's installer pins the version validated for Expo SDK 56 / RN 0.85 (do not hand-pick `@latest`; architecture.md:635 confirms the SDK-56 compatibility matrix relies on the Expo-pinned versions). It is an autolinked native module — no `metro.config.js` edit, but it **does** require a native rebuild to run on-device (deferred to Story 3.3's on-device pass). For this story it is **mocked in Jest**, so the unit tests run without a native build.

### Visibility is mount-controlled (no `visible` prop)

The epic contract is exactly `WebViewModal` accepting `url: string` and `onClose: () => void` (epics.md:372) — there is deliberately **no `visible` prop**. The parent (Story 3.3 detail screen) shows the modal by **mounting** `<WebViewModal>` and hides it by unmounting (toggled by its own `useState`). So inside the component, the `<Modal>`'s `visible` is hardcoded `true`. `onClose` is the single channel back to the parent: the parent's handler flips its state to unmount the modal, which returns the user to the detail view (UX-DR8: "On close: returns to detail view, not feed"). Do **not** add internal `visible` state or an `isOpen` prop — it would diverge from the contract Story 3.3 is built against (same discipline as 3.1's "no `refetch`").

### Back button = dismiss whole modal, never webview history (AC #5 / UX-DR8)

This is the defining behaviour. The pill back button and the Android hardware back (`Modal onRequestClose`) **both** call `onClose` to tear down the entire modal. They must **not** call `WebView.goBack()` or otherwise walk the in-page browser history. Rationale (UX-DR8, ux-design-specification.md:607-610): the user taps Tickets → modal slides up → taps back → lands back on the **detail** screen, predictably, regardless of how many ticket pages they navigated through. Holding a WebView ref to step back through history is an anti-requirement here — do not add it.

### No custom loading UI (AC #3)

The AC is explicit: "no blank screen or spinner placeholder; native webview loading behaviour is used." Render the bare `<WebView source={{ uri: url }} style={{ flex: 1 }} />`. Do **not** set `startInLoadingState`, `renderLoading`, or layer a `SkeletonCard`/`ActivityIndicator`. The native WebView shows its own platform loading behaviour.

### NativeWind styling notes

- Static styles via `className` (`flex-1`, `bg-background`, `rounded-full`, `min-h-[44px]`, `min-w-[44px]`, `items-center`, `justify-center`, `absolute`). This component's path (`components/WebViewModal.tsx`) is already inside the `tailwind.config.js` `content` globs (the `components/**` glob covers it) — no config change.
- Two sanctioned inline-`style` exceptions, both documented with a comment in-code: (1) the back pill's `top: insets.top + 8, left: 16` (depends on a runtime safe-area value — cannot be static), and (2) `WebView style={{ flex: 1 }}` (RN fill idiom; `WebView` is a third-party native component and the `flex-1` className is not guaranteed to map onto it — inline `flex: 1` is the reliable form). The semi-transparent pill background prefers the NativeWind opacity modifier `bg-background/60`; only fall back to inline `rgba(15,12,9,0.6)` if that modifier does not resolve against the custom token.

### Testing notes (precedent: CategoryChip + the hook mocks)

- `@testing-library/react-native` + `fireEvent.press` is the interactive-component pattern (see `components/CategoryChip.test.tsx`). Query the back button by `getByLabelText('Back')` or `getByRole('button')`.
- `react-native-webview` must be mocked per-file — it is a native module absent from `transformIgnorePatterns` and there is no global jest setup file. Minimal mock:
  ```tsx
  jest.mock('react-native-webview', () => {
    const { View } = require('react-native');
    return { WebView: (props: { source?: { uri?: string } }) => <View testID="webview" {...props} /> };
  });
  ```
  Then assert `screen.getByTestId('webview').props.source` equals `{ uri: url }`. Keep the `.tsx` extension (JSX in the mock); `tsc --noEmit` stays clean because the component file is `.tsx`.
- Assert content + handler wiring only (URL passed, back label/role, `onClose` fires once) — no brittle internal/animation assertions, consistent with Stories 2.2–3.1.

### Conventions (project-context.md)

- **Named export** (`components/` — no `export default`; that's reserved for `app/*.tsx` screens). Path alias `@/*`. `strict: true` — no `any` (type the WebView mock's `source` prop explicitly in the test).
- `className` for static styles; inline `style` only for the two documented dynamic exceptions above.
- **No data, no navigation, no analytics in this component.** It is purely presentational: `url` in, `onClose` out. `router.*` calls live only in screen files (`app/*.tsx`); analytics (`logTicketLinkTapped`) is Epic 5 (Story 5.3) and fires from the **CTA in Story 3.3**, not here.

### Project Structure Notes

- **New files:** `components/WebViewModal.tsx`, `components/WebViewModal.test.tsx`. `components/**` is already in the `tsconfig` `@/*` alias, the `tailwind.config.js` content globs, and CI globs.
- **Modified:** `package.json` + `package-lock.json` (the `react-native-webview` install only).
- **Do NOT modify** `app/event/[id].tsx` (the Story 1.1 placeholder). Wiring `WebViewModal` to the Tickets CTA, the sticky CTA layout, the no-ticket-link label, and "close returns to detail" are all **Story 3.3**. This story delivers + unit-tests the component in isolation.
- **On-device verification deferred to Story 3.3** (no simulator in this env, consistent with Epics 2–3.1): real URL loading, the native slide-up animation, Android hardware-back dismissal, and focus-trap behaviour (ux §704-705) are verified when the detail screen consumes the modal on a real build.

### Naming / doc discrepancies (resolved)

- **`WebViewModal` vs `TicketWebView`:** `architecture.md` (lines 473, 521, 606) names the component `TicketWebView.tsx`. The **epic Story 3.2 AC is authoritative and newer** (epics.md:372) — it mandates `components/WebViewModal.tsx` exported as `WebViewModal`. Use `WebViewModal`. (The UX spec component table, ux-design-specification.md:226/400, also uses `WebViewModal`, agreeing with the epic.)
- **URL hostname header:** the UX anatomy note (ux-design-specification.md:402) mentions "back button + URL hostname header". This is **not** in the epic's binding ACs (epics.md:366-373), which specify only the pill back button. Treat the hostname header as **out of scope** for this story (do not build it) — the epic ACs govern. If a later UX pass wants it, it's an additive change. (Same "don't expand the contract beyond the ACs" discipline applied in Story 3.1's optional-guard note.)

### References

- [Source: _bmad-output/planning-artifacts/epics.md#Story 3.2] — binding ACs: slide-up full-screen modal, pill back button top-left (semi-transparent dark, chevron-left, ≥44pt), back always dismisses entire modal (never webview history), WebView loads `ticketLink` with native loading (no spinner), `components/WebViewModal.tsx` exporting `WebViewModal({ url, onClose })`, `accessibilityLabel="Back"` + `accessibilityRole="button"`
- [Source: _bmad-output/planning-artifacts/epics.md#UX-DR8 (line 60), FR-5 (line 23)] — modal exits entirely on tap, returns to detail on close; ticket link opens in-app webview (not system browser)
- [Source: _bmad-output/planning-artifacts/architecture.md] — :102 (`react-native-webview` dependency), :205-207 (Webview: renders ticket URLs in-app, close/back via modal dismiss), :635 (SDK-56 compatibility — use Expo-pinned versions), :473/:521/:606 (older `TicketWebView` name — superseded by epic)
- [Source: _bmad-output/planning-artifacts/ux-design-specification.md] — :226/:400-403 (`WebViewModal` purpose + anatomy), :607-610 (Detail → WebViewModal transition: slides up, back exits entirely, close returns to detail), :687-689 (44pt touch target — back button enumerated), :704-705 (focus trap — on-device, Story 3.3)
- [Source: docs/project-context.md] — named exports (no default outside `app/*.tsx`), `className`-only styling with documented dynamic exceptions, `@/*` alias, no navigation/store in components, strict TS (no `any`)
- [Source: components/EmptyState.tsx] — `@expo/vector-icons` `Feather` usage + `COLORS` accessor precedent (the icon + colour pattern to mirror); also the source of the one pre-existing lint warning (`fallbackConfig`) — do not reproduce it
- [Source: components/CategoryChip.tsx + CategoryChip.test.tsx] — interactive `Pressable` + accessibility pattern, `min-h-[44px]`, and the `fireEvent.press` / `getByRole('button')` test precedent
- [Source: app/index.tsx] — `useSafeAreaInsets()` usage precedent
- [Source: _bmad-output/implementation-artifacts/3-1-useeventdetail-hook.md] — Epic 3 predecessor: standalone-build-then-wire-in-3.3 pattern, per-file Jest mocks, "don't expand the contract beyond the ACs" discipline, on-device verification deferred to the consuming story
- [Source: package.json] — `@expo/vector-icons` 15.1.1, `react-native-safe-area-context` ~5.7.0 present; `react-native-webview` ABSENT (this story adds it)

## Dev Agent Record

### Agent Model Used

claude-opus-4-8 (Claude Code, dev-story workflow)

### Debug Log References

- First test run failed all 4 cases: `useSafeAreaInsets()` threw "No safe area value available. Make sure you are rendering `<SafeAreaProvider>`". Fix: mocked `react-native-safe-area-context` to return zero insets — the established project pattern (`app/index.test.tsx:26-28`), no provider needed since the component only consumes the inset hook (no `<SafeAreaView>`).
- Lint flagged one NEW warning: `no-require-imports` on the `const { View } = require('react-native')` inside the jest.mock factory (the story skeleton's suggested form). AC #7 forbids new warnings. Fix: replaced `require` with a top-level `import { View }` + a `Mock`-prefixed binding (`const MockRnView = View`) referenced by the factory. The factory may only close over `mock`-prefixed identifiers (babel-plugin-jest-hoist), and `MockRnView` is dereferenced lazily at render time (after the assignment runs), so it resolves correctly. Lint returned to 0 errors / 1 pre-existing warning.

### Completion Notes List

- **New dependency installed (user-approved):** `react-native-webview@13.16.1` via `npx expo install` — the SDK 56.0.0-pinned version. Sole new dependency; mocked in Jest so unit tests run without a native build.
- **AC #1–#2 (contract + modal):** named `WebViewModal({ url, onClose })`, no `export default`, no `visible` prop (mount-controlled). `<Modal visible animationType="slide">` slides up from the bottom.
- **AC #3 (no custom loading UI):** bare `<WebView source={{ uri: url }} style={{ flex: 1 }} />` — no `startInLoadingState`/`renderLoading`/spinner.
- **AC #4 (back pill):** `Pressable`, absolute top-left from `insets.top + 8`/`left: 16`, `rounded-full bg-background/60`, `min-h-[44px] min-w-[44px]`, `Feather chevron-left` (24px, `COLORS.textPrimary`). `@expo/vector-icons` + `useSafeAreaInsets` are existing deps (no new install beyond webview).
- **AC #5 (defining behaviour):** pill `onPress` AND Android `Modal onRequestClose` both call `onClose` — the whole modal tears down. No `WebView.goBack()`, no webview ref. Test (d) guards this.
- **AC #6 (a11y):** back button `accessibilityRole="button"` + `accessibilityLabel="Back"`.
- **Scope honoured:** `app/event/[id].tsx` untouched (wiring + Tickets CTA + no-ticket label = Story 3.3). No data/navigation/analytics in the component. UX "hostname header" intentionally not built (not in ACs).
- **Gates:** `tsc --noEmit` clean · `npm test` 14 suites / 82 tests (was 13/78; +1 suite, +4 tests) · `npm run lint` 0 errors, 1 pre-existing `EmptyState.tsx` warning (no new warnings). Jest "worker failed to exit gracefully" notice is pre-existing (present on baseline), not introduced here. On-device verification (real URL load, slide-up animation, Android hardware-back) deferred to Story 3.3.

### File List

- `components/WebViewModal.tsx` (new) — the component
- `components/WebViewModal.test.tsx` (new) — co-located unit tests
- `package.json` (modified) — added `react-native-webview@13.16.1`
- `package-lock.json` (modified) — dependency lockfile update
- `_bmad-output/implementation-artifacts/sprint-status.yaml` (modified) — status `ready-for-dev` → `in-progress` → `review`

## Change Log

| Date | Change |
|------|--------|
| 2026-06-22 | Story created (ready-for-dev). Second story of Epic 3. Defines `WebViewModal({ url, onClose })` in `components/WebViewModal.tsx`: slide-up full-screen `<Modal>`, bare `<WebView source={{ uri: url }}>` (native loading, no spinner), pill back button top-left (safe-area inset, `Feather` chevron-left, ≥44pt, `accessibilityLabel="Back"`) that dismisses the **entire** modal via `onClose` (never webview history; Android back wired via `onRequestClose`). Mount-controlled visibility (no `visible` prop). **Adds the one new dependency `react-native-webview` via `npx expo install`** (dev-story will HALT for approval). Co-located `.tsx` test with per-file `react-native-webview` mock. Resolves the `TicketWebView`→`WebViewModal` naming discrepancy (epic wins) and scopes out the UX "hostname header" (not in ACs). `app/event/[id].tsx` untouched — wiring is Story 3.3. |
| 2026-06-22 | Implemented (status → review). Installed `react-native-webview@13.16.1` (Expo SDK-pinned, user-approved). Created `components/WebViewModal.tsx` + co-located `.tsx` test (4 tests). All 8 ACs satisfied. Two test-setup fixes during the red-green cycle: mocked `useSafeAreaInsets` (no `<SafeAreaProvider>` needed, matching `app/index.test.tsx`), and replaced a `require()` mock import with a `Mock`-prefixed binding to avoid a new lint warning. Gates: tsc clean, 14 suites / 82 tests green, lint 0 errors / 1 pre-existing warning. `app/event/[id].tsx` untouched (Story 3.3). |
| 2026-06-22 | Code review (status → done). 1 decision-needed (resolved fix-now) + 1 patch applied; 1 deferred. Med fix: nested `<SafeAreaProvider>` inside the Modal + extracted `BackButton` child consuming `useSafeAreaInsets()` from it (RN Modal renders outside the root provider → insets would be 0, clipping the back pill under the notch). Test fix: replaced (d)'s tautological `not.toHaveProperty('ref')` with a meaningful `onNavigationStateChange`-absent guard. Deferred: WebView URL-scheme allowlist (logged in deferred-work.md). Gates re-run: tsc clean, 14 suites / 82 tests green, lint 0 errors / 1 pre-existing warning. No unresolved High/Medium. |
