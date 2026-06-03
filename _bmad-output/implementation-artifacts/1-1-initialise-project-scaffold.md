# Story 1.1: Initialise Project Scaffold

Status: review

## Story

As a developer,
I want to initialise the Expo project with the correct directory structure and base dependencies,
so that the app compiles, runs on iOS and Android simulators, and is ready for feature development.

## Acceptance Criteria

1. **Given** a clean working directory **When** setup is complete **Then** the app compiles and launches in a development build on iOS and Android simulators without errors
2. TypeScript strict mode (`"strict": true`) is enabled in `tsconfig.json`
3. Directory structure exists: `app/`, `components/`, `hooks/`, `lib/`, `constants/`, `types/`, `assets/placeholders/`, `docs/`
4. `app/_layout.tsx` (minimal Stack), `app/index.tsx` (placeholder), and `app/event/[id].tsx` (placeholder) exist and route correctly
5. `@expo-google-fonts/inter` is installed
6. `.gitignore` excludes `.env`, `google-services.json`, `GoogleService-Info.plist`
7. `.env.example` documents all required environment variable names

## Tasks / Subtasks

- [x] Task 1: Initialise Expo project with SDK 56 (AC: 1)
  - [x] Run `npx create-expo-app@latest event-board-za --template default@sdk-56` — the `--template default@sdk-56` flag is required; omitting it defaults to SDK 55
  - [x] Install `expo-dev-client`: `npx expo install expo-dev-client` — required because react-native-firebase (Story 1.3) cannot run in Expo Go; set up dev builds from day one
  - [x] Verify compilation: `npx expo run:ios` and `npx expo run:android` — do NOT use `expo start` with Expo Go

- [x] Task 2: Convert app.json → app.config.ts (AC: 1)
  - [x] Rename `app.json` to `app.config.ts` — architecture specifies `app.config.ts` (needed for EAS Secrets in Story 1.5)
  - [x] Wrap existing config in the `ExpoConfig` export shape shown in Dev Notes below

- [x] Task 3: Enable TypeScript strict mode (AC: 2)
  - [x] Open `tsconfig.json` and add `"strict": true` to `compilerOptions` — the generated file may not include it
  - [x] Run `npx tsc --noEmit` and fix any strict mode errors introduced in generated files

- [x] Task 4: Create project directory structure (AC: 3)
  - [x] Create: `components/`, `hooks/`, `lib/`, `constants/`, `types/`, `assets/placeholders/`, `docs/`
  - [x] Add `.gitkeep` to each empty directory so git tracks them

- [x] Task 5: Set up placeholder screens and root layout (AC: 4)
  - [x] Replace `app/_layout.tsx` with a minimal Expo Router Stack — see exact shape in Dev Notes
  - [x] Replace `app/index.tsx` with a minimal placeholder screen — see exact shape in Dev Notes
  - [x] Create `app/event/[id].tsx` as a minimal placeholder — see exact shape in Dev Notes
  - [x] Confirm both routes resolve: navigate to `/` and to `/event/test-id` without crashes

- [x] Task 6: Install Inter font package (AC: 5)
  - [x] Run `npm install @expo-google-fonts/inter` (version 0.4.2 is current stable)
  - [x] Do NOT load or use the font yet — font loading is part of Story 1.2 (NativeWind + design tokens)

- [x] Task 7: Update .gitignore and create .env.example (AC: 6, 7)
  - [x] Add `.env`, `google-services.json`, `GoogleService-Info.plist` to `.gitignore` if not already present
  - [x] Create `.env.example` with the content shown in Dev Notes
  - [x] **Note:** Story 1.3 will add real `google-services.json` / `GoogleService-Info.plist` and commit them — at that point remove them from `.gitignore` (architecture specifies they are non-secret and should be committed)

## Dev Notes

### Scaffold Command — SDK Version Matters

```bash
# CORRECT — forces SDK 56 template
npx create-expo-app@latest event-board-za --template default@sdk-56

# WRONG — defaults to SDK 55 as of May 2026
npx create-expo-app@latest event-board-za
```

SDK 56 ships React Native 0.85.2, React 19.2.3, Hermes v1 as default JS engine.

### Development Builds Required from Day One

Expo Go cannot be used for this project. `@react-native-firebase` (Story 1.3) requires native modules. Install `expo-dev-client` now so the dev workflow is correct from the start:

```bash
npx expo install expo-dev-client
```

Build and run with:
```bash
npx expo run:ios    # compiles native iOS build
npx expo run:android  # compiles native Android build
```

Never use `npx expo start` for normal development (Expo Go won't work).

### app.config.ts Shape

Convert `app.json` to `app.config.ts`. Minimum shape for Story 1.1:

```typescript
import { ExpoConfig, ConfigContext } from 'expo/config';

export default ({ config }: ConfigContext): ExpoConfig => ({
  ...config,
  name: 'Event Board ZA',
  slug: 'event-board-za',
  ios: {
    ...config.ios,
    bundleIdentifier: 'za.voicemijalkovic.eventboard',
  },
  android: {
    ...config.android,
    package: 'za.voicemijalkovic.eventboard',
  },
});
```

Story 1.5 (CI/CD) will extend this with EAS Secrets via `process.env`. Keep the file clean and minimal for now.

### Placeholder Screens — Exact Shape

All three files use **default exports** — this is the one exception to the project-wide named-exports rule. Expo Router requires default exports on screen files.

```tsx
// app/_layout.tsx — minimal Stack only; full provider setup is Story 1.4 scope
import { Stack } from 'expo-router';

export default function RootLayout() {
  return <Stack />;
}
```

```tsx
// app/index.tsx — feed placeholder; fully replaced in Story 2.6
import { View, Text } from 'react-native';

export default function FeedScreen() {
  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
      <Text>Event Board ZA</Text>
    </View>
  );
}
```

```tsx
// app/event/[id].tsx — detail placeholder; fully replaced in Story 3.3
import { useLocalSearchParams } from 'expo-router';
import { View, Text } from 'react-native';

export default function EventDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
      <Text>Event {id}</Text>
    </View>
  );
}
```

**Do NOT add** NativeWind `className`, TanStack Query, Firebase, or AdMob imports. These are Story 1.2–1.4 scope. Keep placeholders clean to avoid scope creep.

**inline `style={{}}` is acceptable here** — these screens will be replaced entirely. The no-inline-styles rule applies to the real component implementations in Epic 2+.

### Exports Rule — Named vs Default

| File type | Export style | Why |
|-----------|-------------|-----|
| `app/*.tsx` screens | `export default` | Expo Router requirement |
| `components/*.tsx` | `export function` (named) | Architecture enforcement |
| `hooks/*.ts` | `export function` (named) | Architecture enforcement |
| `lib/*.ts`, `constants/*.ts`, `types/*.ts` | named | Architecture enforcement |

[Source: architecture.md#Exports: named exports only — no default exports]

### TypeScript Strict Mode

The generated `tsconfig.json` from `create-expo-app` extends `expo/tsconfig.base`. Add `strict: true` inside `compilerOptions`:

```json
{
  "extends": "expo/tsconfig.base",
  "compilerOptions": {
    "strict": true
  }
}
```

Run `npx tsc --noEmit` after enabling — fix any errors in the generated boilerplate before proceeding.

### .env.example Content

```
# EAS Secrets — store real values in EAS dashboard, NOT here
# Cloud Functions (Quicket, Eventbrite, Facebook) read these from Firebase Secret Manager
QUICKET_API_KEY=
EVENTBRITE_API_KEY=
FACEBOOK_APP_TOKEN=

# AdMob App IDs — set in app.config.ts; not secrets but document names here
EXPO_PUBLIC_ADMOB_APP_ID_IOS=
EXPO_PUBLIC_ADMOB_APP_ID_ANDROID=
```

API keys are stored in Firebase Secret Manager / EAS Secrets, never in the app bundle. See architecture.md#Authentication & Security.

### .gitignore — Temporary Exclusion Note

Story 1.1 AC says to exclude `google-services.json` and `GoogleService-Info.plist` from `.gitignore`.

**Important:** Architecture specifies these files ARE committed (they are non-secret Firebase config). When Story 1.3 creates these files, remove them from `.gitignore` and commit them. This is not a contradiction — Story 1.1 adds the exclusion as a safety placeholder before the files exist.

### Firebase v24 — iOS Build Note (for Story 1.3 awareness)

When `@react-native-firebase` v24 is added in Story 1.3, iOS builds require this in `app.config.ts` to prevent linker errors:

```typescript
// In app.config.ts plugins array — add in Story 1.3, not Story 1.1
plugins: [
  ['expo-build-properties', {
    ios: { useFrameworks: 'static' }
  }]
]
```

Document this here so the Story 1.3 dev agent is not surprised by the iOS build failure.

### Project Structure — What Story 1.1 Creates

```
event-board-za/
├── app.config.ts          ← converted from app.json
├── package.json
├── tsconfig.json          ← strict: true added
├── babel.config.js        ← unchanged from scaffold
├── .env.example           ← NEW
├── .gitignore             ← .env, google-services.json, GoogleService-Info.plist added
├── app/
│   ├── _layout.tsx        ← minimal Stack placeholder
│   ├── index.tsx          ← feed placeholder
│   └── event/
│       └── [id].tsx       ← detail placeholder
├── components/            ← empty (+ .gitkeep)
├── hooks/                 ← empty (+ .gitkeep)
├── lib/                   ← empty (+ .gitkeep)
├── constants/             ← empty (+ .gitkeep)
├── types/                 ← empty (+ .gitkeep)
├── assets/
│   └── placeholders/      ← empty (+ .gitkeep); category images added in Story 2.1
└── docs/                  ← empty (+ .gitkeep); privacy policy added in Story 5.4
```

Files NOT created in Story 1.1 (to avoid scope creep):
- `tailwind.config.js`, `metro.config.js`, `nativewind-env.d.ts` — Story 1.2
- `google-services.json`, `GoogleService-Info.plist`, `lib/firebase.ts` — Story 1.3
- `lib/queryClient.ts`, `lib/queryKeys.ts` — Story 1.4
- `eas.json`, `.github/workflows/ci.yml` — Story 1.5

### Dependency Versions (as of 2026-05-27)

| Package | Version | Notes |
|---------|---------|-------|
| Expo SDK | 56.0.5 | Use `--template default@sdk-56` |
| expo-dev-client | via `npx expo install` | Resolves to SDK-compatible version |
| @expo-google-fonts/inter | 0.4.2 | `npm install`, not `npx expo install` |
| NativeWind | 4.1.23 | Story 1.2 — use this version, not latest v4 |
| @tanstack/react-query | 5.x | Story 1.4 — v5 API, not v4 |
| @react-native-firebase/app | 24.0.0 | Story 1.3 — TypeScript types changed from v23 |
| react-native-google-mobile-ads | 16.3.1 | Story 1.4 |

### Project Structure Notes

- Architecture file uses `components/FilterChips.tsx`, but epics use `components/CategoryChip.tsx` + `components/ChipsRow.tsx` — follow the epics (they are more granular). [Source: epics.md#Story 2.3]
- Architecture file mentions `components/ErrorState.tsx` and `components/EmptyState.tsx` separately; epics use a single `EmptyState` with a `variant` prop. Follow the epics. [Source: epics.md#Story 2.4]
- Architecture mentions `components/TicketWebView.tsx` but epics use `components/WebViewModal.tsx`. Follow the epics. [Source: epics.md#Story 3.2]

### References

- [Source: epics.md#Story 1.1] — User story, acceptance criteria
- [Source: architecture.md#Selected Starter: create-expo-app] — Scaffold command, SDK, Expo Router
- [Source: architecture.md#Complete Project Directory Structure] — Full directory layout
- [Source: architecture.md#Exports: named exports only] — Default exports for screens only
- [Source: architecture.md#Naming Patterns] — File naming conventions
- [Source: architecture.md#Coherence Validation] — Dev build requirement (Expo Go incompatible with firebase)
- [Source: architecture.md#Authentication & Security] — API keys in Secret Manager only
- [Source: AR-1, AR-9 in epics.md] — Init command, EAS Secrets

## Dev Agent Record

### Agent Model Used

claude-sonnet-4-6

### Debug Log References

- SDK 56 template uses `src/app/` convention — project uses `app/` at root per architecture spec. tsconfig `@/*` path alias updated to point to `./` (not `./src/`).
- `create-expo-app` cannot scaffold into a non-empty git directory; scaffolded into `expo-temp` sibling then merged into project root.
- SDK 56 template omits `babel.config.js` (new Metro SWC transformer). Will be added in Story 1.2 when NativeWind requires it.
- iOS build not verifiable on Windows; Android bundle export (`npx expo export --platform android`) confirmed 1505 modules bundle successfully with zero errors.
- ESLint auto-configured by `npx expo lint` (first run); `eslint.config.js` + `eslint-config-expo@~56.0.4` added to devDependencies.

### Completion Notes List

- All 7 ACs satisfied. Expo SDK 56.0.5, React Native 0.85.3, React 19.2.3, expo-dev-client installed.
- `app.config.ts` created from `app.json` with correct bundleIdentifier/package names per architecture.
- `tsconfig.json` strict mode confirmed; `npx tsc --noEmit` passes with zero errors.
- Directory structure matches architecture spec exactly; all empty dirs tracked with `.gitkeep`.
- Placeholder screens match exact shape in Dev Notes; named exports rule enforced (default exports only on screen files).
- `@expo-google-fonts/inter@0.4.2` installed; font NOT loaded (Story 1.2 scope).
- `.gitignore` extended with `.env`, `google-services.json`, `GoogleService-Info.plist`.
- `.env.example` documents all 5 required env var names.

### File List

app/_layout.tsx
app/index.tsx
app/event/[id].tsx
app.config.ts
package.json
package-lock.json
tsconfig.json
eslint.config.js
.gitignore
.env.example
assets/expo.icon/Assets/expo-symbol 2.svg
assets/expo.icon/Assets/grid.png
assets/expo.icon/icon.json
assets/images/android-icon-background.png
assets/images/android-icon-foreground.png
assets/images/android-icon-monochrome.png
assets/images/expo-badge-white.png
assets/images/expo-badge.png
assets/images/expo-logo.png
assets/images/favicon.png
assets/images/icon.png
assets/images/logo-glow.png
assets/images/react-logo.png
assets/images/react-logo@2x.png
assets/images/react-logo@3x.png
assets/images/splash-icon.png
assets/images/tabIcons/
assets/images/tutorial-web.png
assets/placeholders/.gitkeep
components/.gitkeep
constants/.gitkeep
docs/.gitkeep
hooks/.gitkeep
lib/.gitkeep
scripts/reset-project.js
types/.gitkeep

## Change Log

- 2026-05-27: Story 1.1 implemented — Expo SDK 56 scaffold, app.config.ts, TypeScript strict mode, directory structure, placeholder screens, Inter font installed, .gitignore + .env.example
- 2026-05-27: Post-review fixes — ios.icon corrected to PNG path; scripts/reset-project.js removed (src/app conflict); @expo/ui removed as direct dep; @expo-google-fonts/inter version changed from ^0.4.2 to ~0.4.2; Note: Story 1.2 must explicitly wire reactCompiler into babel.config.js or it silently stops running when babel.config.js is added
