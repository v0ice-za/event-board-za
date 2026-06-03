# Event Board ZA — Claude Code Instructions

## Project Overview

React Native mobile app (iOS + Android) for discovering events in Johannesburg. Free, ad-supported. Single scrollable card feed — all categories, no account required. Aesthetic reference: Fever app. Built by Voice Mijalkovic, solo founder.

Tech stack: React Native · iOS 15.0+ · Android 9.0+ (API 28) · Apple App Store + Google Play Store · AdMob (ad SDK default).

## Current State

Planning complete. Ready for implementation. Sprint plan generated.

**OQ-1 resolved:** Hybrid data sourcing — Quicket + Eventbrite + Facebook Events + Howler (pending API contact at developers@howler.co.za).

Next steps:
1. `/bmad-create-story` — Create the next story file (start with Story 1.1)
2. `/bmad-dev-story` — Implement a story
3. `/bmad-sprint-status` — Check sprint progress at any time

## Planning Artifacts

| Artifact | Full doc | Distillate | Status |
|----------|----------|------------|--------|
| Product Brief | `_bmad-output/planning-artifacts/briefs/brief-event-board-za-2026-05-25/brief.md` | — | Done (PRD supersedes) |
| PRD | `_bmad-output/planning-artifacts/prds/prd-event-board-za-2026-05-25/prd.md` | `prd-distillate.md` | Final |
| Architecture | `_bmad-output/planning-artifacts/architecture.md` | — | Complete |
| UX Design Spec | `_bmad-output/planning-artifacts/ux-design-specification.md` | — | Complete (all 14 steps done) |
| UX Design Directions | `_bmad-output/planning-artifacts/ux-design-directions.html` | — | Complete (Direction 1 chosen) |
| Epics & Stories | `_bmad-output/planning-artifacts/epics.md` | — | Complete (5 epics, 24 stories) |
| Readiness Report | `_bmad-output/planning-artifacts/implementation-readiness-report-2026-05-27.md` | — | Complete — READY |
| Sprint Status | `_bmad-output/implementation-artifacts/sprint-status.yaml` | — | Active |

**Always prefer the distillate when one exists.** It is lossless compressed (3:1) and saves ~3,000 tokens per load. Only use the full source if you need the narrative prose or the distillate is missing.

## Distillate Workflow

When creating or updating any planning artifact distillate:
1. Run `/bmad-distillator` on the source file.
2. Add `<!-- LLM: prefer {name}-distillate.md (lossless 3:1 compressed) unless you need the full narrative prose -->` as the first comment in the source file (after frontmatter).
3. Add a `distillate: {name}-distillate.md` field to the source file's frontmatter.
4. Add a row to the Planning Artifacts table above.

## Key Product Decisions

- Feed: chronological, date ascending, past events excluded
- Categories (8): Music, Markets, Food & Drink, Art & Culture, Sport, Comedy, Family, Nightlife
- Filter: single-select chips; persists within session, resets on close
- Event cards: name + human-readable date + venue; image if available, category placeholder if not
- Detail view: full fields; ticket links open in in-app webview with back control
- No accounts, no social, no maps, no push notifications, no in-app purchases in v1
- Monetisation v1: AdMob banner + interstitial ads
- Success targets: 60% WAU/MAU; 1,000 MAU within 6 months (calibration, not hard KPI)

## BMad Config

- Module: `bmm` v6.7.1
- Output folder: `_bmad-output/`
- User skill level: `expert` (set in `_bmad/custom/config.user.toml`)
- Agent descriptions trimmed for token efficiency (set in `_bmad/custom/config.toml`)
