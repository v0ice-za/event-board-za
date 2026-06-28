# Store Metadata — Event Board ZA

Submission-ready listing copy + the release runbook for the App Store and Google
Play. Character counts are annotated `(used/limit)`; keep within limits when
pasting into App Store Connect / Play Console.

> **URLs:** the privacy / support / marketing URLs below are marked **TODO** until
> the policy + a support page are hosted (see "Hosting" and Story 5.4). Set the
> real values here and in the `PRIVACY_POLICY_URL` EAS Secret before submission.

---

## Apple App Store

| Field | Value | Count |
|-------|-------|-------|
| **App name** | `Event Board ZA` | 14/30 |
| **Subtitle** | `Joburg events, all in one feed` | 30/30 |
| **Promotional text** | `Discover what's on in Johannesburg — markets, live music, comedy, nightlife and more. Free, no account, one simple feed.` | 120/170 |
| **Keywords** | `johannesburg,joburg,events,things to do,markets,concerts,nightlife,comedy,festivals,tickets` | 91/100 |
| **Support URL** | `TODO — e.g. https://<host>/support` | — |
| **Marketing URL** | `TODO — e.g. https://<host>` | — |
| **Privacy Policy URL** | `TODO — hosted docs/privacy-policy.md` | — |
| **Primary category** | Entertainment | — |
| **Secondary category** | Lifestyle | — |
| **Age rating** | 17+ (frequent/intense — set per AdMob content; app itself is not child-directed) | — |

### Description (App Store) — (≈980/4000)

```
Event Board ZA is the simplest way to discover what's happening in Johannesburg.

Open the app and scroll one clean feed of upcoming events across the city — no
account, no sign-up, no clutter. Just tap an event to see the details and grab
tickets.

WHAT YOU GET
• One scrollable feed of upcoming Joburg events, sorted by date
• Eight categories: Music, Markets, Food & Drink, Art & Culture, Sport, Comedy,
  Family and Nightlife
• Filter the feed to a single category with one tap
• Full event details: date, time, venue, price and description
• Tap "Get tickets" to open the booking page right inside the app
• Works smoothly even on a patchy connection — your last feed stays visible
  offline

FREE & SIMPLE
Event Board ZA is free and supported by ads. There are no accounts, no social
feeds, no notifications and no in-app purchases — just events.

Built in Johannesburg, for Johannesburg.

Questions or feedback? Email voji95@gmail.com
```

---

## Google Play

| Field | Value | Count |
|-------|-------|-------|
| **App name** | `Event Board ZA` | 14/30 |
| **Short description** | `Discover Johannesburg events - markets, music, nightlife and more, in one feed.` | 79/80 |
| **Full description** | see below | ≈1010/4000 |
| **Category** | Events | — |
| **Contact email** | `voji95@gmail.com` | — |
| **Privacy Policy URL** | `TODO — hosted docs/privacy-policy.md` | — |
| **Content rating** | Complete the Play content-rating questionnaire (ad-supported, not child-directed) | — |

### Full description (Google Play) — (≈1010/4000)

```
Event Board ZA is the simplest way to discover what's happening in Johannesburg.

Open the app and scroll one clean feed of upcoming events across the city — no
account, no sign-up, no clutter. Tap an event to see the details and grab tickets.

WHAT YOU GET
• One scrollable feed of upcoming Joburg events, sorted by date
• Eight categories: Music, Markets, Food & Drink, Art & Culture, Sport, Comedy,
  Family and Nightlife
• Filter the feed to a single category with one tap
• Full event details: date, time, venue, price and description
• Tap "Get tickets" to open the booking page right inside the app
• Works smoothly even on a patchy connection — your last feed stays visible offline

FREE & SIMPLE
Event Board ZA is free and supported by ads. No accounts, no social feeds, no
notifications, no in-app purchases — just events.

Built in Johannesburg, for Johannesburg.

Questions or feedback? Email voji95@gmail.com
```

---

## Hosting (required before submission)

Both stores require a public **Privacy Policy URL**, and the App Store requires a
**Support URL**. Host `docs/privacy-policy.md` (e.g. GitHub Pages from `docs/`, or
any static host) and record the URLs above. Then set the in-app + build value:

```bash
eas secret:create --scope project --name PRIVACY_POLICY_URL --value "https://<host>/privacy-policy"
```

(Until set, `extra.privacyPolicyUrl` is empty and the in-app "Privacy Policy"
link is hidden — no dead link ships.)

---

## EAS Secrets required for a production build

Real credentials never live in the repo. Create these before
`eas build --profile production` (Cloud Functions key is already in use for sync):

| Secret | Used by | Notes |
|--------|---------|-------|
| `ADMOB_ANDROID_APP_ID` | `app.config.ts` AdMob plugin | real AdMob Android **app** ID |
| `ADMOB_IOS_APP_ID` | `app.config.ts` AdMob plugin | real AdMob iOS **app** ID |
| `ADMOB_BANNER_UNIT_ID` | `AdBannerUnit.tsx` (via `extra`) | real banner **unit** ID; **required** — empty in prod → no ads |
| `ADMOB_INTERSTITIAL_UNIT_ID` | `app/_layout.tsx` (via `extra`) | real interstitial **unit** ID; **required** — empty in prod → no ads |
| `PRIVACY_POLICY_URL` | `extra.privacyPolicyUrl` + listings | hosted privacy policy URL |
| `QUICKET_API_KEY` | Cloud Functions sync | already configured (Epic 4) |

```bash
eas secret:create --scope project --name ADMOB_ANDROID_APP_ID --value "ca-app-pub-XXXX~YYYY"
eas secret:create --scope project --name ADMOB_IOS_APP_ID --value "ca-app-pub-XXXX~ZZZZ"
eas secret:create --scope project --name ADMOB_BANNER_UNIT_ID --value "ca-app-pub-XXXX/BBBB"
eas secret:create --scope project --name ADMOB_INTERSTITIAL_UNIT_ID --value "ca-app-pub-XXXX/IIII"
```

> ⚠️ A production build **without** the AdMob **unit-ID** secrets compiles and runs, but
> the unit IDs are empty so **ads fail to load — no ads are shown** (the load error is
> swallowed silently; TestIds are used only in `__DEV__`, never as a production fallback).
> Set **all** AdMob secrets before submission for ads to appear. (The AdMob *App* IDs do
> fall back to Google test App IDs, but that alone does not produce ads without unit IDs.)

---

## Release runbook (manual — run by Voice on EAS)

These steps require EAS cloud + Apple/Google credentials and **cannot run in the
dev environment**. `eas.json` already defines the `production` build profile
(`autoIncrement: true`) and a `submit.production` profile (fill the account
specifics below).

1. **Pre-flight:** ensure all EAS Secrets above exist; confirm the privacy/support
   URLs are live; confirm the flattened opaque `icon.png` and `#0F0C09` splash.
2. **Build both platforms:**
   ```bash
   eas build --platform all --profile production
   ```
3. **Verify binary size ≤ 50 MB (NFR-2)** from the EAS build output and record it
   in the table below.
4. **Submit:**
   ```bash
   eas submit --platform all --profile production
   ```
   - iOS `submit.production` needs: `ascAppId` (App Store Connect app ID), Apple
     Team ID. Android needs: a Play service-account key (`serviceAccountKeyPath`)
     and the target `track` (e.g. `internal`).
5. Complete store-side items: screenshots (`docs/screenshots/`), age/content
   rating, data-safety / privacy nutrition labels (consistent with
   `docs/privacy-policy.md`), pricing (free).

### Binary size record (AC7 / NFR-2)

| Platform | Build ID | Size | ≤ 50 MB? | Date |
|----------|----------|------|----------|------|
| iOS | _TODO from EAS output_ | _TBD_ | _TBD_ | _TBD_ |
| Android | _TODO from EAS output_ | _TBD_ | _TBD_ | _TBD_ |
