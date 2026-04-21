# Backend Telemetry Platform Detailed Design

## Overview
This design is the minimum backend shape that satisfies the requirements in [telemetry-visualization-high-level-requirements.md](./telemetry-visualization-high-level-requirements.md):

- one worker generates telemetry every 50 ms
- one worker handles live publish plus database persistence
- one controller serves historical pages
- one repository performs inserts and cursor reads
- one SignalR hub manages live subscriptions

This is enough because the system handles one metric per chart and only 20 samples per second. A more layered backend would add moving parts without solving a real requirement.

This design covers `FR2`, `FR3`, `FR6`, `FR9`, `FR10`, `NFR4`, and `NFR5`.

![Backend telemetry class diagram](./diagrams/backend-telemetry-platform-class.png)

![Backend telemetry sequence diagram](./diagrams/backend-telemetry-platform-sequence.png)

## Radically Simple Shape
- `TelemetryGeneratorWorker` creates one `TelemetrySample` every 50 ms and writes it into one bounded channel.
- `TelemetryDispatchWorker` reads that channel, pushes the sample to SignalR, and batches inserts to the database.
- `TelemetryController` serves historical pages directly from `TelemetryRepository`.
- `TelemetryHub` groups clients by `metricId`.
- `TelemetryRepository` is the only class that knows SQL.

## Vertical Slices For ATDD

### Slice 1. Generate Live Samples
**Requirements**  
`FR2`, `FR9`

**Goal**  
The backend continuously creates one live sample every 50 ms.

**ATDD**
- Given the application is running
- When `TelemetryGeneratorWorker` runs for 5 seconds
- Then it produces about 100 samples
- And each sample has a unique `sampleId`
- And sample timestamps increase monotonically in UTC

### Slice 2. Publish Live And Persist Durably
**Requirements**  
`FR2`, `FR9`, `NFR4`, `NFR5`

**Goal**  
Generated telemetry is broadcast live and also stored in the database.

**ATDD**
- Given the generator is producing samples
- When `TelemetryDispatchWorker` receives a sample from the channel
- Then it sends the sample to the SignalR group for that metric
- And it adds the sample to the current database batch
- And it flushes the batch on a short timer or when the batch is full

### Slice 3. Read History By Cursor
**Requirements**  
`FR3`, `FR6`, `FR10`, `NFR4`

**Goal**  
The API returns deterministic historical pages without using offset paging.

**ATDD**
- Given stored telemetry exists for one metric
- When the client calls `GET /api/telemetry/history`
- Then the controller returns one ordered page
- And the page order is `timestampUtc` then `sampleId`
- And the response contains cursor metadata for older and newer pages

### Slice 4. Manage Live Subscriptions
**Requirements**  
`FR2`, `FR9`, `NFR4`

**Goal**  
Clients can subscribe to exactly one live metric stream.

**ATDD**
- Given a browser connects to SignalR
- When it calls `SubscribeMetric(metricId)`
- Then it joins group `metric:{metricId}`
- And new samples for that metric are delivered to that group

## Runtime Design

### Queue
- Use one bounded `Channel<TelemetrySample>`.
- The generator writes to the channel.
- The dispatch worker reads from the channel.
- `BoundedChannelFullMode.Wait` is sufficient because one metric at 20 Hz is low volume and samples must not be dropped.

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
| `MetricId` | `nvarchar(128)` | Metric key. |
| `TimestampUtc` | `datetime2(7)` | Event time in UTC. |
| `SampleId` | `uniqueidentifier` | Cursor tie-breaker. |
| `Value` | `float` | Numeric telemetry value. |
| `CreatedUtc` | `datetime2(7)` | Insert audit time. |

- Clustered primary key: `MetricId, TimestampUtc, SampleId`
- The table is append-only

### Cursor Query Shape
For `Older`:
```sql
SELECT TOP (@PageSize + 1) MetricId, TimestampUtc, SampleId, Value
FROM TelemetrySamples
WHERE MetricId = @MetricId
  AND (
    TimestampUtc < @CursorTimestampUtc
    OR (TimestampUtc = @CursorTimestampUtc AND SampleId < @CursorSampleId)
  )
ORDER BY TimestampUtc DESC, SampleId DESC;
```

For `Newer`:
```sql
SELECT TOP (@PageSize + 1) MetricId, TimestampUtc, SampleId, Value
FROM TelemetrySamples
WHERE MetricId = @MetricId
  AND (
    TimestampUtc > @CursorTimestampUtc
    OR (TimestampUtc = @CursorTimestampUtc AND SampleId > @CursorSampleId)
  )
ORDER BY TimestampUtc ASC, SampleId ASC;
```

The repository reverses `Older` results before returning them so every API response is ascending.

## HTTP And SignalR Contracts

### Controller Endpoint
`GET /api/telemetry/history?metricId={metricId}&pageSize={pageSize}&direction={Older|Newer}&cursorTimestampUtc={timestamp?}&cursorSampleId={sampleId?}`

### SignalR Hub
- Hub: `TelemetryHub`
- Server push method: `telemetrySample`
- Client subscribe method: `SubscribeMetric(string metricId)`
- Client unsubscribe method: `UnsubscribeMetric(string metricId)`

## Classes, Enums, And Types

| Name | Kind | Responsibility |
| --- | --- | --- |
| `TelemetryGeneratorWorker` | `BackgroundService` | Generates one live sample every 50 ms and writes it to the channel. |
| `TelemetryDispatchWorker` | `BackgroundService` | Reads from the channel, publishes live samples to SignalR, and flushes batched inserts to storage. |
| `TelemetryController` | ASP.NET Core controller | Validates query input and returns historical pages. |
| `TelemetryRepository` | Infrastructure class | Executes batch insert SQL and cursor page SQL. |
| `TelemetryHub` | SignalR hub | Adds and removes clients from metric groups. |
| `TelemetrySample` | Type | One telemetry event with `metricId`, `timestampUtc`, `sampleId`, and `value`. |
| `TelemetryHistoryCursorDto` | Type | Cursor fields for deterministic paging. |
| `TelemetryHistoryPageDto` | Type | One ordered page of telemetry with continuation cursors and availability flags. |
| `TelemetryOptions` | Options type | Metric id, sample period, and generator waveform settings. |
| `HistoryDirection` | Enum | `Older` or `Newer`. |

## Why This Is The Minimum
- One queue is enough for one metric at 20 Hz.
- One dispatch worker is enough to handle both live broadcast and durable insert at this load.
- One controller plus one repository is enough because historical retrieval is one query shape.
- Splitting broadcast, persistence, and history mapping into extra services would increase complexity before it increases throughput.

## Out Of Scope
- Scale-out across multiple application nodes
- Retention jobs
- Authentication and authorization
