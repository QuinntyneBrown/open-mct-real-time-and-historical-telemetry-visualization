# Telemetry Visualization High-Level Requirements

## Purpose
This document defines the high-level behavioral requirements for an application that visualizes one telemetry metric in both live and historical modes.

The application uses:
- Angular for the frontend
- Angular Material for frontend UI components and design primitives
- Chart.js for chart rendering
- Angular Signals for client-side state management
- RxJS observables for HTTP requests
- ASP.NET Core controllers for HTTP APIs
- ASP.NET Core SignalR for live telemetry delivery
- `Microsoft.Extensions.Logging`, dependency injection, configuration, and standard ASP.NET Core hosting infrastructure on the backend

## Product Goal
The application shall let a user view one telemetry metric that is published live at 20 Hz, move smoothly through historical data, and return to live mode without visible glitches, missing samples, or chart stalls.

## In Scope
- One chart displaying one telemetry metric at a time
- Live telemetry streaming over SignalR
- Historical telemetry retrieval over HTTP
- Angular Material-based UI composition for application controls and presentation
- Cursor-based paging using telemetry timestamp and unique sample identifier
- Smooth historical scrubbing with chart updates that remain visually stable at 60 frames per second

## Out Of Scope
- Multi-metric overlays in a single chart
- User-authored analytics, annotations, or alerting
- Bulk export workflows
- Multi-tenant authorization design

## Functional Requirements

### FR1. Single Metric Chart
- The chart shall display exactly one telemetry series for one telemetry unique identifier at a time.
- The selected telemetry unique identifier shall be used consistently across live subscriptions and historical queries.

### FR1A. Angular Material Frontend Standard
- The frontend Angular application shall use Angular Material for application components and UI primitives.
- Buttons, form fields, dialogs, menus, tables, typography, and other standard interface elements shall use Angular Material implementations and styling patterns.
- Custom components may be built where needed, but they shall align with Angular Material interaction and visual conventions.

### FR2. Live Telemetry Ingestion
- The backend shall publish live telemetry samples for the selected telemetry unique identifier at 20 Hz, which is one sample every 50 ms in steady state.
- The frontend shall receive live telemetry through Microsoft SignalR.
- The frontend shall subscribe to live telemetry using the telemetry unique identifier.
- The frontend shall receive only telemetry streams for the identifiers it has actively subscribed to.
- Live samples shall be appended to the chart in timestamp order.

### FR3. Historical Telemetry Retrieval
- The frontend shall retrieve historical telemetry through HTTP endpoints exposed by ASP.NET Core controllers.
- Historical retrieval shall use cursor-based paging instead of offset paging.
- The paging cursor shall be based on:
  - telemetry timestamp
  - unique telemetry sample identifier
  - telemetry unique identifier
- Historical responses shall be deterministic so the client can page backward or forward without duplicates or gaps caused by unstable ordering.

### FR4. Live And Historical Mode Switching
- The chart shall support a live mode that follows the most recent samples.
- The chart shall support a historical mode that allows the user to scrub backward and forward through previously recorded telemetry.
- Switching from live mode to historical mode shall not interrupt receipt of live data.
- Returning from historical mode to live mode shall move the viewport to the newest available telemetry without requiring a full page reload.

### FR5. Historical Scrubbing
- The user shall be able to scrub across historical telemetry smoothly.
- The chart shall continue rendering without visible flicker, redraw glitches, or discontinuities while scrubbing.
- The application shall reuse already loaded historical data before requesting more data.
- When the viewport approaches the edge of loaded history, the application shall request adjacent pages early enough to avoid visible stalls.

### FR6. Ordering And Data Integrity
- Every telemetry point shall have a unique sample identifier.
- If multiple samples share the same timestamp, the unique sample identifier shall be used as the tie-breaker.
- The frontend shall merge live and historical samples using a deterministic ordering rule based on timestamp plus unique identifier.
- The chart shall not display duplicated points when pages overlap or when live data catches up to historical ranges already in memory.

### FR7. Frontend State Management
- Angular Signals shall be the primary state management mechanism for chart mode, viewport, cached telemetry pages, loading status, and derived visible series.
- RxJS shall be used for HTTP request and response handling.
- The application shall not use RxJS as the primary frontend store for chart state.
- Subscription state shall track which telemetry unique identifiers are currently active so the frontend only processes data for active subscriptions.

### FR8. Frontend Rendering Behavior
- Chart rendering shall use Chart.js.
- The chart shall update smoothly enough to maintain a target of 60 frames per second during normal live viewing and historical scrubbing.
- The frontend shall update the visible chart data independently from Angular template change detection for each incoming sample.
- The chart shall render only the visible or otherwise required data needed for the active viewport.

### FR9. Backend Application Shape
- The backend shall be implemented with ASP.NET Core.
- Historical retrieval APIs shall be implemented with controllers.
- Live telemetry distribution shall use Microsoft SignalR.
- The backend shall use `Microsoft.Extensions.Logging` for operational logging.
- The backend shall use built-in dependency injection and configuration facilities from `Microsoft.Extensions.*`.

### FR10. API Behavior
- The historical telemetry API shall accept the telemetry unique identifier, page size, paging direction, and cursor values.
- The historical telemetry API shall return:
  - ordered telemetry items
  - continuation cursor information for paging
  - enough metadata for the client to determine whether older or newer pages are available
- The API contract shall remain stable enough for the frontend cache and paging logic to rely on it.

## Non-Functional Requirements

### NFR1. Responsiveness
- The chart shall remain interactive while live data is arriving and while historical requests are in flight.
- Normal scrubbing shall target 60 frames per second on a typical developer workstation and modern desktop browser.

### NFR2. Visual Stability
- Chart updates shall avoid visible flicker, axis thrash, and full redraw artifacts during scrubbing or mode changes.
- The user experience shall feel continuous when crossing boundaries between cached data and newly fetched pages.

### NFR3. Scalability Of Rendering
- The frontend shall be able to handle datasets larger than the number of horizontal display pixels without degrading interactivity.
- The rendering path shall reduce or project data when necessary so chart updates remain fast.

### NFR4. Reliability
- Historical paging shall be replayable with stable ordering.
- The system shall tolerate temporary network latency without corrupting chart state.
- A transient live transport interruption shall not require application restart to resume live telemetry.

### NFR5. Observability
- Backend components shall log startup, shutdown, errors, and telemetry retrieval failures.
- The system shall log enough information to diagnose paging errors, live subscription issues, and unexpected ordering problems.

## High-Level User Experience Requirements
- The user shall immediately see the most recent telemetry when opening the chart in live mode.
- The user shall be able to move into the past without the chart freezing.
- The user shall be able to scrub back toward the present and return to live mode quickly.
- The user shall not be required to understand paging mechanics, cursors, or transport details.
- The visible application controls and presentation elements shall use Angular Material consistently.

## High-Level Acceptance Criteria
- Given one telemetry unique identifier publishing at 20 Hz, when the user stays in live mode for several minutes, then the chart continues updating without visible glitches.
- Given the user scrubs into historical data, when additional history is required, then the application loads adjacent pages without breaking chart interaction.
- Given historical pages contain samples with equal timestamps, when the client merges pages, then point order remains deterministic because timestamp and unique sample identifier are both used.
- Given the user returns from historical mode to live mode, when newer live samples already exist in memory, then the chart resumes the latest view without a full reload.
- Given normal operating conditions, when the user scrubs through loaded history, then the chart remains visually smooth and targets 60 FPS behavior.
- Given multiple telemetry streams exist on the backend, when the frontend subscribes to one telemetry unique identifier, then it receives only telemetry for that subscribed identifier.

## Related Design Documents
- [Historical Telemetry Retrieval Detailed Design](./historical-telemetry-retrieval-design.md)
- [Backend Telemetry Platform Detailed Design](./backend-telemetry-platform-design.md)
