# Historical Telemetry Retrieval Detailed Design

## Overview
This feature lets one Angular `Chart.js` chart move between live mode and historical scrub mode without frame drops. The design keeps the critical path simple:

1. Fetch historical pages over HTTP using a stable cursor made from `timestampUtc` and `sampleId`.
2. Store fetched pages in an Angular Signals store, not an RxJS store.
3. Project only the visible window into Chart.js on `requestAnimationFrame`.
4. Prefetch the next missing page before the scrubber reaches a cache edge.

The result is a chart that stays responsive at 60 FPS while live telemetry continues to arrive at 20 Hz.

![Historical retrieval class diagram](./diagrams/historical-telemetry-retrieval-class.png)

![Historical retrieval sequence diagram](./diagrams/historical-telemetry-retrieval-sequence.png)

## Radically Simple Shape
- One chart displays one `metricId`.
- Live data arrives from SignalR and is appended to the hot cache.
- Historical data arrives from `HttpClient` observables.
- The store owns state with Signals.
- The chart adapter owns rendering and runs outside Angular change detection.

## Vertical Slices For ATDD

### Slice 1. Stable History Page Contract
**Goal**  
The client can ask for the next or previous page for one metric and always receive a deterministic result.

**ATDD**
- Given telemetry exists for one metric across many timestamps
- When the client requests `pageSize=1024` with no cursor
- Then the API returns the newest 1024 points sorted ascending by `timestampUtc, sampleId`
- And the response contains `previousCursor` when older data exists
- And the response contains `nextCursor` only when newer data exists

**Notes**
- Server default page size: `1024`
- Server max page size: `4096`
- Cursor fields: `metricId`, `timestampUtc`, `sampleId`, `direction`
- Response order is always ascending so the client merge path stays trivial

### Slice 2. Signal Cache For Historical Coverage
**Goal**  
The chart does not refetch data that is already loaded.

**ATDD**
- Given the store already holds pages covering `10:00:00Z` to `10:03:24Z`
- When the user scrubs inside that loaded range
- Then no HTTP request is sent
- And the visible chart data is derived from cached points only

**Notes**
- Store keeps immutable page entries keyed by cursor
- Store also keeps merged coverage ranges so gap checks are O(number of ranges), not O(number of points)
- Pages are merged by cursor, not by array index

### Slice 3. Predictive Prefetch While Scrubbing
**Goal**  
The chart stays ahead of the scrubber and avoids visible fetch stalls.

**ATDD**
- Given the viewport is within 20 percent of a loaded range edge
- When the user keeps scrubbing toward that edge
- Then the store starts loading the adjacent page in the same direction
- And the current chart stays interactive while the request is in flight

**Notes**
- Only one forward prefetch and one backward prefetch may be in flight per metric
- Prefetch is cancelled when the metric changes
- Prefetch uses the same HTTP observable contract as direct loads

### Slice 4. 60 FPS Chart Projection
**Goal**  
The chart updates only on animation frames and only with visible points.

**ATDD**
- Given the store contains more points than are currently visible
- When the viewport changes
- Then the chart adapter receives only visible points for the current range
- And Chart.js is updated with `chart.update('none')`
- And Angular change detection is not used for each sample or scrub step

**Notes**
- Rendering runs inside `requestAnimationFrame`
- `Chart.js` options: `parsing: false`, `normalized: true`, animations disabled
- When visible points exceed horizontal pixels, the projector emits a reduced series using one sample bucket per pixel column with min/max preservation

## Contracts

### HTTP Request
`GET /api/telemetry/history?metricId={metricId}&pageSize={pageSize}&direction={Older|Newer}&cursorTimestampUtc={timestamp?}&cursorSampleId={sampleId?}`

### HTTP Response
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

## Classes, Interfaces, Enums, Types

| Name | Kind | Responsibility |
| --- | --- | --- |
| `ChartComponent` | Angular component | Hosts the chart, scrubber, and mode switch. Delegates data and rendering work to the store and adapter. |
| `TelemetryHistoryStore` | Angular injectable service | Signal-based state owner for `metricId`, `viewport`, `mode`, page cache, coverage ranges, loading flags, and visible series. |
| `TelemetryHistoryApiClient` | Angular injectable service | Uses `HttpClient` and RxJS observables to fetch history pages from the backend. No local state. |
| `ChartViewportProjector` | TypeScript class | Converts loaded telemetry into the exact visible dataset for the current viewport and canvas width. |
| `ChartJsSeriesAdapter` | TypeScript class | Owns the `Chart.js` instance, applies mutable dataset updates, and schedules redraws on animation frames. |
| `HistoryPageCacheEntry` | Type | Immutable cached page with `items`, `previousCursor`, `nextCursor`, `rangeStartUtc`, and `rangeEndUtc`. |
| `LoadedRange` | Type | Inclusive time range already covered in local cache for one metric. Used for gap detection and prefetch decisions. |
| `HistoricalTelemetryQuery` | Type | Client-side request object sent to `TelemetryHistoryApiClient`. Contains metric, page size, cursor, and direction. |
| `TelemetryHistoryPageDto` | Type | Server response contract containing ordered items and continuation cursors. |
| `TelemetryHistoryCursorDto` | Type | Cursor contract using `metricId`, `timestampUtc`, `sampleId`, and `direction`. |
| `TelemetryPointDto` | Type | Single telemetry sample with `sampleId`, `timestampUtc`, and `value`. |
| `ChartMode` | Enum | `Live` or `Historical`. Controls whether the viewport follows now or scrubber time. |
| `CursorDirection` | Enum | `Older` or `Newer`. Keeps paging explicit and stable. |

## State Model

| Signal | Purpose |
| --- | --- |
| `metricId` | Active telemetry metric for the chart. |
| `mode` | `Live` or `Historical`. |
| `viewport` | Visible time range in UTC. |
| `pageCache` | Map of loaded page entries keyed by cursor signature. |
| `loadedRanges` | Merged ranges already covered by cached history. |
| `visibleSeries` | Computed points currently projected for the chart. |
| `isInitialLoadPending` | True while the first history page is loading. |
| `isForwardPrefetchPending` | Guards duplicate forward fetches. |
| `isBackwardPrefetchPending` | Guards duplicate backward fetches. |
| `lastError` | Last non-fatal fetch error to surface in the UI. |

## Fetch And Merge Rules
- The store never inserts one point at a time into the chart.
- The store merges full pages into cache, then recomputes `loadedRanges`.
- The projector slices the merged cache by viewport start and end.
- Live points are appended to the same logical timeline so switching between `Live` and `Historical` mode does not need a separate chart path.
- If the viewport overlaps both live cache and historical cache, the projector merges them and removes duplicates by `sampleId`.

## Rendering Rules
- `ChartComponent` creates the chart once.
- `ChartJsSeriesAdapter` mutates the existing dataset array instead of replacing the entire chart object.
- All rendering work runs in `NgZone.runOutsideAngular`.
- The adapter coalesces multiple store changes into one animation-frame render.
- The chart never animates historical page loads; it only paints the new dataset.

## Failure Handling
- If one history request fails, the chart keeps the last good data on screen.
- The store records the error and exposes a retry command for the missing gap.
- Cursor responses are treated as authoritative; the client never guesses the next cursor.

## Out Of Scope
- Multi-metric overlays in one chart
- Server-side aggregation beyond cursor paging
- Offline storage in the browser
