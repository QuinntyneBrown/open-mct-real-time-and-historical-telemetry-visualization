import { Injectable, signal } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class TelemetryCatalogClient {
  readonly telemetryIds = signal<string[]>([]);

  async loadCatalog() {
    const res = await fetch('/api/telemetry/catalog');
    if (res.ok) {
      this.telemetryIds.set(await res.json());
    }
  }
}
