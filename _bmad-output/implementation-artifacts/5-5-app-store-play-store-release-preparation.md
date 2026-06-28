# Story 5.5: App Store + Play Store Release Preparation

Status: in-progress (in-repo work done; manual EAS build/size/screenshot gates open — see Completion Notes)

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As a developer,
I want the app fully packaged with store assets, metadata, and a validated binary size,
so that it can be submitted to the App Store and Google Play without rejection for missing required items.

> **Final story of v1 (Epic 5).** This is a release-prep story: part **in-repo config/docs/assets** (do now), part **operational release gate** (run on real EAS/devices with Voice's developer accounts). Tasks are explicitly split so completion is never faked — see "Execution reality" in Dev Notes. The dev agent completes the in-repo tasks and **documents** the manual gates with exact commands; it must **not** mark a manual gate `[x]` until it is genuinely done (HALT/flag instead).

## Acceptance Criteria

1. **App icon (AC1).** `assets/` contains a **1024×1024** app icon, **PNG with no alpha channel** (opaque). The current `assets/images/icon.png` is 1024×1024 but **RGBA (has transparency)** — Apple rejects icons with an alpha channel, so it must be flattened to opaque (onto the brand background `#0F0C09`) **or** a no-alpha variant supplied and referenced. The Android **adaptive icon** is already configured (`android.adaptiveIcon` in `app.config.ts`, foreground 512×512) — verify it remains valid. [epics §Story 5.5; assets inspection]
2. **Splash screen (AC2).** `app.config.ts` configures the splash with the app's **dark background colour `#0F0C09`**. The current `expo-splash-screen` plugin entry uses `#208AEF` (a leftover blue) — change `backgroundColor` to `#0F0C09` (matches `COLORS.background`). Splash image/imageWidth retained (and ideally promoted to a shared cross-platform `image` for iOS parity). [epics §Story 5.5; constants/theme.ts]
3. **App Store metadata (AC3).** `docs/store-metadata.md` (NEW) documents, within Apple's limits: app **name** (≤30), **subtitle** (≤30), **description** (≤4000), **keywords** (≤100, comma-separated), **support URL**, **marketing URL**, plus promotional text and the privacy-policy URL. [epics §Story 5.5]
4. **Play Store metadata (AC4).** The same `docs/store-metadata.md` documents Google Play's: **short description** (≤80), **full description** (≤4000), plus app category and contact details. [epics §Story 5.5]
5. **Screenshots (AC5).** At least **3 iPhone (6.7")** and **3 Android (phone)** screenshots captured from the **running app** and saved to `docs/screenshots/`. ⚠️ Requires a simulator/device — **not capturable in this environment**. In-repo deliverable: create `docs/screenshots/` with a `README.md` capture checklist (which screens, required pixel sizes, device frames); the actual PNGs are produced during device QA. [epics §Story 5.5 — manual gate]
6. **Production EAS build (AC6).** A production EAS build for **both** platforms completes without errors: `eas build --platform all --profile production`. ⚠️ Requires EAS cloud + Apple/Google credentials — **operational, run by Voice**. In-repo deliverable: `eas.json` production/submit profiles reviewed and release-ready; release-config blockers resolved (real AdMob App IDs + unit IDs, real privacy-policy URL — see AC8). [epics §Story 5.5; architecture §CI/CD — manual gate]
7. **Binary size ≤50 MB (AC7, NFR-2).** The production binary is **≤50 MB** on both platforms, verified from EAS build output. ⚠️ Depends on AC6 — **verified from the real build**, recorded in `docs/store-metadata.md` (or a release notes file) once known. [epics §Story 5.5; PRD NFR-2 — manual gate]
8. **Release-config blockers resolved (derived; required for AC6 to ship a *viable* build).** Before a real production build:
   - **AdMob App IDs** in the `react-native-google-mobile-ads` plugin are currently Google **test** App IDs (`ca-app-pub-3940256099942544~…`) and the `extra.admobBannerUnitId`/`admobInterstitialUnitId` are empty → a released build would show **test/no ads (zero revenue)**. Wire the **real** AdMob app + unit IDs via env (`ADMOB_*`) so production uses live ads while dev keeps `TestIds`. (Values come from Voice's AdMob account — cannot be invented; structure + env wiring done now, values injected at build.)
   - **Privacy-policy URL** (`extra.privacyPolicyUrl`, Story 5.4) is empty → host `docs/privacy-policy.md` and set `PRIVACY_POLICY_URL` so the in-app link renders and the store listings have a privacy URL. [deferred-work lines 40–41, 47; Story 5.4 follow-ups]
9. **No regressions; gates green.** `tsc --noEmit` 0 errors; `expo lint` 0 errors (1 pre-existing EmptyState warning acceptable); full Jest suite green (baseline 19 suites / 122 tests from Story 5.4); `npx expo config --type public` resolves with the new splash colour + icon + privacy/AdMob values present; `expo export --platform web` still bundles clean. [project rules; precedent: Stories 5.2–5.4]

## Tasks / Subtasks

- [x] **Task 1 — App icon: ensure 1024×1024, no alpha (AC: #1)**
  - [x] Confirm `assets/images/icon.png` is 1024×1024 (it is) and **flatten its alpha** to an opaque PNG over `#0F0C09`. Preferred: produce the flattened file and keep the same path so `app.config.ts` (`icon`, `ios.icon`) needs no change. If a tool isn't available in-repo, document the exact step (see Dev Notes — options: `sharp`, ImageMagick, or Expo's automatic iOS alpha-flatten) and flag for Voice to run, but do not claim done if alpha remains.
  - [x] Verify Android `adaptiveIcon` (foreground/background/monochrome 512×512) is intact and references valid files — no change expected.
  - [x] Re-run the PNG inspection (size + colorType) to confirm `hasAlpha: false` before checking this box.

- [x] **Task 2 — Splash screen dark background (AC: #2)**
  - [x] In `app.config.ts`, change the `expo-splash-screen` plugin `backgroundColor` from `'#208AEF'` to **`'#0F0C09'`**.
  - [x] Promote the splash image to a shared cross-platform `image` (so iOS also shows the icon, not just Android), keeping `imageWidth`. Keep the `android` block. Example shape in Dev Notes.
  - [x] Confirm `npx expo config --type public` shows the splash plugin with the dark colour.

- [x] **Task 3 — Store metadata doc (AC: #3, #4)**
  - [x] Create `docs/store-metadata.md` with two clearly separated sections (App Store / Google Play). Use the **draft copy seeds** in Dev Notes and **respect every character limit** (annotate each field with its limit + current count). No placeholder lorem — write real, submission-ready copy for an ad-supported JHB events app.
  - [x] Include: App Store name(≤30)/subtitle(≤30)/promo text(≤170)/description(≤4000)/keywords(≤100)/support URL/marketing URL/privacy URL; Play short(≤80)/full(≤4000)/category/contact email/privacy URL.
  - [x] Leave the privacy + support/marketing URLs as the agreed hosted values (or clearly-marked TODO if Voice hasn't provided hosting yet — tie to Task 6/AC8).

- [x] **Task 4 — Screenshots scaffold + checklist (AC: #5)**
  - [x] Create `docs/screenshots/` with `README.md`: the capture checklist — **≥3 iPhone 6.7" (1290×2796)** + **≥3 Android phone** shots; which screens (feed with cards, feed with a category filter active, event detail, ticket webview, an empty/offline state); naming convention (`ios-6.7-01-feed.png`, `android-01-feed.png`).
  - [x] ⚠️ Do **not** fabricate screenshot PNGs. Capturing real screenshots needs a simulator/device — record it as a manual QA step; this task is "complete" when the folder + checklist exist, with the actual images flagged as a device gate.

- [x] **Task 5 — Release config: AdMob + privacy URL + EAS profiles (AC: #6, #8)**
  - [x] **AdMob App IDs:** in `app.config.ts`, make the `react-native-google-mobile-ads` plugin `androidAppId`/`iosAppId` env-driven with the test IDs as dev fallback, e.g. `process.env.ADMOB_ANDROID_APP_ID ?? 'ca-app-pub-3940256099942544~3347511713'` (and iOS equiv). This lets production inject real IDs without committing them. Keep the existing test IDs as the `??` fallback so dev/test builds are unaffected. Mirror the existing `extra.admob*UnitId` env pattern (already present, currently `''`).
  - [x] **Privacy URL:** confirm `extra.privacyPolicyUrl` is wired (Story 5.4) and set the real `PRIVACY_POLICY_URL` value/secret once the policy is hosted (host `docs/privacy-policy.md`). If hosting isn't ready, document the exact EAS Secret command and leave the value empty (in-app link stays hidden — acceptable until hosted).
  - [x] **EAS profiles:** review `eas.json` — production build profile (`autoIncrement: true` present) and `submit.production` (currently empty). Document/add the iOS `ascAppId`/Apple Team + Android `serviceAccountKeyPath`/track config needed for `eas submit` (values are Voice's account specifics — structure + comments now, secrets at submit time). Do not commit secrets.
  - [x] List the EAS Secrets that must exist for a real production build (`ADMOB_*`, `PRIVACY_POLICY_URL`, plus the existing `QUICKET_API_KEY` used by Cloud Functions) in `docs/store-metadata.md` or a release checklist.

- [ ] **Task 6 — Production build + size verification (AC: #6, #7) — MANUAL GATE**
  - [ ] Provide the exact commands and document them as the release runbook: `eas build --platform all --profile production`, then read the binary size from EAS output and confirm **≤50 MB** each platform; `eas submit --platform all --profile production` for store upload.
  - [ ] ⚠️ These run on EAS cloud with Voice's Apple/Google credentials — **cannot execute in this environment**. Record them as a runbook; check this task `[x]` **only** after Voice has run the build green and the size is recorded. Otherwise leave unchecked and flag in Completion Notes.

- [x] **Task 7 — Validation gates (AC: #9)**
  - [x] `npx tsc --noEmit` → 0 errors (app.config.ts type-checks).
  - [x] `npx expo config --type public` → resolves; splash `#0F0C09`, icon path, `extra.privacyPolicyUrl` + AdMob plugin IDs present.
  - [x] `npm test` → all suites green (baseline 19 suites / 122 tests — config/doc/asset changes shouldn't alter counts; if `app.config` is covered by a test, keep it green).
  - [x] `npx expo lint` → 0 errors (1 pre-existing EmptyState warning acceptable).
  - [x] `npx expo export --platform web` → bundles clean.

## Dev Notes

### Execution reality — what is doable in-repo vs a manual release gate

| AC | In-repo now (dev agent) | Manual gate (Voice / EAS / device) |
|----|--------------------------|-------------------------------------|
| #1 icon no-alpha | Flatten icon.png (if tooling available) + verify | Re-export from design tool if flatten not possible here |
| #2 splash colour | ✅ edit `app.config.ts` | — |
| #3/#4 metadata | ✅ author `docs/store-metadata.md` | Final URLs once hosting exists |
| #5 screenshots | ✅ folder + capture checklist | ❌ capture real PNGs on device |
| #6 EAS build | ✅ eas.json review + runbook + release-config | ❌ run `eas build` (cloud + credentials) |
| #7 ≤50 MB | record once known | ❌ read from real build output |
| #8 AdMob/privacy URL | ✅ env-wire structure | inject real values/secrets |

**Honesty rule (dev-story):** never mark #5 (real images), #6, or #7 `[x]` from this environment — there is no simulator, no device, and no EAS credentials here. Complete the config/doc/scaffold portions, document the manual commands precisely, and HALT/flag the rest in Completion Notes. This mirrors the on-device deferrals already recorded in Stories 5.1–5.4.

### Files being modified — current state (READ before editing)

- **`app.config.ts`** (now includes Story 5.4 `extra.privacyPolicyUrl` + `ios.privacyManifests`): typed `ExpoConfig` factory. Splash plugin currently `{ backgroundColor: '#208AEF', android: { image: './assets/images/splash-icon.png', imageWidth: 76 } }`. AdMob plugin currently hardcodes Google **test** App IDs. `extra.admobBannerUnitId`/`admobInterstitialUnitId` are env-driven, default `''`. **Change:** splash `backgroundColor` → `#0F0C09` (+ shared `image`); AdMob plugin App IDs → env-driven with test fallback. **Preserve:** `extra` keys, `ios.privacyManifests`, `plugins` order, `experiments`, bundle IDs, `googleServicesFile`s.
- **`assets/images/icon.png`** — 1024×1024 **RGBA** (alpha present). Needs opaque flatten over `#0F0C09`.
- **`eas.json`** — `cli.version >=16`, build profiles development/preview/production (`autoIncrement: true`), `submit.production: {}` (empty — document required fields). No secrets here.
- **NEW:** `docs/store-metadata.md`, `docs/screenshots/README.md`.
- **`docs/privacy-policy.md`** (Story 5.4) — the source to host; its URL feeds AC3/AC4 + the in-app link.

### Splash plugin target shape (Task 2)

```ts
[
  'expo-splash-screen',
  {
    backgroundColor: '#0F0C09',
    image: './assets/images/splash-icon.png',
    imageWidth: 200,
    android: {
      image: './assets/images/splash-icon.png',
      imageWidth: 76,
    },
  },
],
```
(Confirm `imageWidth` values against the actual splash-icon — 228×213; keep the existing 76 for Android if that's the intended density. The AC only strictly requires the `#0F0C09` background.)

### Icon alpha flatten (Task 1) — options

- Apple rejects app icons with an alpha channel. Expo's prebuild **does** auto-flatten the iOS icon, but to satisfy the AC literally and avoid surprises, produce an opaque source:
  - **sharp** (if installable): `sharp('icon.png').flatten({ background: '#0F0C09' }).png().toFile('icon.png')`.
  - **ImageMagick**: `magick icon.png -background '#0F0C09' -alpha remove -alpha off icon.png`.
  - If neither is available in this environment, **flag it** — Voice re-exports a no-alpha 1024² PNG from the design source. Don't check Task 1 until `colorType` is no longer 6 (RGBA).
- Android adaptive icon foreground **keeps** its alpha (transparency is correct there) — only the iOS/marketing icon must be opaque.

### Store metadata draft seeds (Task 3) — respect limits, then count

- **App name (≤30):** `Event Board ZA` (14)
- **Subtitle (≤30):** `Joburg events, all in one feed` (30)
- **Keywords (≤100, comma, no spaces after comma to save chars):** `johannesburg,joburg,events,things to do,markets,concerts,nightlife,comedy,festivals,tickets`
- **Promo text (≤170):** one-liner on discovering JHB events free.
- **Description (≤4000):** what it is (free, ad-supported, no account), the single scrollable feed, 8 categories, filter, in-app ticket links, offline-friendly; JHB-only v1; no spam/social/maps. Honest about ads.
- **Play short description (≤80):** `Discover Johannesburg events — markets, music, nightlife & more, in one feed.` (verify ≤80)
- **Play full description (≤4000):** mirror App Store description, Play tone.
- **Category:** Events / Entertainment. **Support URL / Marketing URL / Privacy URL:** the hosted values (tie to AC8). **Contact:** voji95@gmail.com.

### Release-config specifics (Task 5)

- AdMob real IDs are **account-specific** and must not be invented or committed. Make them env-driven with the current **test** IDs as the `??` fallback so existing dev/test behaviour is unchanged (Stories 5.1/5.2 use `TestIds` in code for the *unit* IDs already; this covers the *app* IDs in the config plugin).
- `extra.admob*UnitId` already env-driven (`process.env.ADMOB_*_UNIT_ID ?? ''`) — production needs the real unit IDs as EAS Secrets; `AdBannerUnit`/`_layout` fall back to `TestIds` when empty, so a missing secret = test ads (safe, but zero revenue — call it out).
- EAS Secrets needed for a real prod build: `QUICKET_API_KEY` (Cloud Functions), `ADMOB_ANDROID_APP_ID`, `ADMOB_IOS_APP_ID`, `ADMOB_BANNER_UNIT_ID`, `ADMOB_INTERSTITIAL_UNIT_ID`, `PRIVACY_POLICY_URL`. Document `eas secret:create` usage; do not store values in the repo.

### Project-wide rules that apply

- `app.config.ts` is the **single source** for app metadata/plugins — never hand-edit native `ios/`/`android/` (none committed; prebuild owns them). [Stories 5.2–5.4 precedent]
- No new runtime dependencies for app code (a dev-only image tool for the icon flatten is acceptable and not shipped). Named-export / className rules don't apply to config/doc changes.
- Keep test IDs as fallbacks so CI and local dev never accidentally need real ad/credentials. [docs/project-context.md; deferred-work line 40]

### Project Structure Notes

- NEW: `docs/store-metadata.md`, `docs/screenshots/README.md`, (real screenshots later)
- MODIFY: `app.config.ts` (splash colour + shared image; AdMob plugin App IDs env-driven), `assets/images/icon.png` (flatten alpha), possibly `eas.json` (submit profile docs/fields)
- MANUAL/RUNBOOK: `eas build`/`eas submit` (cloud), real screenshots (device), ≤50 MB verification
- VERIFY green: full Jest suite, tsc, lint, expo config, web export

### References

- [Source: _bmad-output/planning-artifacts/epics.md#Story 5.5 (lines 561-577)] — AC source: icon, splash #0F0C09, store metadata, screenshots, production EAS build, ≤50 MB
- [Source: _bmad-output/planning-artifacts/architecture.md (lines 28, 44)] — NFR-2 binary ≤50 MB
- [Source: _bmad-output/planning-artifacts/architecture.md (lines 222-238)] — CI/CD: EAS Build/Submit, free tier limits, cost; EAS Secrets (Quicket key)
- [Source: _bmad-output/implementation-artifacts/deferred-work.md (lines 40-41)] — AdMob test App IDs in production = zero revenue; empty `extra.*` placeholders → release prep
- [Source: _bmad-output/implementation-artifacts/5-4-privacy-policy-popia-compliance.md] — `extra.privacyPolicyUrl` wiring + "host policy / set real URL in Story 5.5" follow-up
- [Source: app.config.ts] — current splash (#208AEF), AdMob test App IDs, extra keys, ios.privacyManifests
- [Source: eas.json] — build/submit profiles
- [Source: constants/theme.ts] — `background: '#0F0C09'` confirms splash colour
- [Source: assets/images/*] — icon.png 1024² RGBA (alpha), adaptive icon 512² foreground
- PRD NFR-2 (binary ≤50 MB); AR-10/NFR-5 (privacy URL on store listings)

## Dev Agent Record

### Agent Model Used

claude-opus-4-8 (Opus 4.8)

### Debug Log References

1. **Icon alpha flatten — no system image tool; used `pngjs`.** On Windows, `convert` resolves to the **system disk-conversion utility** (`C:\Windows\System32\convert.exe`), not ImageMagick — it errored and left `icon.png` untouched (no corruption). `sharp`/`jimp`/ImageMagick are not installed. `pngjs` **is** present in `node_modules` (transitive), so I flattened the icon with a one-off script run from the project root: composite each pixel over `#0F0C09` using its alpha, set alpha to 255, then `PNG.sync.write(png, { colorType: 2 })` to emit an RGB (no-alpha) PNG. The throwaway script was deleted; only `assets/images/icon.png` changed. Verified: `1024×1024`, colorType **2 (RGB)**, `hasAlpha: false` (was colorType 6 RGBA).
2. **`pngjs` must run from project root.** First attempt put the script in `/tmp`, where `require('pngjs')` failed (outside the project's `node_modules` resolution). Re-running from the repo root resolved it.
3. **No new tests.** This is a config/asset/docs story — no runtime code paths added, so no unit tests were authored. Regression safety is the full existing suite (unchanged 19/122) plus `expo config` resolution.

### Completion Notes List

**In-repo work — DONE:**
- **Icon (AC1)** — flattened `assets/images/icon.png` from RGBA→opaque RGB over `#0F0C09`; now 1024×1024, no alpha (App-Store-safe). Android adaptive icon untouched (its foreground keeps correct transparency).
- **Splash (AC2)** — `app.config.ts` `expo-splash-screen` `backgroundColor` `#208AEF`→**`#0F0C09`**; added a shared cross-platform `image` (+ `imageWidth: 200`) so iOS also shows the splash icon; Android block retained.
- **Store metadata (AC3/AC4)** — `docs/store-metadata.md` (NEW): App Store + Google Play listings with **verified character counts** (subtitle 30/30, keywords 91/100, Play short 79/80, promo 120/170, full descriptions ≈1k/4000), categories, contact, plus Hosting/EAS-Secrets/runbook/binary-size sections.
- **Screenshots scaffold (AC5)** — `docs/screenshots/README.md` (NEW): capture checklist (≥3 iPhone 6.7" 1290×2796 + ≥3 Android phone), which screens, naming convention, capture commands. Real PNGs are a device gate.
- **Release config (AC8)** — AdMob plugin `androidAppId`/`iosAppId` now env-driven (`ADMOB_ANDROID_APP_ID`/`ADMOB_IOS_APP_ID`) with the Google **test** IDs as dev/CI fallback; `extra.privacyPolicyUrl` confirmed wired (empty→in-app link hidden); EAS Secrets + submit-profile requirements documented in `docs/store-metadata.md`.
- **Gates (AC9)** — `tsc --noEmit` 0 errors · `expo config --type public` resolves (splash `#0F0C09`, shared image, AdMob test-ID fallback, `privacyPolicyUrl: ''`) · `npm test` **19 suites / 122 tests** green (no regressions) · `expo lint` 0 errors (1 pre-existing EmptyState warning) · `expo export --platform web` clean.

**⚠️ Manual release gates — NOT done (cannot run in this environment; left unchecked honestly):**
- **Task 6 / AC6** — `eas build --platform all --profile production` needs EAS cloud + Apple/Google credentials. Runbook documented in `docs/store-metadata.md`; **Voice must run it.**
- **AC7 (≤50 MB)** — read from the real EAS build output; recorded in the store-metadata binary-size table once known.
- **AC5 real screenshots** — must be captured on a device/simulator (checklist provided).
- **Live values** — real AdMob IDs + hosted privacy/support/marketing URLs must be set as EAS Secrets / listing fields before submission (see Open Questions #1–#2). A prod build without AdMob secrets ships **test ads (zero revenue)** — safe for soft launch.

**Status:** kept **in-progress** (not `review`) — per the story's honesty rule, the manual EAS build/size/screenshot gates remain open and only Voice can close them. Once the production build is green and the binary size is recorded, flip Task 6 to `[x]` and move to `review`.

### File List

- `assets/images/icon.png` (MODIFIED — flattened RGBA→opaque RGB over #0F0C09, no alpha)
- `app.config.ts` (MODIFIED — splash `#0F0C09` + shared image; AdMob App IDs env-driven with test fallback; AdMob unit-ID comments updated)
- `docs/store-metadata.md` (NEW — App Store + Play listings, EAS secrets, build/submit runbook, binary-size record)
- `docs/screenshots/README.md` (NEW — screenshot capture checklist)
- `_bmad-output/implementation-artifacts/sprint-status.yaml` (MODIFIED — status tracking)

## Change Log

| Date | Change |
|------|--------|
| 2026-06-27 | Story 5.5 created (ready-for-dev). Context engine analysis complete: splash → `#0F0C09`, icon alpha-flatten (icon.png is 1024² RGBA), `docs/store-metadata.md` (both stores, char-limit-compliant seeds), `docs/screenshots/` capture checklist, env-driven AdMob App IDs (test fallback) + privacy-URL/EAS-secret release config, and a documented EAS build/submit + ≤50 MB runbook. Tasks explicitly split into in-repo work vs manual release gates (no device/EAS in this environment) to keep completion honest. Resolves deferred-work lines 40-41 (AdMob IDs) and Story 5.4's hosted-URL follow-up. |
| 2026-06-27 | Story 5.5 in-repo work implemented. Flattened `icon.png` to opaque RGB (no alpha) via pngjs; splash bg → `#0F0C09` + shared image; AdMob App IDs env-driven (test fallback); authored `docs/store-metadata.md` (both stores, verified counts, EAS secrets, build/submit runbook, size table) + `docs/screenshots/README.md`. All gates green (tsc 0, 122 tests/19 suites, lint 0 errors, expo config + web export clean). **Manual EAS build/size/screenshot gates (Task 6, AC5/6/7) remain open — require Voice's EAS/device.** Status kept in-progress. |

## Open Questions / Clarifications (for Voice — answer before or during dev)

1. **Where is the privacy policy hosted, and what are the support/marketing URLs?** AC3/AC4 store listings and the Story 5.4 in-app link all need these. Options: GitHub Pages from `docs/`, a simple static host, or a one-pager site. If not ready, I'll commit the metadata doc with clearly-marked TODO URLs and leave `PRIVACY_POLICY_URL` empty (in-app link hidden) until you host it.
2. **Real AdMob App + unit IDs** — I'll env-wire them with test-ID fallbacks now, but the live values come from your AdMob account and go in as EAS Secrets at build time. Confirm you want production to use live ads (vs. shipping with test ads for a soft launch).
3. **Icon alpha flatten** — OK for me to flatten `icon.png` onto `#0F0C09` in-repo (if image tooling is available), or would you rather re-export a no-alpha 1024² PNG from your design source? (Android adaptive icon keeps its transparency — only the iOS/marketing icon must be opaque.)
4. **App name / subtitle / keywords** — happy with the drafted "Event Board ZA" / "Joburg events, all in one feed" and the keyword set, or do you want different store positioning?
5. **Screenshots** — these must be captured on a real device/simulator (can't be done here). I'll set up the folder + checklist; confirm you'll capture the 6 shots during device QA, or if you want me to generate framed mockups from design assets instead.

## Review Findings (Consolidated Epic 5 review — 2026-06-27)

- [x] [Review][Decision→Patch] Production build with an **unset** AdMob unit-ID secret passes an **empty** unit ID (ads silently fail to load) — but the `app.config.ts` comment and `docs/store-metadata.md` wrongly claimed a TestIds fallback the code never performs. **Resolved: option (a) — fix the comment + doc to reality** (empty unit-ID secret in prod → no ads; secrets MUST be set before submission; no code-behaviour change). [app.config.ts; docs/store-metadata.md] — FIXED
| 2026-06-28 | Consolidated Epic-5 code review: corrected AdMob fallback comment + store-metadata (empty unit-ID secret in prod → no ads, not test ads). Manual EAS gates still open; stays in-progress. |
