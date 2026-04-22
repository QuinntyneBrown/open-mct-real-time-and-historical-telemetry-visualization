Status: Complete

# Task 07: Implement Historical Cursor API

## Goal
Expose the historical telemetry controller endpoint with deterministic cursor paging based on `telemetryId`, `timestampUtc`, and `sampleId`.

## Requirements
- `FR3`
- `FR6`
- `FR10`
- `NFR4`

## Design References
- [Telemetry Visualization High-Level Requirements](../telemetry-visualization-high-level-requirements.md)
- [Backend Telemetry Platform Detailed Design](../backend-telemetry-platform-design.md)

## Vertical Slice
The backend returns one ordered historical page for one telemetry identifier and returns continuation cursors for paging older or newer without duplicates or gaps.

## In Scope
- Add `GET /api/telemetry/history`
- Add cursor request and response DTOs
- Add repository cursor queries for `Older` and `Newer`
- Return ascending response order

## Not In Scope
- Frontend historical mode
- Scrubbing
- Prefetch

## ATDD First
Write failing controller and repository tests first.

### Acceptance Test
- Given the database contains samples for one telemetry identifier with equal and unequal timestamps
- When the client requests a page
- Then the API returns items ordered by `timestampUtc` then `sampleId`
- And the response includes `previousCursor`, `nextCursor`, `hasPrevious`, and `hasNext`
- And using the continuation cursor replays the next page deterministically

## Implementation Notes
- Use controllers.
- Keep the controller thin and let the repository perform the cursor SQL.
- Do not use offset paging.
- Reverse `Older` query results before returning them so every response is ascending.
- Validate query inputs and return `400` for invalid cursor combinations.

## Suggested Files
- `backend/src/Telemetry.Api/Controllers/TelemetryController.cs`
- `backend/src/Telemetry.Api/Contracts/TelemetryHistoryCursorDto.cs`
- `backend/src/Telemetry.Api/Contracts/TelemetryHistoryPageDto.cs`
- `backend/src/Telemetry.Api/Data/TelemetryRepository.cs`
- controller and repository tests

## Verification

### Automated
- Run controller tests for validation and happy-path paging.
- Run repository tests proving deterministic ordering with equal timestamps.
- Run `dotnet build` and tests.

### Manual
- Start the API and inspect the history endpoint in Swagger or the browser.
- Verify both `Older` and `Newer` queries return ascending `items`.

### Angular Material And Typography Regression
- Start the frontend against the updated backend.
- Confirm `frontend/angular.json` still includes the Angular Material theme and global styles.
- Confirm `frontend/src/index.html` still includes the configured font links.
- Confirm the running browser page still displays Material typography correctly.

### Radically Simple Verification
- One controller endpoint only.
- One cursor query shape per direction only.
- No offset paging fallback exists.
- No extra service layer was introduced if the controller and repository are sufficient.

## Screenshot Evidence
- Capture `docs/tasks/evidence/07-backend-historical-cursor-api.png`.
- If the frontend does not yet consume history, capture a browser screenshot of Swagger or a browser-rendered JSON response for the history endpoint.
