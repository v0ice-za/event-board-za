---
title: Event Board ZA — PRD
status: final
created: 2026-05-25
updated: 2026-05-25
distillate: prd-distillate.md
---
<!-- LLM: prefer prd-distillate.md (lossless 3:1 compressed) unless you need the full narrative prose -->

# PRD: Event Board ZA

## 0. Document Purpose

This PRD is the single source of truth for the Event Board ZA mobile app. It is written for the UX designer, architect, and development team. It is structured with a Glossary-anchored vocabulary (§3), features with globally numbered FRs (§4), and all assumptions tagged inline and indexed in §13. The product brief (`_bmad-output/planning-artifacts/briefs/brief-event-board-za-2026-05-25/brief.md`) is the upstream input; this PRD expands and operationalises it. Data sourcing (how events enter the system) is the single largest open question — see OQ-1.

---

## 1. Vision

Johannesburg has a rich, diverse events scene — concerts, markets, food pop-ups, art shows, sports, comedy nights, club nights — and no good single place to discover it. Today, finding something to do requires checking multiple fragmented sources: Google, Facebook Events, whatsoninjoburg.com, Quicket. The experience is effortful enough that people either miss events or stop looking.

Event Board ZA is a mobile app that solves exactly this. A clean, scrollable feed of upcoming JHB events — every category, one place, no clutter. Each card shows the essentials at a glance: event name, date, and venue. Tap for the full picture. The app does one job and does it well: it answers "what's on in JHB?" in under ten seconds, from anywhere, on your phone.

The app launches for Johannesburg, ad-supported and free, with a clear path to other South African cities once the model is proven.

---

## 2. Target User

### 2.1 Primary Persona

**The JHB Social Planner.** A smartphone-native Johannesburg resident, late 20s to mid-40s. Plans weekends and evenings with a partner, a friend group, or solo. Wants to know what's happening without doing research. Currently cobbles together answers from Google and social media. Frustrated that there's no single feed of "what's on." The product founder is the canonical instance of this persona.

### 2.2 Jobs To Be Done

- **Functional:** Find events happening in JHB this weekend / this month.
- **Functional:** Filter by event type when in a specific mood (e.g. "I want a market, not a concert").
- **Functional:** Get just enough detail to decide whether to go, then get to the ticket link fast.
- **Emotional:** Feel like I know what's happening in my city — not like I'm missing out.
- **Social:** Have a good answer when someone asks "what should we do Saturday?"

### 2.3 Non-Users (v1)

- Event organisers managing listings (no self-serve submission in v1)
- Users outside Johannesburg
- Users looking to purchase tickets within the app (ticket sales are out of scope)

### 2.4 Key User Journeys

- **UJ-1. The planner browses the weekend feed.**
  - **Persona + context:** JHB Social Planner, Thursday evening, wondering what to do Saturday.
  - **Entry state:** App opened from home screen; no account required; no prior session state assumed.
  - **Path:** Opens app → sees card feed sorted by date → scrolls through upcoming events → notices a market on Saturday in Maboneng → taps the card.
  - **Climax:** Detail view loads with venue, time, description, and a ticket / RSVP link. Planner decides to go.
  - **Resolution:** Planner taps the ticket link, exits to browser, books. Returns to the feed.
  - **Edge case:** Event has no ticket link (free event) — detail view shows address and description only; no broken link.

- **UJ-2. The planner filters by category.**
  - **Persona + context:** Same planner, already in the app, specifically looking for a comedy night.
  - **Entry state:** Feed visible, all categories active.
  - **Path:** Taps "Comedy" filter chip → feed narrows to comedy events only → browses → finds an event → taps for detail.
  - **Climax:** Relevant results only; no need to scroll past irrelevant events.
  - **Resolution:** Filter remains active until cleared or app is closed.

---

## 3. Glossary

- **Event** — A scheduled occurrence happening in Johannesburg: has a name, date, time, venue, category, and optionally a description, price, and ticket link. The atomic unit of the product.
- **Event Card** — The compact representation of an Event in the Feed. Displays: event name, date, venue. Tapping an Event Card opens the Event Detail View.
- **Feed** — The scrollable, chronologically ordered list of Event Cards shown on the Home Screen. Default state: all categories, soonest first.
- **Event Detail View** — The full-screen view of a single Event. Displays all available Event attributes.
- **Category** — A classification label applied to each Event. Permitted values: Music, Markets, Food & Drink, Art & Culture, Sport, Comedy, Family, Nightlife.
- **Ticket Link** — An external URL linking to a third-party ticketing page (Quicket, Computicket, Eventbrite, etc.) or an organiser's own site. Optional — not all Events have one.
- **Ad Unit** — A served advertisement displayed within the app, either as a banner between Event Cards or as a full-screen interstitial.

---

## 4. Features

### 4.1 Event Feed

**Description:** The Home Screen presents a vertically scrollable Feed of upcoming Events in Johannesburg, sorted chronologically (soonest first). Each Event Card shows the event name, date, and venue — enough to make a snap decision to look closer. Past events do not appear. The Feed is the first thing a user sees on launch, with no login or onboarding gate. Realises UJ-1, UJ-2.

**Functional Requirements:**

#### FR-1: Chronological event feed
User can view a scrollable Feed of upcoming Events sorted by date ascending (soonest first).

**Consequences (testable):**
- Events with a date in the past do not appear in the Feed.
- Events are ordered so the earliest upcoming Event appears first.
- Feed renders within 2 seconds on a 4G connection. [See NFR-1]

#### FR-2: Event Card content
Each Event Card in the Feed displays the event name, date (human-readable, e.g. "Sat 30 May"), and venue name.

**Consequences (testable):**
- No Event Card omits name, date, or venue.
- [ASSUMPTION: Event Cards display an event image/thumbnail if one is available; a category-appropriate placeholder is shown when no image exists.]

#### FR-3: Empty and error states
When the Feed has no Events to display, a clear empty state message is shown. When data fails to load, a user-friendly error state with a retry action is shown.

**Consequences (testable):**
- Empty state is never a blank screen.
- Error state includes a visible retry control.

**Out of Scope:**
- Personalised or algorithmic feed ordering.
- User-saved or bookmarked events in the feed.

---

### 4.2 Event Detail View

**Description:** Tapping an Event Card opens a full-screen Event Detail View. This view presents all available Event attributes and, where a Ticket Link exists, a clearly visible action to open it. The detail view is the decision-making surface — the user reads it, decides to go, and either taps the Ticket Link or closes back to the Feed. Realises UJ-1.

**Functional Requirements:**

#### FR-4: Full event detail display
User can view a full Event Detail View by tapping any Event Card.

**Consequences (testable):**
- Detail view displays: event name, date, time, venue (name + address), Category, description, price range or "Free" if no price, and Ticket Link button where applicable.
- Fields absent from the Event record are omitted gracefully (not shown as blank or "N/A").

#### FR-5: Ticket link navigation
User can tap a Ticket Link to open the ticketing page in the device's default browser.

**Consequences (testable):**
- Tapping Ticket Link opens the URL in an in-app webview (not the system browser).
- The in-app webview includes a close/back control so the user can return to the Event Detail View without leaving the app.
- If no Ticket Link exists, no link or button is shown.

#### FR-6: Back navigation
User can navigate from the Event Detail View back to the Feed.

**Consequences (testable):**
- Back navigation returns user to the Feed scroll position they left.

---

### 4.3 Category Filtering

**Description:** A horizontal row of Category filter chips sits above (or near the top of) the Feed. By default all Categories are active (unfiltered). The user can tap one or more Category chips to narrow the Feed to matching Events. Realises UJ-2.

**Functional Requirements:**

#### FR-7: Category filter chips
User can filter the Feed by selecting one or more Categories from the available filter chips.

**Consequences (testable):**
- Available Categories: Music, Markets, Food & Drink, Art & Culture, Sport, Comedy, Family, Nightlife.
- Selecting a Category narrows the Feed to Events with that Category only.
- Only one Category can be active at a time (single-select). Tapping an already-active Category chip deselects it and returns the Feed to the unfiltered state.
- An "All" chip or equivalent resets to the unfiltered Feed.

#### FR-8: Filter persistence within session
Active Category filters persist for the duration of the user's session.

**Consequences (testable):**
- Navigating to an Event Detail View and returning does not reset the active filter.
- Closing and reopening the app resets filters to the default (all Categories).

---

### 4.4 Ad Integration

**Description:** The app is ad-supported. Ads are served via a standard mobile ad SDK. Banner Ad Units appear between Event Cards in the Feed at a regular interval. [ASSUMPTION: Interstitial Ad Units are shown on app launch or after a defined number of Event Detail View opens.] Ad placement must not degrade the core discovery experience. Realises the monetisation model.

**Functional Requirements:**

#### FR-9: Banner ads in feed
The Feed displays Banner Ad Units between Event Cards at a regular interval.

**Consequences (testable):**
- At least one Ad Unit appears per screen of Feed content.
- Ad Units are visually distinct from Event Cards (labelled "Ad" or equivalent).
- [ASSUMPTION: Ad interval is 1 Ad Unit per every 5–7 Event Cards.]

#### FR-10: Ad SDK integration
Ads are served via an integrated mobile ad SDK (e.g. Google AdMob).

**Consequences (testable):**
- Ads load asynchronously; a failed ad load does not crash the app or leave a blank space.
- Ad SDK initialises without requiring user login or account creation.

**Feature-specific NFRs:**
- Ads must not autoplay audio without user interaction.
- Interstitial ads must be dismissible within 5 seconds of display.

**Notes:**
- [NOTE FOR PM] Interstitial frequency cap needs definition before build to avoid user churn. A/B testing this post-launch is strongly recommended.

---

## 5. Non-Goals (Explicit)

- **No user accounts in v1.** No sign-up, no sign-in, no saved events, no personalisation.
- **No ticket purchasing in-app.** The app links out; it does not handle transactions.
- **No event organiser portal.** Organisers cannot submit or manage their own listings in v1.
- **No push notifications.** No reminders, no "event tomorrow" alerts in v1.
- **No map view.** Venue address is shown as text; no in-app map integration in v1.
- **No social features.** No sharing, no following, no friend activity.
- **No cities outside Johannesburg in v1.** Geographic scope is JHB only.
- **Not a ticketing platform.** Event Board ZA is a discovery layer, not a commerce layer.

---

## 6. MVP Scope

### 6.1 In Scope
- Johannesburg events only
- Card-based Feed (FR-1, FR-2, FR-3)
- Event Detail View (FR-4, FR-5, FR-6)
- Category filtering (FR-7, FR-8)
- Ad integration — banner ads; interstitial ads [ASSUMPTION] (FR-9, FR-10)
- iOS and Android native apps
- No user account required

### 6.2 Out of Scope for MVP
- Other cities — deferred to v2 once JHB model is validated
- User accounts and saved events — deferred to v2 [NOTE FOR PM: high user demand expected; plan for v2]
- Push notifications — deferred to v2
- In-app map view — deferred to v2
- Event organiser self-serve submissions — deferred to v2
- In-app ticket purchasing — out of scope; link-out model only
- Social features — not on roadmap

---

## 7. Information Architecture & Aesthetic

### 7.1 Screen Structure

The app has two primary screens:

1. **Home Screen (Feed)** — scrollable Event Card feed with category filter chips. Entry point on launch. No login gate.
2. **Event Detail Screen** — full event detail. Accessed via tap on any Event Card. Back navigation returns to Feed.

Navigation is intentionally flat — two levels, no tabs, no hamburger menus.

### 7.2 Aesthetic and Tone

**Reference:** Fever app — polished, mobile-native, event imagery-led, uncluttered.

**Principles:**
- **Clean and minimal.** Only the information needed to make a decision. No sidebars, no tag clouds, no social cruft.
- **Modern and premium feel.** Generous whitespace, strong typography hierarchy, smooth transitions.
- **Event-image led.** Where event imagery is available, it carries the card. Where it isn't, a refined Category-appropriate placeholder fills in — no broken or ugly fallbacks.
- **To the point.** Labels are short. CTAs are single words ("Tickets", "Free"). No paragraph text on cards.

**Tone (any in-app copy):** Direct, local, unpretentious. "What's on in JHB" not "Discover amazing experiences."

**Anti-references:** Eventbrite (too corporate), Facebook Events (too social/noisy), government city guides (too flat).

---

## 8. Platform

- **iOS**: v15.0 minimum [ASSUMPTION]
- **Android**: v9.0 (API level 28) minimum [ASSUMPTION]
- **Development approach**: React Native (confirmed). Single codebase targeting iOS and Android.
- **App Store distribution**: Apple App Store + Google Play Store

---

## 9. Monetisation

- **Model:** Free to users, ad-supported.
- **v1 revenue mechanism:** Mobile display ads via ad SDK (banner + interstitial).
- **v2 candidates (not in scope):**
  - Promoted listings — event organisers pay for top-of-feed placement.
  - Affiliate / referral revenue — earn a cut from Quicket/Eventbrite/Computicket on ticket sales driven by Ticket Links.
  - Premium tier — user accounts with saved events, notifications, no ads.

---

## 10. Non-Functional Requirements

#### NFR-1: Feed load performance
Feed must display initial content within 2 seconds on a 4G mobile connection.

#### NFR-2: App size
App binary must be under 50 MB on initial install.

#### NFR-3: Offline / poor connectivity
When the device has no connectivity, the app displays a clear "no connection" state rather than a crash or blank screen. [ASSUMPTION: No offline caching of events in v1.]

#### NFR-4: Accessibility
Text must meet WCAG 2.1 AA contrast ratios. Interactive elements must have accessible labels for screen readers.

#### NFR-5: Data privacy (POPIA)
The app must comply with the Protection of Personal Information Act (South Africa). Since v1 has no user accounts, data collection is limited to ad SDK telemetry. The privacy policy must disclose ad SDK data practices. No PII collected or stored by the app itself.

---

## 11. Success Metrics

**Primary**
- **SM-1: Weekly Active Users (WAU)** — % of MAU who open the app at least once per week. Target: ≥ 60%. Validates FR-1 (feed is worth returning to).
- **SM-2: Monthly Active Users (MAU)** — Target: 1,000 MAU within 6 months of public launch. Validates overall product-market fit.

**Secondary**
- **SM-3: Detail view rate** — % of Feed sessions that result in at least one Event Detail View tap. Target: ≥ 35%. Validates FR-2 (cards are compelling enough to tap). Validates FR-4.
- **SM-4: Ticket link tap rate** — % of Event Detail Views that result in a Ticket Link tap. Target: ≥ 20%. Validates FR-5 and the affiliate revenue hypothesis.

**Counter-metrics (do not optimise)**
- **SM-C1: Ad impression density** — Do not optimise ad frequency at the expense of SM-3. If SM-3 drops as ad density increases, reduce ad frequency first.
- **SM-C2: Session length** — Long sessions are not a goal. A user who finds what they want in 30 seconds and leaves is a success, not a churn signal.

---

## 12. Open Questions

1. **OQ-1 [BLOCKER]: Data sourcing** — How does event data get into the system? Candidates: Quicket/Eventbrite public APIs, web scraping (legal risk, maintenance burden), manual curation, organiser submissions, or a hybrid. This must be resolved before architecture and build begin. All Feed FRs depend on it.
2. **OQ-2: Content quality bar** — Is every submitted/scraped event published, or is there a moderation/curation step? Who owns this operationally?
3. **OQ-3: Event data freshness** — How often does the event data refresh? What happens when an event is cancelled or rescheduled after a user has viewed it?
4. **OQ-4: Ad SDK selection** — Google AdMob is the default assumption. Alternatives (Meta Audience Network, AppLovin) should be evaluated for SA market fill rates before build.
5. **OQ-5: Interstitial ad policy** — Frequency cap, timing, and dismissal rules need definition. Risk of user churn if misconfigured.

---

## 13. Assumptions Index

- **A-1** (§4.1 FR-2) — Event Cards display an image/thumbnail if available; category placeholder shown otherwise.
- **A-2** (§4.4 FR-9) — Banner ads appear approximately every 5–7 Event Cards.
- **A-3** (§4.4) — Interstitial ads shown on app launch or after a defined number of Event Detail View opens.
- **A-4** (§8) — iOS minimum target is v15.0.
- **A-5** (§8) — Android minimum target is v9.0 (API 28).
- ~~**A-6**~~ — Resolved: React Native confirmed by user. Removed from assumption set.
- **A-7** (§10 NFR-3) — No offline event caching in v1.
- **A-8** (§11 SM-2) — 1,000 MAU within 6 months is the early traction signal (not a hard KPI; a calibration point).
- **A-9** (§1) — Competitive advantage holds absent a well-funded mobile-first JHB events competitor entering before meaningful traction.
