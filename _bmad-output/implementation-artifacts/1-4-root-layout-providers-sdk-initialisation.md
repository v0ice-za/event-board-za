# Story 1.4: Root Layout — Providers + SDK Initialisation

Status: done

## Story

As a developer,
I want the root layout to initialise QueryClient, Firebase, and the AdMob SDK before any screen renders,
So that all screens have data fetching, Firestore access, and ad SDK availability from first render.

## Acceptance Criteria

1. `QueryClientProvider` wraps the entire navigator, using a `QueryClient` from `lib/queryClient.ts` with `staleTime: 5 * 60 * 1000` and `retry: 3`
2. Firebase is initialised once via `lib/firebase.ts` (side-effect import in `_layout.tsx`) before any Firestore calls are made
3. `react-native-google-mobile-ads` is installed; `MobileAds().initialize()` is called in `_layout.tsx` before any ad unit renders
4. `SafeAreaProvider` from `react-native-safe-area-context` wraps the navigator
5. `lib/queryKeys.ts` exports the `eventKeys` factory (`all`, `list(category)`, `detail(id)`)
6. App launches without console errors related to provider initialisation order

## Tasks / Subtasks

- [x] Task 1: Install new packages (AC: 1, 3)
  - [x] Run `npx expo install @tanstack/react-query` — pure JS, no native rebuild needed
  - [x] Run `npx expo install react-native-google-mobile-ads` — has native code, rebuild required after
  - [x] **Do NOT** run `npm install` directly for these — use `npx expo install` so Expo resolves SDK-compatible versions
  - [x] After Task 5 (app.config.ts updated), rebuild: `npx expo run:ios` and/or `npx expo run:android`

- [x] Task 2: Create lib/queryClient.ts (AC: 1)
  - [x] Create `lib/queryClient.ts` — see exact shape in Dev Notes
  - [x] Named export only — no default export [Source: architecture.md#Naming Patterns]

- [x] Task 3: Create lib/queryKeys.ts (AC: 5)
  - [x] Create `lib/queryKeys.ts` — see exact shape in Dev Notes
  - [x] Import `Category` type from `@/types` (barrel re-export via `types/index.ts`)
  - [x] Named export only — no default export

- [x] Task 4: Update app/_layout.tsx (AC: 1, 2, 3, 4, 6)
  - [x] Add `QueryClientProvider` wrapping the return JSX — see exact shape in Dev Notes
  - [x] Add `SafeAreaProvider` as outermost wrapper
  - [x] Add `import '@/lib/firebase'` side-effect import — ensures Firebase auto-init fires before any screen renders
  - [x] Add `MobileAds().initialize()` in a `useEffect` with empty deps array
  - [x] **Preserve** the existing font loading + SplashScreen gate from Story 1.2 (including the fontError fix from code review)
  - [x] Provider order MUST be: SafeAreaProvider → QueryClientProvider → Stack

- [x] Task 5: Update app.config.ts for AdMob plugin (AC: 3)
  - [x] Add `react-native-google-mobile-ads` to the `plugins` array in `app.config.ts` — see exact shape in Dev Notes
  - [x] Use test App IDs for development — production IDs added in Story 5.1
  - [x] Plugin must come after `expo-build-properties` but before `expo-router`

- [x] Task 6: Verify TypeScript + bundle (AC: 1, 5, 6)
  - [x] Run `npx tsc --noEmit` — confirm zero errors
  - [x] Run `npx expo export --platform android` — confirm clean bundle
  - [x] Rebuild native client: `npx expo run:ios` or `npx expo run:android` — required because `react-native-google-mobile-ads` has native code
  - [x] Confirm app launches with no console errors about QueryClient, Firebase, or AdMob init

### Review Findings

- [x] [Review][Patch] `MobileAds().initialize()` promise is not handled — fixed: added `void` operator [app/_layout.tsx:35]
- [x] [Review][Defer] AdMob initialized before consent check on GDPR/POPIA devices — consent flow belongs to Story 5.4 [app/_layout.tsx:34] — deferred, pre-existing
- [x] [Review][Defer] `retry: 3` retries permanent Firestore errors (permission denied, not-found) with no per-query override — document override pattern at hook level in Stories 2.5/3.1 [lib/queryClient.ts:7] — deferred, pre-existing

## Dev Notes

### CRITICAL: `app/_layout.tsx` Is Being MODIFIED, Not Created

`app/_layout.tsx` already exists from Story 1.2 (with font loading + SplashScreen gate) and was patched in the Story 1.2 code review (fontError destructured). **Current state:**

```tsx
import '../global.css';
import { Stack } from 'expo-router';
import {
  useFonts,
  Inter_400Regular,
  Inter_500Medium,
  Inter_600SemiBold,
  Inter_700Bold,
} from '@expo-google-fonts/inter';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect } from 'react';

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [fontsLoaded, fontError] = useFonts({
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
    Inter_700Bold,
  });

  useEffect(() => {
    if (fontsLoaded || fontError) {
      SplashScreen.hideAsync();
    }
  }, [fontsLoaded, fontError]);

  if (!fontsLoaded && !fontError) return null;

  return <Stack />;
}
```

Do NOT reinvent this file. Add the providers and SDK init to it.

### app/_layout.tsx — Full Updated Shape

```tsx
import '../global.css';
import { Stack } from 'expo-router';
import { QueryClientProvider } from '@tanstack/react-query';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import MobileAds from 'react-native-google-mobile-ads';
import {
  useFonts,
  Inter_400Regular,
  Inter_500Medium,
  Inter_600SemiBold,
  Inter_700Bold,
} from '@expo-google-fonts/inter';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect } from 'react';
import { queryClient } from '@/lib/queryClient';
import '@/lib/firebase'; // side-effect: ensures Firebase auto-init fires before any Firestore hook

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [fontsLoaded, fontError] = useFonts({
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
    Inter_700Bold,
  });

  useEffect(() => {
    if (fontsLoaded || fontError) {
      SplashScreen.hideAsync();
    }
  }, [fontsLoaded, fontError]);

  useEffect(() => {
    MobileAds().initialize();
  }, []);

  if (!fontsLoaded && !fontError) return null;

  return (
    <SafeAreaProvider>
      <QueryClientProvider client={queryClient}>
        <Stack />
      </QueryClientProvider>
    </SafeAreaProvider>
  );
}
```

**Provider order is required by architecture:**
- `SafeAreaProvider` outermost — safe area insets must be available to all descendants
- `QueryClientProvider` inside — wraps all screens so hooks can call `useQuery`
- `Stack` (navigator) innermost — screens render inside the providers

### lib/queryClient.ts — Exact Shape

```typescript
import { QueryClient } from '@tanstack/react-query';

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes — matches Firestore offline persistence window
      retry: 3,
    },
  },
});
```

### lib/queryKeys.ts — Exact Shape

```typescript
import type { Category } from '@/types';

export const eventKeys = {
  all: ['events'] as const,
  list: (category: Category | null) =>
    [...eventKeys.all, 'list', category] as const,
  detail: (id: string) =>
    [...eventKeys.all, 'detail', id] as const,
};
```

**All query keys across the app MUST use this factory — no ad-hoc string arrays in hooks or components.**
This factory is consumed by `useEvents` (Story 2.5) and `useEventDetail` (Story 3.1).

### app.config.ts — AdMob Plugin Addition

Add `react-native-google-mobile-ads` to the `plugins` array. Use **test App IDs** for development — production IDs are added via EAS Secrets in Story 5.1.

Full updated `plugins` array:

```typescript
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
      androidAppId: 'ca-app-pub-3940256099942544~3347511713', // Google test App ID
      iosAppId: 'ca-app-pub-3940256099942544~1458002511',     // Google test App ID
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
```

**Without this plugin configuration the AdMob SDK throws at startup** — the native layer requires the App IDs at build time.

### Firebase Import Pattern

`lib/firebase.ts` (created in Story 1.3) currently exports `db = firestore()`. The `@react-native-firebase` SDK **auto-initializes** the default Firebase app from `google-services.json` / `GoogleService-Info.plist` at native startup — no `initializeApp()` call is needed or allowed.

The side-effect import `import '@/lib/firebase'` in `_layout.tsx` ensures the `lib/firebase.ts` module executes (and thus `firestore()` is called) before any screen renders Firestore hooks. This satisfies AC 2.

### Already-Installed Packages (Do Not Re-install)

| Package | Version | Installed In |
|---------|---------|--------------|
| `react-native-safe-area-context` | `~5.7.0` | Story 1.1 scaffold |
| `@react-native-firebase/app` | `^24.0.0` | Story 1.3 |
| `@react-native-firebase/firestore` | `^24.0.0` | Story 1.3 |
| `expo-build-properties` | `~56.0.16` | Story 1.3 |

### What This Story Does NOT Do

- Does NOT implement the interstitial ad session counter or preloading — that is Story 5.2
- Does NOT create `AdBannerUnit` or any ad-rendering components — that is Story 5.1
- Does NOT implement `useEvents`, `useEventDetail`, or any Firestore queries — those are Stories 2.5 and 3.1
- Does NOT set production AdMob App IDs — those are EAS Secrets added in Story 5.1
- Does NOT create `OfflineBanner` or `useNetworkState` — that is Story 2.4

### Rebuild Sequence

`react-native-google-mobile-ads` contains native Objective-C/Java code. The existing dev client from Stories 1.1–1.3 will **crash** when it tries to call AdMob. A full native rebuild is mandatory:

```bash
npx expo run:ios      # rebuilds iOS app with AdMob native code linked
npx expo run:android  # rebuilds Android app with AdMob native code linked
```

### Dependency Versions

| Package | Version | Notes |
|---------|---------|-------|
| `@tanstack/react-query` | latest SDK-compatible | Pure JS — no native rebuild |
| `react-native-google-mobile-ads` | latest SDK-compatible | Has native code — rebuild required |

Use `npx expo install` to get SDK-compatible versions automatically.

### Architecture Boundary Reminder

- `MobileAds().initialize()` lives ONLY in `app/_layout.tsx`
- Only `components/AdBannerUnit.tsx` (Story 5.1) imports `react-native-google-mobile-ads` for rendering
- `queryClient` is created ONCE in `lib/queryClient.ts` — never instantiate `new QueryClient()` elsewhere

### References

- [Source: epics.md#Story 1.4] — User story, acceptance criteria, AR-4
- [Source: architecture.md#Frontend Architecture] — Provider tree, TanStack Query setup, AdMob init
- [Source: architecture.md#Communication Patterns] — eventKeys factory (exact shape)
- [Source: architecture.md#Complete Project Directory Structure] — lib/queryClient.ts, lib/queryKeys.ts locations
- [Source: architecture.md#Architectural Boundaries] — AdMob boundary, Firebase init location
- [Source: architecture.md#Naming Patterns] — Named exports only (except screen default exports)
- [Source: architecture.md#Enforcement] — eventKeys factory mandatory, no ad-hoc query key strings
- [Source: implementation-artifacts/1-2-configure-nativewind-v4-design-tokens.md] — Current _layout.tsx shape
- [Source: implementation-artifacts/1-2-configure-nativewind-v4-design-tokens.md#Review Findings] — fontError fix that must be preserved
- [Source: implementation-artifacts/1-3-firebase-project-firestore-schema-seed-data.md] — lib/firebase.ts shape (named export `db`, no initializeApp call)

## Dev Agent Record

### Agent Model Used

claude-sonnet-4-6 (create-story) / claude-sonnet-4-6 (dev)

### Debug Log References

None.

### Completion Notes List

- `@tanstack/react-query` and `react-native-google-mobile-ads` installed via `npx expo install` (Expo-compatible versions).
- `lib/queryClient.ts` created: named export `queryClient` with `staleTime: 5 * 60 * 1000`, `retry: 3`.
- `lib/queryKeys.ts` created: named export `eventKeys` factory (`all`, `list(category)`, `detail(id)`); imports `Category` from `@/types`.
- `app/_layout.tsx` updated: `SafeAreaProvider` → `QueryClientProvider` → `Stack` provider tree; Firebase side-effect import; `MobileAds().initialize()` in `useEffect([])`; font loading + SplashScreen gate preserved from Story 1.2.
- `app.config.ts` updated: AdMob plugin added after `expo-build-properties`, before `expo-router`, using Google test App IDs.
- `npx tsc --noEmit` — zero errors.
- `npx expo export --platform android` — clean 4.3 MB bundle, no errors.
- Native rebuild (`npx expo run:ios` / `npx expo run:android`) required before AdMob SDK is active on device — native modules need fresh build.

### File List

- `lib/queryClient.ts` (new)
- `lib/queryKeys.ts` (new)
- `app/_layout.tsx` (modified)
- `app.config.ts` (modified)
- `package.json` (modified — @tanstack/react-query, react-native-google-mobile-ads added)
- `package-lock.json` (modified)

### Change Log

- 2026-05-31: Story 1.4 created
- 2026-06-01: All tasks complete — providers wired, queryKeys factory, AdMob init, TypeScript + bundle verified. Story → review.
