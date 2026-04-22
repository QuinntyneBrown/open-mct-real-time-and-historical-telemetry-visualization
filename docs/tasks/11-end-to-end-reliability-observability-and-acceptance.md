Status: Complete

# Task 11: End-To-End Reliability, Observability, And Final Acceptance

## Goal
Finish the implementation by proving the complete flow works end to end, adding only the smallest reliability and observability behavior required by the requirements, and verifying the final result is still radically simple.

## Requirements
- `FR1` through `FR10`
- `NFR1` through `NFR5`
- High-Level Acceptance Criteria

## Design References
- [Telemetry Visualization High-Level Requirements](../telemetry-visualization-high-level-requirements.md)
- [Historical Telemetry Retrieval Detailed Design](../historical-telemetry-retrieval-design.md)
- [Backend Telemetry Platform Detailed Design](../backend-telemetry-platform-design.md)

## Vertical Slice
The app runs end to end: selectable telemetry, filtered live stream, durable storage, deterministic history, smooth scrubbing, and stable chart rendering, with logging and user-visible error handling where required.

## In Scope
- Add missing structured logs for startup, shutdown, history failures, and live transport failures
- Add frontend reconnect and error presentation behavior if still missing
- Run end-to-end acceptance checks
- Clean up any accidental complexity introduced in earlier tasks

## Not In Scope
- New product features
- Extra abstractions for “future flexibility”

## ATDD First
Write the final acceptance tests first.

### Acceptance Test
- Given one selected telemetry identifier publishing at 20 Hz
- When the user stays in live mode for several minutes
- Then the chart continues updating without visible glitches
- And when the user switches to historical mode and scrubs
- Then the app reuses loaded data, loads missing data early, and remains interactive
- And when the user returns to live mode
- Then the chart resumes the newest telemetry without a full reload
- And when multiple telemetry identifiers exist
- Then the frontend receives only the active subscription stream

## Implementation Notes
- Prefer deleting accidental layers over adding new ones.
- Ensure logging fields include `telemetryId`, `sampleId`, cursor values, and page size where relevant.
- Ensure frontend error handling uses Angular Material primitives such as `MatSnackBar`.
- Ensure backend and frontend startup documentation is current if commands or setup changed during implementation.

## Suggested Files
- whichever production files still need the final minimal reliability or logging adjustments
- end-to-end tests
- any documentation updates required for startup and verification

## Verification

### Automated
- Run the full frontend test suite.
- Run the full backend test suite.
- Run end-to-end acceptance tests covering live mode, history mode, and subscription filtering.

### Manual
- Run the full system.
- Verify live mode, switch to history, scrub across cached and uncached ranges, then return to live mode.
- Confirm logs capture startup, shutdown, failures, and paging details.

### Angular Material And Typography Regression
- Confirm `frontend/angular.json` still includes the Angular Material theme and global styles.
- Confirm `frontend/src/index.html` still includes the configured font links.
- Confirm toolbar text, selector labels, buttons, helper text, snackbars, and card headings still display correctly.
- Confirm the visible application still follows Angular Material conventions consistently.

### Radically Simple Verification
- Count the core runtime types against the design docs and remove anything unnecessary.
- Confirm there is still one frontend store, one live client, one history client, one generator worker, one dispatch worker, one controller, one repository, and one hub unless a requirement forced a change.
- Confirm no task solved a problem by adding a second state source, a second queue, or a speculative abstraction.
- Confirm the implemented behavior fully satisfies the requirements, not a reduced interpretation of them.

## Screenshot Evidence
- Capture `docs/tasks/evidence/11-end-to-end-reliability-observability-and-acceptance.png`.
- The screenshot must show the final running browser application with Angular Material controls and the telemetry chart visible.
