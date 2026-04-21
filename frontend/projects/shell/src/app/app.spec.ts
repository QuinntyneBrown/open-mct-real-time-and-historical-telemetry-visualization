import { TestBed } from '@angular/core/testing';
import { App } from './app';

describe('App Shell Acceptance', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [App],
    }).compileComponents();
  });

  it('should create the app', () => {
    const fixture = TestBed.createComponent(App);
    const app = fixture.componentInstance;
    expect(app).toBeTruthy();
  });

  it('should render Angular Material toolbar', async () => {
    const fixture = TestBed.createComponent(App);
    await fixture.whenStable();
    const compiled = fixture.nativeElement as HTMLElement;
    const toolbar = compiled.querySelector('mat-toolbar');
    expect(toolbar).toBeTruthy();
    expect(toolbar?.textContent).toContain('Telemetry Visualization');
  });

  it('should render telemetry panel card', async () => {
    const fixture = TestBed.createComponent(App);
    await fixture.whenStable();
    const compiled = fixture.nativeElement as HTMLElement;
    const card = compiled.querySelector('mat-card.telemetry-card');
    expect(card).toBeTruthy();
    expect(card?.textContent).toContain('Telemetry Panel');
  });


  it('should render disabled telemetry selector placeholder', async () => {
    const fixture = TestBed.createComponent(App);
    await fixture.whenStable();
    const compiled = fixture.nativeElement as HTMLElement;
    const select = compiled.querySelector('mat-select');
    expect(select).toBeTruthy();
    expect(select?.getAttribute('aria-disabled')).toBe('true');
  });

  it('should render disabled mode toggle placeholder', async () => {
    const fixture = TestBed.createComponent(App);
    await fixture.whenStable();
    const compiled = fixture.nativeElement as HTMLElement;
    const toggle = compiled.querySelector('mat-button-toggle-group');
    expect(toggle).toBeTruthy();
    expect(toggle?.getAttribute('aria-disabled')).toBe('true');
  });

  it('should render chart placeholder', async () => {
    const fixture = TestBed.createComponent(App);
    await fixture.whenStable();
    const compiled = fixture.nativeElement as HTMLElement;
    const chart = compiled.querySelector('.chart-placeholder');
    expect(chart).toBeTruthy();
    expect(chart?.textContent).toContain('Chart will appear here');
  });
});
