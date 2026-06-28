# Story 5.4: Privacy Policy + POPIA Compliance

Status: done

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As a user,
I want to be able to read the app's privacy policy,
so that I understand what data is collected and can make an informed decision about using the app.

## Acceptance Criteria

1. **`docs/privacy-policy.md` exists (NEW) and is complete (AR-10, NFR-5).** Covers, at minimum:
   - **App identity** — "Event Board ZA", solo developer Voice Mijalkovic, contact email **voji95@gmail.com**.
   - **Data the app itself collects** — **none / no PII**. No account, no login, no name/email/location capture, no maps, no push. State this explicitly.
   - **Data collected by third-party SDKs** — **Google AdMob** (advertising identifiers / device data for ad serving + measurement) and **Firebase Analytics + Crashlytics** (anonymous usage events, crash diagnostics). Disclose what each collects and link to Google's privacy policy.
   - **Why** — ad serving (free, ad-supported app), basic product analytics, crash diagnostics.
   - **User rights under POPIA** — right of access, correction, objection, and complaint to the Information Regulator (South Africa); how to exercise them (the contact email).
   - **Children** — not directed at children under 18 (or state the chosen age posture).
   - **Effective date** and a "last updated" line.
   [epics §Story 5.4; PRD NFR-5; architecture line 164]
2. **Privacy policy URL is set in `app.config.ts` (UPDATE).** A `privacyPolicyUrl` is added to `extra` (read from `process.env.PRIVACY_POLICY_URL ?? '<hosted-url>'`, mirroring the existing `extra.*` pattern) so it is available both to store listings and to the in-app link. The URL points at a **hosted** copy of the policy (see Dev Notes — hosting choice is Voice's; the value may be a known placeholder URL committed now and finalised in Story 5.5). [epics §Story 5.4]
3. **iOS privacy manifest declared via Expo config (UPDATE `app.config.ts`).** `expo.ios.privacyManifests` is set with the **Required Reason API** entries the app needs (`NSPrivacyAccessedAPITypes`) and the tracking/collection posture (`NSPrivacyTracking`, and `NSPrivacyCollectedDataTypes` if declaring AdMob's collected data at the app level). On `expo prebuild` / EAS build this generates `ios/PrivacyInfo.xcprivacy`. The Google Mobile Ads native SDK ships **its own** bundled privacy manifest, so the app-level manifest covers **app-level** Required Reason APIs (e.g. `UserDefaults`), not the SDK's internal ones (see Dev Notes — exact API codes verified at implementation time). [epics §Story 5.4]
4. **No native files are hand-edited.** `ios/PrivacyInfo.xcprivacy` is produced by the `privacyManifests` config (not committed by hand) — consistent with the project's "no hand-edited native config; native dirs are not checked in; prebuild runs in EAS/dev-client" posture (Stories 5.2 / 5.3). [project rules; epics §Story 5.4 "generated (or added via EAS config)"]
5. **In-app Privacy Policy link (UPDATE `app/event/[id].tsx`).** A "Privacy Policy" link renders in the **detail screen's scrollable body footer** — small, `text-text-secondary`, **11px** — below the description, inside the `ScrollView` (not the sticky CTA). Tapping it opens the configured `privacyPolicyUrl` in the existing in-app `WebViewModal` (consistent with the ticket-link pattern), reusing the `showTickets`-style mount-controlled visibility with a separate state flag. If `privacyPolicyUrl` is empty, the link is not rendered (no dead link). [epics §Story 5.4; UX 11sp text-secondary]
6. **No regressions; web + tests green.** `tsc --noEmit` 0 errors; `expo lint` 0 errors (the 1 pre-existing EmptyState warning is acceptable); full Jest suite green (baseline 19 suites / 120 tests from Story 5.3) with a new/updated test covering the privacy link render + open behaviour; `expo export --platform web` bundles clean. [project rules; precedent: Stories 5.2 / 5.3]

## Tasks / Subtasks

- [x] **Task 1 — Author `docs/privacy-policy.md` (NEW) (AC: #1)**
  - [x] Create `docs/privacy-policy.md` with the sections in AC #1. Plain markdown, no app code.
  - [x] Be accurate to the actual SDK surface in the codebase: AdMob via `react-native-google-mobile-ads` (banner + interstitial), Firebase Analytics + Crashlytics via `@react-native-firebase/*`. **Do not over-claim** — the app collects no PII itself; all data flows through these SDKs.
  - [x] Include the POPIA user-rights section + Information Regulator complaint route, contact email **voji95@gmail.com**, effective date, last-updated line.
  - [x] Keep it the **single source of truth**; the hosted copy (AC #2) should be generated/published from this file.

- [x] **Task 2 — Wire `privacyPolicyUrl` into `app.config.ts` extra (AC: #2)**
  - [x] Add `privacyPolicyUrl: process.env.PRIVACY_POLICY_URL ?? '<hosted-url-or-placeholder>'` to the `extra` block, alongside the existing `admob*`/`*ApiKey` entries. Add a one-line comment noting the real hosted URL is finalised in Story 5.5 if a placeholder is used now.
  - [x] Do not remove or reorder existing `extra` keys.

- [x] **Task 3 — Add `expo.ios.privacyManifests` to `app.config.ts` (AC: #3, #4)**
  - [x] Add an `ios.privacyManifests` object with:
    - `NSPrivacyTracking: false` (v1 does not run an ATT/UMP consent prompt — disclosure model; see Open Questions). Set `true` only if the UMP/ATT decision changes.
    - `NSPrivacyAccessedAPITypes` — at minimum the **UserDefaults** Required Reason API (`NSPrivacyAccessedAPICategoryUserDefaults`, reason `CA92.1`) which apps using these SDKs commonly need. **Verify the exact required set at implementation time** against the current Google Mobile Ads + Firebase Expo/Apple docs (see Dev Notes) and include only what is actually required.
    - Optionally `NSPrivacyCollectedDataTypes` if declaring AdMob's collected-data categories at the app level (the store privacy "nutrition labels" can also be filled in App Store Connect — coordinate with Story 5.5).
  - [x] Do **not** check in `ios/PrivacyInfo.xcprivacy` by hand — it is generated by `expo prebuild` from this config (no `ios/` dir is committed in this story's scope). Native generation is verified on the next EAS/dev-client build (Story 5.5 device QA).
  - [x] Confirm `app.config.ts` still type-checks (it is a typed `ExpoConfig` factory).

- [x] **Task 4 — In-app Privacy Policy link in the detail footer (AC: #5)**
  - [x] In `app/event/[id].tsx`, read the URL: `const privacyPolicyUrl = (Constants.expoConfig?.extra?.privacyPolicyUrl as string | undefined) ?? '';` (add `import Constants from 'expo-constants';` — same pattern as `AdBannerUnit.tsx` / `_layout.tsx`).
  - [x] Add a `showPrivacy` state flag (`useState(false)`) mirroring `showTickets`.
  - [x] Render the link **inside the `ScrollView` body**, after the description block (within the `px-4` body `View` or a small footer `View`), only when `privacyPolicyUrl !== ''`:
    ```tsx
    {privacyPolicyUrl !== '' && (
      <Pressable
        onPress={() => setShowPrivacy(true)}
        accessibilityRole="link"
        accessibilityLabel="Privacy Policy"
        className="mt-4 min-h-[44px] justify-center"
      >
        <Text className="text-[11px] font-inter text-text-secondary">Privacy Policy</Text>
      </Pressable>
    )}
    ```
    (Keep a ≥44px touch target for a11y even though the text is 11px — wrap height, not font size.)
  - [x] Mount-control the modal next to the existing tickets one:
    ```tsx
    {showPrivacy && privacyPolicyUrl !== '' && (
      <WebViewModal url={privacyPolicyUrl} onClose={() => setShowPrivacy(false)} />
    )}
    ```
  - [x] Do **not** touch the back pill, the sticky CTA, the tickets flow, the analytics calls, or navigation. The link is additive.

- [x] **Task 5 — Tests (AC: #5, #6)**
  - [x] `app/event/[id].test.tsx` (UPDATE): with `expo-constants` mocked to provide `extra.privacyPolicyUrl: 'https://example.com/privacy'`, assert the "Privacy Policy" link renders and that pressing it mounts `WebViewModal` with that URL (assert via the existing `WebViewModal` mock / `react-native-webview` mock used by the ticket-link test). Add a case where `privacyPolicyUrl` is `''` → link is **not** rendered. Keep all existing detail-screen tests (interstitial `recordDetailView`, analytics screen-view, ticket-tap) green.
  - [x] Reuse the suite's existing mocks (`@/lib/analytics`, `expo-constants`, webview). Mind the NativeWind jest-factory restriction noted in Stories 5.1–5.3 (`require('react-native')` inside any mock factory that needs RN primitives).

- [x] **Task 6 — Validation gates (AC: #6)**
  - [x] `npx tsc --noEmit` → 0 errors.
  - [x] `npm test` → all suites green (baseline 19 suites / 120 tests; expect the detail-screen suite to gain assertions, count unchanged or +1 suite if a new file is added).
  - [x] `npx expo lint` → 0 errors (1 pre-existing EmptyState warning acceptable).
  - [x] `npx expo export --platform web` → bundles clean (no new native imports added — `expo-constants` + `WebViewModal` already web-safe).

## Dev Notes

### Scope boundary — this is a compliance/disclosure story, NOT a consent-SDK story

The epics AC for 5.4 is **disclosure-based**: a privacy policy doc, a store/in-app URL, the iOS privacy manifest, and an in-app link. It does **not** mandate a Google **UMP** (User Messaging Platform) consent flow or an iOS **ATT** prompt. Deferred-work line 47 (Story 1.4 review) flagged "AdMob `MobileAds().initialize()` called before user consent on GDPR/POPIA devices … consent flow belongs to Story 5.4". **Decision for v1:** POPIA (South Africa, the target market) does not require GDPR-style *prior* opt-in consent; v1 satisfies POPIA via **disclosure** (this story). A full UMP/ATT consent gate is only needed if the app targets EEA/UK users or wants IDFA-based personalised ads on iOS — **deferred to v1.1** unless Voice says otherwise (Open Question #1). Do **not** add a UMP SDK, an ATT prompt, or move/condition `MobileAds().initialize()` in this story.

Likewise, Story 5.3 deferred "consent-gated analytics collection (off until POPIA acceptance)" to 5.4. Under the disclosure model there is **no consent gate** — `initInstrumentation()` stays gated on `__DEV__` only (production on). Do **not** change `lib/analytics.ts` or the init effect. (Open Question #4.)

### Files being modified — current state (READ before editing)

- **`docs/privacy-policy.md`** — NEW. Pure markdown; the doc deliverable. `docs/` already holds `project-context.md`.
- **`app.config.ts`** (current state above): typed `ExpoConfig` factory. `extra` holds `quicketApiKey`, `eventbriteApiKey`, `facebookAppToken`, `admobBannerUnitId`, `admobInterstitialUnitId`, `eas.projectId`. `ios` block has `bundleIdentifier`, `icon`, `googleServicesFile` (spread over `...config.ios`). **Add** `extra.privacyPolicyUrl` and `ios.privacyManifests`; preserve everything else (plugins, splash, experiments). The `react-native-google-mobile-ads` plugin still uses Google **test** App IDs — real IDs are Story 5.5 (deferred-work line 40); do not change them here.
- **`app/event/[id].tsx`** (Stories 3.3 + 5.2 + 5.3): detail screen. Already imports `WebViewModal`, uses `showTickets` mount-controlled modal, has `logScreenView`/`logTicketLinkTapped` and `recordDetailView`. **Preserve all of it.** Add: `expo-constants` import, `showPrivacy` state, the 11px footer link inside the `ScrollView` body, and a second `WebViewModal` mount for the privacy URL. The body `ScrollView` already has `contentContainerStyle={{ paddingBottom: insets.bottom + 72 }}` so footer content clears the sticky CTA — the link sits naturally above that padding.
- **`components/WebViewModal.tsx`** (Story 3.2): reused **as-is**. It takes `{ url, onClose }`, is purely presentational, mount-controlled. No change needed. (Note the deferred-work item: no URL-scheme allowlist — fine here since `privacyPolicyUrl` is a trusted https URL we control.)
- **`app/event/[id].test.tsx`**: extend; reuse existing mocks.

### iOS privacy manifest — accurate guidance (verify codes at implementation)

- Apple requires `PrivacyInfo.xcprivacy` declaring **Required Reason APIs** (`NSPrivacyAccessedAPITypes`) and tracking/collected-data posture. Expo supports this declaratively via `ios.privacyManifests` in app config (Expo SDK 50+; this project is SDK 56) — it generates the file on prebuild. No manual Xcode editing.
- The **Google Mobile Ads SDK** (wrapped by `react-native-google-mobile-ads` 16.3.1) and the **Firebase** SDKs ship **their own** bundled `.xcprivacy` manifests for their internal API use. The **app-level** manifest you add covers APIs the **app/Expo** layer touches — most commonly **`NSPrivacyAccessedAPICategoryUserDefaults`** with reason **`CA92.1`** (app functionality). Add file-timestamp / system-boot / disk-space reasons **only if** a lint/upload warning shows they're needed.
- `NSPrivacyTracking: false` for v1 (no ATT prompt, no cross-app tracking declared). The App Store privacy **nutrition labels** (data collected by AdMob: identifiers, usage, diagnostics) are primarily completed in **App Store Connect** during submission — coordinate with Story 5.5; declaring `NSPrivacyCollectedDataTypes` here is optional and additive.
- **Action:** at implementation, check the current Expo "Apple privacy manifests" doc + `react-native-google-mobile-ads` privacy notes and include the minimal accurate set. Don't blindly copy a large boilerplate list — Apple flags over-declaration too.

### In-app link UX

- 11px `text-text-secondary` per AC, but the **Pressable** must keep a ≥44px touch height (a11y / NFR-4) — set min-height on the wrapper, not the font. `accessibilityRole="link"`.
- Opening in `WebViewModal` (in-app) matches the ticket-link convention (FR-5 / UX-DR8) and keeps the user in the app. `router.*` is not involved — modal is mount-controlled, no navigation. (Project rule: `router.*` only in screen files — and this *is* a screen file, but we don't need it.)
- If `privacyPolicyUrl` is empty (placeholder not yet hosted), render nothing — never a dead link. This also keeps existing tests that don't set the extra value unaffected unless they opt in.

### Testing patterns (this repo)

- Preset `jest-expo`; tests co-located; `functions/` excluded. `@testing-library/react-native` + `act`.
- The detail-screen suite already mocks `expo-constants`, `@/lib/analytics`, the interstitial hook, and the webview — extend those rather than adding new global mocks. To assert the privacy modal opens, follow the existing ticket-link test's approach for detecting `WebViewModal` mount with a given `url`.
- NativeWind jest-factory pitfall (Stories 5.1–5.3): if any mock factory needs RN primitives, `require('react-native')` **inside** the factory.
- "A worker process has failed to exit gracefully" and the `@expo/vector-icons` "not wrapped in act()" console noise are known jest-expo nuisances, not failures.

### Project-wide rules that apply

- Named exports except `app/*.tsx` screen defaults. [docs/project-context.md#Exports]
- `className` only — the 11px link uses `text-[11px]`; the ≥44px target is `min-h-[44px]`. No `StyleSheet`/inline style except the documented dynamic-inset exceptions already in the file. [docs/project-context.md#NativeWind]
- Absent optional fields are `null` not `undefined` — not directly relevant (no data model change). [docs/project-context.md#Null vs Undefined]
- No new native config hand-editing; prebuild owns `ios/PrivacyInfo.xcprivacy`. [Stories 5.2 / 5.3 precedent]

### Project Structure Notes

- NEW: `docs/privacy-policy.md`
- MODIFY: `app.config.ts` (`extra.privacyPolicyUrl` + `ios.privacyManifests`), `app/event/[id].tsx` (footer link + privacy `WebViewModal`)
- UPDATE tests: `app/event/[id].test.tsx`
- REUSE as-is: `components/WebViewModal.tsx`
- GENERATED (not committed this story): `ios/PrivacyInfo.xcprivacy` (via prebuild on next EAS/dev-client build)
- VERIFY green: all other suites

### References

- [Source: _bmad-output/planning-artifacts/epics.md#Story 5.4 (lines 545-559)] — AC source: privacy-policy.md contents, URL in app.config.ts, PrivacyInfo.xcprivacy, ios.privacyManifests, in-app 11sp link in detail footer
- [Source: _bmad-output/planning-artifacts/epics.md (lines 36, 49, 83)] — NFR-5 / AR-10: POPIA compliance, no PII, AdMob telemetry disclosure, privacy manifest required before submission
- [Source: _bmad-output/planning-artifacts/architecture.md (lines 31, 56, 164, 220, 486, 556)] — POPIA posture, ad-SDK telemetry disclosure, Firebase Analytics tracking, privacy-policy.md location in structure
- [Source: _bmad-output/implementation-artifacts/5-3-firebase-analytics-crashlytics.md (Dev Notes "Crashlytics collection toggle", Open Question #4)] — consent-gated collection explicitly deferred to this story; `__DEV__`-only gate stands under the disclosure model
- [Source: _bmad-output/implementation-artifacts/deferred-work.md (line 47)] — "MobileAds().initialize() before consent … consent flow belongs to Story 5.4" — resolved here as disclosure-based (UMP/ATT deferred to v1.1)
- [Source: app.config.ts] — current `extra` + `ios` + plugins; AdMob test App IDs (real IDs = Story 5.5)
- [Source: app/event/[id].tsx] — ScrollView body, `showTickets` mount-controlled WebViewModal, sticky CTA, back pill
- [Source: components/WebViewModal.tsx] — reusable `{ url, onClose }` in-app browser
- [Source: components/AdBannerUnit.tsx:16 / app/_layout.tsx:33] — `Constants.expoConfig?.extra?.X` read pattern
- [Source: docs/project-context.md] — exports, NativeWind className-only, error-handling rules
- AR-10 (privacy-policy.md), NFR-5 (POPIA + privacy manifest)

## Dev Agent Record

### Agent Model Used

claude-opus-4-8 (Opus 4.8)

### Debug Log References

1. **Test mock for `expo-constants`.** The detail-screen suite did not previously mock `expo-constants` (the screen had no need for it). Added a mock whose `expoConfig` is a **getter** returning `{ extra: { privacyPolicyUrl: mockPrivacyUrl } }`, with `mockPrivacyUrl` a mutable module-scope variable (the `mock` prefix is required for a jest.mock factory to legally reference an outer variable). `beforeEach` resets it to the configured URL; test (n) sets it to `''` to exercise the hidden-link path. The getter ensures per-test changes are read at render time.
2. **No regressions from the new import.** Adding `import Constants from 'expo-constants'` to the screen is web-safe and Jest-safe (expo-constants ships with jest-expo); existing tests that don't care about the URL still pass because the link only affects new assertions, and pressing "Get tickets" still mounts exactly one `webview-modal` (the privacy link is rendered but not pressed in those tests).
3. **iOS privacy manifest is config-only.** `ios.privacyManifests` in `app.config.ts` generates `ios/PrivacyInfo.xcprivacy` on `expo prebuild`; no `ios/` dir is checked in for this story, so native generation is verified on the next EAS/dev-client build (Story 5.5 device QA). No native file hand-edited.

### Completion Notes List

- **`docs/privacy-policy.md` (NEW)** — POPIA-compliant disclosure policy: app identity + contact (voji95@gmail.com), explicit **no-PII** statement (no accounts/location/social/maps/push/IAP), third-party SDK disclosure (Google AdMob; Firebase Analytics + Crashlytics) with links to Google's policies, processing purposes, POPIA user rights + Information Regulator complaint route, under-18 posture, retention/security, change policy, effective + last-updated dates (2026-06-27).
- **`app.config.ts` (MODIFIED)** — added `extra.privacyPolicyUrl` (`process.env.PRIVACY_POLICY_URL ?? ''`, env-driven, empty until hosted → in-app link hides; real URL + store-listing wiring finalised in Story 5.5) and `ios.privacyManifests` (`NSPrivacyTracking: false`; `NSPrivacyAccessedAPICategoryUserDefaults` reason `CA92.1`). AdMob/Firebase native SDKs ship their own manifests; this declares the app-level Required Reason API.
- **`app/event/[id].tsx` (MODIFIED)** — reads `privacyPolicyUrl` from `Constants.expoConfig.extra`; renders an 11px `text-text-secondary` "Privacy Policy" link in the scrollable body footer (≥44px touch target via `min-h-[44px]`, `accessibilityRole="link"`), shown only when the URL is non-empty; tapping it opens the URL in the existing `WebViewModal` via a `showPrivacy` mount-controlled flag — same pattern as the tickets webview. Back pill, sticky CTA, analytics, interstitial, and navigation untouched.
- **Scope decisions honoured (disclosure-based POPIA):** no UMP/ATT consent SDK added; `MobileAds().initialize()` unchanged; analytics collection stays `__DEV__`-only (no consent gate). UMP/ATT deferred to v1.1 per Open Question #1.
- **Reuse, not reinvention:** `WebViewModal` reused as-is; `Constants.expoConfig.extra` read pattern mirrors `AdBannerUnit.tsx` / `_layout.tsx`. No new dependencies.
- **Gates:** `tsc --noEmit` 0 errors · `npm test` **19 suites / 122 tests** green (was 19/120 — +2 detail-screen tests) · `expo lint` 0 errors (1 pre-existing EmptyState warning) · `expo export --platform web` bundles clean.
- ⚠️ **Release follow-ups (Story 5.5):** host `privacy-policy.md` and set the real `PRIVACY_POLICY_URL` (so the in-app link renders and the store listing URL is populated); complete App Store Connect privacy nutrition labels; verify generated `PrivacyInfo.xcprivacy` on a device build. Open Questions #2/#3 carried forward.

### File List

- `docs/privacy-policy.md` (NEW — POPIA + AdMob/Firebase disclosure policy)
- `app.config.ts` (MODIFIED — `extra.privacyPolicyUrl` + `ios.privacyManifests`)
- `app/event/[id].tsx` (MODIFIED — in-app Privacy Policy footer link + privacy WebViewModal)
- `app/event/[id].test.tsx` (MODIFIED — mock expo-constants; tests (m) link render+open, (n) hidden when URL empty)
- `_bmad-output/implementation-artifacts/sprint-status.yaml` (MODIFIED — status tracking)

## Change Log

| Date | Change |
|------|--------|
| 2026-06-27 | Story 5.4 created (ready-for-dev). Context engine analysis complete: privacy-policy.md (POPIA + AdMob/Firebase disclosure, no PII), `privacyPolicyUrl` in app.config.ts extra, `ios.privacyManifests` (Required Reason APIs; SDKs ship their own manifests), in-app 11px Privacy Policy link in the detail footer opening the URL via the existing WebViewModal. Scoped as **disclosure-based** POPIA compliance — UMP/ATT consent SDK and consent-gated analytics deferred to v1.1 (flagged as Open Questions); resolves deferred-work line 47 accordingly. |
| 2026-06-27 | Story 5.4 implemented. Authored `docs/privacy-policy.md`; added `extra.privacyPolicyUrl` (env-driven, empty→link hidden) + `ios.privacyManifests` (NSPrivacyTracking false, UserDefaults CA92.1) to `app.config.ts`; added the 11px in-app Privacy Policy footer link to the detail screen (opens via existing WebViewModal, ≥44px target, hidden when no URL). Disclosure-only POPIA — no UMP/ATT, analytics gate unchanged. All gates green (tsc 0, 122 tests/19 suites, lint 0 errors, web export clean). Real hosted URL + store labels deferred to Story 5.5. Status → review. |

## Open Questions / Clarifications (for Voice — answer before or during dev)

1. **Consent SDK (UMP/ATT) — defer to v1.1?** v1 satisfies **POPIA** via disclosure (this story); it does **not** add a Google UMP consent prompt or iOS ATT prompt. That's correct for a South-Africa-only launch. If you intend to serve EEA/UK users or want IDFA-based personalised ads on iOS, a UMP/ATT flow (gating `MobileAds().initialize()`) is needed — confirm v1.1 is the right home. **(Recommended: defer to v1.1.)**
2. **Where will the privacy policy be hosted?** The store listing + in-app link need a public **URL**. Options: GitHub Pages, a gist, or simple static hosting rendered from `docs/privacy-policy.md`. Should I commit a placeholder URL now and finalise the real one in Story 5.5, or do you have the hosting URL already?
3. **iOS privacy manifest scope** — v1 declares `NSPrivacyTracking: false` plus the minimal Required Reason APIs (likely just UserDefaults `CA92.1`), and the AdMob/Firebase native SDKs supply their own manifests. The detailed App Store privacy "nutrition labels" get completed in App Store Connect during Story 5.5. OK to keep the in-config manifest minimal and do the full label set at submission?
4. **Analytics collection gate** — stays `__DEV__`-only (production on), per the disclosure model; no consent gate added (Story 5.3's deferral resolved as "no gate needed for POPIA"). Confirm you don't want collection held off until an in-app acceptance.
5. **Children/age posture** — privacy policy will state "not directed at children under 18". Confirm that's the posture (affects AdMob's tag-for-child-directed-treatment setting, which we are leaving default/off).
