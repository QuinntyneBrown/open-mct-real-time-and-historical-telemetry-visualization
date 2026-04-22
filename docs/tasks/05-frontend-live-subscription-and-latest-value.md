Status: Complete

# Task 05: Implement Frontend Live Subscription And Latest Value Display

## Goal
Connect the Angular application to SignalR, subscribe to the selected telemetry identifier, and display the current live value in the running browser UI.

## Requirements
- `FR1`
- `FR2`
- `FR4`
- `FR7`
- `FR8`

## Design References
- [Telemetry Visualization High-Level Requirements](../telemetry-visualization-high-level-requirements.md)
- [Historical Telemetry Retrieval Detailed Design](../historical-telemetry-retrieval-design.md)

## Vertical Slice
When the user selects a telemetry identifier, the app subscribes to that SignalR stream and shows the latest sample value and timestamp using Angular Material presentation.

## In Scope
- Add `TelemetryLiveClient`
- Add live subscription state to `TelemetryChartStore`
- Subscribe on active telemetry change
- Unsubscribe the previous telemetry identifier
- Display latest value, timestamp, and connection state

## Not In Scope
- Historical retrieval
- Scrubbing
- Final chart rendering

## ATDD First
Write the failing client test, store test, and component test first.

### Acceptance Test
- Given the active telemetry identifier is `temperature-a`
- When live samples arrive for `temperature-a`
- Then the store merges them into the timeline
- And the page displays the latest value and timestamp
- And when the user switches to `pressure-b`
- Then the app unsubscribes from `temperature-a` and displays `pressure-b` values instead

## Implementation Notes
- Keep one `HubConnection`.
- Keep one active subscription.
- Ignore any sample whose `telemetryId` does not match the active telemetry identifier.
- Use Angular Material components to display status and latest value.
- Do not add a second store or event bus.

## Suggested Files
- `frontend/src/app/telemetry-chart/telemetry-live.client.ts`
- `frontend/src/app/telemetry-chart/telemetry-chart.store.ts`
- `frontend/src/app/telemetry-chart/telemetry-chart.component.html`
- related tests

## Verification

### Automated
- Run the store test for subscribe, unsubscribe, and live sample merge behavior.
- Run the component test for latest value rendering.
- Run `npm run build`.

### Manual
- Start frontend and backend.
- Change the telemetry identifier and confirm the displayed live value switches with it.
- Confirm the app remains responsive while live samples continue to arrive.

### Angular Material And Typography Regression
- Confirm the live status area uses Angular Material cards, chips, icons, or progress indicators.
- Confirm `frontend/angular.json` still contains the Angular Material theme and global styles.
- Confirm `frontend/src/index.html` still contains the configured font links.
- Confirm the displayed latest value, timestamp label, and status text use the configured typography.

### Radically Simple Verification
- One SignalR client only.
- One active subscription only.
- One store owns live state and selected telemetry state together.
- The component does not duplicate live state.

## Screenshot Evidence
- Capture `docs/tasks/evidence/05-frontend-live-subscription-and-latest-value.png`.
- The screenshot must show the running browser page with the selected telemetry identifier, connection state, and a live value visible.
