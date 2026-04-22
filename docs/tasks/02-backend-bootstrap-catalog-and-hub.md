Status: Complete

# Task 02: Bootstrap ASP.NET Core Backend, Telemetry Catalog, And Hub Skeleton

## Goal
Create the minimum backend host so the frontend can discover available telemetry identifiers and a SignalR hub exists for later live subscriptions.

## Requirements
- `FR1`
- `FR2`
- `FR9`

## Design References
- [Telemetry Visualization High-Level Requirements](../telemetry-visualization-high-level-requirements.md)
- [Backend Telemetry Platform Detailed Design](../backend-telemetry-platform-design.md)

## Vertical Slice
The backend starts, exposes a controller endpoint that returns configured telemetry identifiers, and exposes a SignalR hub with subscribe or unsubscribe methods.

## In Scope
- Create the ASP.NET Core API project
- Configure logging, dependency injection, configuration, controllers, and SignalR
- Add telemetry options with a small configured list of telemetry identifiers
- Add `GET /api/telemetry/catalog`
- Add `TelemetryHub` with `SubscribeTelemetry` and `UnsubscribeTelemetry`

## Not In Scope
- Telemetry generation
- Persistence
- Historical retrieval
- Frontend SignalR connection

## ATDD First
Write failing API and hub tests first.

### Acceptance Test
- Given the backend is running
- When the client calls `GET /api/telemetry/catalog`
- Then the response returns the configured telemetry identifiers
- And when a SignalR client calls `SubscribeTelemetry("temperature-a")`
- Then the connection joins group `telemetry:temperature-a`

## Implementation Notes
- Use ASP.NET Core with controllers, not minimal APIs for history or catalog endpoints.
- Keep the catalog controller thin. It should read configured telemetry identifiers and return them.
- Keep the hub thin. It should only manage group membership.
- Configure CORS so the Angular frontend can call HTTP and SignalR from the browser.
- Use `IOptions<TelemetryOptions>` for configured telemetry identifiers.
- Enable Swagger if it helps manual verification.

## Suggested Files
- `backend/src/Telemetry.Api/Program.cs`
- `backend/src/Telemetry.Api/Controllers/TelemetryCatalogController.cs`
- `backend/src/Telemetry.Api/Hubs/TelemetryHub.cs`
- `backend/src/Telemetry.Api/Configuration/TelemetryOptions.cs`
- `backend/tests/Telemetry.Api.Tests/...`

## Verification

### Automated
- Run API integration tests for the catalog endpoint.
- Run SignalR hub tests for subscribe and unsubscribe group behavior.
- Run `dotnet build` and the backend test suite.

### Manual
- Start the API and inspect `GET /api/telemetry/catalog` in Swagger or the browser.
- Confirm the hub endpoint is mapped successfully.

### Angular Material And Typography Regression
- Start the frontend app after the backend change.
- Confirm `frontend/angular.json` still includes the Angular Material theme and global styles.
- Confirm `frontend/src/index.html` still includes the configured font links.
- Confirm the Material toolbar, card, labels, and typography still render correctly in the browser.

### Radically Simple Verification
- Only one options type was added for telemetry configuration.
- The controller only returns configured identifiers.
- The hub only manages group membership.
- No generator, repository, or service layer for later tasks was introduced yet.

## Screenshot Evidence
- Capture `docs/tasks/evidence/02-backend-catalog-and-hub.png`.
- If no frontend-visible change exists yet, use a browser screenshot of Swagger or the catalog endpoint response.
