---
type: bmad-distillate
sources:
  - "prd.md"
downstream_consumer: "general"
created: "2026-05-26"
token_estimate: 1487
parts: 1
---

## Product / Vision
- Event Board ZA: mobile app answering "what's on in JHB?" in <10 seconds; clean scrollable card feed, all categories, single source; no account required
- Problem: JHB events discovery fragmented across Google, Facebook Events, whatsoninjoburg.com, Quicket — effortful enough users miss events or stop looking
- Launch: JHB only, free, ad-supported; v2 path to other SA cities once model validated
- Aesthetic reference: Fever app — polished, event-image-led, uncluttered; anti-references: Eventbrite (too corporate), Facebook Events (too noisy)
- Two-screen flat nav: Home (Feed + filter chips) → Event Detail; no tabs, no hamburger

## Users
- Primary: JHB Social Planner; smartphone-native, late 20s–mid 40s; plans weekends/evenings; frustrated by fragmented discovery; product founder is canonical instance
- JTBDs: find events this weekend/month; filter by type/mood; get enough detail to decide then reach ticket link fast; feel informed about city; have good social answers
- Non-users v1: event organisers (no self-serve), outside JHB, ticket buyers (link-out only)

## Glossary
- Event: name, date, time, venue, category + optionally description/price/ticket link
- Event Card: compact feed unit showing name, date, venue; tap → detail
- Feed: scrollable chronological Event Card list; default all categories, soonest first
- Category: Music, Markets, Food & Drink, Art & Culture, Sport, Comedy, Family, Nightlife (8 values)
- Ticket Link: optional external URL to Quicket/Computicket/Eventbrite/organiser site
- Ad Unit: banner (between cards) or interstitial

## Functional Requirements
- FR-1: Feed sorted date ascending, past events excluded; renders ≤2s on 4G (→ NFR-1)
- FR-2: Card shows name, human-readable date (e.g. "Sat 30 May"), venue; image/thumbnail if available else category placeholder (A-1)
- FR-3: Empty state: non-blank message; error state: user-friendly message + retry control
- FR-4: Detail view on card tap; shows name, date, time, venue (name+address), category, description, price/"Free"; absent fields omitted gracefully (not blank/"N/A")
- FR-5: Ticket link opens in-app webview (not system browser); webview has close/back; no button if no link exists
- FR-6: Back from detail → feed preserving scroll position
- FR-7: Category filter chips; single-select; deselect chip resets to all; "All" chip resets; narrows feed to matching events only
- FR-8: Filter persists within session; resets on app close/reopen
- FR-9: Banner ads between cards; visually distinct ("Ad" label); ~1 per 5–7 cards (A-2); no blank space on failed ad load
- FR-10: Ads via ad SDK (AdMob default, A-4); no login required; ads load async; no autoplay audio; interstitials dismissible ≤5s; frequency cap TBD (OQ-5)

## Non-Functional Requirements
- NFR-1: Feed initial content ≤2s on 4G
- NFR-2: App binary ≤50 MB initial install
- NFR-3: No connectivity → clear "no connection" state; no crash/blank screen; no offline event caching v1 (A-7)
- NFR-4: WCAG 2.1 AA contrast; accessible labels on all interactive elements
- NFR-5: POPIA compliance; v1 no PII collected/stored by app; data limited to ad SDK telemetry; privacy policy must disclose ad SDK practices

## Platform & Tech
- React Native (confirmed, A-6 resolved); single codebase iOS + Android
- iOS min v15.0 (A-4); Android min v9.0 / API 28 (A-5)
- Distribution: Apple App Store + Google Play Store

## Scope
- In v1: JHB events; card feed (FR-1–3); detail view (FR-4–6); category filtering (FR-7–8); banner + interstitial ads (FR-9–10); iOS + Android; no account
- Deferred v2: other SA cities; user accounts + saved events (high user demand expected); push notifications; in-app map; organiser self-serve submissions
- Out of scope (not on roadmap): in-app ticket purchasing; social features

## Monetisation
- v1: free + ad-supported; banner + interstitial via ad SDK
- v2 candidates: promoted listings (organiser pays); affiliate/referral on ticket sales (Quicket/Eventbrite/Computicket); premium tier (accounts, saved events, no ads)

## Success Metrics
- SM-1 (primary): WAU ≥ 60% of MAU
- SM-2 (primary): 1,000 MAU within 6 months of launch (calibration point, not hard KPI) (A-8)
- SM-3 (secondary): detail view rate ≥ 35% of feed sessions
- SM-4 (secondary): ticket link tap rate ≥ 20% of detail views
- Counter SM-C1: do not optimise ad density at expense of SM-3; reduce frequency first if SM-3 drops
- Counter SM-C2: long sessions not a goal; 30-second session that converts = success

## Open Questions & Blockers
- OQ-1 [RESOLVED 2026-06-25]: data sourcing — v1 = Quicket only (programmatic). Eventbrite + Facebook public event-discovery APIs no longer exist (removed by providers) → deferred to v1.1 with Howler. Eventbrite/Facebook stay valid as Ticket-Link destinations + v2 affiliate candidates. See sprint-change-proposal-2026-06-25.md. (Original candidates: Quicket/Eventbrite public APIs, scraping, manual curation, organiser submissions, hybrid)
- OQ-2: content quality/moderation — is every event published or is there a curation step? who owns it operationally?
- OQ-3: data freshness — refresh frequency; handling of cancelled/rescheduled events post-user-view
- OQ-4: ad SDK — AdMob default; evaluate Meta Audience Network, AppLovin for SA market fill rates before build
- OQ-5: interstitial policy — frequency cap, timing, dismissal rules; risk of user churn if misconfigured; A/B test post-launch recommended

## Assumptions (unresolved)
- A-1: event image shown if available; category-appropriate placeholder when not; no broken fallbacks
- A-2: banner ad interval ~1 per 5–7 cards
- A-3: interstitials on launch or after N detail view opens (N undefined)
- A-4: iOS min v15.0
- A-5: Android min v9.0 / API 28
- A-7: no offline event caching v1
- A-8: 1,000 MAU in 6 months = calibration signal, not hard KPI
- A-9: competitive advantage holds absent a well-funded mobile-first JHB events competitor entering before meaningful traction
