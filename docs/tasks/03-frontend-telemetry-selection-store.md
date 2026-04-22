Status: Complete

# Task 03: Implement Telemetry Selection And Frontend Signals Store

## Goal
Let the Angular application load telemetry identifiers from the backend and let the user choose the active telemetry stream using Angular Material controls and a single Signals store.

## Requirements
- `FR1`
- `FR1A`
- `FR7`

## Design References
- [Telemetry Visualization High-Level Requirements](../telemetry-visualization-high-level-requirements.md)
- [Historical Telemetry Retrieval Detailed Design](../historical-telemetry-retrieval-design.md)

## Vertical Slice
The page loads telemetry identifiers over HTTP, displays them in a Material select, and stores the active telemetry identifier in one Signals store.

## In Scope
- Add a small `TelemetryChartStore`
- Add a small `TelemetryHistoryClient` or catalog client for the selector
- Load telemetry identifiers at startup
- Bind the selector to `activeTelemetryId`
- Display the current selection in the shell

## Not In Scope
- Live SignalR data
- Historical data
- Chart plotting

## ATDD First
Write the failing store test and component test first.

### Acceptance Test
- Given the backend catalog endpoint returns `temperature-a` and `pressure-b`
- When the page loads
- Then the Material selector shows both options
- And when the user selects `pressure-b`
- Then the Signals store updates `activeTelemetryId` to `pressure-b`
- And the page reflects the current selection

## Implementation Notes
- Keep state in one Signals store.
- Use RxJS only in the HTTP client.
- Use `MatFormField` and `MatSelect`.
- Keep selector loading and error state in the same store.
- Do not introduce separate coordinator services.

## Suggested Files
- `frontend/src/app/telemetry-chart/telemetry-chart.store.ts`
- `frontend/src/app/telemetry-chart/telemetry-catalog.client.ts`
- `frontend/src/app/telemetry-chart/telemetry-chart.component.ts`
- `frontend/src/app/telemetry-chart/telemetry-chart.component.html`
- component and store tests

## Verification

### Automated
- Run the component test for selector rendering and selection changes.
- Run the store test for catalog load success and failure paths.
- Run `npm run build`.

### Manual
- Start frontend and backend.
- Confirm the selector loads values from the backend.
- Change the selected telemetry identifier and confirm the UI updates.

### Angular Material And Typography Regression
- Confirm the selector uses Angular Material, not a native unstyled select.
- Confirm `frontend/angular.json` still contains the Angular Material theme and global styles.
- Confirm `frontend/src/index.html` still contains the configured font links.
- Confirm selector labels, hints, and card headings render with the correct typography.

### Radically Simple Verification
- One Signals store owns the selection state.
- One HTTP client owns the catalog call.
- No duplicate selector state exists in the component.
- No live or history logic was added yet.

## Screenshot Evidence
- Capture `docs/tasks/evidence/03-frontend-telemetry-selection-store.png`.
- The screenshot must show the running browser page with the populated Material selector and the selected telemetry identifier visible.
