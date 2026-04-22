Status: Complete

# Task 08: Implement Historical Mode And Initial History Load

## Goal
Allow the user to leave live mode, enter historical mode, and load the first historical page for the active telemetry identifier without interrupting live intake.

## Requirements
- `FR3`
- `FR4`
- `FR5`
- `FR7`

## Design References
- [Telemetry Visualization High-Level Requirements](../telemetry-visualization-high-level-requirements.md)
- [Historical Telemetry Retrieval Detailed Design](../historical-telemetry-retrieval-design.md)

## Vertical Slice
The user switches from live mode to historical mode using Angular Material controls, the app loads the initial historical page, and the UI shows loading and completion states.

## In Scope
- Add `TelemetryHistoryClient`
- Add historical mode state to the store
- Load the first historical page for the active telemetry identifier
- Add Material loading indicator and error presentation
- Keep the live subscription running in the background

## Not In Scope
- Scrubbing across multiple pages
- Prefetch
- Final chart plotting

## ATDD First
Write the failing store test and component test first.

### Acceptance Test
- Given the page is in live mode
- When the user switches to historical mode
- Then the app requests the first history page for the active telemetry identifier
- And the UI shows a Material loading indicator while the request is in flight
- And the loaded historical points are stored without stopping the live subscription

## Implementation Notes
- Use one store only.
- Keep live points and historical points in one ordered timeline.
- Use `MatButtonToggleGroup` or `MatSlideToggle` for mode switching.
- Use `MatProgressBar` or `MatProgressSpinner` for loading.
- Use `MatSnackBar` for transient errors.

## Suggested Files
- `frontend/src/app/telemetry-chart/telemetry-history.client.ts`
- `frontend/src/app/telemetry-chart/telemetry-chart.store.ts`
- `frontend/src/app/telemetry-chart/telemetry-chart.component.html`
- tests for mode switch and initial history load

## Verification

### Automated
- Run store tests for mode switching and initial page load.
- Run component tests for loading indicator and mode control behavior.
- Run `npm run build`.

### Manual
- Start frontend and backend.
- Switch to historical mode and confirm the page loads history and stays responsive.
- Confirm live connection state remains healthy while in historical mode.

### Angular Material And Typography Regression
- Confirm the mode switch, loading indicator, and error presentation use Angular Material.
- Confirm `frontend/angular.json` still includes the Angular Material theme and global styles.
- Confirm `frontend/src/index.html` still includes the configured font links.
- Confirm the browser still renders Material typography correctly.

### Radically Simple Verification
- One store owns live and historical mode.
- The history client only wraps HTTP.
- No separate historical coordinator service was added.
- Returning to live mode is still a mode and viewport change, not a reload.

## Screenshot Evidence
- Capture `docs/tasks/evidence/08-frontend-historical-mode-and-initial-page.png`.
- The screenshot must show the running browser page in historical mode with the Material mode control and history-loading or loaded state visible.
