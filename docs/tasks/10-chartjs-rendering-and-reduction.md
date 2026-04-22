Status: Complete

# Task 10: Implement High-Performance Chart.js Rendering And Data Reduction

## Goal
Render live and historical telemetry with Chart.js at the target interaction quality by updating only the visible viewport on animation frames and reducing point count when the series exceeds the available pixel width.

## Requirements
- `FR8`
- `NFR1`
- `NFR2`
- `NFR3`

## Design References
- [Telemetry Visualization High-Level Requirements](../telemetry-visualization-high-level-requirements.md)
- [Historical Telemetry Retrieval Detailed Design](../historical-telemetry-retrieval-design.md)

## Vertical Slice
The app plots the active telemetry timeline in Chart.js, updates only the visible viewport, runs chart updates on animation frames, disables chart animation, and reduces visible points when needed.

## In Scope
- Add Chart.js to the Angular page
- Create the chart once
- Update the dataset with `chart.update('none')`
- Use `requestAnimationFrame`
- Use `NgZone.runOutsideAngular`
- Reduce visible data when point count exceeds chart width

## Not In Scope
- Additional analytics overlays
- Export
- Multi-series support

## ATDD First
Write failing rendering and projection tests first.

### Acceptance Test
- Given the timeline contains more points than the chart can display directly
- When the viewport changes
- Then the component renders only visible points
- And when visible points exceed horizontal pixel capacity
- Then the component reduces the plotted set before calling Chart.js
- And Chart.js updates without animated redraw artifacts

## Implementation Notes
- Keep rendering logic inside the chart component unless a helper function is necessary for pure data reduction.
- If a helper function is introduced, keep it a small pure function, not a service.
- Use `parsing: false`, `normalized: true`, and disabled animations in the chart configuration.
- Mutate the existing dataset instead of recreating the chart instance.

## Suggested Files
- `frontend/src/app/telemetry-chart/telemetry-chart.component.ts`
- `frontend/src/app/telemetry-chart/telemetry-chart.component.html`
- small pure function file for point reduction if needed
- rendering and reduction tests

## Verification

### Automated
- Run tests for visible-window projection.
- Run tests for point reduction behavior.
- Run `npm run build`.

### Manual
- Start frontend and backend.
- Observe the chart in live mode and historical mode.
- Confirm there is no visible flicker or full redraw artifact during viewport changes.

### Angular Material And Typography Regression
- Confirm the chart still sits inside the Angular Material shell without typography regressions.
- Confirm `frontend/angular.json` still includes the Angular Material theme and global styles.
- Confirm `frontend/src/index.html` still includes the configured font links.
- Confirm surrounding toolbar text, selector labels, and mode controls still display correctly.

### Radically Simple Verification
- One chart component owns the chart instance.
- Rendering does not introduce a second render store.
- Any reduction helper remains a pure function, not a framework service.
- Chart updates are animation-frame coalesced and minimal.

## Screenshot Evidence
- Capture `docs/tasks/evidence/10-chartjs-rendering-and-reduction.png`.
- The screenshot must show the running browser page with the actual telemetry chart rendered inside the Angular Material shell.
