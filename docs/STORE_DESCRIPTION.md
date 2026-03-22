# Auto Page Capture - Store Description Source

This file is intended as a shared source text for the Microsoft Edge Add-ons listing, the Chrome Web Store listing, and the GitHub README.

## Short description

Save web pages on a schedule in MHTML, HTML, PDF, or full-page image formats, with optional pre-save actions.

## Main description

Auto Page Capture is a browser extension for Microsoft Edge and Google Chrome that saves web pages on a schedule, with optional pre-save actions.

You can register multiple capture items. For each item, you can set a URL, one or more schedules, a save format, a download folder, a filename prefix, and optional action steps to run before saving.

Supported save formats:

- MHTML
- HTML
- PDF
- PNG
- JPEG
- WebP

Main features:

- Multiple items with independent schedules
- Optional pre-save actions such as waiting, clicking, and setting values
- Manual run from the popup
- Recent history in the popup
- Full logs on the settings page
- Log export as JSON or CSV
- Per-site permission grant/revoke from the settings page
- UI language selection

This extension saves the currently rendered page to local downloads. It does not upload captured data to an external server.

Permissions are used for these reasons:

- storage: save items, settings, and logs
- alarms: run scheduled captures
- downloads: save captured files
- tabs / scripting: open pages and run optional pre-save actions
- pageCapture: save pages as MHTML
- debugger: save pages as PDF or full-page images (PNG / JPEG / WebP)

Site access is requested per target site from the settings page.

Notes:

- PDF and image capture require the extension's debugger permission.
- If DevTools is open for the same tab, PDF or image capture can fail until DevTools is closed.
- Site permission changes are reflected immediately.
- Other settings are saved when you press Save.
- Logs are capped by the global log limit.
- Recent history can be cleared without deleting the full log.
