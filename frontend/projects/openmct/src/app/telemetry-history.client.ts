import { Injectable, signal } from '@angular/core';

export interface TelemetryHistoryCursorRequest {
  telemetryId: string;
  cursorTimestampUtc?: string;
  cursorSampleId?: number;
  pageSize?: number;
  direction?: 'Older' | 'Newer';
}

export interface TelemetrySampleEntity {
  sampleId: number;
  telemetryId: string;
  timestampUtc: string;
  value: number;
}

export interface TelemetryHistoryCursor {
  timestampUtc: string;
  sampleId: number;
}

export interface TelemetryHistoryCursorResponse {
  samples: TelemetrySampleEntity[];
  previousCursor?: TelemetryHistoryCursor;
  nextCursor?: TelemetryHistoryCursor;
  hasPrevious: boolean;
  hasNext: boolean;
}

@Injectable({ providedIn: 'root' })
export class TelemetryHistoryClient {
  readonly loading = signal(false);
  readonly error = signal<string | null>(null);
  readonly page = signal<TelemetryHistoryCursorResponse | null>(null);

  async loadPage(request: TelemetryHistoryCursorRequest) {
    this.loading.set(true);
    this.error.set(null);
    try {
      const res = await fetch('/api/telemetry/history', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(request)
      });
      if (!res.ok) throw new Error('Failed to load history');
      const page = await res.json();
      this.page.set(page);
      return page as TelemetryHistoryCursorResponse;
    } catch (e: any) {
      this.error.set(e.message);
      throw e;
    } finally {
      this.loading.set(false);
    }
  }

  async loadInitialPage(telemetryId: string) {
    return this.loadPage({ telemetryId, pageSize: 40, direction: 'Older' });
  }
}
