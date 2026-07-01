# Mobile Smoke Tests

Playwright-driven checks that block the common iOS/Android launch bugs.

## What it covers
- **Public routes load** (`/`, `/auth`, `/choose-role`, `/privacy`, `/terms`) with no runtime errors, empty `#root`, or bad HTTP status.
- **No horizontal overflow** — `documentElement.scrollWidth <= innerWidth` on every route (catches rogue `w-screen`, `min-w-*`, or fixed-width children).
- **Input glitches** on `/auth`: every `input/select/textarea` has `font-size >= 16px` (prevents iOS zoom-on-focus) and `height >= 32px` (touch target).
- **Viewport & meta**: `<meta name="viewport">` includes `width=device-width` + `initial-scale=1`; `theme-color` is a valid hex; favicon and apple-touch-icon resolve.
- **Routing**: `history.pushState` does not full-reload (SPA is intact); unknown routes render the 404 page without crashing.

## Devices
- iPhone 14 (iOS Safari viewport, Chromium engine)
- Pixel 7 (Android Chrome)
- iPhone SE (small-screen edge case)

> The Chromium engine is used for all three form factors so the suite runs without extra browser downloads. WebKit-specific engine bugs aren't covered here — for those, run `npx playwright install webkit` locally and add a WebKit project.

## Run
Dev server must be running at `http://localhost:8080` (or set `BASE_URL`).

```bash
bun run test:mobile              # all devices
bun run test:mobile:ios          # iPhone 14 only
bun run test:mobile:android      # Pixel 7 only
bun run test:mobile:report       # open the HTML report
```

## CI
```bash
BASE_URL=https://your-preview.lovable.app bun run test:mobile
```
Unset `PW_CHROMIUM_EXECUTABLE_PATH` in CI to use Playwright's bundled Chromium.
