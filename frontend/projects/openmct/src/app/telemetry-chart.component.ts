import { Component, Input, ElementRef, ViewChild, AfterViewInit, NgZone, OnChanges, SimpleChanges } from '@angular/core';
import Chart from 'chart.js/auto';
import { ChartSample, TelemetrySample } from './telemetry-live.client';
import { TelemetrySampleEntity } from './telemetry-history.client';

@Component({
  selector: 'telemetry-chart',
  standalone: true,
  template: `<canvas #chartCanvas style="width:100%;height:300px;"></canvas>`
})
export class TelemetryChartComponent implements AfterViewInit, OnChanges {
  @Input() samples: Array<TelemetrySample | TelemetrySampleEntity | ChartSample> = [];
  @ViewChild('chartCanvas', { static: true }) chartCanvas!: ElementRef<HTMLCanvasElement>;
  private chart: Chart | null = null;

  private formatTimeLabel(timestamp: string): string {
    const date = new Date(timestamp);
    if (Number.isNaN(date.getTime())) {
      return timestamp;
    }

    return date.toISOString().slice(11, 19);
  }

  constructor(private zone: NgZone) {}

  ngAfterViewInit() {
    this.zone.runOutsideAngular(() => {
      this.chart = new Chart(this.chartCanvas.nativeElement, {
        type: 'line',
        data: {
          labels: [],
          datasets: [{
            label: 'Value',
            data: [],
            borderColor: '#1976d2',
            backgroundColor: 'rgba(25, 118, 210, 0.2)',
            borderWidth: 2,
            pointRadius: 0,
            pointHoverRadius: 3,
            tension: 0.2,
            fill: false
          }]
        },
        options: {
          animation: false,
          responsive: true,
          scales: {
            x: {
              ticks: {
                autoSkip: false,
                maxRotation: 0,
                minRotation: 0,
                callback: (_value, index) => {
                  const labels = this.chart?.data.labels as string[] | undefined;
                  const currentLabel = labels?.[index];
                  if (!currentLabel) {
                    return '';
                  }

                  const currentSecond = this.formatTimeLabel(currentLabel);
                  const previousSecond = index > 0 && labels?.[index - 1]
                    ? this.formatTimeLabel(labels[index - 1])
                    : null;

                  return currentSecond === previousSecond ? '' : currentSecond;
                }
              }
            }
          }
        }
      });
      this.render();
    });
  }

  render() {
    if (!this.chart) return;
    const width = this.chartCanvas.nativeElement.width || 600;
    let points = this.samples;
    if (points.length > width) {
      // Simple reduction: sample every Nth point
      const step = Math.ceil(points.length / width);
      points = points.filter((_, i) => i % step === 0);
    }
    this.chart.data.labels = points.map(s => s.timestampUtc);
    this.chart.data.datasets[0].data = points.map(s => s.value);
    this.chart.update('none');
  }

  ngOnChanges(_changes: SimpleChanges) {
    this.zone.runOutsideAngular(() => this.render());
  }
}
