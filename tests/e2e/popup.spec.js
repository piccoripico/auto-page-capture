import {
  buildActionRunSeedState,
  buildFileUrlSeedState,
  buildSeedState,
} from './helpers/sample-config.js';
import { expect, test } from './fixtures/extension.js';

test.describe('popup page', () => {
  test('shows seeded summary, items, and history', async ({
    baseURL,
    extensionId,
    page,
    resetExtensionState,
  }) => {
    await resetExtensionState();

    await page.goto(`chrome-extension://${extensionId}/popup.html?mode=window`);
    await resetExtensionState(buildSeedState(baseURL));
    await page.locator('#refresh').click();

    await expect(page.locator('#summary-enabled')).toHaveText('1');
    await expect(page.locator('#summary-needs')).toHaveText('1');
    await expect(page.locator('#summary-history')).toHaveText('2');
    await expect(page.locator('#items .item-row')).toHaveCount(2);
    await expect(page.locator('#history .history-row')).toHaveCount(2);
    await expect(page.locator('#items .item-row').first()).toContainText('Local capture target');
    await expect(page.locator('#history .history-row').first()).toContainText(
      'Local capture target'
    );
  });

  test('clears recent history from the popup', async ({
    baseURL,
    extensionId,
    page,
    readExtensionState,
    resetExtensionState,
  }) => {
    await resetExtensionState();

    await page.goto(`chrome-extension://${extensionId}/popup.html?mode=window`);
    await resetExtensionState(buildSeedState(baseURL));
    await page.locator('#refresh').click();
    await expect(page.locator('#summary-history')).toHaveText('2');

    await page.locator('#clear-history').click();

    await expect(page.locator('#summary-history')).toHaveText('0');
    await expect(page.locator('#history .history-row')).toHaveCount(1);

    const stored = await readExtensionState(['recentHistory']);
    expect(stored.recentHistory).toEqual([]);
  });

  test('shows a clear error when a run is attempted without actual host access', async ({
    baseURL,
    extensionId,
    listDownloadedFiles,
    page,
    readExtensionState,
    resetExtensionState,
  }) => {
    const originPattern = `${new URL(baseURL).origin}/*`;

    await page.addInitScript((allowedOriginPattern) => {
      const originalContains = chrome.permissions.contains.bind(chrome.permissions);
      chrome.permissions.contains = async (details = {}) => {
        if ((details.origins || []).includes(allowedOriginPattern)) {
          return true;
        }
        return originalContains(details);
      };
    }, originPattern);

    await resetExtensionState();

    await page.goto(`chrome-extension://${extensionId}/popup.html?mode=window`);
    await resetExtensionState(buildActionRunSeedState(baseURL));
    await page.locator('#refresh').click();

    await expect(page.locator('#summary-enabled')).toHaveText('1');
    await expect(page.locator('#summary-needs')).toHaveText('0');
    await expect(page.locator('#summary-history')).toHaveText('0');

    await page.getByRole('button', { name: 'Run' }).click();
    await expect(page.locator('#status')).toContainText('Site access is not granted');
    await page.locator('#refresh').click();

    await expect(page.locator('#summary-history')).toHaveText('1');
    await expect(page.locator('#history .history-row').first()).toContainText(
      'Interactive capture target'
    );

    const stored = await readExtensionState(['logs', 'recentHistory']);
    expect(stored.logs[0].itemName).toBe('Interactive capture target');
    expect(stored.logs[0].status).toBe('error');
    expect(stored.logs[0].message).toContain('Site access is not granted');
    expect(stored.recentHistory[0].itemName).toBe('Interactive capture target');

    const downloadedFiles = await listDownloadedFiles();
    expect(downloadedFiles).toEqual([]);
  });

  test('guides the user when file URL access is not enabled', async ({
    extensionId,
    page,
    resetExtensionState,
    serviceWorkerEval,
  }) => {
    await page.addInitScript(() => {
      chrome.extension.isAllowedFileSchemeAccess = (callback) => callback(false);
    });

    await serviceWorkerEval(async () => {
      chrome.extension.isAllowedFileSchemeAccess = (callback) => callback(false);
    });

    await resetExtensionState();

    await page.goto(`chrome-extension://${extensionId}/popup.html?mode=window`);
    await resetExtensionState(buildFileUrlSeedState());
    await page.locator('#refresh').click();

    await expect(page.locator('#summary-needs')).toHaveText('1');
    const row = page.locator('#items .item-row').first();
    await expect(row).toContainText('Local file capture');

    await row.getByRole('button', { name: 'How to enable' }).click();
    await expect(page.locator('#status')).toContainText('Allow access to file URLs');

    const result = await page.evaluate(async () => {
      return await chrome.runtime.sendMessage({ type: 'run-item-now', itemId: 'item_file_url' });
    });
    expect(result.ok).toBe(false);
    expect(result.entry.message).toContain('Allow access to file URLs');
  });
});
