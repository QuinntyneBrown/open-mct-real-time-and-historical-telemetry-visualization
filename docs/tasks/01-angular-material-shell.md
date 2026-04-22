Status: Complete

# Task 01: Scaffold Angular Material Application Shell

## Goal
Create the smallest possible Angular application shell in `frontend` so every later slice has a real browser surface to run on. This task must establish Angular Material, global theme styling, fonts, typography, and a stable page layout for the telemetry chart screen.

## Requirements
- `FR1A`
- High-Level User Experience Requirements

## Design References
- [Telemetry Visualization High-Level Requirements](../telemetry-visualization-high-level-requirements.md)
- [Historical Telemetry Retrieval Detailed Design](../historical-telemetry-retrieval-design.md)

## Vertical Slice
One browser page loads successfully and shows an Angular Material toolbar, page card, telemetry selector placeholder, mode toggle placeholder, and chart placeholder.

## In Scope
- Scaffold the Angular app into `frontend`
- Install and configure Angular Material
- Create `src/index.html`
- Configure theme and global styles in `angular.json`
- Add typography and icon fonts
- Build the initial application shell

## Not In Scope
- HTTP calls
- SignalR
- Chart.js
- Real telemetry data

## ATDD First
Write the acceptance test first.

### Acceptance Test
- Given the application starts
- When the user opens the root page
- Then an Angular Material toolbar is visible
- And a telemetry panel card is visible
- And a disabled telemetry selector placeholder is visible
- And a disabled live or historical mode control placeholder is visible
- And the page uses Angular Material typography instead of unstyled browser defaults

## Implementation Notes
- Use standalone Angular bootstrapping.
- Run `ng add @angular/material`.
- Use `MatToolbar`, `MatCard`, `MatFormField`, `MatSelect`, `MatButtonToggleGroup` or `MatSlideToggle`, and `MatProgressSpinner` placeholders.
- Keep the shell state local or in a single small Signals store stub. Do not introduce NgRx, Akita, or a custom component library.
- Create `frontend/src/index.html` with font links for `Roboto` and Material symbols or Material icons.
- Update `frontend/angular.json` so the project exists and includes:
  - the global stylesheet entry
  - the Angular Material theme stylesheet entry
  - assets and build targets required to run the app
- Create `frontend/src/styles.scss` with the minimal Angular Material theme and typography setup.

## Suggested Files
- `frontend/angular.json`
- `frontend/src/index.html`
- `frontend/src/styles.scss`
- `frontend/src/main.ts`
- `frontend/src/app/app.component.ts`
- `frontend/src/app/app.component.html`
- `frontend/src/app/app.component.scss`

## Verification

### Automated
- Run the Angular unit or component test that checks the shell renders the Material layout.
- Run `npm run build` in `frontend`.

### Manual
- Run the Angular app in the browser.
- Confirm the toolbar, card, selector placeholder, and mode placeholder render cleanly.

### Angular Material And Typography Regression
- Confirm `frontend/angular.json` includes the Angular Material theme stylesheet and the app stylesheet.
- Confirm `frontend/src/index.html` includes the configured font links.
- Confirm toolbar text, form field labels, button text, and card headings render with the intended Material typography.

### Radically Simple Verification
- The shell uses Angular Material primitives directly.
- No custom design system layer was introduced.
- No state library beyond Angular Signals was introduced.
- No feature code for later slices was added.

## Screenshot Evidence
- Start the app and capture `docs/tasks/evidence/01-angular-material-shell.png`.
- The screenshot must show the running browser page with the Material toolbar, page card, selector placeholder, and mode placeholder.
