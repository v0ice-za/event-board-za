# Store Screenshots — capture checklist

Store screenshots must be captured from the **running app** on a real device or
simulator — they cannot be generated in the dev/CI environment. This folder holds
the final PNGs; this checklist defines exactly what to capture.

## Requirements

- **iPhone (App Store):** ≥ 3 shots at **6.7"** = **1290 × 2796 px** (e.g. iPhone
  15/16 Pro Max simulator). This size also covers smaller iPhones on App Store
  Connect.
- **Android (Google Play):** ≥ 3 phone shots, portrait, **1080 × 1920 px** or
  larger (16:9 / 19.5:9). PNG or JPEG, no alpha.
- Dark UI — capture with the app's normal dark theme (`#0F0C09`).
- No status-bar clutter; use a clean status bar (full battery/signal) where possible.

## Shots to capture (same set per platform)

1. **Feed — full** — the scrollable event feed with several event cards visible.
2. **Feed — filtered** — a category chip active (e.g. "Music") showing the filtered feed.
3. **Event detail** — an event with image, date/time, venue, price, description and the "Get tickets" CTA.
4. **Ticket webview** *(optional, strong)* — the in-app ticket page open with the back pill.
5. **Empty / offline state** *(optional)* — the offline banner or an empty-state illustration.

Minimum to ship: **shots 1–3** on each platform (6 total).

## Naming convention

```
ios-6.7-01-feed.png
ios-6.7-02-feed-filtered.png
ios-6.7-03-detail.png
android-01-feed.png
android-02-feed-filtered.png
android-03-detail.png
```

## How to capture

- **iOS simulator:** run `npx expo run:ios` on the 6.7" simulator, then `Cmd+S`
  (or Device ▸ Trigger Screenshot) — saves at the exact 1290×2796.
- **Android emulator:** run `npx expo run:android`, use the emulator camera button
  or `adb exec-out screencap -p > android-01-feed.png`.
- Drop the PNGs in this folder using the names above, then upload them in App Store
  Connect / Play Console.

> Tip: seed/keep a few real upcoming events in Firestore before capturing so the
> feed and detail screens look populated and realistic.
