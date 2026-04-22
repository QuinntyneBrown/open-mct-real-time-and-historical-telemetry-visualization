import { Injectable, signal } from '@angular/core';
import { TelemetryHistoryClient, TelemetryHistoryCursor, TelemetryHistoryCursorResponse } from './telemetry-history.client';

@Injectable({ providedIn: 'root' })
export class TelemetryHistoryStore {
  readonly page = signal<TelemetryHistoryCursorResponse | null>(null);
  readonly loading = signal(false);
  readonly error = signal<string | null>(null);

  constructor(private client: TelemetryHistoryClient) {}

  async loadInitial(telemetryId: string) {
    return this.loadPage({ telemetryId, pageSize: 40, direction: 'Older' });
  }

  async loadOlder(telemetryId: string) {
    const cursor = this.page()?.previousCursor;
    if (!cursor) return;
    return this.loadPage({
      telemetryId,
      pageSize: 40,
      direction: 'Older',
      cursorTimestampUtc: cursor.timestampUtc,
      cursorSampleId: cursor.sampleId
    });
  }

  async loadNewer(telemetryId: string) {
    const cursor = this.page()?.nextCursor;
    if (!cursor) return;
    return this.loadPage({
      telemetryId,
      pageSize: 40,
      direction: 'Newer',
      cursorTimestampUtc: cursor.timestampUtc,
      cursorSampleId: cursor.sampleId
    });
  }

  async scrubTo(cursor: TelemetryHistoryCursor, telemetryId: string) {
    return this.loadPage({
      telemetryId,
      pageSize: 40,
      direction: 'Older',
      cursorTimestampUtc: cursor.timestampUtc,
      cursorSampleId: cursor.sampleId
    });
  }

  private async loadPage(request: {
    telemetryId: string;
    pageSize: number;
    direction: 'Older' | 'Newer';
    cursorTimestampUtc?: string;
    cursorSampleId?: number;
  }) {
    this.loading.set(true);
    this.error.set(null);
    try {
      const page = await this.client.loadPage(request);
      this.page.set(page);
      return page;
    } catch (e: any) {
      this.error.set(e.message);
      throw e;
    } finally {
      this.loading.set(false);
    }
  }
}
