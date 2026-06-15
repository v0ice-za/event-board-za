# Story 1.5: CI/CD Pipeline

Status: in-progress

## Story

As a developer,
I want GitHub Actions CI and EAS Build configured,
So that every PR is automatically validated with type-checking and tests, and production builds are producible for both stores.

## Acceptance Criteria

1. `.github/workflows/ci.yml` runs `tsc --noEmit` and `jest` on every pull request to `main`
2. `eas.json` defines `development`, `preview`, and `production` build profiles for both iOS and Android
3. `app.config.ts` reads API key values from EAS Secrets via `process.env` (`QUICKET_API_KEY`, `EVENTBRITE_API_KEY`, `FACEBOOK_APP_TOKEN` present; values are empty strings in dev via `?? ''` fallback)
4. EAS Secrets are configured in the EAS dashboard for the three API key names (manual CLI step with placeholder values for now)
5. A push to `main` is able to trigger `eas build --platform all --profile production` without configuration errors
6. The `ci.yml` workflow completes successfully on the `main` branch

## Tasks / Subtasks

- [x] Task 1: Install Jest testing infrastructure (AC: 1)
  - [x] Run `npx expo install jest-expo jest @testing-library/react-native` — Expo-compatible versions
  - [x] Verify `jest-expo`, `jest`, `@testing-library/react-native` appear in `devDependencies` in `package.json`

- [x] Task 2: Configure Jest (AC: 1)
  - [x] Create `jest.config.js` at project root — see exact shape in Dev Notes
  - [x] Add `"test": "jest --passWithNoTests"` to `scripts` in `package.json`
  - [x] Run `npm test` locally — confirm passes (no tests yet, `--passWithNoTests` ensures clean exit)

- [x] Task 3: Create `.github/workflows/ci.yml` (AC: 1, 6)
  - [x] Create `.github/` directory and `workflows/` subdirectory (first-time setup)
  - [x] Write `ci.yml` — see exact shape in Dev Notes
  - [x] Workflow triggers: `pull_request` targeting `main`; runs `npm ci` → `tsc --noEmit` → `jest --passWithNoTests`

- [x] Task 4: Create `eas.json` (AC: 2, 5)
  - [x] Create `eas.json` at project root — see exact shape in Dev Notes
  - [x] Three profiles: `development` (dev client, internal distribution), `preview` (internal distribution), `production` (autoIncrement)
  - [x] Both iOS and Android are implicitly covered by not restricting `platforms` at the profile level

- [x] Task 5: Update `app.config.ts` for EAS Secrets (AC: 3)
  - [x] Add `extra` field that reads API keys from `process.env` with `?? ''` fallback — see exact shape in Dev Notes
  - [x] Three keys: `QUICKET_API_KEY`, `EVENTBRITE_API_KEY`, `FACEBOOK_APP_TOKEN`
  - [x] Confirm `npx tsc --noEmit` still passes after changes

- [x] Task 6: Configure EAS project and Secrets (AC: 4, 5)
  - [x] Run `eas build:configure` if `eas.json` not yet linked to an EAS project; or verify via `eas whoami` — project linked (`extra.eas.projectId` present); `eas whoami` → `voiceza`
  - [x] Create `QUICKET_API_KEY` placeholder secret (used `eas env:create` — `eas secret:create` is deprecated)
  - [x] Create `EVENTBRITE_API_KEY` placeholder secret
  - [x] Create `FACEBOOK_APP_TOKEN` placeholder secret
  - [x] Verify all three secrets exist (`eas env:list production` shows all three as `secret` visibility)
  - [x] **HALT** if `eas-cli` is not authenticated — N/A, authenticated as `voiceza`

- [ ] Task 7: Verify end-to-end (AC: 1, 5, 6)
  - [x] Run `npx tsc --noEmit` — zero errors
  - [x] Run `npm test` — passes (--passWithNoTests; no tests exist yet)
  - [x] Confirm `eas.json` validates cleanly — `eas config --profile production` resolves with no config errors for ios and android
  - [x] Commit all new/modified files; push to `main` — files already committed in `8a7fe9a` and present on `origin/main`
  - [ ] Verify GitHub Actions run appears in the repo's Actions tab and `ci.yml` completes green — **BLOCKED:** see AC6 note below
  - [x] **HALT** if no GitHub remote is configured — N/A, `origin` → `github.com/v0ice-za/event-board-za`

## Dev Notes

### Critical Context: No Jest Exists Yet

`package.json` currently has no `test` script and no jest-related packages. The project does have `eslint` and TypeScript set up. This story adds the full Jest stack from scratch — do NOT skip Task 1.

Current `package.json` scripts (for reference — do not remove existing scripts):
```json
"scripts": {
  "start": "expo start",
  "android": "expo start --android",
  "ios": "expo start --ios",
  "web": "expo start --web",
  "lint": "expo lint"
}
```

After Task 2, `test` is the only addition to scripts. Do NOT add `typecheck` or other scripts — only what the story specifies.

### jest.config.js — Exact Shape

```js
module.exports = {
  preset: 'jest-expo',
  transformIgnorePatterns: [
    'node_modules/(?!((jest-)?react-native|@react-native(-community)?)|expo(nent)?|@expo(nent)?/.*|@expo-google-fonts/.*|react-navigation|@react-navigation/.*|@unimodules/.*|unimodules|native-base|react-native-svg)',
  ],
};
```

**Why `transformIgnorePatterns`?** React Native packages ship untranspiled ES modules; Jest's default transform skips `node_modules`. This list whitelists all RN-ecosystem packages so Babel processes them. `jest-expo`'s built-in pattern covers most cases but explicit listing prevents breakage when new packages are added in later stories.

**`--passWithNoTests` rationale:** No test files exist yet. The CI workflow must not fail on an empty test suite. Stories 2+ introduce tests co-located with their components (`components/__tests__/`).

### `.github/workflows/ci.yml` — Exact Shape

```yaml
name: CI

on:
  pull_request:
    branches: [main]

jobs:
  ci:
    runs-on: ubuntu-latest
    steps:
      - name: Checkout
        uses: actions/checkout@v4

      - name: Setup Node
        uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: 'npm'

      - name: Install dependencies
        run: npm ci

      - name: TypeScript check
        run: npx tsc --noEmit

      - name: Jest
        run: npx jest --passWithNoTests
```

**Node 20 LTS:** Required for Expo SDK 56 + current npm toolchain. Do not use Node 18 (approaching EOL) or 22 (not yet fully validated with Expo SDK 56).

**`npm ci` (not `npm install`):** Faster, reproducible, respects `package-lock.json` exactly — correct for CI.

**`npx tsc` / `npx jest`:** Do not assume global installs; `npx` always uses the project-local binary.

### `eas.json` — Exact Shape

```json
{
  "cli": {
    "version": ">= 16.0.0"
  },
  "build": {
    "development": {
      "developmentClient": true,
      "distribution": "internal",
      "ios": {
        "resourceClass": "m-medium"
      }
    },
    "preview": {
      "distribution": "internal"
    },
    "production": {
      "autoIncrement": true
    }
  },
  "submit": {
    "production": {}
  }
}
```

**Profile intent:**
- `development`: Builds the `expo-dev-client` app for on-device development. `distribution: internal` means IPA/APK distributed to testers via EAS, not the stores. iOS uses M-series runners (`m-medium`) for faster builds.
- `preview`: Internal distribution build without dev client — closest to production but not released publicly. Used for stakeholder demos and manual QA before store submission.
- `production`: Store-ready build with `autoIncrement: true` so the build number auto-increments on each EAS build (avoids manual version bumps).

**Both platforms implicit:** All three profiles apply to both iOS and Android by default (no `platform` restriction). `eas build --platform all --profile production` works as-is.

### `app.config.ts` — Updated Shape with EAS Secrets

Add `extra` field inside the returned config object. The full updated `app.config.ts` with new additions:

```typescript
import { ExpoConfig, ConfigContext } from 'expo/config';

export default ({ config }: ConfigContext): ExpoConfig => ({
  ...config,
  name: 'Event Board ZA',
  slug: 'event-board-za',
  version: '1.0.0',
  orientation: 'portrait',
  icon: './assets/images/icon.png',
  scheme: 'eventboardza',
  userInterfaceStyle: 'automatic',
  ios: {
    ...config.ios,
    bundleIdentifier: 'za.voicemijalkovic.eventboard',
    icon: './assets/images/icon.png',
    googleServicesFile: './GoogleService-Info.plist',
  },
  android: {
    ...config.android,
    package: 'za.voicemijalkovic.eventboard',
    googleServicesFile: './google-services.json',
    adaptiveIcon: {
      backgroundColor: '#E6F4FE',
      foregroundImage: './assets/images/android-icon-foreground.png',
      backgroundImage: './assets/images/android-icon-background.png',
      monochromeImage: './assets/images/android-icon-monochrome.png',
    },
    predictiveBackGestureEnabled: false,
  },
  web: {
    output: 'static',
    favicon: './assets/images/favicon.png',
  },
  extra: {
    quicketApiKey: process.env.QUICKET_API_KEY ?? '',
    eventbriteApiKey: process.env.EVENTBRITE_API_KEY ?? '',
    facebookAppToken: process.env.FACEBOOK_APP_TOKEN ?? '',
  },
  plugins: [
    '@react-native-firebase/app',
    [
      'expo-build-properties',
      {
        ios: {
          useFrameworks: 'static',
        },
      },
    ],
    [
      'react-native-google-mobile-ads',
      {
        androidAppId: 'ca-app-pub-3940256099942544~3347511713',
        iosAppId: 'ca-app-pub-3940256099942544~1458002511',
      },
    ],
    'expo-router',
    [
      'expo-splash-screen',
      {
        backgroundColor: '#208AEF',
        android: {
          image: './assets/images/splash-icon.png',
          imageWidth: 76,
        },
      },
    ],
  ],
  experiments: {
    typedRoutes: true,
    reactCompiler: true,
  },
});
```

**Why `extra`?** `extra` fields are available at runtime via `expo-constants` (`Constants.expoConfig.extra`). In this story the values are empty strings in dev (no local `.env`). In EAS production builds, the real values are injected from EAS Secrets as `process.env` before `app.config.ts` is evaluated.

**Architecture note:** These API keys are for Cloud Functions (Quicket/Eventbrite/Facebook sync) implemented in Epic 4. They are NOT called from the app directly. The `extra` values here serve as the configuration bridge between EAS Secrets (where keys are stored) and the build process. Cloud Functions independently use Firebase Secret Manager for runtime access.

### EAS Secrets Setup

EAS Secrets are project-scoped and never leave the EAS build environment. Commands to create:

```bash
eas secret:create --scope project --name QUICKET_API_KEY --value placeholder
eas secret:create --scope project --name EVENTBRITE_API_KEY --value placeholder
eas secret:create --scope project --name FACEBOOK_APP_TOKEN --value placeholder
```

Use `placeholder` as the value — real API keys are obtained and updated in Epic 4 (Stories 4.3–4.5). To verify:

```bash
eas secret:list
```

Should show all three secrets with `project` scope.

**`eas-cli` authentication:** Must be logged in to EAS. Run `eas whoami` to check. If not logged in, run `eas login` (requires browser auth — HALT and ask user to complete).

### EAS Project Linking

If `eas.json` doesn't already reference an EAS project ID (via `app.json`/`app.config.ts` having an `extra.eas.projectId` or `.easignore`), run:

```bash
eas build:configure
```

This links the local project to an EAS project (creates one if not exists). It may modify `app.json` — if it does, review and incorporate the `projectId` into `app.config.ts` under `extra.eas.projectId` instead, keeping the single-source config approach.

### AC6: GitHub Push Required

AC6 cannot be verified locally. The `ci.yml` only runs on GitHub. Steps:
1. Ensure `git remote -v` shows a GitHub remote (`origin`)
2. Commit all story changes: `git add .github/ eas.json jest.config.js && git add -p package.json app.config.ts`
3. Push to `main` or open a PR targeting `main`
4. Navigate to `https://github.com/<org>/<repo>/actions` and confirm CI completes green

If no GitHub remote exists yet, **HALT** and inform the user they need to push the repo to GitHub before AC6 can be satisfied. AC6 is a hard requirement per the architecture (AR-7).

### Directory Structure After This Story

New files:
```
.github/
└── workflows/
    └── ci.yml
eas.json
jest.config.js
```

Modified files:
- `package.json` — `test` script added; `jest`, `jest-expo`, `@testing-library/react-native` in `devDependencies`
- `app.config.ts` — `extra` field with process.env reads added

### What This Story Does NOT Do

- Does NOT create any test files — the `--passWithNoTests` flag handles the empty suite
- Does NOT configure EAS Submit (store submission wiring) — that is Story 5.5
- Does NOT add production API keys — those are set via `eas secret:create` in Epic 4 stories
- Does NOT configure Firebase Functions environment — that is Epic 4's responsibility
- Does NOT set up EAS Update (OTA updates) — not in v1 scope
- Does NOT configure code signing profiles (iOS provisioning / Android keystore) — EAS manages these automatically on first build

### Previously Installed Packages (Do Not Re-install)

| Package | Installed In |
|---------|-------------|
| `@tanstack/react-query` | Story 1.4 |
| `react-native-google-mobile-ads` | Story 1.4 |
| `@react-native-firebase/app` | Story 1.3 |
| `@react-native-firebase/firestore` | Story 1.3 |
| `expo-build-properties` | Story 1.3 |
| `react-native-safe-area-context` | Story 1.1 scaffold |

### References

- [Source: epics.md#Story 1.5] — User story, acceptance criteria, AR-7
- [Source: architecture.md#CI/CD] — GitHub Actions + EAS Build + EAS Submit + EAS Secrets pattern
- [Source: architecture.md#Complete Project Directory Structure] — `.github/workflows/ci.yml`, `eas.json` locations
- [Source: architecture.md#Architectural Boundaries] — API keys not in app bundle; EAS Secrets are the injection point

## Dev Agent Record

### Agent Model Used

claude-sonnet-4-6 (create-story); claude-opus-4-8 (dev-story)

### Debug Log References

None.

### Completion Notes List

- All file artifacts (`ci.yml`, `eas.json`, `jest.config.js`, `app.config.ts` `extra`, `package.json` Jest stack) were already authored and committed in `8a7fe9a` by a prior session, exactly matching the Dev Notes spec — verified byte-for-byte, no changes needed.
- Task 6 (EAS Secrets) was the main outstanding work: created the three placeholder secrets via `eas env:create --scope project --visibility secret` across `production`/`preview`/`development` environments. Note `eas secret:create` from the original Dev Notes is deprecated in eas-cli 20.x; `eas env:create` is the current equivalent. Verified via `eas env:list production`.
- Local verification (AC1/AC3/AC5): `npx tsc --noEmit` → 0 errors; `npm test` → passes (`--passWithNoTests`, no tests yet); `eas config --profile production` resolves cleanly for both ios and android (no config errors).
- EAS project is linked: `extra.eas.projectId` = `48b701cb-...` present in `app.config.ts`; `eas whoami` → `voiceza`.
- **AC6 outstanding:** `ci.yml` triggers only on `pull_request` → `main`, but all story files are already merged to `main`, so CI has never had a PR to run against. Demonstrating "CI completes green" requires opening a PR to `main` and observing the Actions tab. `gh` CLI is not installed in this environment, so this step cannot be completed or observed locally — handed to user for a decision (see below). Story held at `in-progress` pending AC6.

### File List

- `.github/workflows/ci.yml` (new — committed in 8a7fe9a)
- `eas.json` (new — committed in 8a7fe9a)
- `jest.config.js` (new — committed in 8a7fe9a)
- `app.config.ts` (modified — `extra` API keys + `eas.projectId`; committed in 8a7fe9a)
- `package.json` (modified — `test` script + Jest devDependencies; committed in 8a7fe9a)
- EAS project secrets (cloud-side, not in repo): `QUICKET_API_KEY`, `EVENTBRITE_API_KEY`, `FACEBOOK_APP_TOKEN`

### Change Log

- 2026-06-01: Story 1.5 created
- 2026-06-15: Verified all file artifacts match spec; created 3 EAS placeholder secrets; ran local validations (tsc, jest, eas config) — all pass. AC6 (CI green on a PR) blocked pending user decision; story held at in-progress.
