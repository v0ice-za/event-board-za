# Sprint Change Proposal — OQ-1 Data Sourcing Correction

**Date:** 2026-06-25
**Author:** Voice Mijalkovic (via Correct Course workflow)
**Trigger story:** 4.4 syncEventbrite (during story creation)
**Change scope:** Moderate (backlog reorganization + planning-artifact updates; no code rollback)

---

## Section 1 — Issue Summary

While preparing Story 4.4 (`syncEventbrite`), API research revealed that the OQ-1
"hybrid data sourcing" decision rests on public event-discovery APIs that **no longer
exist**. Of the four resolved sources, only **Quicket** is viable today.

| Source | OQ-1 premise | Verified reality (June 2026) | Status |
|--------|--------------|------------------------------|--------|
| Quicket | SA-native REST API, key required | ✅ Live; Story 4.3 implemented against it | **Viable** |
| Eventbrite | "public API" | ❌ Public Event Search API (`GET /v3/events/search/`) removed **2020-02-20**. Only org/venue/by-id listing remains — no open discovery | **Not viable** |
| Facebook Events | "public events readable with app token" | ❌ Location / `type=event` search deprecated (~2018+); no public event discovery by location | **Not viable** |
| Howler | pending API access | ⏳ Already deferred to v1.1 | Deferred |

**Evidence:**
- Eventbrite: [v3 Search API removed Feb 2020](https://github.com/Automattic/eventbrite-api/issues/83); [API Reference](https://www.eventbrite.com/platform/api) (only `/organizations/{id}/events`, `/venues/{id}/events`, `/events/{id}`).
- Facebook: [facebook-events-by-location — DEPRECATED](https://github.com/tobilg/facebook-events-by-location); [Meta Event Graph API Reference](https://developers.facebook.com/docs/graph-api/reference/event/) — no location search.

**Consequence:** Stories 4.4 (Eventbrite) and 4.5 (Facebook) are both built on dead
endpoints and cannot be implemented as specified.

---

## Section 2 — Impact Analysis

**Epic impact**
- **Epic 4 (Data Pipeline):** Stories 4.1–4.3 (done) are unaffected — Quicket pipeline is complete and correct. Stories 4.4 and 4.5 are no longer implementable as written.
- **No other epic affected.** Epics 1–3 (done) and Epic 5 (Monetisation & Release) have no dependency on the dead sources. Epic 5 release prep is unblocked.

**Artifact conflicts**
- `architecture.md` — OQ-1 line, Event Sourcing list, schedules (AR-5 echo), API-key lists, EAS Secrets, implementation sequence, file structure (`syncEventbrite.ts`, `syncFacebookEvents.ts`), data-flow diagram, integration points.
- `epics.md` — Epic 4 intro, Story 4.4, Story 4.5, AR-5, AR-9, Story 1.5 AC (line 207).
- `prd.md` + `prd-distillate.md` — OQ-1 open question (light; annotate resolution).
- `sprint-status.yaml` — `4-4`, `4-5` entries.
- `CLAUDE.md` — "OQ-1 resolved" note.
- `app.config.ts` — `EVENTBRITE_API_KEY` / Facebook token EAS secrets (already a deferred-work item; no longer needed for v1).

**Technical impact**
- No code rollback. Quicket code (4.1–4.3) stays. No `syncEventbrite.ts` / `syncFacebookEvents.ts` were created, so nothing to delete.
- v1 ships with a **single programmatic source (Quicket)**. Event coverage breadth is reduced versus the original 4-source plan — accepted for v1; richer sourcing revisited post-launch.

---

## Section 3 — Recommended Approach

**Selected path: Option A — Quicket-only v1 (Direct Adjustment).** *(User-approved 2026-06-25.)*

Defer Stories 4.4 and 4.5 to v1.1 alongside Howler. Epic 4 ships with Quicket as the
sole v1 source. Update all planning artifacts so the dead-API assumption is removed and
the v1.1 deferral is explicit.

- **Effort:** Low (doc + backlog edits only). **Risk:** Low. **Timeline:** Net acceleration — Epic 4 is effectively complete, moving the project to Epic 5 (release).
- **Rationale:** Quicket is the only source that works today; it is SA-native and already integrated. Shipping a working single-source feed beats blocking v1 on discovery APIs that no longer exist. Manual curation / org-scoped Eventbrite / scraping are post-launch options, not v1 blockers. Deferral mirrors the existing, accepted Howler precedent.
- **Alternatives considered:** Option B (curated supplements) and Option C (scraping) both add build + ongoing-ops burden and were declined for v1; recorded as v1.1 candidates.

---

## Section 4 — Detailed Change Proposals

### 4.1 `sprint-status.yaml`

```
OLD:
  4-4-synceventbrite-cloud-function: backlog
  4-5-syncfacebookevents-cloud-function: backlog

NEW:
  4-4-synceventbrite-cloud-function: deferred   # v1.1 — no public Eventbrite discovery API (removed 2020-02-20)
  4-5-syncfacebookevents-cloud-function: deferred  # v1.1 — no public Facebook event discovery API
```
Plus: mark `epic-4: done` (4.1–4.3 complete; 4.4/4.5 deferred out of v1) and update `last_updated`.
*Note: `deferred` is a new status value; a one-line definition will be added to the STATUS DEFINITIONS comment block.*

### 4.2 `epics.md`

**(a) Epic 4 intro (line 399 / 105):**
```
OLD: Real JHB events from Quicket, Eventbrite, and Facebook Events automatically sync to Firestore on schedule with deduplication.
NEW: Real JHB events from Quicket automatically sync to Firestore on schedule. Eventbrite and Facebook Events are deferred to v1.1 (their public event-discovery APIs were removed by the providers); Howler also deferred to v1.1.
```

**(b) AR-5 (line 44):**
```
OLD: AR-5: Cloud Functions workspace (separate npm workspace): syncQuicket (every 4h), syncEventbrite (every 4h), syncFacebookEvents (every 1h), plus shared normaliseEvent() and firestoreClient utilities; Howler deferred to v1.1
NEW: AR-5: Cloud Functions workspace (separate npm workspace): syncQuicket (every 4h), plus shared normaliseEvent() and firestoreClient utilities. Eventbrite, Facebook Events, and Howler sync functions deferred to v1.1 (no viable public event-discovery API at v1).
```

**(c) AR-9 (line 48):**
```
OLD: AR-9: EAS Secrets for API keys (Quicket, Eventbrite, Facebook app token); ...
NEW: AR-9: EAS Secrets / Firebase Secret Manager for the Quicket API key (Eventbrite + Facebook secrets deferred with their sync functions to v1.1); ...
```

**(d) Story 4.4 & 4.5:** Replace each story body with a deferral notice (status, reason, evidence link, what's required to revive in v1.1). ACs removed (no longer implementable). Full replacement text applied on approval.

### 4.3 `architecture.md`

- **Line 115 (OQ-1 resolved):** → `OQ-1 resolved (revised 2026-06-25): Quicket as the sole v1 programmatic source. Eventbrite + Facebook Events deferred to v1.1 — their public event-discovery APIs were removed by the providers. Howler deferred to v1.1 (pending API contact).`
- **Lines 134–138 (Event Sourcing):** Keep Quicket as the v1 source; move Eventbrite/Facebook/Howler into a "Deferred to v1.1" sub-list with the API-removal reason.
- **Line 144 (schedules):** → `Scheduled Cloud Function: Quicket every 4h. (Eventbrite/Facebook/Howler functions deferred to v1.1.)`
- **Lines 160, 224 (API keys / EAS Secrets):** reduce to Quicket key only for v1; note others deferred.
- **Lines 247, 251 (implementation sequence):** step 8 → "Cloud Functions: Quicket sync"; Eventbrite/Facebook folded into the deferred note alongside Howler.
- **Lines 312–315 & 559–565 (file structure):** keep `syncQuicket.ts`; annotate `syncEventbrite.ts` / `syncFacebookEvents.ts` / `syncHowler.ts` as "v1.1 — deferred".
- **Lines 590, 598, 620–623 (boundaries / data flow / integration):** trim active sources to Quicket; list the rest as deferred.
- **Lines 664–666 (dedup note, AR-6):** keep `{source}-{slugify(name)}-{date}` ID scheme; soften "Quicket authoritative across platforms" since cross-source overlap is moot at v1 (single source), but retain the scheme for v1.1 re-introduction.

### 4.4 `prd.md` + `prd-distillate.md`

Annotate OQ-1 (prd.md line 317; distillate line 73) with a resolution note:
```
ADD: Resolved 2026-06-25 — v1 sources to Quicket only (programmatic). Eventbrite & Facebook public discovery APIs no longer exist; deferred to v1.1 with Howler. Eventbrite/Facebook remain valid as Ticket-Link destinations (FR) and affiliate candidates (v2).
```
*(Eventbrite/Facebook references as anti-references, ticket-link examples, and v2 affiliate candidates are left intact — still accurate.)*

### 4.5 `CLAUDE.md`

```
OLD: **OQ-1 resolved:** Hybrid data sourcing — Quicket + Eventbrite + Facebook Events + Howler (pending API contact at developers@howler.co.za).
NEW: **OQ-1 resolved (revised 2026-06-25):** v1 sources to **Quicket only**. Eventbrite + Facebook Events deferred to v1.1 (their public event-discovery APIs were removed by the providers); Howler also deferred to v1.1 (pending developers@howler.co.za). See sprint-change-proposal-2026-06-25.md.
```

### 4.6 `deferred-work.md`

Add an entry recording the EVENTBRITE/FACEBOOK secret wiring in `app.config.ts` is no longer needed for v1 (revisit at v1.1).

---

## Section 5 — Implementation Handoff

**Scope classification: Moderate** (backlog reorganization + planning-doc edits; no rollback, no replan).

- **Executor:** Developer agent (this workflow) applies all artifact edits on approval.
- **Distillate sync:** PRD distillate updated in lockstep (project rule).
- **Success criteria:**
  1. `sprint-status.yaml`: 4-4 & 4-5 = `deferred`; `epic-4 = done`.
  2. No planning artifact asserts Eventbrite/Facebook as a v1 public-API source.
  3. v1.1 deferral + revival conditions documented for 4.4/4.5.
  4. Quicket-only pipeline reads as complete and internally consistent.
- **Next step after approval:** Epic 4 is complete → proceed to Epic 4 retrospective (optional) or begin Epic 5 (Story 5.1) via `/bmad-create-story`.

---

## Open follow-ups (v1.1 backlog)
- Revive richer sourcing: org-scoped Eventbrite (curated organiser IDs), manual curation / organiser submissions, Howler (pending contact), or sanctioned scraping. Re-evaluate per legal + ops cost.
