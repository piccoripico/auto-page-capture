# System Test Notes

This project uses Playwright for browser-level system tests.

## Automated suite

Run the default automated suite:

```bash
npm run test:e2e
```

This suite is designed to run headless and verify stable flows such as:

- options editing and persistence
- sidebar live-update behavior
- popup summary and history rendering
- recent-history clearing
- alarm synchronization
- clear user-facing failure behavior when host access is missing

## Manual success smoke test

The successful host-permission flow is not fully automated in the default suite because optional host access requires a real browser permission grant.

Run the manual smoke test in a headed browser:

```bash
npm run test:e2e:manual
```

When the popup shows `Grant permission`, click it and accept the browser permission prompt once. The test then continues and verifies:

- site access becomes available
- successful runs across multiple save formats
- downloads for `HTML`, `MHTML`, `PDF`, `PNG`, `JPEG`, and `WebP`
- content or file signatures that match each expected format

## Why there are two paths

Browser extension system tests can automate most UI and storage behavior, but site-access grants are intentionally protected by the browser. Keeping the successful permission flow as a manual-headed smoke test makes the default suite stable while still giving you a repeatable way to validate the full happy path.
