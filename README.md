# Auto Page Capture

Auto Page Capture is a Manifest V3 browser extension for Microsoft Edge and Google Chrome.

It opens a target page on a schedule, optionally performs actions before saving, and stores the result in the local downloads folder as MHTML, HTML, PDF, or a full-page image.

## Screenshots

| Popup                                         | Settings                                           |
| --------------------------------------------- | -------------------------------------------------- |
| ![Popup screen](docs/images/popup-screen.png) | ![Settings screen](docs/images/options-screen.png) |

## What It Does

This extension is designed for pages that are only useful after they finish loading or after a small interaction changes the page state.

Typical examples include reports, dashboards, charts, news pages, and pages that need a click, a wait, or a small form input before they are saved.

## Target URLs

The main target pages are:

- `http://...`
- `https://...`

Local files can also be used with:

- `file://...`

`file://` capture requires the browser setting `Allow access to file URLs` for this extension.

## Main Features

- Multiple capture items with independent schedules
- Manual run from the popup
- Scheduled capture with `chrome.alarms`
- Optional pre-save actions such as:
  - wait
  - click by visible text
  - click by CSS selector
  - click by XPath
  - set a form value
  - wait for an element or attribute state
- Save formats:
  - `MHTML`
  - `HTML`
  - `PDF`
  - `PNG`
  - `JPEG`
  - `WebP`
- Recent history in the popup
- Detailed logs in the settings page
- Log export as JSON or CSV
- Per-site permission grant and revoke from the settings page
- UI language switching

## Scheduling

Each item can use one or more schedules.

Supported schedule styles:

- run once
- every N minutes / hours / days / weeks
- monthly on a chosen day

Scheduled captures run only while the browser is running and the extension is available.

If the browser is fully closed at a scheduled time, that run is skipped. When the browser starts again, the extension resumes from the next upcoming scheduled time instead of replaying missed runs.

## Save Formats

- `MHTML`: single-file web archive
- `HTML`: snapshot of the current DOM state
- `PDF`: rendered through the browser print pipeline
- `PNG / JPEG / WebP`: full-page screenshot captured through the browser debugger API

Per-item output settings are available for supported formats.

PDF settings include:

- page orientation
- paper size
- margins
- scale
- background graphics
- header / footer display
- CSS page-size preference
- document outline

JPEG settings include:

- quality (1-100)

## Permissions

The extension uses these permissions for the following reasons:

- `storage`: save items, settings, recent history, and logs
- `alarms`: run scheduled captures
- `downloads`: save files locally
- `tabs`: open and manage target tabs
- `scripting`: run optional pre-save actions in the page
- `pageCapture`: create MHTML captures
- `debugger`: create PDF and full-page image captures
- `optional_host_permissions`: request site access only for target origins you register

For normal website capture, site access is requested per target `http://` / `https://` origin.

For `file://` capture, the browser's extension details page must allow access to file URLs.

## Privacy

Captured pages are saved to the local downloads folder only.

- No external server upload
- No cloud sync
- No built-in remote analytics

## Typical Flow

1. Create an item in the settings page
2. Set the target URL
3. Choose a save format
4. Add one or more schedules
5. Add optional pre-save actions if needed
6. Grant site access for the target origin
7. Save the configuration
8. Run it manually from the popup or let the schedule trigger it

## Load Unpacked

Load the extension from the `src` directory.

### Chrome

1. Open `chrome://extensions`
2. Enable Developer mode
3. Click `Load unpacked`
4. Select the `src` folder

### Microsoft Edge

1. Open `edge://extensions`
2. Enable Developer mode
3. Click `Load unpacked`
4. Select the `src` folder

## Development

Install dependencies:

```bash
npm install
```

Run lint:

```bash
npm run lint
```

Auto-fix lint issues where possible:

```bash
npm run lint:fix
```

Format the project:

```bash
npm run format
```

Create a release zip from the contents of `src/`:

```bash
npm run package
```

The archive is written to `dist/` and contains the extension files at the zip root, not an extra `src/` folder.

## Testing

Run the default automated Playwright suite:

```bash
npm test
```

Run the same suite in a visible browser window:

```bash
npm run test:e2e:headed
```

Open Playwright UI mode:

```bash
npm run test:e2e:ui
```

Run the manual headed smoke test for the successful host-permission flow:

```bash
npm run test:e2e:manual
```

If PowerShell blocks `npm`, use `npm.cmd` instead.

The default automated suite covers settings editing, scheduling, popup rendering, recent-history display, permission guidance, and compact popup history.

The manual smoke test exists because optional host-permission grants require a real browser confirmation. It verifies the successful flow and checks downloads across `HTML`, `MHTML`, `PDF`, `PNG`, `JPEG`, and `WebP`.

See [`tests/README.md`](tests/README.md) for details about automated versus manual system tests and the local test target page.

## Repository Layout

- `src/`: extension source loaded by the browser as an unpacked extension
- `src/lib/`: shared runtime helpers
- `src/_locales/`: localized UI strings
- `tests/e2e/`: automated Playwright system tests
- `tests/manual/`: headed manual smoke test for the permission-grant happy path
- `tests/site/`: local deterministic test page and tiny HTTP server used by Playwright
- `docs/`: screenshots and store-listing source files
- `playwright.config.js`: Playwright runner configuration

Generated test artifacts such as `playwright-report/` and `test-results/` are local-only and can be deleted or regenerated at any time.

## Notes

- PDF and image capture require the `debugger` permission
- PDF or image capture can fail while DevTools is attached to the same tab
- Site permission changes apply immediately
- Other settings are applied when you press `Save`
- Logs are capped by the configured log limit

## License

MIT
