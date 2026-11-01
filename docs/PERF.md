# Performance and quality gates

Baseline: v0.3.4. Candidate: v0.4.0. No user-device latency or memory figures have been measured for this candidate.

## Repeatable browser checks

`npm ci`, `npm run build`, `npx playwright install --with-deps chromium`, `npm run test:e2e`.

The test server uses the real Worker router with an in-memory SQLite D1 adapter and synthetic credentials/data. It never reads `.dev.vars` or contacts production. Tests cover CSV corrections and approval, results, navigation/edit preservation, XLSX, logout/asset auth, and synthetic image product-price pairs. This is not a production Cloudflare runtime or the private 28-image accuracy benchmark.

## Local measurements

The browser records at most about 100 local `mis:*` performance measures. In DevTools, inspect `performance.getEntriesByType('measure').filter(x => x.name.startsWith('mis:'))`. Labels contain stage names, never file names or prices. No analytics upload occurs.

| Metric | v0.3.4 | v0.4.0 | Proposed budget |
|---|---|---|---|
| Authenticated startup, cold/warm | not measured | not measured | record p50/p95 |
| Tab switch | not measured | not measured | investigate >300 ms |
| Editing a cell, 25/500 rows | not measured | not measured | investigate >100 ms |
| OCR, simple/dense table | private Node baseline only | browser pending | no accuracy regression |
| Memory after 10 image runs | not measured | not measured | stable bounded worker count |

Record browser, CPU/RAM, network, input size, cold/warm cache and engine/model. Do not interpret fewer DOM options or passing CI as a measured speed gain. The private golden set must check missing/extra rows and product-price-unit-tier pairs before changing recognition algorithms, models or pooling.

## Implemented controls

- Vendor assets use release-versioned paths and `private, no-cache`: the browser can revalidate with ETag after authentication. HTML, API, application source, failures and unauthenticated responses remain `private, no-store`.
- One serial OCR worker is reused, terminated after 60 seconds idle, and discarded on failure/cancellation. Each existing read still sets recognition parameters explicitly. No parallel heterogeneous scheduler is added.
- Review pages render 25 rows. Completion updates row/status/warning areas without replacing the source preview. Inputs lock during OCR to avoid losing edits to a replacing result.
- Master catalog has a one-minute in-memory cache scoped to user; local catalog/rule changes force refresh.
- Draft debounce is local (2 seconds idle, 60 seconds maximum continuous editing); this does not add periodic D1 writes.

The promo-card heuristic and all existing OCR accuracy limits remain. The built-in example is local training data and cannot be saved to the team database through the UI.
