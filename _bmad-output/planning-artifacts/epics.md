---
stepsCompleted: [1, 2, 3, 4]
inputDocuments:
  - "_bmad-output/planning-artifacts/prds/prd-event-board-za-2026-05-25/prd-distillate.md"
  - "_bmad-output/planning-artifacts/architecture.md"
  - "_bmad-output/planning-artifacts/ux-design-specification.md"
---

# Event Board ZA - Epic Breakdown

## Overview

This document provides the complete epic and story breakdown for Event Board ZA, decomposing the requirements from the PRD, UX Design, and Architecture into implementable stories.

## Requirements Inventory

### Functional Requirements

FR-1: Feed sorted date ascending, past events excluded; renders ≤2s on 4G
FR-2: Card shows name, human-readable date (e.g. "Sat 30 May"), venue; image/thumbnail if available else category placeholder
FR-3: Empty state: non-blank message; error state: user-friendly message + retry control
FR-4: Detail view on card tap; shows name, date, time, venue (name+address), category, description, price/"Free"; absent fields omitted gracefully (not blank/"N/A")
FR-5: Ticket link opens in-app webview (not system browser); webview has close/back; no button if no link exists
FR-6: Back from detail → feed preserving scroll position
FR-7: Category filter chips; single-select; deselect chip resets to all; "All" chip resets; narrows feed to matching events only
FR-8: Filter persists within session; resets on app close/reopen
FR-9: Banner ads between cards; visually distinct ("Ad" label); ~1 per 5–7 cards; no blank space on failed ad load
FR-10: Ads via AdMob SDK; no login required; ads load async; no autoplay audio; interstitials dismissible ≤5s; frequency cap TBD

### Non-Functional Requirements

NFR-1: Feed initial content ≤2s on 4G
NFR-2: App binary ≤50 MB initial install
NFR-3: No connectivity → clear "no connection" state; no crash/blank screen; no offline event caching v1
NFR-4: WCAG 2.1 AA contrast; accessible labels on all interactive elements
NFR-5: POPIA compliance; v1 no PII collected/stored by app; data limited to ad SDK telemetry; privacy policy must disclose AdMob data practices

### Additional Requirements (Architecture)

- AR-1: Project scaffold via `npx create-expo-app@latest event-board-za` — this is Epic 1 Story 1
- AR-2: Firebase project setup: Firestore `events` collection with Event schema, compound index (category ASC + date ASC), single index (date ASC), public-read / no-client-write security rules
- AR-3: NativeWind v4 configuration: metro.config.js withNativeWind plugin, tailwind.config.js with Dark Warm custom tokens, nativewind-env.d.ts
- AR-4: Root layout (`app/_layout.tsx`) initialises QueryClient, Firebase, and AdMob SDK before any screen renders
- AR-5: Cloud Functions workspace (separate npm workspace): syncQuicket (every 4h), plus shared normaliseEvent() and firestoreClient utilities. Eventbrite, Facebook Events, and Howler sync functions deferred to v1.1 (no viable public event-discovery API at v1 — see sprint-change-proposal-2026-06-25.md)
- AR-6: Event deduplication: normaliseEvent() generates Firestore document ID as `{source}-{slugify(name)}-{date}`; Quicket is authoritative when same event appears on multiple platforms
- AR-7: GitHub Actions CI (Jest + tsc --noEmit on every PR) + EAS Build on merge to main + EAS Submit on release tag
- AR-8: Firebase Crashlytics + Firebase Analytics integrated in app via react-native-firebase
- AR-9: Firebase Secret Manager / EAS Secrets for the Quicket API key (Eventbrite + Facebook secrets deferred with their sync functions to v1.1); Firebase config files (google-services.json / GoogleService-Info.plist) committed (non-secret)
- AR-10: privacy-policy.md covering POPIA compliance and AdMob telemetry disclosure (NFR-5), required before App Store submission

### UX Design Requirements

UX-DR1: Design token system — tailwind.config.js custom extensions for Dark Warm palette (background #0F0C09, surface #1C1814, text-primary #F5F0E8, text-secondary #8A7E70, accent #FF6B35, border #2A2420, error #FF4D4D, success #4CAF50) + Inter font at 6 typographic scale roles (18sp/700, 15sp/400, 16sp/600, 13sp/500, 13sp/400, 9px)
UX-DR2: EventCard component — full-bleed expo-image (~200px height, full-width), absolute gradient overlay (linear-gradient to-top: rgba(15,12,9,0.95) 0% → transparent 100%), bottom-left text overlay (name 18sp/700 + date·venue 13sp), states: default / pressed (scale 0.93) / image-error (falls to CategoryPlaceholder), numberOfLines={2} on name + numberOfLines={1} on subtitle, accessibilityRole="button", accessibilityLabel="{name}, {date}, {venue}"
UX-DR3: CategoryPlaceholder component — 8 variants, each a full-bleed LinearGradient (Music: #1a0a1e→#3d1459; Markets: #1a1200→#4a3000; Food & Drink: #1a0800→#4a1a00; Art & Culture: #001a1a→#004040; Sport: #001a00→#003300; Comedy: #1a1500→#3d3000; Nightlife: #0d0020→#200040; Family: #001a0d→#003320) + centred category emoji; designed assets, not CSS fallbacks
UX-DR4: CategoryChip component — inactive (surface bg, secondary text, 1px border) / active (#FF6B35 bg, #0F0C09 text, no border) / pressed (scale 0.95), accessibilityRole="button", accessibilityState={selected: active}, minHeight 44pt
UX-DR5: ChipsRow component — "All" chip pinned left (never scrolls), 8 category chips scroll freely behind it, no scrollbar indicator, active chip plays scale-pulse on return from detail view (1.0→1.05→1.0, 200ms)
UX-DR6: SkeletonCard component — matches EventCard dimensions exactly (~200px, full-width), pulsing shimmer (#1C1814↔#2A2420, opacity 0.3→0.6→0.3, 1.2s Animated loop), accessibilityLabel="Loading events"
UX-DR7: EmptyState/ErrorState components — 3 variants: empty-category (category emoji 32px, "No [Category] events right now", "Try a different category or check back later", "Clear filter" pill); no-connection (signal-off icon 32px text-secondary, "No connection", "Check your signal and try again", "Retry" pill); general-error (alert-triangle icon 32px #FF4D4D, "Something went wrong", "Try again or check back later", "Retry" pill)
UX-DR8: WebViewModal component — full-screen modal slides up from bottom, pill back button overlaid top-left, always exits modal entirely on tap (no browser-back), returns to detail view on close
UX-DR9: AdBannerUnit component — #1C1814 bg, "Ad" label (9px, text-secondary), zero height on failed load (no layout shift), no spinner/placeholder while loading
UX-DR10: Detail screen layout — hero image 220px full-width, back pill overlaid top-left (semi-transparent), scrollable body (category tag → event name → metadata block [date+time, venue+address, price/"Free"] → description), sticky full-width Tickets CTA (48px height, #FF6B35 bg) at bottom with SafeAreaView bottom inset
UX-DR11: No-ticket-link state — sticky CTA area retained, non-interactive "No tickets required" label (#8A7E70, 13sp/400, centred) — CTA area never disappears
UX-DR12: Feed screen foreground/background behaviour — on app foreground: feed resets to top + soft refresh triggers in background; active category filter persists through backgrounding (session-scoped state)

### FR Coverage Map

FR-1: Epic 2 + Epic 4 — chronological feed with seed data in Epic 2; real sourced data from Epic 4
FR-2: Epic 2 — EventCard component + CategoryPlaceholder fallback
FR-3: Epic 2 — EmptyState + ErrorState components
FR-4: Epic 3 — Event Detail screen
FR-5: Epic 3 — WebViewModal component
FR-6: Epic 3 — scroll position restoration on back navigation
FR-7: Epic 2 — ChipsRow + CategoryChip filter components
FR-8: Epic 2 — filter session persistence via useState in Feed screen
FR-9: Epic 5 — AdBannerUnit component in feed
FR-10: Epic 5 — AdMob interstitial in root layout

NFR-1: Epic 2 — TanStack Query staleTime + Firestore compound index
NFR-2: Epic 5 — binary size validation before release
NFR-3: Epic 2 — Firestore offline persistence + useNetworkState + OfflineBanner
NFR-4: Epic 2 (feed) + Epic 3 (detail) — accessibility labels and roles on all interactive elements
NFR-5: Epic 5 — privacy-policy.md + App Store privacy manifest

## Epic List

### Epic 1: Project Foundation
Get the app shell compiling and running on device; Firebase schema and seed data in place; CI/CD pipeline running. No user-facing feature yet — everything subsequent builds on this.
**ARs covered:** AR-1, AR-2, AR-3, AR-4, AR-7, AR-9
**FRs covered:** None directly — foundational

### Epic 2: Event Feed
Users can open the app, browse JHB events in a full-bleed card feed, filter by category, and see appropriate loading/empty/error states throughout.
**FRs covered:** FR-1, FR-2, FR-3, FR-7, FR-8
**NFRs covered:** NFR-1, NFR-3, NFR-4 (feed)
**UX-DRs covered:** UX-DR1, UX-DR2, UX-DR3, UX-DR4, UX-DR5, UX-DR6, UX-DR7, UX-DR12

### Epic 3: Event Detail & Ticketing
Users can tap any event card to see full details and tap Tickets to open the booking page in-app; back navigation returns to exact scroll position.
**FRs covered:** FR-4, FR-5, FR-6
**NFRs covered:** NFR-4 (detail)
**UX-DRs covered:** UX-DR8, UX-DR10, UX-DR11

### Epic 4: Data Pipeline
Real JHB events from Quicket automatically sync to Firestore on schedule. Eventbrite and Facebook Events are deferred to v1.1 (their public event-discovery APIs were removed by the providers); Howler also deferred to v1.1.
**ARs covered:** AR-5, AR-6
**FRs supported:** FR-1 (real data)

### Epic 5: Monetisation & Release
App is monetised with banner and interstitial ads, instrumented with analytics and crash reporting, POPIA-compliant, and ready for App Store + Play Store submission.
**FRs covered:** FR-9, FR-10
**NFRs covered:** NFR-2, NFR-5
**ARs covered:** AR-8, AR-10
**UX-DRs covered:** UX-DR9

---

## Epic 1: Project Foundation

Get the app shell compiling and running on device; Firebase schema and seed data in place; CI/CD pipeline running. No user-facing feature yet — everything subsequent builds on this.

### Story 1.1: Initialise Project Scaffold

As a developer,
I want to initialise the Expo project with the correct directory structure and base dependencies,
So that the app compiles, runs on iOS and Android simulators, and is ready for feature development.

**Acceptance Criteria:**

**Given** a clean working directory
**When** `npx create-expo-app@latest event-board-za` is run and base setup is complete
**Then** the app compiles and launches in development build on iOS and Android simulators without errors
**And** TypeScript strict mode is enabled in tsconfig.json
**And** the directory structure exists: `app/`, `components/`, `hooks/`, `lib/`, `constants/`, `types/`, `assets/placeholders/`, `docs/`
**And** `app/_layout.tsx`, `app/index.tsx` (placeholder screen), and `app/event/[id].tsx` (placeholder screen) exist and route correctly
**And** `@expo-google-fonts/inter` is installed
**And** `.gitignore` excludes `.env`, `google-services.json`, `GoogleService-Info.plist`
**And** `.env.example` documents all required environment variables

### Story 1.2: Configure NativeWind v4 + Design Tokens

As a developer,
I want NativeWind v4 configured with the Dark Warm design token system,
So that all components can use the project's colour palette and typography scale via `className` with no StyleSheet objects.

**Acceptance Criteria:**

**Given** the project scaffold from Story 1.1
**When** NativeWind v4 is configured and design tokens are defined
**Then** `metro.config.js` wraps the Metro bundler with `withNativeWind`
**And** `tailwind.config.js` includes all 8 custom colour tokens: `background` (#0F0C09), `surface` (#1C1814), `text-primary` (#F5F0E8), `text-secondary` (#8A7E70), `accent` (#FF6B35), `border` (#2A2420), `error` (#FF4D4D), `success` (#4CAF50)
**And** `nativewind-env.d.ts` is created for TypeScript support
**And** `constants/theme.ts` exports the design token values as typed constants
**And** `constants/categories.ts` exports `CATEGORY_VALUES` as const array (8 categories) and `CATEGORY_PLACEHOLDERS` map (category → placeholder asset path)
**And** `types/event.ts` defines the `Event` interface (all fields per architecture spec) and `Category` type
**And** `types/index.ts` barrel-exports all types
**And** a `className="bg-background text-text-primary"` applied to a test view renders with the correct colours — confirmed visually on device

### Story 1.3: Firebase Project + Firestore Schema + Seed Data

As a developer,
I want the Firebase project configured with Firestore schema, indexes, security rules, and seed events,
So that the app has a live data source with real-shaped events for feed and detail development.

**Acceptance Criteria:**

**Given** a Firebase project created at console.firebase.google.com
**When** Firebase is fully configured
**Then** `google-services.json` (Android) and `GoogleService-Info.plist` (iOS) are committed to the repo
**And** `@react-native-firebase/app` and `@react-native-firebase/firestore` are installed and linked
**And** `lib/firebase.ts` exports a singleton Firebase app instance
**And** Firestore has an `events` collection with security rules: public read, no client writes
**And** a compound Firestore index exists on (`category` ASC, `date` ASC)
**And** a single-field Firestore index exists on `date` ASC
**And** at least 25 seed events are written to Firestore covering: all 8 categories, future dates only, a mix of `imageUrl` present/null, `ticketLink` present/null, `description` present/null, `price` values of "Free", a price string (e.g. "R150"), and null
**And** `normaliseEvent()` placeholder function exists in `functions/src/lib/normaliseEvent.ts` (returns null for missing required fields)

### Story 1.4: Root Layout — Providers + SDK Initialisation

As a developer,
I want the root layout to initialise QueryClient, Firebase, and the AdMob SDK before any screen renders,
So that all screens have data fetching, Firestore access, and ad SDK availability from first render.

**Acceptance Criteria:**

**Given** Stories 1.1–1.3 are complete
**When** `app/_layout.tsx` is implemented
**Then** `QueryProvider` wraps the entire navigator, using a `QueryClient` from `lib/queryClient.ts` with `staleTime: 5 * 60 * 1000` and `retry: 3`
**And** Firebase is initialised once via `lib/firebase.ts` before any Firestore calls are made
**And** `react-native-google-mobile-ads` is installed; `MobileAds().initialize()` is called in `_layout.tsx` before any ad unit renders
**And** `SafeAreaProvider` from `react-native-safe-area-context` wraps the navigator
**And** `lib/queryKeys.ts` exports the `eventKeys` factory (`all`, `list(category)`, `detail(id)`)
**And** the app launches without console errors related to provider initialisation order

### Story 1.5: CI/CD Pipeline

As a developer,
I want GitHub Actions CI and EAS Build configured,
So that every PR is automatically validated with type-checking and tests, and production builds are producible for both stores.

**Acceptance Criteria:**

**Given** the project is in a GitHub repository
**When** the CI/CD pipeline is configured
**Then** `.github/workflows/ci.yml` runs `tsc --noEmit` and `jest` on every pull request to `main`
**And** `eas.json` defines `development`, `preview`, and `production` build profiles for both iOS and Android
**And** `app.config.ts` reads API key values from EAS Secrets via `process.env` (Quicket key present; Eventbrite/Facebook token keys deferred to v1.1 with their sync functions — values are placeholder strings in dev)
**And** EAS Secrets are configured in the EAS dashboard for the three API key names
**And** a push to `main` is able to trigger `eas build --platform all --profile production` without configuration errors
**And** the `ci.yml` workflow completes successfully on the `main` branch

---

## Epic 2: Event Feed

Users can open the app, browse JHB events in a full-bleed card feed, filter by category, and see appropriate loading/empty/error states throughout.

### Story 2.1: CategoryPlaceholder Component

As a user,
I want events without images to show a visually designed category placeholder,
So that the feed always looks intentional and polished, never broken.

**Acceptance Criteria:**

**Given** an event with `imageUrl: null`
**When** the feed renders that event's card
**Then** a full-bleed `LinearGradient` fills the card area using the category-specific gradient (Music: #1a0a1e→#3d1459; Markets: #1a1200→#4a3000; Food & Drink: #1a0800→#4a1a00; Art & Culture: #001a1a→#004040; Sport: #001a00→#003300; Comedy: #1a1500→#3d3000; Nightlife: #0d0020→#200040; Family: #001a0d→#003320)
**And** a centred category emoji is rendered over the gradient at 32px
**And** the component is exported as `CategoryPlaceholder` from `components/CategoryPlaceholder.tsx` accepting `category: Category` prop
**And** all 8 variants are visually verified on device — none resembles a broken image or grey fallback
**And** `accessible={false}` is set — decorative, label carried by parent `Pressable`

### Story 2.2: EventCard + SkeletonCard Components

As a user,
I want each event card to show the event image (or category placeholder), name, date, and venue at a glance,
So that I can make a 1-second yes/no decision while scrolling without tapping.

**Acceptance Criteria:**

**Given** an `Event` object is passed to `EventCard`
**When** the card renders in the feed
**Then** a full-bleed `expo-image` fills the card at ~200px height and full screen width
**And** a `linear-gradient` overlay (rgba(15,12,9,0.95) 0% → transparent 100%) is absolutely positioned over the image
**And** event name renders bottom-left in the overlay at 18sp/700 with `numberOfLines={2}` + `ellipsizeMode="tail"`
**And** date · venue renders below the name at 13sp, date in weight 500 and venue in weight 400, with `numberOfLines={1}`
**And** when `imageUrl` is null or fails to load, `CategoryPlaceholder` renders in place of the image
**And** `Pressable` wraps the card with `scale: 0.93` pressed transform (no opacity change)
**And** `accessibilityRole="button"` and `accessibilityLabel="{name}, {date}, {venue}"` are set
**And** `SkeletonCard` exists at `components/SkeletonCard.tsx` matching `EventCard` dimensions (~200px height, full width) with a pulsing shimmer (opacity 0.3→0.6→0.3, 1.2s `Animated` loop between #1C1814 and #2A2420)
**And** `SkeletonCard` has `accessibilityLabel="Loading events"` on its container

### Story 2.3: CategoryChip + ChipsRow Components

As a user,
I want to filter the event feed by category using a horizontal chip row,
So that I can narrow the feed to events matching my current mood in one tap.

**Acceptance Criteria:**

**Given** the feed screen is rendered
**When** the category chip row is displayed
**Then** `ChipsRow` renders a horizontal `ScrollView` (no scroll indicator) with an "All" chip followed by 8 category chips
**And** "All" chip is always visible at the left edge and never scrolls off-screen
**And** `CategoryChip` inactive state: `surface` (#1C1814) bg, `text-primary` (#F5F0E8) text, 1px `border` (#2A2420) border
**And** `CategoryChip` active state: `accent` (#FF6B35) bg, `background` (#0F0C09) text, no border
**And** pressing any chip plays a `scale: 0.95` transform
**And** `accessibilityRole="button"` and `accessibilityState={{ selected: isActive }}` are set on each chip
**And** minimum touch target height is 44pt on all chips
**And** `ChipsRow` accepts `activeCategory: Category | null` and `onSelect: (category: Category | null) => void` props
**And** when returning from the detail screen while a chip is active, the active chip plays a scale pulse (1.0→1.05→1.0, 200ms) — implemented via an `Animated` sequence triggered on focus

### Story 2.4: Empty/Error/Offline States + useNetworkState Hook

As a user,
I want to see a clear, actionable message when the feed is empty, fails to load, or has no connection,
So that I'm never left on a blank screen with no way forward.

**Acceptance Criteria:**

**Given** the app is open and any feed state is not the normal loaded state
**When** the relevant condition is detected
**Then** `useNetworkState` hook (wrapping `expo-network`) exports `isConnected: boolean` updated reactively
**And** `EmptyState` with variant `empty-category` shows: category emoji (32px), "No [Category] events right now" (18sp/600), "Try a different category or check back later" (13sp/400, text-secondary), "Clear filter" pill button — tapping it calls `onClearFilter` prop
**And** `EmptyState` with variant `no-connection` shows: signal-off icon (32px, text-secondary), "No connection" (18sp/600), "Check your signal and try again" (13sp/400, text-secondary), "Retry" pill button
**And** `EmptyState` with variant `general-error` shows: alert-triangle icon (32px, #FF4D4D), "Something went wrong" (18sp/600), "Try again or check back later" (13sp/400, text-secondary), "Retry" pill button
**And** the "Retry" pill is styled: #2A2420 bg, #F5F0E8 text, 13sp/500, 20px border-radius, 16px horizontal padding, 36px height — never full-width
**And** `OfflineBanner` renders a slim banner at the top of the feed when `isConnected` is false while cached data is showing
**And** no state renders a blank screen — every terminal state has a visible action

### Story 2.5: useEvents Hook

As a developer,
I want a `useEvents` hook that fetches and caches the event feed from Firestore,
So that the feed screen has a single, testable data source with built-in loading, error, and offline handling.

**Acceptance Criteria:**

**Given** the Firebase and QueryClient providers are initialised (Story 1.4)
**When** `useEvents(category)` is called with a `Category | null` argument
**Then** the hook queries the Firestore `events` collection ordered by `date` ASC, excluding past events (date < today)
**And** when `category` is non-null, the query adds a `where('category', '==', category)` filter using the compound index
**And** the hook uses the `eventKeys.list(category)` query key from `lib/queryKeys.ts`
**And** the hook returns `{ events: Event[], isLoading: boolean, isError: boolean, refetch: () => void }`
**And** `isLoading` is true only on the initial fetch — subsequent background refreshes do not set `isLoading: true`
**And** Firestore offline persistence is enabled so cached events are returned when offline (NFR-3)
**And** the hook is exported as a named export from `hooks/useEvents.ts`
**And** `useEvents.test.ts` covers: returns events sorted by date, filters by category, returns isError on failure

### Story 2.6: Event Feed Screen

As a user,
I want to open the app and immediately see a scrollable feed of upcoming JHB events,
So that I can discover what's on this weekend in under 10 seconds.

**Acceptance Criteria:**

**Given** the app is launched
**When** `app/index.tsx` renders
**Then** `ChipsRow` appears at the top of the screen with "All" selected by default
**And** a `FlatList` of `EventCard` items renders below the chips, ordered date ascending, past events excluded (FR-1)
**And** while data is loading, exactly 3 `SkeletonCard` components render in the list area — chips also show skeleton shimmer
**And** tapping a category chip immediately narrows the `FlatList` to matching events; tapping the active chip or "All" resets to all events (FR-7)
**And** the active category filter is stored in `useState` local to the screen and persists while the app is in the foreground (FR-8)
**And** when the app is brought to foreground from background: the feed scrolls to the top and a soft background refresh is triggered
**And** when the filtered category has no events, the `empty-category` `EmptyState` renders with the category name in the message
**And** when the fetch fails and no cached data is available, the `general-error` `EmptyState` renders with a Retry button that calls `refetch()`
**And** when offline with cached data showing, `OfflineBanner` is visible at the top
**And** feed renders initial content within ≤2s on a 4G connection (NFR-1)
**And** all interactive elements have `accessibilityLabel` and `accessibilityRole` (NFR-4)
**And** `AdBanner` placeholder slot exists in the `FlatList` at every 6th position (renders nothing until Epic 5)

---

## Epic 3: Event Detail & Ticketing

Users can tap any event card to see full details and tap Tickets to open the booking page in-app; back navigation returns to exact scroll position.

### Story 3.1: useEventDetail Hook

As a developer,
I want a `useEventDetail` hook that fetches a single event from Firestore by ID,
So that the detail screen has a typed, cached data source with loading and error states.

**Acceptance Criteria:**

**Given** the Firebase and QueryClient providers are initialised (Story 1.4)
**When** `useEventDetail(id)` is called with an event document ID
**Then** the hook fetches the document at `events/{id}` from Firestore
**And** it returns `{ event: Event | null, isLoading: boolean, isError: boolean }`
**And** it uses the `eventKeys.detail(id)` query key from `lib/queryKeys.ts`
**And** `isLoading` is true only on the initial fetch — subsequent background refreshes do not set `isLoading: true`
**And** if the document does not exist, `event` is `null` and `isError` is `true`
**And** the hook is exported as a named export from `hooks/useEventDetail.ts`
**And** `useEventDetail.test.ts` covers: returns event on success, returns isError on missing document, returns isError on Firestore failure

### Story 3.2: WebViewModal Component

As a user,
I want ticket links to open inside the app in a full-screen modal,
So that I can browse ticket options and return to the event detail without leaving the app.

**Acceptance Criteria:**

**Given** an event with a `ticketLink` URL
**When** the user taps the Tickets CTA on the detail screen
**Then** `WebViewModal` slides up from the bottom as a full-screen modal
**And** a pill-shaped back button is overlaid top-left on the modal (semi-transparent dark bg, chevron-left icon, minimum 44pt touch target)
**And** tapping the back button always dismisses the entire modal — it does not navigate within the webview history (UX-DR8)
**And** the webview loads the `ticketLink` URL — no blank screen or spinner placeholder; native webview loading behaviour is used
**And** the component is exported as `WebViewModal` from `components/WebViewModal.tsx` accepting `url: string` and `onClose: () => void` props
**And** `accessibilityLabel="Back"` and `accessibilityRole="button"` are set on the back button

### Story 3.3: Event Detail Screen

As a user,
I want to see the full details of an event after tapping a card, and be able to book tickets without leaving the app,
So that I have all the information I need to decide whether to attend, and can book immediately if I want to.

**Acceptance Criteria:**

**Given** the user taps an event card in the feed
**When** `app/event/[id].tsx` renders
**Then** a 220px full-width hero image renders at the top (expo-image, falls to `CategoryPlaceholder` on null/error) with a semi-transparent back pill overlaid top-left (UX-DR10)
**And** tapping the back pill navigates back to the feed and restores the feed's scroll position (FR-6)
**And** the scrollable body renders in order: category tag (accent colour, 13sp/500) → event name (18sp/700, text-primary) → metadata block (date+time, venue name+address, price string or "Free") → description (if present; omitted if null, not shown as blank)
**And** absent optional fields (`description`, `price`) are omitted entirely — no "N/A", no blank rows (FR-4)
**And** a sticky Tickets CTA renders at the bottom (48px height, full-width, #FF6B35 bg, SafeAreaView bottom inset) when `ticketLink` is non-null; tapping it opens `WebViewModal` (FR-5)
**And** when `ticketLink` is null, the sticky CTA area is retained but renders a non-interactive "No tickets required" label (#8A7E70, 13sp/400, centred) — the CTA area never disappears (UX-DR11)
**And** while the event is loading, a skeleton layout renders (hero placeholder + body placeholders)
**And** if `isError` is true, the `general-error` `EmptyState` renders with a Retry button
**And** all interactive elements have `accessibilityLabel` and `accessibilityRole` (NFR-4)

---

## Epic 4: Data Pipeline

Real JHB events from Quicket automatically sync to Firestore on schedule. Eventbrite and Facebook Events are deferred to v1.1 (their public event-discovery APIs were removed by the providers); Howler also deferred to v1.1. See `sprint-change-proposal-2026-06-25.md`.

### Story 4.1: Cloud Functions Workspace Setup + firestoreClient Utility

As a developer,
I want the Cloud Functions workspace scaffolded with TypeScript compilation and a shared Firestore write client,
So that sync functions have a working deploy target and a single, testable upsert primitive.

**Acceptance Criteria:**

**Given** the project scaffold from Story 1.1 and the `normaliseEvent.ts` placeholder from Story 1.3
**When** the Cloud Functions workspace is set up
**Then** `functions/` is a separate npm workspace with its own `package.json` (Node 20, `"main": "lib/index.js"`) and `tsconfig.json` (strict, targeting `lib/`)
**And** `firebase.json` references the `functions/` directory and is configured to deploy to the Firebase project from Story 1.3
**And** `functions/src/lib/firestoreClient.ts` exports `upsertEvent(event: NormalisedEvent): Promise<void>` — writes to `events/{id}` using Firestore `set` with merge, where `id` is taken from `event.id`
**And** `functions/src/index.ts` exists as the entry point and exports at least one placeholder export (no-op) so Firebase deploy succeeds
**And** `firebase deploy --only functions` runs without errors against the dev Firebase project
**And** `firestoreClient.test.ts` covers: calls Firestore set with correct document ID and merge option

### Story 4.2: normaliseEvent() Utility — Full Implementation

As a developer,
I want `normaliseEvent()` to map raw API payloads to the `Event` schema and generate a deduplication-safe document ID,
So that all sync functions produce consistently shaped Firestore documents and duplicate events are deduplicated across sources.

**Acceptance Criteria:**

**Given** the placeholder `normaliseEvent.ts` from Story 1.3
**When** `normaliseEvent(raw: unknown, source: EventSource)` is called
**Then** it returns an `Event` object (all required fields present)
**And** it returns `null` if any required field (`name`, `date`, `venue`) is missing or unparseable
**And** the document ID is generated as `` `${source}-${slugify(name)}-${isoDate}` `` (e.g. `quicket-jazz-in-the-park-2026-06-07`)
**And** `slugify` converts to lowercase, replaces spaces with hyphens, removes non-alphanumeric characters
**And** `date` is stored as an ISO 8601 date string (e.g. `"2026-06-07"`) — never a Firestore Timestamp or Date object
**And** optional fields (`imageUrl`, `ticketLink`, `description`, `price`) are `null` when absent — never `undefined` or empty string
**And** `source` is stored on the document as `"quicket" | "eventbrite" | "facebook"`
**And** `normaliseEvent.test.ts` covers: valid event returns correct shape + ID, missing required field returns null, optional fields default to null, slugify handles special characters and unicode

### Story 4.3: syncQuicket Cloud Function

As a developer,
I want a scheduled Cloud Function that syncs JHB events from the Quicket REST API into Firestore every 4 hours,
So that Quicket events appear in the feed automatically without manual intervention.

**Acceptance Criteria:**

**Given** Stories 4.1 and 4.2 are complete
**When** `syncQuicket` runs (scheduled every 4 hours via Firebase Cloud Scheduler)
**Then** it fetches upcoming events in Johannesburg from the Quicket REST API using the `QUICKET_API_KEY` EAS Secret (available in Cloud Function environment via `functions.config()` or Secret Manager)
**And** it paginates through all result pages until no more events remain
**And** each raw event is passed through `normaliseEvent(raw, 'quicket')`; null results are skipped with a warning log
**And** each normalised event is written to Firestore via `upsertEvent()` — existing documents are updated (merge), new ones created
**And** `syncQuicket` is exported from `functions/src/index.ts` as a Firebase scheduled function with `schedule: 'every 4 hours'` and `timeZone: 'Africa/Johannesburg'`
**And** the function logs: start time, events fetched count, events written count, any skipped events with reason
**And** the function does not throw on a single failed upsert — it logs the error and continues processing remaining events

### Story 4.4: syncEventbrite Cloud Function — DEFERRED to v1.1

**Status: Deferred (2026-06-25).** Not in v1 scope.

**Reason:** Eventbrite removed its public Event Search API (`GET /v3/events/search/`) on
2020-02-20. No public event-discovery endpoint exists; only owned-resource listing remains
(`/organizations/{id}/events`, `/venues/{id}/events`, `/events/{id}`). The original premise
— "fetch upcoming JHB events from Eventbrite's public API" — is not achievable.
Evidence: https://github.com/Automattic/eventbrite-api/issues/83 ; https://www.eventbrite.com/platform/api

**Revival conditions for v1.1:** decide a viable strategy — e.g. org-scoped ingestion via a
curated list of JHB organiser IDs (`/organizations/{id}/events/`), a partner/data agreement,
or another sourcing approach. Re-scope the ACs accordingly before implementing. The
`normaliseEvent(raw, 'eventbrite')` + `upsertEvent()` plumbing and the `eventbrite` source
value remain valid and reusable.

### Story 4.5: syncFacebookEvents Cloud Function — DEFERRED to v1.1

**Status: Deferred (2026-06-25).** Not in v1 scope.

**Reason:** Facebook/Meta deprecated public event discovery — location/`type=event` search
via the Graph API is no longer available, and public events are not readable by location
with an app token. The original premise — "fetch upcoming public JHB events from the Graph
API" — is not achievable.
Evidence: https://github.com/tobilg/facebook-events-by-location ; https://developers.facebook.com/docs/graph-api/reference/event/

**Revival conditions for v1.1:** decide a viable strategy — e.g. Page-scoped ingestion for a
curated set of JHB venue/promoter Pages (with required permissions), a partner feed, or
another sourcing approach. Re-scope the ACs accordingly before implementing. The
`normaliseEvent(raw, 'facebook')` + `upsertEvent()` plumbing and the `facebook` source value
remain valid and reusable.

---

## Epic 5: Monetisation & Release

App is monetised with banner and interstitial ads, instrumented with analytics and crash reporting, POPIA-compliant, and ready for App Store + Play Store submission.

### Story 5.1: AdBannerUnit Component + Feed Banner Integration

As a user,
I want ads in the feed to look intentional and not break the layout if they fail to load,
So that the app feels polished even when ads are present or absent.

**Acceptance Criteria:**

**Given** the AdMob SDK is initialised (Story 1.4)
**When** `AdBannerUnit` renders in the feed `FlatList`
**Then** `AdBannerUnit` is exported from `components/AdBannerUnit.tsx`, wrapping the AdMob `BannerAd` component
**And** the component has a `#1C1814` background and a "Ad" label (9px, #8A7E70, top-right) to visually distinguish it from event cards (UX-DR9)
**And** when the ad fails to load, the component renders with zero height — no empty space, no spinner, no placeholder (UX-DR9)
**And** the feed `FlatList` in `app/index.tsx` replaces the placeholder ad slots (every 6th position from Story 2.6) with live `AdBannerUnit` components (FR-9)
**And** the AdMob banner unit ID is read from `app.config.ts` (not hardcoded); a test unit ID is used in development
**And** the banner loads asynchronously — it does not block feed rendering (FR-10)

### Story 5.2: Interstitial Ad Integration

As a developer,
I want interstitial ads shown at a sensible frequency during normal app use,
So that the app generates ad revenue without disrupting the user experience.

**Acceptance Criteria:**

**Given** the AdMob SDK is initialised (Story 1.4)
**When** interstitial ads are configured in `app/_layout.tsx`
**Then** an interstitial ad is preloaded on app start using the AdMob interstitial unit ID from `app.config.ts` (test unit ID in development)
**And** the interstitial is shown after the user views their 3rd event detail in a session — tracked via a session counter in `_layout.tsx` context
**And** after showing, the counter resets and the next ad preloads immediately
**And** the interstitial is dismissible — AdMob's native close button is not suppressed (FR-10)
**And** no autoplay audio accompanies the interstitial (FR-10)
**And** if the preloaded ad is not ready when the trigger fires, the interstitial is skipped silently — the user is never blocked

### Story 5.3: Firebase Analytics + Crashlytics

As a developer,
I want Firebase Analytics event tracking and Crashlytics crash reporting enabled,
So that I can understand user behaviour and be alerted to crashes in production.

**Acceptance Criteria:**

**Given** the Firebase project from Story 1.3
**When** Analytics and Crashlytics are integrated
**Then** `@react-native-firebase/analytics` and `@react-native-firebase/crashlytics` are installed and linked (AR-8)
**And** `lib/analytics.ts` exports typed wrapper functions for the key events: `logScreenView(screenName)`, `logCategoryFilter(category)`, `logTicketLinkTapped(eventId)`, `logAdImpression(adType)`
**And** `logScreenView` is called on mount in `app/index.tsx` (feed) and `app/event/[id].tsx` (detail)
**And** `logCategoryFilter` is called when a category chip is tapped
**And** `logTicketLinkTapped` is called when the Tickets CTA is tapped
**And** Crashlytics is enabled — unhandled JS errors and native crashes are reported to the Firebase console
**And** Analytics and Crashlytics are disabled when `__DEV__` is true so local dev sessions do not pollute production data

### Story 5.4: Privacy Policy + POPIA Compliance

As a user,
I want to be able to read the app's privacy policy,
So that I understand what data is collected and can make an informed decision about using the app.

**Acceptance Criteria:**

**Given** the app is preparing for store submission
**When** privacy compliance work is complete
**Then** `docs/privacy-policy.md` exists and covers: app identity, data collected (AdMob telemetry only — no PII collected by the app itself), third-party SDKs (AdMob, Firebase), user rights under POPIA, contact details (AR-10, NFR-5)
**And** the privacy policy URL is set in `app.config.ts` so it appears on App Store and Play Store listings
**And** `ios/PrivacyInfo.xcprivacy` is generated (or added via EAS config) declaring AdMob's required privacy nutrition labels
**And** `app.config.ts` sets `expo.ios.privacyManifests` with the AdMob required reason API entries
**And** the privacy policy is accessible from within the app — a "Privacy Policy" link renders in the detail screen's scrollable body footer (small, text-secondary, 11sp)

### Story 5.5: App Store + Play Store Release Preparation

As a developer,
I want the app fully packaged with store assets, metadata, and a validated binary size,
So that it can be submitted to the App Store and Google Play without rejection for missing required items.

**Acceptance Criteria:**

**Given** all previous epics are complete
**When** release preparation is complete
**Then** `assets/` contains a 1024×1024 app icon (PNG, no alpha) and an adaptive icon for Android
**And** a splash screen is configured in `app.config.ts` with the app's dark background colour (#0F0C09)
**And** App Store metadata is documented in `docs/store-metadata.md`: app name, subtitle, description (≤4000 chars), keywords (≤100 chars), support URL, marketing URL
**And** Play Store metadata is documented in `docs/store-metadata.md`: short description (≤80 chars), full description (≤4000 chars)
**And** at least 3 iPhone screenshots (6.7" size) and 3 Android screenshots (phone size) are captured from the running app and saved to `docs/screenshots/`
**And** a production EAS build for both platforms completes without errors (`eas build --platform all --profile production`)
**And** the production build binary is ≤50 MB on both platforms (NFR-2) — verified from EAS build output
**And** `eas submit` configuration is set up in `eas.json` for both App Store Connect and Google Play tracks
