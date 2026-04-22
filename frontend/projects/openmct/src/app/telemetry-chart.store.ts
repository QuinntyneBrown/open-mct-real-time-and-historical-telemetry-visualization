import { Injectable, effect, inject, signal } from '@angular/core';
import { TelemetryHistoryClient } from './telemetry-history.client';
import { TelemetryHistoryStore } from './telemetry-history.store';
import { TelemetryLiveClient } from './telemetry-live.client';

@Injectable({ providedIn: 'root' })
export class TelemetryChartStore {
  readonly activeTelemetryId = signal<string | null>(null);
  readonly mode = signal<'live' | 'historical'>('live');
  private readonly live = inject(TelemetryLiveClient);
  private readonly history = inject(TelemetryHistoryClient);
  private readonly historyStore = inject(TelemetryHistoryStore);
  readonly latestSample = this.live.latestSample;
  readonly liveSamples = this.live.recentSamples;
  readonly connectionState = this.live.connectionState;

  constructor() {
    effect(() => {
      const id = this.activeTelemetryId();
      if (id) this.live.connect(id);
      else this.live.disconnect();
      if (id && this.mode() === 'historical') this.historyStore.loadInitial(id);
    });
    effect(() => {
      const mode = this.mode();
      const telemetryId = this.activeTelemetryId();
      if (mode === 'historical' && telemetryId) {
        this.historyStore.loadInitial(telemetryId);
      }
    });
  }
}
