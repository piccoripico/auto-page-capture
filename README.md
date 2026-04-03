# Auto Page Capture

Auto Page Capture is a Manifest V3 browser extension for Microsoft Edge and Google Chrome.

It opens a target page on a schedule, optionally performs pre-save actions, and saves the result to your local downloads folder as MHTML, HTML, PDF, or a full-page image.

## Screenshots

| Popup                                         | Settings                                           |
| --------------------------------------------- | -------------------------------------------------- |
| ![Popup screen](docs/images/popup-screen.png) | ![Settings screen](docs/images/options-screen.png) |

## Why This Extension Exists

Many pages are only useful after they finish loading, after a button is clicked, or after a small interaction updates the page.

This extension is built for that workflow:

- open a page automatically
- wait for the right state
- click or fill what is needed
- save the final result in a format you can keep locally

## Features

- Multiple capture items with independent schedules
- Flexible schedules:
  - run once
  - every N minutes / hours / days / weeks
  - monthly on a chosen day
- Local file URL support:
  - `file://` targets can be registered
  - requires the browser's `Allow access to file URLs` setting for this extension
- Manual run from the popup
- Automatic scheduled capture with `chrome.alarms`
- Pre-save actions such as:
  - wait
  - click by visible text
  - click by CSS selector
  - click by XPath
  - set an input value
  - wait for an element or attribute state
- Save formats:
  - `MHTML`
  - `HTML`
  - `PDF`
  - `PNG`
  - `JPEG`
  - `WebP`
- Full logs in the settings page
- Recent history in the popup
- Log export as JSON or CSV
- Per-site permission grant and revoke from the settings page
- UI language switching

## Save Formats

- `MHTML`: single-file web archive
- `HTML`: DOM snapshot of the current page state
- `PDF`: rendered through the browser print pipeline
- `PNG / JPEG / WebP`: full-page screenshot captured through the browser debugger API
- PDF output settings per item:
  - page orientation
  - paper size
  - margin preset
  - background graphics on/off
- JPEG output settings per item:
  - quality (1-100)

## Privacy

This extension saves captured pages to local downloads only.

- No external server upload
- No cloud sync
- No built-in remote analytics

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
- `file://` URLs also require the extension details setting `Allow access to file URLs`

## Typical Flow

1. Create an item in the settings page
2. Set the target URL
3. Choose a save format
4. Add one or more schedules
5. Add optional pre-save actions
6. Grant site access for the target origin
7. Save the configuration
8. Run it manually from the popup or let the schedule trigger it

## Scheduling Notes

Scheduled captures run only while the browser is running and the extension is available.

If the browser is fully closed at a scheduled time, that run is skipped. When the browser starts again, the extension resumes from the next upcoming scheduled time instead of replaying missed runs.

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

The default automated suite covers settings editing, sidebar live updates, popup rendering, recent-history clearing, alarm synchronization, and file-URL guidance.

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
