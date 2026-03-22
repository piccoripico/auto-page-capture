import fs from 'node:fs/promises';

import { buildMultiFormatManualSeedState } from '../e2e/helpers/sample-config.js';
import { expect, test } from '../e2e/fixtures/extension.js';

const formatChecks = [
  {
    itemName: 'Manual HTML capture',
    filenamePattern: /manual-html-capture.*\.html$/i,
    verify: async (filePath) => {
      const savedHtml = await fs.readFile(filePath, 'utf8');
      expect(savedHtml).toContain('data-ready="true"');
      expect(savedHtml).toContain('value="Tokyo edition"');
      expect(savedHtml).toContain('Delayed panel ready');
    },
  },
  {
    itemName: 'Manual MHTML capture',
    filenamePattern: /manual-mhtml-capture.*\.mhtml$/i,
    verify: async (filePath) => {
      const content = await fs.readFile(filePath, 'utf8');
      expect(content).toContain('multipart/related');
    },
  },
  {
    itemName: 'Manual PDF capture',
    filenamePattern: /manual-pdf-capture.*\.pdf$/i,
    verify: async (filePath) => {
      const content = await fs.readFile(filePath);
      expect(content.subarray(0, 5).toString('latin1')).toBe('%PDF-');
    },
  },
  {
    itemName: 'Manual PNG capture',
    filenamePattern: /manual-png-capture.*\.png$/i,
    verify: async (filePath) => {
      const content = await fs.readFile(filePath);
      expect(content.subarray(0, 8).toString('hex')).toBe('89504e470d0a1a0a');
    },
  },
  {
    itemName: 'Manual JPEG capture',
    filenamePattern: /manual-jpeg-capture.*\.jpeg$/i,
    verify: async (filePath) => {
      const content = await fs.readFile(filePath);
      expect(content.subarray(0, 3).toString('hex')).toBe('ffd8ff');
    },
  },
  {
    itemName: 'Manual WebP capture',
    filenamePattern: /manual-webp-capture.*\.webp$/i,
    verify: async (filePath) => {
      const content = await fs.readFile(filePath);
      expect(content.subarray(0, 4).toString('latin1')).toBe('RIFF');
      expect(content.subarray(8, 12).toString('latin1')).toBe('WEBP');
    },
  },
];

test.describe('manual success smoke', () => {
  test('can grant site access and complete successful runs for multiple save formats', async ({
    baseURL,
    extensionId,
    listDownloadedFiles,
    page,
    readExtensionState,
    resetExtensionState,
  }) => {
    await resetExtensionState();

    await page.goto(`chrome-extension://${extensionId}/popup.html?mode=window`);
    await resetExtensionState(buildMultiFormatManualSeedState(baseURL));
    await page.locator('#refresh').click();

    await expect(page.locator('#summary-needs')).toHaveText(String(formatChecks.length));

    // Manual step: accept the browser permission prompt after this click.
    await page.getByRole('button', { name: 'Grant permission' }).click();
    await expect(page.locator('#summary-needs')).toHaveText('0', { timeout: 120_000 });

    for (let index = 0; index < formatChecks.length; index += 1) {
      const formatCheck = formatChecks[index];
      const row = page.locator('#items .item-row').filter({ hasText: formatCheck.itemName });
      const downloadCountBefore = (await listDownloadedFiles()).length;

      await expect(row).toContainText(formatCheck.itemName);
      await row.getByRole('button', { name: 'Run' }).click();

      await expect(page.locator('#summary-history')).toHaveText(String(index + 1), {
        timeout: 120_000,
      });
      await expect(page.locator('#history .history-row').first()).toContainText(
        formatCheck.itemName
      );

      const stored = await readExtensionState(['logs', 'recentHistory']);
      expect(stored.logs[0].status).toBe('success');
      expect(stored.logs[0].itemName).toBe(formatCheck.itemName);
      expect(stored.recentHistory[0].itemName).toBe(formatCheck.itemName);

      const downloadedFiles = await listDownloadedFiles();
      expect(downloadedFiles.length).toBe(downloadCountBefore + 1);
      const matchedFile = downloadedFiles.find((filePath) =>
        formatCheck.filenamePattern.test(filePath)
      );
      expect(matchedFile).toBeTruthy();
      await formatCheck.verify(matchedFile);
    }
  });
});
