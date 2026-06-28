# Story 2.1: CategoryPlaceholder Component

Status: done

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As a user,
I want events without images to show a visually designed category placeholder,
so that the feed always looks intentional and polished, never broken.

## Acceptance Criteria

1. **Given** an event with `imageUrl: null`, **when** the feed renders that event's card, **then** a full-bleed `LinearGradient` fills the card area using the category-specific gradient (Music: `#1a0a1e→#3d1459`; Markets: `#1a1200→#4a3000`; Food & Drink: `#1a0800→#4a1a00`; Art & Culture: `#001a1a→#004040`; Sport: `#001a00→#003300`; Comedy: `#1a1500→#3d3000`; Nightlife: `#0d0020→#200040`; Family: `#001a0d→#003320`).
2. A centred category emoji is rendered over the gradient at **32px**.
3. The component is exported as a **named export** `CategoryPlaceholder` from `components/CategoryPlaceholder.tsx`, accepting a single `category: Category` prop.
4. All 8 variants are visually verified on device — none resembles a broken image or grey fallback.
5. `accessible={false}` is set on the component root — it is decorative; the accessible label is carried by the parent `Pressable` (`EventCard`, Story 2.2).

## Tasks / Subtasks

- [x] Task 1: Create `components/CategoryPlaceholder.tsx` (AC: #1, #2, #3, #5)
  - [x] Add `export function CategoryPlaceholder({ category }: { category: Category }) { ... }` — **named export**, not default
  - [x] Import the `Category` type from `@/types` and the `CATEGORY_PLACEHOLDERS` map from `@/constants/categories` — **do not redefine gradients or the emoji map** (they already exist)
  - [x] Look up `const { colors, emoji } = CATEGORY_PLACEHOLDERS[category]` and pass `colors` to `LinearGradient` from `expo-linear-gradient` (already installed, `~56.0.4`)
  - [x] Render the gradient full-bleed (fills its parent — `EventCard` supplies the dimensions) with the emoji centred over it at 32px
  - [x] Set `accessible={false}` on the gradient root
- [x] Task 2: Verify gradient direction matches the design (AC: #1)
  - [x] Default `LinearGradient` direction (top→bottom) is acceptable; the AC and `CATEGORY_PLACEHOLDERS` define a 2-stop `[dark, lighter]` pair. Do not invert the stop order.
- [x] Task 3: Co-located render test `components/CategoryPlaceholder.test.tsx` (AC: #1, #2, #3, #5)
  - [x] Renders without crashing for a representative category
  - [x] Renders the correct emoji for the given category (e.g. `Music` → 🎵)
  - [x] Passes the correct `colors` pair to `LinearGradient` for that category
  - [x] Root has `accessible={false}`
  - [x] Run `npm test` — must pass (this is the project's first component test; Jest + RNTL are already configured)
- [ ] Task 4: On-device visual verification of all 8 variants (AC: #4) — **OUTSTANDING (manual)**
  - [ ] Temporarily render all 8 via `npx expo run:ios` / `run:android` (Expo Go will NOT work — native Firebase module), confirm each looks intentional, then remove the scratch usage
  - Note: cannot be performed in this environment (no iOS/Android simulator). All 8 variants are verified to render with the correct colours + emoji via the automated test; the subjective "looks intentional" eyeball remains for review on a device.

## Dev Notes

### Reuse — do NOT reinvent (critical)

- **Gradient + emoji config already exists.** `constants/categories.ts` exports:
  ```ts
  export const CATEGORY_PLACEHOLDERS: Record<CategoryKey, { colors: [string, string]; emoji: string }> = {
    'Music':        { colors: ['#1a0a1e', '#3d1459'], emoji: '🎵' },
    'Markets':      { colors: ['#1a1200', '#4a3000'], emoji: '🛍️' },
    'Food & Drink': { colors: ['#1a0800', '#4a1a00'], emoji: '🍽️' },
    'Art & Culture':{ colors: ['#001a1a', '#004040'], emoji: '🎨' },
    'Sport':        { colors: ['#001a00', '#003300'], emoji: '⚽' },
    'Comedy':       { colors: ['#1a1500', '#3d3000'], emoji: '😂' },
    'Family':       { colors: ['#001a0d', '#003320'], emoji: '👨‍👩‍👧' },
    'Nightlife':    { colors: ['#0d0020', '#200040'], emoji: '🌃' },
  };
  ```
  Consume this map directly. The colour values here are the single source of truth and already match the AC. Do not hardcode hex values or an emoji map inside the component.
- **`Category` type already exists** — `export type Category = typeof CATEGORY_VALUES[number]` in `types/event.ts`, re-exported from `types/index.ts`. Import via `import type { Category } from '@/types'`.
- **`expo-linear-gradient` is already a dependency** (`~56.0.4`) — no install needed. Import: `import { LinearGradient } from 'expo-linear-gradient'`.
- ⚠️ The hardcoded `CATEGORY_META` emoji map and inline-styled `EventCard` inside `app/index.tsx` are a **throwaway prototype** from Story 1.4. Do **not** copy its patterns, and do not import from it. Note: its `Family` emoji (🎡) differs from `CATEGORY_PLACEHOLDERS` (👨‍👩‍👧) — use the `CATEGORY_PLACEHOLDERS` value, which is canonical.

### Component implementation pattern

- This is the **first real component** in `components/`. Establish the convention the rest of Epic 2 will follow.
- Suggested shape:
  ```tsx
  import { Text } from 'react-native';
  import { LinearGradient } from 'expo-linear-gradient';
  import type { Category } from '@/types';
  import { CATEGORY_PLACEHOLDERS } from '@/constants/categories';

  export function CategoryPlaceholder({ category }: { category: Category }) {
    const { colors, emoji } = CATEGORY_PLACEHOLDERS[category];
    return (
      <LinearGradient
        colors={colors}
        accessible={false}
        className="absolute inset-0 items-center justify-center"
      >
        <Text className="text-[32px]" accessible={false}>{emoji}</Text>
      </LinearGradient>
    );
  }
  ```
- **Full-bleed:** the placeholder must fill its parent. `EventCard` (Story 2.2) renders it as the full-bleed background in place of `expo-image`. Use `absolute inset-0` so it fills a positioned parent the same way `expo-image` does in the prototype (`position:absolute, inset 0`). If you build a temporary standalone harness for visual check (Task 4), wrap it in a parent `View` with explicit height (~200px) and `overflow-hidden`.

### NativeWind / styling rules (project-context.md + architecture)

- **`className` only — never `StyleSheet.create()` or `style={{}}`** in app components. Custom Tailwind colours (`background`, `surface`, `accent`, etc.) and font families are defined in `tailwind.config.js`. The `components/**` glob is already in the tailwind `content` array, so classes won't be purged.
- **Documented exception:** `LinearGradient`'s `colors` is a *dynamic prop* (varies by category) and cannot be a static class name — passing it as a prop is correct and expected, not a violation.
- If `className` does not apply to `LinearGradient` in this RN/NativeWind setup (it is a third-party native component), fall back to the documented style exception **only** for layout/fill (`StyleSheet.absoluteFillObject` + centering) — and add an inline comment explaining why. Verify which path works during on-device check; prefer `className`.
- Emoji size: `text-[32px]` (arbitrary value) satisfies the 32px requirement via className. Avoid inline `style={{ fontSize: 32 }}` unless className proves unreliable on `Text`.

### Code conventions (project-context.md)

- **Named exports everywhere.** Only Expo Router screen files (`app/*.tsx`) use `export default`. This component uses a named export.
- Path alias `@/*` → project root. Use `@/types`, `@/constants/categories`.
- TypeScript `strict: true` — no `any`, no unused vars. `CATEGORY_PLACEHOLDERS[category]` is fully typed; no casts needed.
- `colors: [string, string]` is assignable to `expo-linear-gradient`'s `colors` prop (it accepts a tuple/array of ≥2 colour values). No type wrangling expected.

### Testing standards (architecture §Test File Placement)

- **Co-located** tests: `CategoryPlaceholder.test.tsx` next to the component. (Matches architecture: `EventCard.test.tsx` lives next to `EventCard.tsx`.)
- Stack: Jest (`jest-expo` preset) + `@testing-library/react-native` (`render`, query helpers). Both already in `devDependencies`; `jest.config.js` is configured.
- Run with `npm test` (script: `jest --passWithNoTests`).
- This is a presentational component — assert rendered emoji, the `colors` prop forwarded to `LinearGradient`, and `accessible={false}`. The "8 variants verified on device" AC is covered by manual on-device check (Task 4), not the unit test.

### Project Structure Notes

- New file: `components/CategoryPlaceholder.tsx` (component) + `components/CategoryPlaceholder.test.tsx` (co-located test).
- Test tooling also required `jest-env.d.ts` (new), `tsconfig.json` (include), and `package.json` (`@types/jest`, Jest version alignment) — see File List.
- `app/index.tsx` is **out of scope** for this story — it remains the Story 1.4 prototype until Story 2.6 rebuilds the feed screen. Do not modify it.
- Code review (2026-06-16) added `FALLBACK_PLACEHOLDER` to `constants/categories.ts` (unmapped-category guard) and a `components/` lint gate to `.github/workflows/ci.yml`.

### References

- [Source: _bmad-output/planning-artifacts/epics.md#Story 2.1: CategoryPlaceholder Component]
- [Source: _bmad-output/planning-artifacts/ux-design-specification.md#CategoryPlaceholder] (UX-DR3: 8 variants, full-bleed LinearGradient + centred emoji, designed assets not CSS fallbacks)
- [Source: _bmad-output/planning-artifacts/architecture.md#Component Structure] (components/ layout, co-located test placement, NativeWind className-only rule)
- [Source: docs/project-context.md#Framework-Specific Rules] (NativeWind className only; named exports; `@/*` alias; expo-linear-gradient already installed)
- [Source: constants/categories.ts] — `CATEGORY_PLACEHOLDERS` (canonical colours + emoji), `CATEGORY_VALUES`
- [Source: types/event.ts] — `Category` type
- [Source: package.json] — `expo-linear-gradient ~56.0.4`, jest + @testing-library/react-native present

## Dev Agent Record

### Agent Model Used

claude-opus-4-8 (Claude Opus 4.8)

### Debug Log References

- `npx jest components/CategoryPlaceholder.test.tsx` → RED (module not found) before implementation, then GREEN: 4/4 passing.
- `npx tsc --noEmit` → clean (no errors); `className` on `LinearGradient` and the `[string, string]` colours tuple both typecheck under `strict`.
- `npx jest` (full suite) → 1 suite, 4 tests passing, no regressions.
- `npx eslint components/CategoryPlaceholder.tsx components/CategoryPlaceholder.test.tsx` → clean.

### Completion Notes List

- Implemented `CategoryPlaceholder` as a named export consuming the existing `CATEGORY_PLACEHOLDERS` map (colours + emoji) and `Category` type — no gradient/emoji values duplicated in the component.
- Full-bleed via `className="absolute inset-0 items-center justify-center"`; emoji centred at 32px via `text-[32px]`. `accessible={false}` on both the gradient root and the emoji `Text` (decorative; label carried by parent `Pressable` per AC #5).
- Confirmed NativeWind's `className` flows to `expo-linear-gradient` (babel `jsxImportSource: 'nativewind'`), so no `StyleSheet`/inline-style exception was needed — the component is fully className-styled per project rules. The `colors` prop is the only dynamic value and is passed as a prop by design (documented in the story as expected, not a violation).
- First component test in the project; established the co-located RNTL pattern. jest-expo preserves `LinearGradient` props, so `UNSAFE_getByType(LinearGradient)` asserts `colors` and `accessible`. Variant test loops all 8 `CATEGORY_VALUES`.
- **AC #4 (on-device visual QA) outstanding:** no iOS/Android simulator in this environment. All 8 variants verified to render with correct colours + emoji programmatically; the subjective visual check (Task 4) should be done on a device during review.
- Out of scope / untouched: `app/index.tsx` (Story 1.4 throwaway prototype) — it carries a **pre-existing** lint error (`react/no-unescaped-entities` at `app/index.tsx:245`, last modified in commit `d6e2da7`, Story 1.2) unrelated to this story. Not fixed here to respect story scope.

### File List

- `components/CategoryPlaceholder.tsx` (new)
- `components/CategoryPlaceholder.test.tsx` (new)
- `jest-env.d.ts` (new) — `/// <reference types="jest" />` so `tsc --noEmit` sees Jest globals project-wide
- `tsconfig.json` (modified) — added `jest-env.d.ts` to `include`
- `package.json` (modified) — added `@types/jest`; aligned `jest` `^30.4.2` → `~29.7.0` with `jest-expo@56` / `@react-native/jest-preset`
- `constants/categories.ts` (modified, code review) — added `FALLBACK_PLACEHOLDER` for unmapped categories
- `.github/workflows/ci.yml` (modified, code review) — added lint gate for `components/`

## Change Log

| Date | Change |
|------|--------|
| 2026-06-16 | Implemented Story 2.1 `CategoryPlaceholder` component + co-located test. Status → review. AC #4 on-device visual QA outstanding (no simulator in env). |

## Review Findings

_Code review 2026-06-16 (Blind Hunter + Edge Case Hunter + Acceptance Auditor). 1 decision-needed, 3 patch, 2 deferred, 9 dismissed as noise._

- [x] [Review][Patch] (resolved from decision) Guard `CATEGORY_PLACEHOLDERS[category]` lookup with a fallback — destructured with no guard; an unknown/null `category` from external feeds throws `TypeError` and crashes the parent card. The Story 1.2 review explicitly deferred this fallback **to Story 2.1**. **Decision: guard at this leaf (option 1).** Approach: add exported `FALLBACK_PLACEHOLDER` (neutral gradient + generic emoji) to `constants/categories.ts`, use `CATEGORY_PLACEHOLDERS[category] ?? FALLBACK_PLACEHOLDER`, add an unknown-category test. [components/CategoryPlaceholder.tsx:14]
- [x] [Review][Patch] Story File List & Project Structure Notes under-report touched files — they claim "no config files / no new dependencies," but `jest-env.d.ts` (new), `tsconfig.json` (modified), and `package.json` (modified: +`@types/jest`, jest `^30`→`~29.7`) were also changed. Update File List + Notes. [2-1-categoryplaceholder-component.md]
- [x] [Review][Patch] Redundant `toBeTruthy()` on `getByText(...)` — the query already throws on miss, so the matcher asserts nothing. [components/CategoryPlaceholder.test.tsx:11,29]
- [x] [Review][Patch] CI lint gate for `components/` not added — explicitly deferred to Story 2.1 (deferred-work.md); precondition (real source files in `components/`) is now met. [.github/workflows/ci.yml]
- [x] [Review][Defer] AC #4 on-device visual verification of all 8 variants (incl. the gradient/emoji contrast "design pass" deferred to 2.1) — no iOS/Android simulator in this environment; manual on device. [components/CategoryPlaceholder.tsx] — deferred, manual QA
- [x] [Review][Defer] Unit tests don't assert NativeWind `className` styling actually applies (full-bleed fill, 32px) — `className`-only project rule precludes a `style` fallback; correctness is covered by the AC #4 on-device visual check. [components/CategoryPlaceholder.test.tsx] — deferred, covered by AC #4
