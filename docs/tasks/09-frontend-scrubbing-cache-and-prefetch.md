Status: Complete

# Task 09: Implement Scrubbing, Cache Reuse, And Early Prefetch

## Goal
Let the user scrub through historical telemetry smoothly while the app reuses loaded windows, fetches only missing ranges, and prefetches the next page before a visible stall happens.

## Requirements
- `FR4`
- `FR5`
- `FR6`
- `FR7`
- `NFR1`
- `NFR2`

## Design References
- [Telemetry Visualization High-Level Requirements](../telemetry-visualization-high-level-requirements.md)
- [Historical Telemetry Retrieval Detailed Design](../historical-telemetry-retrieval-design.md)

## Vertical Slice
The user can drag the scrubber across loaded history, the app reuses cached windows, and the next page starts loading near a cache edge.

## In Scope
- Add `LoadedWindow` tracking to the store
- Add scrub viewport state
- Reuse cached windows before HTTP fetch
- Prefetch one adjacent page per direction
- Merge overlapping pages and remove duplicates by `sampleId`

## Not In Scope
- Final Chart.js performance tuning
- Data reduction

## ATDD First
Write failing store tests first.

### Acceptance Test
- Given the store already holds a loaded window
- When the user scrubs inside that window
- Then no HTTP request is sent
- And when the user scrubs near the edge of that window
- Then the store starts loading the adjacent page early
- And overlapping pages merge without duplicate points

## Implementation Notes
- Keep loaded windows as a small merged range list.
- Keep page fetch decisions in the store.
- Limit prefetch to one request per direction at a time.
- Use deterministic merge order: `timestampUtc`, then `sampleId`.
- Do not create a second cache abstraction if the store can hold both timeline and loaded windows.

## Suggested Files
- `frontend/src/app/telemetry-chart/telemetry-chart.store.ts`
- tests for cache reuse, prefetch, and overlap dedupe

## Verification

### Automated
- Run store tests for loaded-window reuse.
- Run store tests for prefetch trigger behavior.
- Run store tests for overlap merge and dedupe.
- Run `npm run build`.

### Manual
- Start frontend and backend.
- Switch to historical mode and scrub across already loaded data.
- Confirm the UI stays responsive and network traffic only appears when the scrubber approaches an unloaded edge.

### Angular Material And Typography Regression
- Confirm the scrubber host controls and supporting labels still use Angular Material where applicable.
- Confirm `frontend/angular.json` still includes the Angular Material theme and global styles.
- Confirm `frontend/src/index.html` still includes the configured font links.
- Confirm labels, helper text, and buttons still display the configured typography.

### Radically Simple Verification
- One store still owns viewport, loaded windows, timeline, and fetch flags.
- One history client still owns HTTP only.
- No separate cache manager or prefetch service was added.
- The merge rule is deterministic and local to the store.

## Screenshot Evidence
- Capture `docs/tasks/evidence/09-frontend-scrubbing-cache-and-prefetch.png`.
- The screenshot must show the running browser page in historical mode with the scrubber positioned away from the newest live point.
