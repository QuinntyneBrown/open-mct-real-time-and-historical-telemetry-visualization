import { Injectable, signal } from '@angular/core';
import { HubConnection, HubConnectionBuilder, LogLevel } from '@microsoft/signalr';

export interface TelemetrySample {
  telemetryId: string;
  timestampUtc: string;
  value: number;
}

export interface ChartSample {
  timestampUtc: string;
  value: number | null;
}

@Injectable({ providedIn: 'root' })
export class TelemetryLiveClient {
  private static readonly maxSamples = 40;
  private connection: HubConnection | null = null;
  private currentTelemetryId: string | null = null;
  readonly latestSample = signal<TelemetrySample | null>(null);
  readonly recentSamples = signal<ChartSample[]>([]);
  readonly connectionState = signal<'disconnected' | 'connecting' | 'connected'>('disconnected');

  private createPlaceholderSamples() {
    const now = Date.now();
    return Array.from({ length: TelemetryLiveClient.maxSamples }, (_, index) => ({
      timestampUtc: new Date(now - (TelemetryLiveClient.maxSamples - index - 1) * 1000).toISOString(),
      value: null
    }));
  }

  connect(telemetryId: string) {
    if (this.currentTelemetryId === telemetryId) return;
    this.disconnect();
    this.connectionState.set('connecting');
    this.recentSamples.set(this.createPlaceholderSamples());
    this.connection = new HubConnectionBuilder()
      .withUrl('/telemetryHub')
      .configureLogging(LogLevel.Warning)
      .build();
    this.connection.on('ReceiveTelemetry', (sample: TelemetrySample) => {
      this.latestSample.set(sample);
      this.recentSamples.update(samples => [...samples, sample].slice(-TelemetryLiveClient.maxSamples));
    });
    this.connection.start().then(() => {
      this.connectionState.set('connected');
      this.connection!.invoke('SubscribeTelemetry', telemetryId);
      this.currentTelemetryId = telemetryId;
    }).catch(() => {
      this.connectionState.set('disconnected');
    });
  }

  disconnect() {
    if (this.connection) {
      if (this.currentTelemetryId)
        this.connection.invoke('UnsubscribeTelemetry', this.currentTelemetryId);
      this.connection.stop();
      this.connection = null;
      this.currentTelemetryId = null;
      this.connectionState.set('disconnected');
      this.latestSample.set(null);
      this.recentSamples.set([]);
    }
  }
}
