# Changelog

## 1.1.1

- Give the native browser action popup an intrinsic document size so it opens at 560 × 520 instead of collapsing to a narrow strip. The standalone preview remains responsive.

## 1.1.0

- Simplify the popup with neutral folder cards, compact bookmark rows, and a quieter navigation bar.
- Remove folder and section counts from the browse view.
- Load website icons from the local Chrome / Edge favicon cache, then the website origin, with a local fallback on failure or timeout.
- Detect Chromium's generic cache image so uncached bookmarks can try their website icon.
- Fix sorted views updating after bookmark edits and folder changes, and improve search and keyboard interactions.
- Improve narrow-screen settings and dialog accessibility.
- Add an isolated interactive preview, icon regression tests, and working lint checks.

Chrome / Edge now request the `favicon` permission for local icon access. No third-party favicon aggregator is used.
