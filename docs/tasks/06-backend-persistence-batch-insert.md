Status: Complete

# Task 06: Implement Durable Batch Persistence

## Goal
Store every generated live telemetry sample in the database using a radically simple append-only table and batched inserts.

## Requirements
- `FR3`
- `FR6`
- `FR9`
- `NFR4`
- `NFR5`

## Design References
- [Telemetry Visualization High-Level Requirements](../telemetry-visualization-high-level-requirements.md)
- [Backend Telemetry Platform Detailed Design](../backend-telemetry-platform-design.md)

## Vertical Slice
Generated live telemetry is inserted into `TelemetrySamples` in ordered batches without changing the existing live SignalR behavior.

## In Scope
- Create the append-only telemetry table
- Add `TelemetryRepository` batch insert logic
- Extend `TelemetryDispatchWorker` to batch and flush inserts
- Add logging for insert success and failure paths

## Not In Scope
- Historical API
- Frontend historical mode

## ATDD First
Write failing repository tests and dispatch worker tests first.

### Acceptance Test
- Given live samples are generated continuously
- When the dispatch worker collects a batch
- Then it inserts the batch into `TelemetrySamples`
- And the inserted rows retain `telemetryId`, `timestampUtc`, `sampleId`, and `value`
- And the live SignalR path still works

## Implementation Notes
- Keep one repository class for SQL.
- Use straightforward ADO.NET or equally simple SQL access. Do not introduce a full ORM if the repository can stay small without it.
- Flush on timer, maximum batch size, and shutdown.
- The primary key must be `TelemetryId, TimestampUtc, SampleId`.

## Suggested Files
- `backend/src/Telemetry.Api/Data/TelemetryRepository.cs`
- `backend/src/Telemetry.Api/Data/TelemetrySchema.sql` or migration script
- `backend/src/Telemetry.Api/Workers/TelemetryDispatchWorker.cs`
- repository and worker tests

## Verification

### Automated
- Run repository integration tests against the chosen test database.
- Run dispatch worker tests that prove batched inserts happen.
- Run `dotnet build` and tests.

### Manual
- Start the application and inspect the database after live traffic runs briefly.
- Confirm rows exist for the configured telemetry identifiers.

### Angular Material And Typography Regression
- Run the frontend with the backend persistence change in place.
- Confirm `frontend/angular.json` still includes the Angular Material theme and global styles.
- Confirm `frontend/src/index.html` still includes the configured font links.
- Confirm the running browser page still shows correct Angular Material typography.

### Radically Simple Verification
- One repository owns SQL.
- No persistence service layer was added above the repository.
- The dispatch worker still owns batching.
- The database table shape is append-only and minimal.

## Screenshot Evidence
- Capture `docs/tasks/evidence/06-backend-persistence-batch-insert.png`.
- If no new visible UI exists, capture the running browser app as a regression screenshot while the backend persistence slice is active.
