# Angular Chart Component: High-Performance Historical Telemetry Retrieval Design

## Overview
This design enables smooth, high-frequency (20 Hz) telemetry visualization using Chart.js in Angular, supporting both real-time SignalR streaming and efficient historical data scrubbing via HTTP with cursor-based paging. State is managed with Angular Signals for optimal UI reactivity and performance.

---

## 1. Data Flow Architecture

- **Real-Time Telemetry**: Consumed via SignalR, appended to a live buffer.
- **Historical Telemetry**: Fetched via HTTP, paged by timestamp & metric ID, merged into the chart buffer.
- **State Management**: Angular Signals for all chart state (data, cursors, loading, error, etc.).
- **Chart Rendering**: Chart.js, updated via Angular Signals, targeting 60 FPS.

---

## 2. Historical Telemetry Retrieval (Optimal Solution)

### a. Cursor-Based Paging
- **API**: `GET /telemetry?metricId={id}&from={timestamp}&pageSize={N}`
- **Response**: `{ data: TelemetryPoint[], nextCursor: {timestamp, metricId} | null }`
- **Paging**: Use `nextCursor` for subsequent requests.

### b. RxJS HTTP Integration
- Use `HttpClient` returning `Observable<HistoricalPage>`.
- Expose a function: `fetchHistoricalPage(cursor): Observable<HistoricalPage>`.
- Use `expand` for seamless multi-page fetches if needed.

### c. Angular Signals for State
- Store chart data, cursors, and loading state in Angular Signals.
- Use computed signals for derived state (e.g., visible window, isLoading).
- Update chart data signal on each page fetch.

### d. Scrubbing & Buffering
- On user scrub, calculate required time window.
- If data missing, trigger fetch for missing pages.
- Pre-fetch ahead of scrub position for seamless experience.
- Use a ring buffer for chart data to minimize memory churn.

### e. Glitch-Free, 60 FPS Rendering
- Chart.js updates only when data signal changes.
- Use `requestAnimationFrame` for chart redraws if needed.
- Avoid full chart re-renders; update only changed data.

---

## 3. Pseudocode: Historical Fetch Logic

```typescript
// Signal for chart data
const chartData = signal<TelemetryPoint[]>([]);
const isLoading = signal(false);
const error = signal<string | null>(null);
const cursor = signal<Cursor | null>(null);

function fetchHistoricalPage(cursor: Cursor): Observable<HistoricalPage> {
  return http.get<HistoricalPage>(`/telemetry`, { params: { ...cursor } });
}

function loadHistoricalWindow(targetWindow: TimeRange) {
  isLoading.set(true);
  fetchHistoricalPage({ ...targetWindow })
    .pipe(
      expand(page => page.nextCursor ? fetchHistoricalPage(page.nextCursor) : EMPTY),
      takeWhile(page => !hasFullWindow(page.data, targetWindow), true),
      reduce((acc, page) => acc.concat(page.data), [] as TelemetryPoint[])
    )
    .subscribe({
      next: data => chartData.set(data),
      error: err => error.set(err.message),
      complete: () => isLoading.set(false)
    });
}
```

---

## 4. Key Performance Practices
- **Signals for all state**: No RxJS Subjects/BehaviorSubjects for store.
- **Efficient buffer management**: Use ring buffer for chart data.
- **Prefetching**: Always fetch ahead of user scrub position.
- **Minimal chart updates**: Only update Chart.js when data actually changes.
- **Debounce scrubbing**: Avoid excessive HTTP requests during rapid user input.

---

## 5. Component Structure
- `ChartComponent`: Handles rendering, state, and data fetch logic.
- `TelemetryService`: Encapsulates SignalR and HTTP logic, exposes observables for real-time and historical data.
- `SignalsStore`: Holds all signals for chart state.

---

## 6. Diagram

```
[User Scrub] → [SignalsStore] → [TelemetryService.fetchHistoricalPage()] → [HTTP Observable] → [SignalsStore.chartData] → [Chart.js Render]
```

---

## 7. Summary
- Use Angular Signals for all state.
- Use RxJS only for HTTP and SignalR integration.
- Use cursor-based paging for historical data.
- Prefetch and buffer for smooth scrubbing.
- Update Chart.js only on data change, at 60 FPS.

---

**This design ensures a radically simple, high-performance, and maintainable solution for real-time and historical telemetry visualization in Angular.**
