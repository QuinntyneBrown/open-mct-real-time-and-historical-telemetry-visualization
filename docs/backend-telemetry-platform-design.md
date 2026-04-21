# Backend Telemetry Platform Detailed Design

## Overview
This design is the minimum backend shape that satisfies the requirements in [telemetry-visualization-high-level-requirements.md](./telemetry-visualization-high-level-requirements.md):

- one worker generates telemetry every 50 ms for each configured telemetry unique identifier
- one worker handles live publish plus database persistence
- one controller serves historical pages
- one repository performs inserts and cursor reads
- one SignalR hub manages live subscriptions

This is enough because the frontend charts one telemetry stream at a time, but the backend may host multiple configured telemetry streams. A more layered backend would add moving parts before it adds value.

This design covers `FR2`, `FR3`, `FR6`, `FR9`, `FR10`, `NFR4`, and `NFR5`.

![Backend telemetry class diagram](./diagrams/backend-telemetry-platform-class.png)

![Backend telemetry sequence diagram](./diagrams/backend-telemetry-platform-sequence.png)

## Radically Simple Shape
- `TelemetryGeneratorWorker` creates one `TelemetrySample` every 50 ms for each configured `telemetryId` and writes each sample into one bounded channel.
- `TelemetryDispatchWorker` reads that channel, pushes each sample to the matching SignalR group, and batches inserts to the database.
- `TelemetryController` serves historical pages directly from `TelemetryRepository`.
- `TelemetryHub` groups clients by `telemetryId`.
- `TelemetryRepository` is the only class that knows SQL.

## Vertical Slices For ATDD

### Slice 1. Generate Live Samples
**Requirements**  
`FR2`, `FR9`

**Goal**  
The backend continuously creates one live sample every 50 ms for each configured telemetry unique identifier.

**ATDD**
- Given the application is running with configured telemetry identifiers `temperature-a` and `pressure-b`
- When `TelemetryGeneratorWorker` runs for 5 seconds
- Then it produces about 100 samples for `temperature-a`
- And it produces about 100 samples for `pressure-b`
- And each sample has a unique `sampleId`
- And sample timestamps increase monotonically in UTC

### Slice 2. Deliver Only The Subscribed Live Stream
**Requirements**  
`FR2`, `FR9`, `NFR4`

**Goal**  
The backend sends a browser only the telemetry stream it subscribed to.

**ATDD**
- Given the generator is producing samples for `temperature-a` and `pressure-b`
- And a browser has subscribed to `temperature-a`
- When `TelemetryDispatchWorker` receives a sample from the channel
- Then it sends `temperature-a` samples to group `telemetry:temperature-a`
- And it sends `pressure-b` samples to group `telemetry:pressure-b`
- And the browser subscribed to `temperature-a` receives only `temperature-a`

### Slice 3. Publish Live And Persist Durably
**Requirements**  
`FR2`, `FR9`, `NFR4`, `NFR5`

**Goal**  
Generated telemetry is broadcast live and also stored in the database.

**ATDD**
- Given the generator is producing samples
- When `TelemetryDispatchWorker` receives a sample from the channel
- Then it sends the sample to the SignalR group for that telemetry identifier
- And it adds the sample to the current database batch
- And it flushes the batch on a short timer or when the batch is full

### Slice 4. Read History By Cursor
**Requirements**  
`FR3`, `FR6`, `FR10`, `NFR4`

**Goal**  
The API returns deterministic historical pages without using offset paging.

**ATDD**
- Given stored telemetry exists for one telemetry unique identifier
- When the client calls `GET /api/telemetry/history`
- Then the controller returns one ordered page
- And the page order is `timestampUtc` then `sampleId`
- And the response contains cursor metadata for older and newer pages

### Slice 5. Manage Live Subscriptions
**Requirements**  
`FR2`, `FR9`, `NFR4`

**Goal**  
Clients can subscribe to exactly one live telemetry stream.

**ATDD**
- Given a browser connects to SignalR
- When it calls `SubscribeTelemetry(telemetryId)`
- Then it joins group `telemetry:{telemetryId}`
- And new samples for that telemetry identifier are delivered to that group

## Runtime Design

### Configuration Rule
- `TelemetryOptions` contains the configured telemetry unique identifiers to generate.
- The generator loops over that configured list on each 50 ms tick.
- Each generated sample includes the originating `telemetryId`.

### Queue
- Use one bounded `Channel<TelemetrySample>`.
- The generator writes to the channel.
- The dispatch worker reads from the channel.
- `BoundedChannelFullMode.Wait` is sufficient for the small configured set of telemetry identifiers in the current scope and samples must not be dropped.

### Dispatch Loop
- Broadcast each sample to SignalR as soon as it is read from the channel.
- Add the same sample to the current insert batch.
- Flush the batch every 100 ms, every 256 samples, or on shutdown.
- If broadcast fails, log it and continue.
- If insert fails, log it and retry the same batch with backoff.

### Storage
`TelemetrySamples`

| Column | Type | Notes |
| --- | --- | --- |
| `TelemetryId` | `nvarchar(128)` | Telemetry unique identifier. |
| `TimestampUtc` | `datetime2(7)` | Event time in UTC. |
| `SampleId` | `uniqueidentifier` | Cursor tie-breaker. |
| `Value` | `float` | Numeric telemetry value. |
| `CreatedUtc` | `datetime2(7)` | Insert audit time. |

- Clustered primary key: `TelemetryId, TimestampUtc, SampleId`
- The table is append-only

### Cursor Query Shape
For `Older`:
```sql
SELECT TOP (@PageSize + 1) TelemetryId, TimestampUtc, SampleId, Value
FROM TelemetrySamples
WHERE TelemetryId = @TelemetryId
  AND (
    TimestampUtc < @CursorTimestampUtc
    OR (TimestampUtc = @CursorTimestampUtc AND SampleId < @CursorSampleId)
  )
ORDER BY TimestampUtc DESC, SampleId DESC;
```

For `Newer`:
```sql
SELECT TOP (@PageSize + 1) TelemetryId, TimestampUtc, SampleId, Value
FROM TelemetrySamples
WHERE TelemetryId = @TelemetryId
  AND (
    TimestampUtc > @CursorTimestampUtc
    OR (TimestampUtc = @CursorTimestampUtc AND SampleId > @CursorSampleId)
  )
ORDER BY TimestampUtc ASC, SampleId ASC;
```

The repository reverses `Older` results before returning them so every API response is ascending.

## HTTP And SignalR Contracts

### Controller Endpoint
`GET /api/telemetry/history?telemetryId={telemetryId}&pageSize={pageSize}&direction={Older|Newer}&cursorTimestampUtc={timestamp?}&cursorSampleId={sampleId?}`

### SignalR Hub
- Hub: `TelemetryHub`
- Server push method: `telemetrySample`
- Client subscribe method: `SubscribeTelemetry(string telemetryId)`
- Client unsubscribe method: `UnsubscribeTelemetry(string telemetryId)`

## Classes, Enums, And Types

| Name | Kind | Responsibility |
| --- | --- | --- |
| `TelemetryGeneratorWorker` | `BackgroundService` | Generates one live sample every 50 ms for each configured `telemetryId` and writes it to the channel. |
| `TelemetryDispatchWorker` | `BackgroundService` | Reads from the channel, publishes live samples to the matching SignalR group, and flushes batched inserts to storage. |
| `TelemetryController` | ASP.NET Core controller | Validates query input and returns historical pages. |
| `TelemetryRepository` | Infrastructure class | Executes batch insert SQL and cursor page SQL. |
| `TelemetryHub` | SignalR hub | Adds and removes clients from telemetry groups. |
| `TelemetrySample` | Type | One telemetry event with `telemetryId`, `timestampUtc`, `sampleId`, and `value`. |
| `TelemetryHistoryCursorDto` | Type | Cursor fields for deterministic paging. |
| `TelemetryHistoryPageDto` | Type | One ordered page of telemetry with continuation cursors and availability flags. |
| `TelemetryOptions` | Options type | Configured telemetry identifiers, sample period, and generator waveform settings. |
| `HistoryDirection` | Enum | `Older` or `Newer`. |

## Why This Is The Minimum
- One queue is enough for the small configured telemetry set in the current scope.
- One dispatch worker is enough to handle both live broadcast and durable insert at this load.
- One controller plus one repository is enough because historical retrieval is one query shape.
- SignalR groups give per-telemetry filtering without adding a separate subscription service.
- Splitting broadcast, persistence, and history mapping into extra services would increase complexity before it increases throughput.

## Out Of Scope
- Scale-out across multiple application nodes
- Retention jobs
- Authentication and authorization
