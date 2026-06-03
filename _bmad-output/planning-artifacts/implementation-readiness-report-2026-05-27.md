---
stepsCompleted: [1, 2, 3, 4, 5, 6]
inputDocuments:
  - "_bmad-output/planning-artifacts/prds/prd-event-board-za-2026-05-25/prd-distillate.md"
  - "_bmad-output/planning-artifacts/architecture.md"
  - "_bmad-output/planning-artifacts/epics.md"
  - "_bmad-output/planning-artifacts/ux-design-specification.md"
---

# Implementation Readiness Assessment Report

**Date:** 2026-05-27
**Project:** event-board-za

## PRD Analysis

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
FR-10: Ads via ad SDK (AdMob); no login required; ads load async; no autoplay audio; interstitials dismissible ≤5s; frequency cap TBD

Total FRs: 10

### Non-Functional Requirements

NFR-1: Feed initial content ≤2s on 4G
NFR-2: App binary ≤50 MB initial install
NFR-3: No connectivity → clear "no connection" state; no crash/blank screen; no offline event caching v1
NFR-4: WCAG 2.1 AA contrast; accessible labels on all interactive elements
NFR-5: POPIA compliance; v1 no PII collected/stored by app; data limited to ad SDK telemetry; privacy policy must disclose ad SDK practices

Total NFRs: 5

### Additional Requirements / Open Questions Status

- OQ-1 (data sourcing) — RESOLVED: Hybrid Quicket + Eventbrite + Facebook Events; Howler deferred to v1.1
- OQ-2 (content moderation) — Unresolved; no story addresses curation/moderation workflow
- OQ-3 (data freshness / cancellations) — Partially addressed: sync schedules defined (4h/1h); no story handles cancelled/rescheduled event propagation
- OQ-4 (ad SDK choice) — Resolved: AdMob confirmed
- OQ-5 (interstitial frequency cap) — Partially resolved: Story 5.2 sets "every 3rd detail view"; no A/B test mechanism in v1
- A-3 (interstitial trigger) — Resolved in Story 5.2 as N=3

### PRD Completeness Assessment

PRD is well-formed with clear FRs, NFRs, and scope boundaries. Three open questions (OQ-2, OQ-3, OQ-5) remain partially unresolved but are not implementation blockers for v1 — they are operational concerns or post-launch tuning.

## Epic Coverage Validation

### Coverage Matrix

| FR | PRD Requirement (summary) | Epic Coverage | Story Coverage | Status |
|----|--------------------------|---------------|----------------|--------|
| FR-1 | Feed date ascending, past excluded, ≤2s 4G | Epic 2 + Epic 4 | 2.5 (useEvents), 2.6 (feed screen), 4.3–4.5 (real data) | ✅ Covered |
| FR-2 | Card: name + date + venue + image/placeholder | Epic 2 | 2.1 (CategoryPlaceholder), 2.2 (EventCard) | ✅ Covered |
| FR-3 | Empty state + error state with retry | Epic 2 | 2.4 (EmptyState/ErrorState), 2.6 (integration) | ✅ Covered |
| FR-4 | Detail view: full fields, absent fields omitted | Epic 3 | 3.3 (Event Detail Screen) | ✅ Covered |
| FR-5 | Ticket link in-app webview with close/back | Epic 3 | 3.2 (WebViewModal), 3.3 (CTA) | ✅ Covered |
| FR-6 | Back from detail → feed preserving scroll | Epic 3 | 3.3 (back navigation) | ✅ Covered |
| FR-7 | Category chips, single-select, "All" resets | Epic 2 | 2.3 (CategoryChip + ChipsRow), 2.6 (filter logic) | ✅ Covered |
| FR-8 | Filter persists in session, resets on close | Epic 2 | 2.6 (useState session persistence) | ✅ Covered |
| FR-9 | Banner ads ~1/5–7 cards, "Ad" label, no blank on fail | Epic 5 | 5.1 (AdBannerUnit + feed slots) | ✅ Covered |
| FR-10 | AdMob SDK, async, no autoplay, dismissible interstitials | Epic 5 | 5.1 (banner), 5.2 (interstitial) | ✅ Covered |

### Missing Requirements

None.

### Coverage Statistics

- Total PRD FRs: 10
- FRs covered in epics: 10
- Coverage: **100%**

## UX Alignment Assessment

### UX Document Status

Found: `_bmad-output/planning-artifacts/ux-design-specification.md` — complete (all 14 steps, Direction 1 chosen).

### UX ↔ PRD Alignment

All PRD user-facing FRs are reflected in UX components. The UX spec introduces 12 UX-DRs which are all captured in epics. No PRD requirements are contradicted by the UX spec.

**Additional UX scope beyond PRD (all appropriate):** scale-pulse animation on chip return (UX-DR5), skeleton card shimmer (UX-DR6), OfflineBanner (UX-DR7/story 2.4), detail screen hero + back pill layout (UX-DR10), sticky CTA / no-ticket label retention (UX-DR11), foreground soft-refresh pattern (UX-DR12). All are quality polish consistent with PRD intent.

### UX ↔ Architecture Alignment Issues

#### 🔴 HIGH — Date storage format conflict (Story 4.2 vs Architecture)

- **Architecture:** Explicit decision — store dates as ISO 8601 strings (`"2026-06-14"`). Anti-pattern listed: "Firestore Timestamp objects or `new Date()` stored in documents." Rationale: simpler serialisation, string comparison works for date-ascending sort.
- **Story 4.2 AC:** "date is stored as a Firestore `Timestamp` derived from the raw event's start datetime"
- **These directly contradict each other.** Story 4.2 must be corrected before dev starts. Architecture decision takes precedence — ISO strings are the correct approach.

#### 🟡 MODERATE — Category placeholder approach superseded

- **Architecture:** Lists `assets/placeholders/*.png` (one PNG per category) in the directory structure; references "placeholder prop" via expo-image.
- **UX-DR3 + Story 2.1:** `CategoryPlaceholder` is a `LinearGradient` component with hardcoded per-category gradients and centred emoji — not PNG files. "Designed assets, not CSS fallbacks."
- **Resolution:** The `assets/placeholders/` directory and 8 PNG files described in the architecture are obsolete. The UX spec (finalized after architecture) takes precedence. Dev agent should implement UX-DR3's LinearGradient approach and skip the PNG assets.

#### 🟡 MODERATE — Component naming mismatches (Architecture vs Epics/UX)

The architecture document uses different names for several components than the UX spec and epics:

| Architecture | Epics/UX Spec | Impact |
|---|---|---|
| `FilterChips.tsx` (single file) | `ChipsRow.tsx` + `CategoryChip.tsx` (split) | Epics approach is more modular and correct |
| `AdBanner.tsx` | `AdBannerUnit.tsx` | Naming only; same component |
| `TicketWebView.tsx` | `WebViewModal.tsx` | Naming only; same component |
| `EmptyState.tsx` + `ErrorState.tsx` (two files) | `EmptyState.tsx` (single, 3 variants) + `OfflineBanner.tsx` | Epics consolidation is correct |

**Resolution:** Epics take precedence over the architecture doc for component names. Architecture doc names are considered stale.

#### 🟢 LOW — `dateUtils.ts` has no story

- Architecture includes `functions/src/lib/dateUtils.ts` for ISO 8601 parse/format helpers.
- No story explicitly creates this file.
- **Resolution:** Story 4.2 (normaliseEvent utility) should create `dateUtils.ts` as part of its implementation. Add a note in Story 4.2 AC or accept it as an implicit implementation detail.

#### 🟢 LOW — `lib/analytics.ts` not in architecture file structure

- Story 5.3 creates `lib/analytics.ts` for typed Analytics wrapper functions.
- Not listed in the architecture's directory structure.
- **Resolution:** Non-blocking addition; consistent with architecture patterns. No change needed.

### Warnings

None beyond the issues listed above. UX spec is comprehensive and well-structured for implementation handoff.

## Epic Quality Review

### Epic Structure Validation

| Epic | User Value? | Independent? | Verdict |
|------|-------------|--------------|---------|
| Epic 1: Project Foundation | Indirect (greenfield setup) | ✅ Standalone | ✅ Acceptable — standard greenfield pattern |
| Epic 2: Event Feed | ✅ User can browse JHB events | ✅ Epic 1 only | ✅ Pass |
| Epic 3: Event Detail & Ticketing | ✅ User can see details + book | ✅ Epics 1+2 | ✅ Pass |
| Epic 4: Data Pipeline | ⚠️ Technical framing | ✅ Epic 1 only (Cloud Functions) | ⚠️ See below |
| Epic 5: Monetisation & Release | ✅ Mixed — ads + release | ✅ Epics 1–4 | ✅ Acceptable |

**Epic 4 note:** "Data Pipeline" is technically framed with no direct user-facing value in its title. The goal statement is correct ("Real JHB events automatically sync"), but the epic title reads as an infrastructure milestone. Functionally sound — without Epic 4, the app shows seed data only, which is a valid development state. Recommended rename: "Live JHB Event Data" better communicates user value. Not blocking.

### Story Quality — Forward Dependency Scan

Scanned all 24 stories for forward references. One found:

- **Story 2.6:** `"AdBanner placeholder slot exists in the FlatList at every 6th position (renders nothing until Epic 5)"` — forward reference to Epic 5. **Not a blocking dependency** — Epic 2 is complete and functional; the slot renders nothing. Acceptable scaffolding pattern. ✅

No stories block on future stories to function.

### Story Quality — Acceptance Criteria Review

All stories use Given/When/Then format with specific, testable criteria. No vague criteria found ("user can see events" etc.). Happy paths, error conditions, and edge cases are covered.

**Minor issues found:**

#### 🟠 Major — Story 4.2: `RawEvent` type undefined

Story 4.2 signature: `normaliseEvent(raw: RawEvent, source: EventSource)` — `RawEvent` is never defined in any story. The architecture uses `raw: unknown` explicitly. Inconsistency: if dev agent creates a `RawEvent` type, it will conflict with the architecture's `unknown` convention and break type safety across sync functions (each source has a different raw shape).
**Recommendation:** Story 4.2 should use `raw: unknown` per architecture. Minor correction needed.

#### 🟡 Minor — Story 4.1: `NormalisedEvent` type vs `Event` type

Story 4.1 uses `upsertEvent(event: NormalisedEvent)`. The architecture uses `Event` throughout and defines a single `Event` interface in Story 1.2. Introducing `NormalisedEvent` may cause the dev agent to create a duplicate type.
**Recommendation:** `NormalisedEvent` should be treated as an alias for `Event` (same shape, same interface). Dev agent should use `Event` directly.

#### 🟡 Minor — Epic 1 "As a developer" framing

All 5 Epic 1 stories use "As a developer" rather than "As a user". This is a pragmatic exception for greenfield foundation stories — no user-facing behaviour exists yet. Acceptable for Epic 1 only.

### Starter Template Check ✅

Story 1.1 correctly begins with `npx create-expo-app@latest event-board-za` per Architecture AR-1.

### Database/Entity Creation Timing ✅

Firestore schema + indexes + security rules created in Story 1.3 — the first story that needs them (Epic 2 depends on this). Seed data in Story 1.3 enables Epic 2 development without waiting for Epic 4. Correct timing.

### Best Practices Compliance Summary

| Check | Status |
|-------|--------|
| Epics deliver user value | ✅ (Epic 4 title borderline, see above) |
| Epic independence | ✅ All pass |
| No forward blocking dependencies | ✅ |
| Stories appropriately sized | ✅ |
| Schema created when first needed | ✅ |
| Clear Given/When/Then ACs | ✅ |
| FR traceability maintained | ✅ 100% |

## Summary and Recommendations

### Overall Readiness Status

**✅ READY — with one required fix and several clarifications**

The planning artifacts are complete, well-aligned, and sufficient to begin implementation. One story has a direct contradiction with the architecture that will cause a runtime bug if not corrected. The remaining issues are naming inconsistencies and stale architecture references that the dev agent would otherwise have to resolve mid-sprint.

### Issues by Severity

| # | Severity | Issue | Location |
|---|----------|-------|----------|
| 1 | 🔴 Required fix | Story 4.2 stores `date` as Firestore Timestamp; architecture mandates ISO 8601 string. Feed sort breaks if Timestamps are used. | Story 4.2 AC |
| 2 | 🟠 Recommended fix | Story 4.2 uses `RawEvent` type — undefined type not present anywhere; architecture uses `unknown`. Will cause dev agent to invent a type or get stuck. | Story 4.2 AC |
| 3 | 🟡 Recommended clarification | Component names in architecture are stale vs epics/UX: `FilterChips`→`CategoryChip+ChipsRow`, `AdBanner`→`AdBannerUnit`, `TicketWebView`→`WebViewModal`, split EmptyState/ErrorState→single EmptyState with variants. | Architecture doc |
| 4 | 🟡 Recommended clarification | Architecture lists `assets/placeholders/*.png` (8 PNG files). UX-DR3 supersedes this — CategoryPlaceholder is a LinearGradient component, no PNGs needed. | Architecture doc |
| 5 | 🟡 Minor | Story 4.1 introduces `NormalisedEvent` type; architecture uses `Event`. Likely same type — dev agent should treat as alias. | Story 4.1 AC |
| 6 | 🟢 Informational | `dateUtils.ts` (in architecture) has no story — implicitly created by Story 4.2's normaliseEvent implementation. | Story 4.2 |
| 7 | 🟢 Informational | Epic 4 title "Data Pipeline" is technical framing. Functionally correct; rename optional. | Epics doc |

### Required Actions Before Dev Starts

1. **Correct Story 4.2 date format:** Change the AC line `"date is stored as a Firestore Timestamp derived from the raw event's start datetime"` to `"date is stored as an ISO 8601 date string ('2026-06-14') derived from the raw event's start datetime"`. This aligns with the architecture's explicit mandate and anti-pattern callout.

2. **Correct Story 4.2 type signature:** Change `normaliseEvent(raw: RawEvent, source: EventSource)` to `normaliseEvent(raw: unknown, source: EventSource)` — consistent with architecture's normaliser contract.

### Recommended Actions (Pre-Sprint or Sprint 1 Note)

3. Add a dev note in Story 4.1 or a CLAUDE.md note that `NormalisedEvent` = `Event` interface from `types/event.ts`.

4. Add a dev note that `assets/placeholders/` PNG directory is **not** needed — `CategoryPlaceholder` is a LinearGradient component per UX-DR3/Story 2.1.

5. Add a dev note that component names in the architecture doc are superseded by the epics — epics are the authoritative source for component names.

### What's Working Well

- FR coverage: 100% across all 10 requirements ✅
- NFR coverage: all 5 NFRs have explicit story-level validation ✅
- UX-DR coverage: all 12 design requirements covered ✅
- Story sizing: all 24 stories appropriately scoped for single dev agent sessions ✅
- No forward blocking dependencies in any story ✅
- Architecture is detailed and explicit with implementation patterns, naming conventions, and boundary rules — high-quality dev agent handoff ✅

### Final Note

This assessment identified **7 issues** across **3 categories** (data model, naming, stale references). Only 2 require correction before dev starts. The planning artifacts represent a thorough, well-thought-out v1 scope. The dev agent has everything it needs to implement without ambiguity.

**Report:** `_bmad-output/planning-artifacts/implementation-readiness-report-2026-05-27.md`
