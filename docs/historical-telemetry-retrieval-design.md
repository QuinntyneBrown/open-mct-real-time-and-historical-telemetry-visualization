# Historical Telemetry Retrieval Detailed Design

## Overview
This design is the minimum frontend shape that satisfies the requirements in [telemetry-visualization-high-level-requirements.md](./telemetry-visualization-high-level-requirements.md):

- one Angular component owns one Chart.js chart
- one Angular Signals store owns all chart state and all fetch decisions
- one HTTP client wraps `HttpClient` observables for historical pages

There are no extra adapter, projector, or coordinator classes. The chart stays smooth by doing three things only:

1. Keep one ordered in-memory timeline for one metric.
2. Keep one small list of loaded time windows to know when history is already present.
3. Render only the current viewport on `requestAnimationFrame`.

This design covers `FR3` through `FR8` and `NFR1` through `NFR4`.

![Historical retrieval class diagram](./diagrams/historical-telemetry-retrieval-class.png)

![Historical retrieval sequence diagram](./diagrams/historical-telemetry-retrieval-sequence.png)

## Radically Simple Shape
- `TelemetryChartComponent` owns the Chart.js instance and the scrubber UI.
- `TelemetryChartStore` owns mode, viewport, live samples, historical samples, and loading flags with Signals.
- `TelemetryHistoryClient` performs HTTP requests with RxJS observables.
- The store merges live and historical samples into one ordered timeline using `timestampUtc` then `sampleId`.
- The component renders only visible points and never asks Angular template change detection to process each sample.

## Vertical Slices For ATDD

### Slice 1. Stable History Page
**Requirements**  
`FR3`, `FR6`, `FR10`

**Goal**  
The client can request older or newer history pages and always receive a deterministic result.

**ATDD**
- Given persisted telemetry exists for one metric
- When the client requests a page with `metricId`, `direction`, `cursorTimestampUtc`, and `cursorSampleId`
- Then the API returns items sorted ascending by `timestampUtc` then `sampleId`
- And the response contains cursor metadata for the next older or newer page
- And replaying the next cursor does not create gaps caused by unstable ordering

### Slice 2. Cache Before Fetch
**Requirements**  
`FR4`, `FR5`, `FR7`

**Goal**  
Scrubbing inside already loaded history does not issue another HTTP request.

**ATDD**
- Given the store already holds a loaded window covering the requested viewport
- When the user scrubs inside that viewport
- Then the chart updates from memory only
- And no HTTP request is sent

### Slice 3. Fetch Early At Window Edge
**Requirements**  
`FR5`, `NFR1`, `NFR2`

**Goal**  
The chart loads the adjacent page before the scrubber reaches a cache boundary.

**ATDD**
- Given the viewport is near the start or end of a loaded window
- When the user continues scrubbing toward that edge
- Then the store requests the adjacent page early
- And the chart remains interactive while the request is in flight

### Slice 4. Render Only What The User Can See
**Requirements**  
`FR8`, `NFR1`, `NFR2`, `NFR3`

**Goal**  
The chart stays visually stable at the target frame rate.

**ATDD**
- Given the timeline contains more points than the viewport can display
- When the viewport changes
- Then the component renders only points inside the viewport
- And if the point count is larger than the chart width in pixels, the component reduces the visible set before calling Chart.js
- And the chart updates with `chart.update('none')`

## Runtime Design

### In-Memory Model
- Keep one sorted array of `TelemetryPoint` for the active `metricId`.
- Keep one list of merged `LoadedWindow` ranges.
- Keep live mode and historical mode in the same store.
- Do not maintain separate live and historical rendering pipelines.

### Render Rule
- The component creates the Chart.js chart once.
- The component runs chart mutation inside `NgZone.runOutsideAngular`.
- Store changes are coalesced into one `requestAnimationFrame` render.
- The component mutates the existing dataset instead of recreating the chart.

### Fetch Rule
- `TelemetryHistoryClient` returns `Observable<TelemetryHistoryPage>`.
- The store decides when to fetch.
- The store never fetches if the requested viewport is already inside `LoadedWindow`.
- The store fetches one adjacent page at a time per direction.

### Merge Rule
- Merge order is always `timestampUtc`, then `sampleId`.
- If two pages overlap, the later merge drops duplicates by `sampleId`.
- Live samples are merged into the same ordered array, so returning to live mode is only a viewport change.

## HTTP Contract
`GET /api/telemetry/history?metricId={metricId}&pageSize={pageSize}&direction={Older|Newer}&cursorTimestampUtc={timestamp?}&cursorSampleId={sampleId?}`

### Response Shape
```json
{
  "metricId": "motor-speed",
  "items": [
    {
      "sampleId": "018fe1c5-8c62-7f67-bb85-7c1d7f122001",
      "timestampUtc": "2026-04-21T18:00:00.000Z",
      "value": 42.17
    }
  ],
  "previousCursor": {
    "metricId": "motor-speed",
    "timestampUtc": "2026-04-21T17:59:09.950Z",
    "sampleId": "018fe1c5-8c62-7f67-bb85-7c1d7f121c00",
    "direction": "Older"
  },
  "nextCursor": null,
  "hasPrevious": true,
  "hasNext": false
}
```

## Classes, Enums, And Types

| Name | Kind | Responsibility |
| --- | --- | --- |
| `TelemetryChartComponent` | Angular component | Owns the Chart.js chart, scrubber events, and render scheduling. |
| `TelemetryChartStore` | Angular injectable service | Signal-based state owner for `metricId`, `mode`, `viewport`, ordered timeline, loaded windows, and loading flags. |
| `TelemetryHistoryClient` | Angular injectable service | Calls the history API through `HttpClient` and returns RxJS observables. |
| `TelemetryPoint` | Type | One telemetry sample with `metricId`, `timestampUtc`, `sampleId`, and `value`. |
| `TelemetryHistoryCursor` | Type | Cursor fields required to page deterministically. |
| `TelemetryHistoryPage` | Type | Ordered history items plus continuation cursors and availability flags. |
| `LoadedWindow` | Type | Inclusive time range already available in memory for the active metric. |
| `Viewport` | Type | Visible start and end time for the chart. |
| `ChartMode` | Enum | `Live` or `Historical`. |
| `HistoryDirection` | Enum | `Older` or `Newer`. |

## Why This Is The Minimum
- One metric means one timeline array is enough.
- One store is enough because all decisions depend on the same state: mode, viewport, loaded windows, and timeline.
- One HTTP client is enough because historical retrieval is one endpoint.
- Any extra projector or adapter class would only rename logic that already belongs to the component or store.

## Out Of Scope
- Multi-metric charts
- Browser persistence
- Server-side aggregation beyond cursor paging
