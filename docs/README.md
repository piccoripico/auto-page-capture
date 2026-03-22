# Auto Page Capture

Browser extension for **Microsoft Edge** and **Google Chrome** that saves web pages on a schedule, with optional pre-save actions.

## What it does

Auto Page Capture lets you register multiple capture items. For each item, you can set:

- URL
- one or more schedules
- save format
- download folder
- filename prefix
- optional action steps to run before saving

Each item can be run manually from the popup, or automatically by schedule.

## Save formats

- **MHTML**: single-file page archive
- **HTML**: current DOM snapshot as HTML
- **PDF**: rendered through the browser print pipeline
- **PNG / JPEG / WebP**: full-page screenshot

## Main features

- Multiple items with independent schedules
- Optional pre-save actions such as waiting, clicking, and setting values
- Manual run from the popup
- Recent history in the popup
- Full logs on the settings page
- Log export as JSON or CSV
- Per-site permission grant/revoke from the settings page
- UI language selection

## Permissions

This extension saves the currently rendered page to local downloads.
It does **not** upload captured data to an external server.

It uses the following permissions for these reasons:

- **storage**: save items, settings, and logs
- **alarms**: run scheduled captures
- **downloads**: save captured files
- **tabs / scripting**: open pages and run optional pre-save actions
- **pageCapture**: save pages as MHTML
- **debugger**: save pages as PDF or full-page images (PNG / JPEG / WebP)

Site access is requested per target site from the settings page.

## Notes

- PDF and image capture require the extension's `debugger` permission.
- If DevTools is open for the same tab, PDF or image capture can fail until DevTools is closed.
- Site permission changes are reflected immediately.
- Other settings are saved when you press **Save**.
- Logs are capped by the global log limit.
- Recent history can be cleared without deleting the full log.

## Version 1.0.0

First stable release.
