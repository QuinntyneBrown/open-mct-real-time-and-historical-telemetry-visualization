Status: Complete

# Task 04: Implement Live Telemetry Generation And Group-Based Delivery

## Goal
Generate live telemetry for each configured telemetry identifier at 20 Hz and deliver it through SignalR groups so only subscribed clients receive the stream they asked for.

## Requirements
- `FR2`
- `FR6`
- `FR9`
- High-Level Acceptance Criterion for subscribed identifier filtering

## Design References
- [Telemetry Visualization High-Level Requirements](../telemetry-visualization-high-level-requirements.md)
- [Backend Telemetry Platform Detailed Design](../backend-telemetry-platform-design.md)

## Vertical Slice
The backend generates live samples for configured telemetry identifiers, writes them into one channel, and dispatches them to matching SignalR groups.

## In Scope
- Add `TelemetryGeneratorWorker`
- Add `TelemetryDispatchWorker`
- Add `TelemetrySample`
- Generate one sample every 50 ms for each configured telemetry identifier
- Broadcast to group `telemetry:{telemetryId}`

## Not In Scope
- Database persistence
- Frontend live plotting
- Historical retrieval

## ATDD First
Write the failing generator test and SignalR integration test first.

### Acceptance Test
- Given configured telemetry identifiers `temperature-a` and `pressure-b`
- When the generator runs
- Then it emits samples for both identifiers every 50 ms in steady state
- And when a client subscribes to `temperature-a`
- Then that client receives only `temperature-a` samples

## Implementation Notes
- Use one bounded `Channel<TelemetrySample>`.
- Use `PeriodicTimer` and `TimeProvider`.
- Keep the generator responsible only for creating samples.
- Keep the dispatch worker responsible only for reading the channel and broadcasting live samples.
- Use `timestampUtc` plus `sampleId` ordering semantics from the design docs.

## Suggested Files
- `backend/src/Telemetry.Api/Workers/TelemetryGeneratorWorker.cs`
- `backend/src/Telemetry.Api/Workers/TelemetryDispatchWorker.cs`
- `backend/src/Telemetry.Api/Contracts/TelemetrySample.cs`
- tests for timing and hub delivery

## Verification

### Automated
- Run tests that validate cadence and generated identifier coverage.
- Run SignalR tests that prove group filtering works.
- Run `dotnet build` and the backend tests.

### Manual
- Start the backend and inspect logs for generator startup and dispatch activity.
- If a simple hub test page exists, confirm subscription filtering manually.

### Angular Material And Typography Regression
- Restart the frontend app after the backend change.
- Confirm `frontend/angular.json` still includes the Angular Material theme and global styles.
- Confirm `frontend/src/index.html` still includes the configured font links.
- Confirm the browser page still renders Material typography correctly.

### Radically Simple Verification
- One generator worker and one dispatch worker only.
- One channel only.
- No persistence code yet.
- No extra service layer between workers and the hub.

## Screenshot Evidence
- Capture `docs/tasks/evidence/04-backend-live-generation-and-group-delivery.png`.
- If the browser app does not yet surface live values, capture the running app shell plus any browser-visible verification page used for SignalR delivery.
