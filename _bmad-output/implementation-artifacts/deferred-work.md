# Deferred Work

## Deferred from: code review of 1-4-root-layout-providers-sdk-initialisation (2026-06-01)

- AdMob `MobileAds().initialize()` called before user consent on GDPR/POPIA devices [app/_layout.tsx:34] — consent flow belongs to Story 5.4 POPIA compliance
- `queryClient` `retry: 3` default retries permanent Firestore errors (permission denied, not-found) — add per-query `retry: false` or `retry: 0` for known-permanent errors in Stories 2.5, 3.1 [lib/queryClient.ts:7]

## Deferred from: code review of 1-3-firebase-project-firestore-schema-seed-data (2026-06-01)

- Firestore batch not chunked — fails silently above 500 ops [scripts/seed-firestore.js:seed()] — safe now at 25 events; add chunking if seed script is reused at scale
- `future()` seed dates are relative to script-run time — near-term events (10–17 days out) will expire from the feed naturally [scripts/seed-firestore.js:future()] — expected for seed data
- `normaliseEvent` return type is `null` literal, not `NormalisedEvent | null` [functions/src/lib/normaliseEvent.ts:3] — full type belongs in Story 4.2
- `.gitignore` `scripts/service-account.json` entry is case-exact — theoretical staging risk on case-insensitive filesystems (macOS/Windows) [.gitignore]

## Deferred from: code review of 1-2-configure-nativewind-v4-design-tokens (2026-06-03)

- `app/index.tsx` uses `style={{}}` with hardcoded hex values instead of `className` — stub screen, Story 2.6 will replace entirely
- `event.image` / `event.title` field names don't match canonical `Event.imageUrl` / `Event.name` — stub screen field mismatch, Story 2.6
- Local `type Event`, `CATEGORY_META`, and hardcoded font families in `app/index.tsx` — stub screen divergence, Story 2.6
- AC8 visual on-device confirmation unverifiable — no device available; bundle compiles clean; developer must verify on first native build
- `event.going` and `event.badge` absent from canonical `Event` type — stub fields to evaluate in Story 2.6 feed design
- Static stub event dates bypass past-event filtering — stub data only; Story 2.6 uses real Firestore data

## Deferred from: code review of 1-2-configure-nativewind-v4-design-tokens (2026-05-31)

- `preventAutoHideAsync()` at module scope with no `.catch()` [app/_layout.tsx:13] — standard Expo boilerplate pattern; risk is negligible in practice
- `Event.date` typed as plain `string` — no ISO 8601 enforcement at type level [types/event.ts:8] — enforcement belongs in Story 4.2 normaliseEvent
- `Event.time` format undefined — `"19:00"` vs `"8PM"` vs full ISO not specified [types/event.ts:9] — format normalisation belongs in Story 4.2 normaliseEvent
- `CATEGORY_PLACEHOLDERS[unknown_category]` returns `undefined` at runtime for categories not in `CATEGORY_VALUES` [constants/categories.ts:17] — Story 2.1 CategoryPlaceholder component should handle this with a fallback
- Gradient colors all near-black — no minimum contrast ratio enforced for emoji/text overlay [constants/categories.ts:20-27] — Story 2.1 design pass
- `price: string | null` type allows `""` despite comment contract [types/event.ts:16] — empty string enforcement belongs in Story 4.2 normaliseEvent
