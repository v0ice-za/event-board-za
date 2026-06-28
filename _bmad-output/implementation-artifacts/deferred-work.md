# Deferred Work

## Deferred from: consolidated code review of Epic 5 (stories 5-2..5-5) (2026-06-27)

- iOS `background → inactive → active` sequence defeats the feed's foreground soft-refresh guard `next === 'active' && prev === 'background'` — on a real iOS return-from-background the intervening `inactive` event sets `prev = 'inactive'`, so the scroll-to-top + soft refetch (UX-DR12) never fires [app/index.tsx:55]. Pre-existing Epic 2.6 code (not changed in Epic 5). The guard was deliberately written to ignore Control Center/biometric `inactive` blips; distinguishing those from a true background return needs tracking whether `background` was seen since the last `active`. Fix in a feed-polish pass.
- Banner `onAdLoaded` can call `setLoaded`/`logAdImpression('banner')` after its `FlatList` slot unmounts (`removeClippedSubviews` row recycling) → dev "setState on unmounted component" warning + a false impression; it also re-logs `ad_view` on every AdMob auto-refresh (double-counts banner impressions) [components/AdBannerUnit.tsx:47-50]. Ties to the existing Story 5.1/2.6 row-recycling deferral; revisit with the ad-row-injection fix.
- Interstitial detail-view counter (`recordDetailView`) increments on mount before the `isLoading`/`isError` early returns, so 3 failed/never-loading detail opens still trigger an interstitial [app/event/[id].tsx:32-34]. Minor metric/UX oddity; moving the call below the loaded branch risks rules-of-hooks complexity.

## Deferred from: Story 5.1 (AdBannerUnit) implementation (2026-06-26)

- FlatList `removeClippedSubviews` + the ad slot rendered conditionally inside `renderItem` (now a real `<AdBannerUnit/>`, non-zero-height once an ad loads) may blank/recycle rows on a real device [app/index.tsx]. Mitigated for now because the ad is zero-height until loaded; the robust fix is to inject ad rows into the FlatList `data` array so every row is a stable item. Left as a future refinement (out of Story 5.1 AC scope) — verify on-device during QA and escalate to data-array injection if row blanking is observed. Supersedes the 2026-06-22 (2-6) entry on the same line

## Deferred from: correct-course OQ-1 data-sourcing revision (2026-06-25)

- Stories 4.4 (syncEventbrite) and 4.5 (syncFacebookEvents) deferred to v1.1 — Eventbrite's public Event Search API (removed 2020-02-20) and Facebook's public event discovery by location no longer exist. v1 ships with Quicket as the sole programmatic source. See `_bmad-output/planning-artifacts/sprint-change-proposal-2026-06-25.md`
- `EVENTBRITE_API_KEY` and Facebook app-token EAS Secrets / `app.config.ts` wiring are NOT needed for v1 (supersedes the Epic-4 note in the 1-5-cicd-pipeline entry below for those two keys) — re-wire alongside their sync functions in v1.1. Quicket key wiring stands (Story 4.3)

## Deferred from: code review of 3-2-webviewmodal-component (2026-06-22)

- No URL-scheme allowlist on the in-app `WebView` (`onShouldStartLoadWithRequest`) — an unexpected `ticketLink` scheme (`javascript:`, `file:`, `intent:`) would load inside the modal [components/WebViewModal.tsx:31]. Mitigated today by curated Firestore data (Epic 4 `normaliseEvent` owns the trust boundary) and out of Story 3.2's ACs. Future security hardening: restrict to `https:` (and `http:`) navigations, optionally pinned to the ticket provider hosts

## Deferred from: code review of 2-6-event-feed-screen (2026-06-22)

- `removeClippedSubviews` + the interleaved conditional ad-slot in `renderItem` may blank/recycle rows once a real ad replaces the zero-height seam [app/index.tsx:104-111] — Story 5.1; consider injecting ad rows into the data array instead of conditionally rendering inside `renderItem`
- Trailing ad rendered when `events.length` is an exact multiple of 6 (ad becomes the final scroll row) [app/index.tsx:108] — Story 5.1; harmless while zero-height, product call whether a terminal ad is wanted (guard with `index + 1 < events.length` if not)
- `EventCard` can display literal "undefined" if a Firestore doc has null `name`/`venue` [hooks/useEvents.ts:84] — pre-existing trust-boundary concern owned by useEvents / Epic 4 `normaliseEvent`, not the feed screen
- Online error-with-cached-events shows a stale list with no error/stale indicator [app/index.tsx:80] — spec deliberately serves cached data on error; an optional stale/error banner (mirroring `OfflineBanner`) is a future UX enhancement

## Deferred from: code review of 2-5-useevents-hook (2026-06-21)

- Composite index `(category ASC, date ASC)` must be deployed or the filtered category query throws `failed-precondition` at runtime [hooks/useEvents.ts:67-72] — index deployment is Story 1.3 / Epic 4 territory, not a hook bug; mocked tests cannot catch it
- `as Event` cast / `data()` returning `undefined` / `date` stored as a Firestore Timestamp are unguarded at runtime [hooks/useEvents.ts:75-78] — trust boundary owned by Cloud Function `normaliseEvent()` (Epic 4); prior review chose document-not-validate. Add a malformed-doc filter here if blast-radius containment is wanted later
- No `AbortController`/`signal` wired into `queryFn` — rapid category toggling leaves the prior in-flight `getDocs` uncancelled (extra Firestore read, can seed stale cache) [hooks/useEvents.ts:63-79] — low impact (TanStack serves the active key); future optimization

## Deferred from: code review of 2-2-eventcard-skeletoncard-components (2026-06-16)

- SkeletonCard ignores reduced-motion preferences — a constantly pulsing shimmer should pause/soften when `AccessibilityInfo.isReduceMotionEnabled()` is true. Out of Story 2.2 AC scope; a future accessibility polish tied to NFR-4 (consider doing it across all animated components, incl. EventCard press scale) [components/SkeletonCard.tsx]

## Deferred from: code review of 2-1-categoryplaceholder-component (2026-06-16)

- AC #4 on-device visual verification of all 8 placeholder variants — no iOS/Android simulator in this environment; includes the gradient/emoji contrast "design pass" originally deferred to Story 2.1 (see 2026-05-31 entry below). Must be eyeballed on a real device during release/QA [components/CategoryPlaceholder.tsx]
- Unit tests don't assert NativeWind `className` styling actually applies (full-bleed `absolute inset-0`, `text-[32px]`) — `className`-only project rule precludes a `style` fallback; visual correctness is covered by the AC #4 on-device check, not the Jest suite [components/CategoryPlaceholder.test.tsx]

## Deferred from: code review of 1-5-cicd-pipeline (2026-06-16)

- AdMob plugin ships Google **test** App IDs in the `production` profile — zero ad revenue if released as-is [app.config.ts:55-56] — belongs to Epic 5 (Story 5.1/5.5 release prep)
- `extra.*ApiKey ?? ''` bakes empty strings into all EAS build profiles with no non-empty validation for `production` — silent credential-less builds [app.config.ts:35-37] — real key wiring + validation belongs to Epic 4 (Stories 4.3–4.5)
- `@react-native/jest-preset` added to devDependencies but absent from the story File List and the spec's "only these three packages" constraint — redundant (jest-expo pulls it in transitively), harmless [package.json:40] — document or remove
- Add a `lint` step to `ci.yml` once `components/` has real source files — `expo lint` errors today because the dir holds only `.gitkeep` (ESLint 9: all matched files ignored). Verify `npm run lint` passes, then add the gate in **Story 2.1** [.github/workflows/ci.yml]

## Deferred from: code review of 1-4-root-layout-providers-sdk-initialisation (2026-06-01)

- AdMob `MobileAds().initialize()` called before user consent on GDPR/POPIA devices [app/_layout.tsx:34] — consent flow belongs to Story 5.4 POPIA compliance
- `queryClient` `retry: 3` default retries permanent Firestore errors (permission denied, not-found) — add per-query `retry: false` or `retry: 0` for known-permanent errors in Stories 2.5, 3.1 [lib/queryClient.ts:7]

## Deferred from: code review of 1-3-firebase-project-firestore-schema-seed-data (2026-06-01)

- Firestore batch not chunked — fails silently above 500 ops [scripts/seed-firestore.js:seed()] — safe now at 25 events; add chunking if seed script is reused at scale
- `future()` seed dates are relative to script-run time — near-term events (10–17 days out) will expire from the feed naturally [scripts/seed-firestore.js:future()] — expected for seed data
- `normaliseEvent` return type is `null` literal, not `NormalisedEvent | null` [functions/src/lib/normaliseEvent.ts:3] — full type belongs in Story 4.2
- `.gitignore` `scripts/service-account.json` entry is case-exact — theoretical staging risk on case-insensitive filesystems (macOS/Windows) [.gitignore]

## Deferred from: code review of 1-2-configure-nativewind-v4-design-tokens (2026-06-03)

- `app/index.tsx` uses `style={{}}` with hardcoded hex values instead of `className` — stub screen, Story 2.6 will replace entirely
- `event.image` / `event.title` field names don't match canonical `Event.imageUrl` / `Event.name` — stub screen field mismatch, Story 2.6
- Local `type Event`, `CATEGORY_META`, and hardcoded font families in `app/index.tsx` — stub screen divergence, Story 2.6
- AC8 visual on-device confirmation unverifiable — no device available; bundle compiles clean; developer must verify on first native build
- `event.going` and `event.badge` absent from canonical `Event` type — stub fields to evaluate in Story 2.6 feed design
- Static stub event dates bypass past-event filtering — stub data only; Story 2.6 uses real Firestore data

## Deferred from: code review of 1-2-configure-nativewind-v4-design-tokens (2026-05-31)

- `preventAutoHideAsync()` at module scope with no `.catch()` [app/_layout.tsx:13] — standard Expo boilerplate pattern; risk is negligible in practice
- `Event.date` typed as plain `string` — no ISO 8601 enforcement at type level [types/event.ts:8] — enforcement belongs in Story 4.2 normaliseEvent
- `Event.time` format undefined — `"19:00"` vs `"8PM"` vs full ISO not specified [types/event.ts:9] — format normalisation belongs in Story 4.2 normaliseEvent
- `CATEGORY_PLACEHOLDERS[unknown_category]` returns `undefined` at runtime for categories not in `CATEGORY_VALUES` [constants/categories.ts:17] — Story 2.1 CategoryPlaceholder component should handle this with a fallback
- Gradient colors all near-black — no minimum contrast ratio enforced for emoji/text overlay [constants/categories.ts:20-27] — Story 2.1 design pass
- `price: string | null` type allows `""` despite comment contract [types/event.ts:16] — empty string enforcement belongs in Story 4.2 normaliseEvent
