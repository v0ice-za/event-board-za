---
stepsCompleted: [1, 2, 3, 4, 5, 6, 7, 8]
lastStep: 8
status: 'complete'
completedAt: '2026-05-26'
inputDocuments:
  - "_bmad-output/planning-artifacts/prds/prd-event-board-za-2026-05-25/prd-distillate.md"
  - "_bmad-output/planning-artifacts/briefs/brief-event-board-za-2026-05-25/brief.md"
workflowType: 'architecture'
project_name: 'event-board-za'
user_name: 'Voice.mijalkovic'
date: '2026-05-26'
---

# Architecture Decision Document

_This document builds collaboratively through step-by-step discovery. Sections are appended as we work through each architectural decision together._

## Project Context Analysis

### Requirements Overview

**Functional Requirements:**
10 FRs across 4 areas: Event Feed (FR-1–3), Event Detail View (FR-4–6), Category Filtering (FR-7–8), Ad Integration (FR-9–10). All requirements are read-only consumer behaviours — no writes, no auth, no user data.

**Non-Functional Requirements:**
- NFR-1 (feed ≤2s on 4G): primary perf constraint; drives API caching and pagination strategy
- NFR-2 (binary ≤50 MB): constrains RN dependencies and bundled assets
- NFR-3 (offline graceful degradation): requires network state detection; no offline caching in v1
- NFR-4 (WCAG 2.1 AA): accessible labels on all interactive elements
- NFR-5 (POPIA): no PII collected by app; ad SDK telemetry must be disclosed in privacy policy

**Scale & Complexity:**
- Primary domain: React Native mobile (iOS 15+ / Android 9+ / API 28+)
- Complexity level: Low–Medium
- Data volume: Low (hundreds–low thousands of JHB events)
- Real-time: Not required — periodic refresh sufficient
- Estimated architectural components: ~10

### Technical Constraints & Dependencies

- React Native (confirmed): single codebase, iOS + Android
- iOS 15.0 min / Android 9.0 min (API 28)
- App binary ≤50 MB: limits heavy dependencies and bundled assets
- No auth system, no user accounts, no in-app purchases in v1
- In-app webview required for ticket link navigation (FR-5)
- Ad SDK (AdMob default): async init, banner + interstitial, no autoplay audio
- OQ-1 (data sourcing): unresolved — drives backend architecture entirely

### Cross-Cutting Concerns Identified

- Network state: feed loading, empty/error states, retry logic (NFR-3)
- Image loading + fallbacks: feed performance, card rendering, memory (FR-2)
- Ad SDK lifecycle: initialisation and error handling spans both screens
- Scroll position preservation: navigation architecture constraint (FR-6)
- POPIA compliance: ad SDK config + app store privacy disclosures (NFR-5)

## Starter Template Evaluation

### Primary Technology Domain

React Native mobile (confirmed) — iOS 15+ / Android 9+ (API 28), single codebase.

### Starter Options Considered

- Ignite v11.5: rejected — MobX-State-Tree, i18n, Reactotron are overkill for a 2-screen read-only app; adds complexity with no v1 payoff
- Obytes Starter: rejected — opinionated CI matrix and Zustand setup exceed v1 requirements; better suited to team projects with auth flows
- create-expo-stack: viable but unnecessary; interactive picker adds steps when the default Expo template is sufficient

### Selected Starter: create-expo-app (default)

**Rationale:** Minimal, official, right-sized for a 2-screen read-only consumer app. Expo Router handles the 2-screen flat nav natively. EAS handles App Store + Play Store submissions. SDK 56 includes Expo UI primitives out of the box.

**Initialization Command:**

```bash
npx create-expo-app@latest event-board-za
```

**Architectural Decisions Provided by Starter:**

**Language & Runtime:**
TypeScript (default in SDK 56); strict mode recommended

**Routing & Navigation:**
Expo Router (file-based, `app/` directory); Home screen = `app/index.tsx`, Detail screen = `app/event/[id].tsx`; back navigation handled by router

**Build & Distribution:**
Expo EAS (eas-cli) for iOS + Android builds and App Store / Play Store submissions; managed workflow — no native Xcode/Android Studio config required

**Testing Infrastructure:**
Jest + React Native Testing Library (add via expo install)

**Code Organisation:**
`app/` for screens, `components/` for shared UI, `hooks/` for data logic, `constants/` for categories/theme

**Development Experience:**
Expo Go for local dev; hot reload; TypeScript LSP; Expo Dev Tools

**Additional Dependencies (add post-init):**
- `expo-image` — image caching + category placeholders (FR-2)
- `react-native-webview` — in-app ticket link webview (FR-5)
- `react-native-google-mobile-ads` — AdMob banner + interstitial (FR-9, FR-10)
- `@tanstack/react-query` — data fetching, caching, retry (NFR-1, NFR-3)
- `expo-network` — offline/connectivity detection (NFR-3)
- Data source package: TBD (resolves with OQ-1)

**Note:** Project initialisation using this command is the first implementation story.

## Core Architectural Decisions

### Decision Priority Analysis

**Critical Decisions (Block Implementation):**
- OQ-1 resolved: Hybrid data sourcing via Quicket + Eventbrite + Facebook Events + Howler (pending API contact)
- Backend: Firebase (Firestore + Cloud Functions) — budget-safe, never pauses on free tier
- App data access: react-native-firebase SDK reads Firestore directly (no REST layer)
- Styling: NativeWind v4 — fast visual iteration for design-centric app

**Important Decisions (Shape Architecture):**
- State: React useState (UI) + TanStack Query (server state); no global store needed
- Monitoring: Firebase Crashlytics + Firebase Analytics (both free; replaces Sentry)
- CI/CD: GitHub Actions (tests) + EAS Build (binaries) + EAS Submit (stores)
- API keys never in app bundle: stored in Cloud Functions environment via EAS Secrets

**Deferred (Post-MVP):**
- Howler API contract: contact developers@howler.co.za; add in v1.1 once confirmed
- Push notifications, user accounts, multi-city: v2 per PRD scope

---

### Data Architecture

**Event Sourcing (OQ-1 — resolved):**
- Quicket REST API (developer.quicket.co.za) — SA-native ticketed events; API key required
- Eventbrite REST API — larger paid JHB events; public API
- Facebook Events Graph API — community/informal events (markets, free gigs); public events readable with app token
- Howler (howler.co.za) — SA nightlife/festivals; pending API access via developers@howler.co.za; add in v1.1 once confirmed

**Backend: Firebase (Firestore + Cloud Functions)**
- Firestore `events` collection: normalised Event schema (id, name, date, time, venue, address, category, description, price, ticketLink, imageUrl, source, lastUpdated)
- Firestore indexes: compound index on (category ASC, date ASC) for filtered queries; single index on date ASC for unfiltered feed
- Security rules: public read on `events` collection; no client writes
- Scheduled Cloud Functions (one per source): Quicket every 4h, Eventbrite every 4h, Facebook Events every 1h (more volatile), Howler every 4h (when available)
- Source API keys stored in Firebase Secret Manager (Cloud Functions environment) — never bundled in app
- Estimated Firestore reads at 1k MAU: ~3,000/day — within 50,000/day free limit
- Estimated Cloud Function invocations: ~3,000/month — within 2M/month free limit

**Client-side data layer:**
- react-native-firebase SDK reads Firestore directly (no extra REST hop)
- TanStack Query wraps Firestore calls: 5-min stale time, background refetch on focus
- Firestore SDK offline persistence enabled: last-known events visible when offline (satisfies NFR-3)

---

### Authentication & Security

- No auth in v1 (PRD decision); Firestore rules enforce read-only from clients
- POPIA: no PII collected or stored by app; ad SDK telemetry only; privacy policy must disclose AdMob data practices before App Store submission
- All third-party API keys (Quicket, Eventbrite, Facebook token) in Cloud Functions environment only; rotatable without app update

---

### API & Communication

- No custom REST API layer: app reads Firestore SDK directly
- Cloud Functions HTTP endpoints: reserved for future admin/webhook use only
- Error handling: TanStack Query retry (3 attempts, exponential backoff) + Firestore SDK built-in retry; expo-network drives offline UI state (NFR-3)
- Rate limiting: handled per-source in Cloud Functions sync logic; app never calls third-party APIs directly

---

### Frontend Architecture

**Styling: NativeWind v4**
- Tailwind CSS utility classes in React Native; rapid iteration for design-centric app
- Install: `npm install nativewind react-native-reanimated react-native-safe-area-context`
- Config: metro.config.js + tailwind.config.js + nativewind-env.d.ts
- Rationale: Fever-reference aesthetic requires fast visual tuning; NativeWind makes spacing/typography/colour iteration significantly faster than StyleSheet

**State Management:**
- UI state: React useState (active category filter, session-scoped; resets on close)
- Server state: TanStack Query (events list, event detail; cached, background-refresh)
- No Zustand/Redux: 2-screen read-only app has no shared cross-component state

**Navigation (Expo Router — file-based):**
- `app/index.tsx` — Home/Feed screen (FR-1–3, FR-7–8, FR-9–10)
- `app/event/[id].tsx` — Event Detail screen (FR-4–6)
- `app/_layout.tsx` — root layout, QueryClient provider, Firebase init, AdMob init

**Component Structure:**
- `components/EventCard.tsx` — name, date, venue, image/placeholder (FR-2)
- `components/FilterChips.tsx` — horizontal scroll, single-select (FR-7)
- `components/AdBanner.tsx` — AdMob banner, async load, no blank on fail (FR-9)
- `components/EmptyState.tsx` / `ErrorState.tsx` — FR-3
- `hooks/useEvents.ts` — TanStack Query + Firestore feed query
- `hooks/useEventDetail.ts` — TanStack Query + Firestore single-event query
- `constants/categories.ts` — 8 category values + placeholder image map
- `constants/theme.ts` — NativeWind design tokens

**Images:**
- expo-image for feed cards: built-in memory + disk cache, placeholder prop (FR-2, A-1)
- Category placeholder map in constants: one asset per category, no broken fallbacks

**Webview:**
- react-native-webview renders ticket URLs in-app (FR-5)
- Close/back control via Expo Router back() or modal dismiss

---

### Infrastructure & Deployment

**Monitoring (free):**
- Firebase Crashlytics: RN crash reporting via react-native-firebase
- Firebase Analytics: session/event tracking

**CI/CD:**
- GitHub Actions: Jest + TypeScript check on every PR
- EAS Build: trigger on merge to main; iOS + Android binaries
- EAS Submit: App Store + Google Play submission
- EAS free tier: 15 iOS + 15 Android builds/month

**Environment Config:**
- EAS Secrets: Quicket API key, Eventbrite API key, Facebook App Token — injected at build time via app.config.ts
- Firebase config: committed in google-services.json / GoogleService-Info.plist (standard Firebase pattern; non-secret)

**Monthly cost at launch: ~$8–12/month**
- Firebase: $0 (Spark plan; no pausing)
- Expo EAS: $0 (free tier)
- GitHub Actions: $0
- Firebase Crashlytics + Analytics: $0
- Apple Developer: ~$8/month (amortised $99/year)
- Google Play: $25 one-time

---

### Decision Impact Analysis

**Implementation Sequence:**
1. `npx create-expo-app@latest event-board-za` — project scaffold
2. Firebase project setup: Firestore schema, indexes, security rules
3. NativeWind v4 setup: metro config, tailwind config
4. Navigation structure: root layout, screen files, QueryClient + Firebase + AdMob init
5. Feed screen: EventCard, FilterChips, TanStack Query hook, AdBanner
6. Event Detail screen: full fields, WebView for ticket links, back nav
7. Offline/error/empty states (NFR-3, FR-3)
8. Cloud Functions: Quicket sync, Eventbrite sync, Facebook Events sync
9. AdMob interstitial integration (FR-10)
10. EAS Build + GitHub Actions CI setup
11. Firebase Crashlytics + Analytics wiring
12. Howler sync function (when API access confirmed)

**Cross-Component Dependencies:**
- Firebase init must complete before any Firestore reads → initialise in `app/_layout.tsx`
- AdMob SDK must initialise before rendering AdBanner → init in `app/_layout.tsx` alongside Firebase
- TanStack Query QueryClient wraps entire app in `_layout.tsx`
- NativeWind config must include all component paths in tailwind content array or classes will be purged

## Implementation Patterns & Consistency Rules

### Naming Patterns

**Firestore Field Naming: camelCase**
- All Firestore document fields use camelCase: `ticketLink`, `lastUpdated`, `imageUrl` — not `ticket_link` or `image_url`
- Rationale: matches TypeScript/JS conventions; no transformation layer needed

**File Naming:**
- React components: PascalCase — `EventCard.tsx`, `FilterChips.tsx`
- Hooks: camelCase prefixed with `use` — `useEvents.ts`, `useEventDetail.ts`
- Screens (Expo Router): lowercase — `app/index.tsx`, `app/event/[id].tsx`
- Constants: camelCase — `categories.ts`, `theme.ts`
- Cloud Functions: camelCase per source — `syncQuicket.ts`, `syncEventbrite.ts`
- Utilities: camelCase — `normaliseEvent.ts`, `formatDate.ts`

**TypeScript Naming:**
- Data model types: plain PascalCase — `Event`, `Category`, `AdConfig`
- Type unions: PascalCase — `CategoryFilter`, `FeedStatus`
- True constants: SCREAMING_SNAKE_CASE — `CATEGORY_VALUES`, `AD_INTERVAL`
- No enums — use `as const` objects: `const CATEGORIES = { MUSIC: 'Music' } as const`

---

### Structure Patterns

**Project File Structure:**
```
app/
  _layout.tsx          ← QueryClient + Firebase + AdMob init
  index.tsx            ← Feed screen
  event/
    [id].tsx           ← Event Detail screen
components/
  EventCard.tsx
  FilterChips.tsx
  AdBanner.tsx
  EmptyState.tsx
  ErrorState.tsx
hooks/
  useEvents.ts
  useEventDetail.ts
constants/
  categories.ts        ← CATEGORY_VALUES, CATEGORY_PLACEHOLDERS
  theme.ts             ← NativeWind design tokens
lib/
  firebase.ts          ← Firebase app init (singleton)
  queryClient.ts       ← TanStack QueryClient instance
types/
  event.ts             ← Event interface
  index.ts             ← barrel export
functions/
  src/
    syncQuicket.ts
    syncEventbrite.ts
    syncFacebookEvents.ts
    syncHowler.ts
    lib/
      normaliseEvent.ts  ← shared normaliser
      firestoreClient.ts ← shared Firestore write util
```

**Test File Placement: co-located**
- `EventCard.test.tsx` lives next to `EventCard.tsx`
- Rationale: easier to find, less directory switching, standard RN pattern

**Exports: named exports only — no default exports**
- `export function EventCard(...)` not `export default function EventCard(...)`
- Exception: Expo Router screen files require default exports — screens only
- Rationale: named exports make refactoring and imports explicit

---

### Format Patterns

**Firestore Event Document Shape:**
```typescript
interface Event {
  id: string;
  name: string;
  date: string;           // ISO 8601 date string: "2026-06-14"
  time: string | null;    // "19:00" or null if unknown
  venue: string;
  address: string | null;
  category: Category;
  description: string | null;
  price: string | null;   // "R150" or "Free" or null
  ticketLink: string | null;
  imageUrl: string | null;
  source: 'quicket' | 'eventbrite' | 'facebook' | 'howler';
  lastUpdated: string;    // ISO 8601 timestamp
}
```

**Date Storage: ISO strings, not Firestore Timestamps**
- Store dates as ISO 8601 strings in Firestore (`"2026-06-14"`)
- Rationale: simpler serialisation; string comparison works for date-ascending sort

**Absent Fields: null, not undefined or omitted**
- Optional fields with no value are stored as `null` in Firestore — never omitted
- Rationale: consistent document shape; prevents undefined vs missing key bugs

**Category Values (canonical):**
```typescript
export const CATEGORY_VALUES = [
  'Music', 'Markets', 'Food & Drink', 'Art & Culture',
  'Sport', 'Comedy', 'Family', 'Nightlife'
] as const;
export type Category = typeof CATEGORY_VALUES[number];
```

---

### Communication Patterns

**TanStack Query Key Factory:**
```typescript
export const eventKeys = {
  all: ['events'] as const,
  list: (category: Category | null) =>
    [...eventKeys.all, 'list', category] as const,
  detail: (id: string) =>
    [...eventKeys.all, 'detail', id] as const,
};
```
- All query keys use this factory — no ad-hoc string arrays in components

**Filter State: local to Feed screen, passed as prop**
- Active category filter lives in `useState` in `app/index.tsx`
- Passed as prop to `FilterChips` and as argument to `useEvents(category)`
- Not in context, not in a store — session-local state only

**Hook Contracts:**
```typescript
function useEvents(category: Category | null): {
  events: Event[];
  isLoading: boolean;
  isError: boolean;
  refetch: () => void;
}

function useEventDetail(id: string): {
  event: Event | null;
  isLoading: boolean;
  isError: boolean;
}
```

---

### Process Patterns

**Loading States:**
- Feed loading: skeleton EventCard placeholders (3–5 cards) — not a spinner
- Detail loading: skeleton layout matching detail screen shape
- Ad loading: zero-height view — never a spinner or placeholder

**Error States:**
- Feed error: `<ErrorState>` with retry button calling `refetch()`
- Detail error: `<ErrorState>` with back navigation option
- Ad load failure: silent — no UI change, no Crashlytics log
- Network offline: expo-network drives top-level banner; feed shows last Firestore cached data

**Error Handling: no try/catch in components**
- All async errors flow through TanStack Query's `isError` state
- Components read `isError` and render `<ErrorState>` — no inline try/catch
- Cloud Functions use try/catch internally; log via Firebase Functions logger

**NativeWind: className only, no inline styles**
- All styling via `className` prop using Tailwind utilities
- Never use `StyleSheet.create()` or `style={{}}` in app components
- Exception: dynamic styles that cannot be expressed as static class names (document with comment)

**AdMob Patterns:**
- `<AdBanner>` handles its own load/fail state internally — parent never checks ad state
- Interstitial: request on app foreground, show after 3rd detail view open; minimum once per 10 minutes (confirm OQ-5 before implementing)

**Cloud Functions Normaliser Contract:**
```typescript
// All sync functions call this before writing to Firestore
function normaliseEvent(raw: unknown, source: Event['source']): Event | null
// Returns null if required fields (name, date, venue) are missing — caller discards silently
```

---

### Enforcement: All AI Agents MUST

- Use named exports for all non-screen files
- Use the `eventKeys` factory for all TanStack Query keys
- Store `null` (not undefined, not omitted) for absent optional fields
- Use ISO 8601 strings for all dates in Firestore
- Use NativeWind `className` — no `StyleSheet` in app components except documented exceptions
- Pass category filter as prop/argument — not via context or global state
- Use `normaliseEvent()` in all Cloud Function sync jobs

**Anti-patterns:**
- `export default` on components (screen files excepted)
- `style={{ marginTop: 8 }}` inline styles on app components
- Bare string query keys: `useQuery({ queryKey: ['events'] })`
- Firestore `Timestamp` objects or `new Date()` stored in documents
- Fetching from Quicket/Eventbrite APIs directly from the app
- Spinner or placeholder while ads load

## Project Structure & Boundaries

### FR-to-Structure Mapping

| Requirement | File(s) |
|---|---|
| FR-1 (chronological feed) | `hooks/useEvents.ts` + Firestore `date ASC` index |
| FR-2 (event card content) | `components/EventCard.tsx` + `assets/placeholders/` |
| FR-3 (empty/error states) | `components/EmptyState.tsx`, `components/ErrorState.tsx` |
| FR-4 (detail view) | `app/event/[id].tsx` + `hooks/useEventDetail.ts` |
| FR-5 (ticket webview) | `components/TicketWebView.tsx` |
| FR-6 (back nav) | Expo Router stack — automatic |
| FR-7 (filter chips) | `components/FilterChips.tsx` + `constants/categories.ts` |
| FR-8 (filter persistence) | `useState` in `app/index.tsx` (session-local) |
| FR-9 (banner ads) | `components/AdBanner.tsx` |
| FR-10 (ad SDK init) | `app/_layout.tsx` |
| NFR-1 (feed ≤2s) | `lib/queryClient.ts` staleTime config + Firestore compound index |
| NFR-3 (offline) | `hooks/useNetworkState.ts` + `components/OfflineBanner.tsx` + Firestore offline persistence |
| NFR-5 (POPIA) | `docs/privacy-policy.md` + App Store privacy manifest |
| OQ-1 (data sourcing) | `functions/src/sync*.ts` + `functions/src/lib/normaliseEvent.ts` |

---

### Complete Project Directory Structure

```
event-board-za/                          ← RN app root (create-expo-app output)
├── app.config.ts                        ← Expo config; EAS Secrets injected here
├── package.json
├── tsconfig.json
├── tailwind.config.js                   ← NativeWind content paths
├── metro.config.js                      ← withNativeWind Metro plugin
├── nativewind-env.d.ts
├── babel.config.js
├── .env.example                         ← documents required env vars; no real values
├── .gitignore
├── google-services.json                 ← Firebase Android config (committed; non-secret)
├── GoogleService-Info.plist             ← Firebase iOS config (committed; non-secret)
├── eas.json                             ← EAS Build profiles (development/preview/production)
├── .github/
│   └── workflows/
│       └── ci.yml                       ← Jest + tsc --noEmit on every PR
├── app/
│   ├── _layout.tsx                      ← QueryClient provider + Firebase init + AdMob init
│   ├── index.tsx                        ← Feed screen (FR-1–3, FR-7–8, FR-9–10)
│   └── event/
│       └── [id].tsx                     ← Event Detail screen (FR-4–6)
├── components/
│   ├── EventCard.tsx                    ← name, date, venue, image/placeholder (FR-2)
│   ├── EventCard.test.tsx
│   ├── FilterChips.tsx                  ← horizontal category chips, single-select (FR-7)
│   ├── FilterChips.test.tsx
│   ├── AdBanner.tsx                     ← AdMob banner; self-contained load/fail (FR-9)
│   ├── AdBanner.test.tsx
│   ├── SkeletonCard.tsx                 ← feed loading placeholder
│   ├── EmptyState.tsx                   ← no events to show (FR-3)
│   ├── ErrorState.tsx                   ← load failed + retry button (FR-3)
│   ├── OfflineBanner.tsx                ← no connection indicator (NFR-3)
│   └── TicketWebView.tsx                ← in-app webview + close control (FR-5)
├── hooks/
│   ├── useEvents.ts                     ← Firestore feed query via TanStack Query (FR-1)
│   ├── useEvents.test.ts
│   ├── useEventDetail.ts                ← Firestore single-event query (FR-4)
│   ├── useEventDetail.test.ts
│   └── useNetworkState.ts               ← expo-network wrapper; drives OfflineBanner (NFR-3)
├── lib/
│   ├── firebase.ts                      ← Firebase app init singleton
│   ├── queryClient.ts                   ← TanStack QueryClient (staleTime: 5min, retry: 3)
│   └── queryKeys.ts                     ← eventKeys factory (all query keys live here)
├── constants/
│   ├── categories.ts                    ← CATEGORY_VALUES as const + CATEGORY_PLACEHOLDERS map
│   └── theme.ts                         ← NativeWind design tokens (colours, spacing, fonts)
├── types/
│   ├── event.ts                         ← Event interface, Category type
│   └── index.ts                         ← barrel re-export
├── assets/
│   ├── placeholders/                    ← one PNG per category; keep each under 50KB (NFR-2)
│   │   ├── music.png
│   │   ├── markets.png
│   │   ├── food-drink.png
│   │   ├── art-culture.png
│   │   ├── sport.png
│   │   ├── comedy.png
│   │   ├── family.png
│   │   └── nightlife.png
│   ├── icon.png
│   └── splash.png
└── docs/
    └── privacy-policy.md                ← POPIA + AdMob telemetry disclosure (NFR-5)

functions/                               ← Firebase Cloud Functions (separate npm workspace)
├── package.json
├── tsconfig.json
├── .gitignore
└── src/
    ├── index.ts                         ← exports all scheduled functions
    ├── syncQuicket.ts                   ← Quicket API → Firestore, scheduled every 4h
    ├── syncQuicket.test.ts
    ├── syncEventbrite.ts                ← Eventbrite API → Firestore, scheduled every 4h
    ├── syncEventbrite.test.ts
    ├── syncFacebookEvents.ts            ← Facebook Graph API → Firestore, scheduled every 1h
    ├── syncFacebookEvents.test.ts
    ├── syncHowler.ts                    ← Howler API → Firestore, every 4h (add when confirmed)
    └── lib/
        ├── normaliseEvent.ts            ← shared normaliser used by all sync functions
        ├── normaliseEvent.test.ts
        ├── firestoreClient.ts           ← shared Firestore batch-write util
        └── dateUtils.ts                 ← ISO 8601 parse/format helpers
```

---

### Architectural Boundaries

**Firestore write boundary — Cloud Functions only:**
- `functions/src/sync*.ts` are the only writers to the `events` collection
- App client has read-only Firestore security rules; any write attempt returns permission denied

**AdMob boundary — AdBanner + _layout only:**
- `components/AdBanner.tsx` is the only component that imports from `react-native-google-mobile-ads`
- Interstitial logic lives exclusively in `app/_layout.tsx`

**Navigation boundary — screens only:**
- `router.push()` / `router.back()` only called inside screen files (`app/*.tsx`)
- Components receive callback props if they need to trigger navigation

**External API boundary — Cloud Functions only:**
- Quicket, Eventbrite, Facebook, Howler APIs called only from `functions/src/`
- API keys never reach the app bundle — stored in Firebase Secret Manager

---

### Data Flow

```
[Quicket / Eventbrite / Facebook / Howler APIs]
        ↓  scheduled Cloud Functions (write-only)
[Firestore — events collection]
        ↓  react-native-firebase SDK (read-only)
[TanStack Query in-memory cache]
        ↓  useEvents(category) / useEventDetail(id)
[app/index.tsx (Feed) / app/event/[id].tsx (Detail)]
        ↓  props
[EventCard / FilterChips / AdBanner / TicketWebView / states]
```

**Offline path (NFR-3):**
```
[No network] → expo-network → useNetworkState → OfflineBanner visible
                            → Firestore SDK serves last cached documents
                            → Feed renders stale data (no blank screen)
```

---

### Integration Points

- Quicket REST API — Cloud Functions only; API key in Secret Manager
- Eventbrite REST API — Cloud Functions only; API key in Secret Manager
- Facebook Graph API — Cloud Functions only; app token in Secret Manager
- Howler API — Cloud Functions only (pending); placeholder in syncHowler.ts
- Google AdMob — app only; AdMob App ID in app.config.ts (non-secret)
- Firebase — app + Cloud Functions
- GitHub PR → ci.yml → Jest + tsc
- Merge to main → EAS Build → internal distribution
- Release tag → EAS Submit → App Store + Play Store

## Architecture Validation Results

### Coherence Validation ✅

**Decision Compatibility:**
All technology choices are mutually compatible on Expo SDK 56 + React Native 0.85: react-native-firebase, NativeWind v4, TanStack Query, react-native-google-mobile-ads, react-native-webview, and expo-image have no version conflicts. NativeWind requires metro.config.js setup (documented). react-native-firebase requires a development build — Expo Go cannot be used; developers run `npx expo run:ios` / `npx expo run:android`.

**Pattern Consistency:**
NativeWind className-only rule is consistent with no-StyleSheet enforcement. Named export rule is consistent with Expo Router screen exception. eventKeys factory is consistent across all hook contracts. ISO string dates are consistent with dateUtils.ts helpers and Firestore string-sort behaviour.

**Structure Alignment:**
Project structure supports all decisions: screens in app/ (Expo Router), co-located tests, lib/ singletons, Cloud Functions as a separate workspace. Boundary rules (Firestore write-only via Functions, AdMob in AdBanner+_layout only, external APIs in Functions only) are structurally enforced.

---

### Requirements Coverage Validation ✅

**Functional Requirements:**
All 10 FRs have specific file-level architectural support (see FR-to-Structure Mapping). FR-6 (back nav) is handled automatically by Expo Router stack — no custom code needed.

**Non-Functional Requirements:**
- NFR-1 (≤2s on 4G): TanStack Query staleTime + Firestore compound index + initial query limit ✅
- NFR-2 (≤50 MB): minimal dependency set; placeholder images <50KB each; monitor binary size in EAS Build output before release ✅
- NFR-3 (offline): Firestore SDK offline persistence + useNetworkState + OfflineBanner ✅
- NFR-4 (WCAG 2.1 AA): accessibility pattern specified in Gap Resolution below ✅
- NFR-5 (POPIA): privacy-policy.md + no PII + App Store privacy manifest ✅

---

### Gap Analysis & Resolutions

**Gap 1 — Feed pagination (NFR-1):**
Initial Firestore query uses `limit(50)` ordered by date ASC; sufficient at launch. When event count grows, implement `useInfiniteQuery` with Firestore `startAfter()` cursor. `useEvents.ts` accepts optional `pageSize` param (default 50). Story-level implementation detail, not a blocking gap.

**Gap 2 — Cross-source event deduplication:**
`normaliseEvent()` generates Firestore document ID as `{source}-{slugify(name)}-{date}` (e.g. `quicket-jazz-in-the-gardens-2026-06-14`). Sync functions write with `set({ merge: false })` — last writer wins deterministically. Quicket is the authoritative source when the same event appears on multiple platforms.

**Gap 3 — Accessibility pattern (NFR-4):**
All interactive components must include:
- `accessibilityLabel`: descriptive string (e.g. "Jazz in the Gardens, Saturday 14 June, Maboneng")
- `accessibilityRole`: "button" on tappable cards, "tab" on filter chips
- `accessibilityState`: `{ selected: true/false }` on FilterChip when active
Enforce in story acceptance criteria for EventCard, FilterChips, and ErrorState.

---

### Architecture Completeness Checklist

**Requirements Analysis**
- [x] Project context thoroughly analyzed
- [x] Scale and complexity assessed (Low–Medium)
- [x] Technical constraints identified
- [x] Cross-cutting concerns mapped

**Architectural Decisions**
- [x] Critical decisions documented with versions
- [x] Technology stack fully specified
- [x] Integration patterns defined
- [x] Performance considerations addressed

**Implementation Patterns**
- [x] Naming conventions established
- [x] Structure patterns defined
- [x] Communication patterns specified
- [x] Process patterns documented

**Project Structure**
- [x] Complete directory structure defined
- [x] Component boundaries established
- [x] Integration points mapped
- [x] Requirements to structure mapping complete

---

### Architecture Readiness Assessment

**Overall Status:** READY FOR IMPLEMENTATION

**Confidence Level:** High — all FRs and NFRs covered, no critical gaps, technology choices verified against current versions.

**Key Strengths:**
- Zero-auth read-only client: minimal attack surface and implementation complexity
- Firebase free tier eliminates infrastructure cost until meaningful traction
- Boundary rules (write-only Functions, read-only app) make the data pipeline simple and auditable
- Normalised Event schema with explicit null fields prevents a class of bugs at the data layer

**Areas for Future Enhancement (v2):**
- User accounts: Firebase Auth + Firestore user collection
- Push notifications: Firebase Cloud Messaging (already in stack)
- Multi-city: `city` field + Firestore index
- Promoted listings: `promoted: true` flag + feed sort adjustment

---

### Implementation Handoff

**AI Agent Guidelines:**
- Follow all architectural decisions exactly as documented
- Use implementation patterns from §Implementation Patterns & Consistency Rules
- Respect the four boundary rules (Firestore, AdMob, Navigation, External APIs)
- Refer to FR-to-Structure Mapping for file-level implementation targets

**First Implementation Steps:**
1. `npx create-expo-app@latest event-board-za`
2. Firebase project setup (console.firebase.google.com)
3. `npm install nativewind react-native-reanimated react-native-safe-area-context`
4. `npm install @react-native-firebase/app @react-native-firebase/firestore`
5. Configure metro.config.js (NativeWind) + google-services.json / GoogleService-Info.plist
