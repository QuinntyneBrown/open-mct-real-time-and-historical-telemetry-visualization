import { CommonModule } from '@angular/common';
import { Component, signal, inject, OnInit } from '@angular/core';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatCardModule } from '@angular/material/card';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatButtonModule } from '@angular/material/button';
import { TelemetryCatalogClient } from './telemetry-catalog.client';
import { TelemetryChartStore } from './telemetry-chart.store';
import { TelemetryHistoryClient } from './telemetry-history.client';
import { TelemetryHistoryStore } from './telemetry-history.store';
import { TelemetryChartComponent } from './telemetry-chart.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    CommonModule,
    MatToolbarModule,
    MatCardModule,
    MatSelectModule,
    MatButtonToggleModule,
    MatIconModule,
    MatFormFieldModule,
    MatInputModule,
    MatProgressSpinnerModule,
    MatButtonModule,
    TelemetryChartComponent
  ],
  templateUrl: './app.html',
  styleUrl: './app.scss'
})
export class App implements OnInit {
  protected readonly title = signal('Telemetry Visualization');
  protected readonly catalog = inject(TelemetryCatalogClient);
  protected readonly store = inject(TelemetryChartStore);
  protected readonly history = inject(TelemetryHistoryClient);
  protected readonly historyStore = inject(TelemetryHistoryStore);

  ngOnInit() {
    this.catalog.loadCatalog();
  }
}
