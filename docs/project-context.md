---
project_name: 'event-board-za'
user_name: 'Voice.mijalkovic'
date: '2026-05-27'
sections_completed: ['technology_stack', 'language_rules', 'framework_rules']
---

# Project Context for AI Agents

_Critical rules and patterns for implementing code in this project. Focuses on unobvious details agents might otherwise miss._

---

## Technology Stack & Versions

| Layer | Package | Version |
|---|---|---|
| Runtime | react-native | 0.85.3 |
| Framework | expo | ~56.0.5 |
| Language | typescript | ~6.0.3 |
| UI / Routing | expo-router | ~56.2.7 |
| Styling | nativewind | 4.1.23 ← Story 1.2 |
| Backend SDK | @react-native-firebase/app | 24.0.0 ← Story 1.3 |
| Backend SDK | @react-native-firebase/firestore | 24.0.0 ← Story 1.3 |
| Server state | @tanstack/react-query | v5 ← Story 1.4 |
| Ads | react-native-google-mobile-ads | 16.3.1 ← Story 1.4 |
| Images | expo-image | ~56.0.9 |
| Fonts | @expo-google-fonts/inter | ~0.4.2 |
| Dev builds | expo-dev-client | ~56.0.16 |

**Critical version constraints:**
- NativeWind must be exactly `4.1.23` — do not install latest v4; minor versions have breaking Metro config changes
- `@react-native-firebase` v24 changed TypeScript types from v23 — always use v24+ types
- TanStack Query is v5 — v4 API is incompatible (no `onSuccess` callback, `isLoading` split into `isPending`/`isFetching`)
- Expo Go cannot be used — `@react-native-firebase` requires native modules; always use `npx expo run:ios` / `npx expo run:android`

---

## Language-Specific Rules

### TypeScript
- `strict: true` is set in `tsconfig.json` — no `any`, no implicit returns, no unused vars
- Path alias `@/*` maps to project root (`./*`) — use `@/components/Foo`, `@/hooks/useBar`, etc.
  - ⚠️ Metro does not honour `tsconfig` paths natively — `metro.config.js` must wire up the alias (Story 1.2); until then, use relative imports
- No enums — use `as const` objects: `const CATEGORIES = { MUSIC: 'Music' } as const`
- True constants: `SCREAMING_SNAKE_CASE` — `CATEGORY_VALUES`, `AD_INTERVAL`
- Data model types: plain PascalCase — `Event`, `Category`; type unions: `CategoryFilter`, `FeedStatus`

### Exports
- **Named exports everywhere** — `export function EventCard(...)`, `export const useEvents = ...`
- **Exception: Expo Router screen files only** (`app/*.tsx`) require `export default`
- No barrel `index.ts` re-exports except `types/index.ts`

### Null vs Undefined
- Absent optional fields are always `null` — never `undefined`, never omitted
- Applies to both Firestore documents and TypeScript interfaces
- Rationale: consistent document shape; prevents undefined vs missing key bugs at runtime

---

## Framework-Specific Rules

### Expo Router
- Screens live in `app/` at project root — not `src/app/`
- Route files: `app/index.tsx` (feed), `app/event/[id].tsx` (detail), `app/_layout.tsx` (root)
- `router.push()` / `router.back()` only called inside screen files — components receive callback props for navigation
- `app/_layout.tsx` is the only place for global providers: QueryClient, Firebase init, AdMob init

### NativeWind (Story 1.2+)
- `className` prop only — never `StyleSheet.create()` or `style={{}}` in app components
- Exception: dynamic styles that cannot be expressed as static class names (document with inline comment)
- All component paths must be in `tailwind.config.js` `content` array or classes are purged at build time
- When adding `babel.config.js` for NativeWind, explicitly include `babel-preset-expo` with `reactCompiler: true` — otherwise the React Compiler silently stops running

### TanStack Query (Story 1.4+)
- All query keys use the `eventKeys` factory in `lib/queryKeys.ts` — no ad-hoc string arrays in components:
  ```typescript
  export const eventKeys = {
    all: ['events'] as const,
    list: (category: Category | null) => [...eventKeys.all, 'list', category] as const,
    detail: (id: string) => [...eventKeys.all, 'detail', id] as const,
  };
  ```
- QueryClient config: `staleTime: 5 * 60 * 1000`, `retry: 3` (exponential backoff built-in)
- v5 API: use `isPending` (no cached data) not `isLoading`; no `onSuccess` callback — use `useEffect` on data

### State Management
- UI state (category filter): `useState` in `app/index.tsx`, passed as prop — not Context, not Zustand
- Server state: TanStack Query only
- No global store of any kind in v1

### React Native / Expo Image
- Use `expo-image` (not RN `<Image>`) for all event card images — has built-in memory + disk cache
- Always provide `placeholder` prop using category placeholder map — never a blank card
- Feed loading state: 3–5 `<SkeletonCard>` components — never a spinner

### Error Handling
- All async errors flow through TanStack Query `isError` — no `try/catch` in components
- Components render `<ErrorState>` when `isError` is true; `<ErrorState>` includes a retry button calling `refetch()`
- Ad load failures: silent — no UI change, no logging
