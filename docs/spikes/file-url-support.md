# File URL Support Spike

## Goal

Evaluate whether Auto Page Capture can support `file://` URLs in a practical way on Chromium browsers.

## Summary

`file://` support looks feasible, but only with an explicit user action in the browser's extension details page.

- Chrome allows `file` match patterns such as `file:///`.
- Access to `file://` is not automatic, even if the extension declares the pattern.
- Since Chrome 118, opening `file://` with `chrome.tabs` or `chrome.windows` also requires the browser-level "Allow access to file URLs" toggle.
- The extension can detect that state with `chrome.extension.isAllowedFileSchemeAccess()`.

That means this is not the same as the current per-site permission flow for `http` and `https`.

## Current blockers in this repository

The current codebase is explicitly limited to `http` and `https`.

- [`src/manifest.json`](../../src/manifest.json)
  - `optional_host_permissions` only includes `https://*/*` and `http://*/*`.
- [`src/lib/shared.js`](../../src/lib/shared.js)
  - `deriveOriginPattern()` rejects anything other than `http:` or `https:`.
  - `validateItem()` reports a validation error for non-HTTP URLs.
- [`src/options.js`](../../src/options.js)
  - permission grant and revoke flows assume `chrome.permissions.request()` can resolve access.
- [`src/popup.js`](../../src/popup.js)
  - popup permission checks and grant buttons also assume the normal host-permission flow.
- [`src/service_worker.js`](../../src/service_worker.js)
  - runtime execution checks host permission, but does not check file-scheme access separately before opening a tab.

## Findings from official Chrome documentation

1. Match patterns can target local files.
   - Chrome documents `file` as a valid scheme and lists `file:///` as the special case for local files.
2. File access is a separate user-controlled browser setting.
   - Chrome's permissions guide says that if an extension needs to run on `file://` URLs, the user must enable access from the extension details page.
3. The extension can check this state programmatically.
   - `chrome.extension.isAllowedFileSchemeAccess()` returns whether the per-extension file access toggle is enabled.
4. Opening file URLs with Tabs or Windows is blocked unless that toggle is on.
   - Chrome's release notes state that, from Chrome 118, extensions need "Allow access to file URLs" enabled to open `file://` URLs with the Tabs or Windows APIs.

## Important design implications

- The current `Grant permission` button model will not be enough for `file://`.
  - For local files, the extension should guide the user to the extension details page instead of pretending it can grant access by itself.
- `file://` access is likely coarse-grained.
  - Chrome host permissions ignore path segments by convention for host permissions, so `file://` support should be treated as "local files in general", not "just one folder".
  - This is an inference from the host-permission documentation and match-pattern rules.
- Automated testing will probably stay partial.
  - The browser-controlled file-access toggle is similar to the current host-permission happy path: it is safer to cover with a headed/manual smoke test.

## Recommended MVP implementation

1. Manifest
   - Add `file:///` to `optional_host_permissions`.

2. Shared URL handling
   - Update `deriveOriginPattern()` to accept `file:` and return `file:///`.
   - Update validation text from `http/https only` to `http/https/file`.

3. Permission UX
   - In the settings page and popup, detect `file:` URLs.
   - Replace the normal `Grant permission` flow with a dedicated message such as:
     - "Enable Allow access to file URLs on the extension details page."
   - Keep normal request/revoke buttons only for `http` and `https`.

4. Runtime safety
   - Before `chrome.tabs.create()` for a `file://` item, call `chrome.extension.isAllowedFileSchemeAccess()`.
   - If access is disabled, fail with a clear actionable error message instead of the current generic navigation failure.

5. Testing
   - Add unit coverage for `deriveOriginPattern('file:///...')`.
   - Add one manual Playwright smoke scenario or manual checklist for the full happy path.

## Recommendation

This feature is worth implementing if local HTML files or exported reports are a meaningful use case.

The MVP looks like a small-to-medium change:

- low risk in core capture logic
- medium UX work because the permission flow is different
- manual verification required

If the desired requirement is "support local files after a one-time browser toggle", the feature looks realistic.

If the desired requirement is "let the extension grant local-file access entirely by itself" or "limit access to one local folder only", that does not look realistic with the documented Chromium model.

## References

- Chrome match patterns: https://developer.chrome.com/docs/extensions/develop/concepts/match-patterns
- Chrome declare permissions: https://developer.chrome.com/docs/extensions/develop/concepts/declare-permissions
- Chrome extension API: https://developer.chrome.com/docs/extensions/reference/api/extension
- Chrome permissions API: https://developer.chrome.com/docs/extensions/reference/api/permissions
- Chrome extension updates / file URL change in Chrome 118: https://developer.chrome.com/docs/extensions/whats-new
- Chrome Extensions October 2023 update: https://developer.chrome.com/blog/extension-news-october-2023
