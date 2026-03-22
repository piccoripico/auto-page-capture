import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';

import { chromium, expect, test as base } from '@playwright/test';

const extensionPath = path.resolve(process.cwd(), 'src');

export const test = base.extend({
  userDataDir: async ({}, use) => {
    const userDataDir = await fs.mkdtemp(path.join(os.tmpdir(), 'apc-playwright-'));
    try {
      await use(userDataDir);
    } finally {
      await fs.rm(userDataDir, { recursive: true, force: true });
    }
  },

  downloadsDir: async ({ userDataDir }, use) => {
    const downloadsDir = path.join(userDataDir, 'downloads');
    await fs.mkdir(downloadsDir, { recursive: true });
    await use(downloadsDir);
  },

  context: async ({ downloadsDir, userDataDir }, use) => {
    const context = await chromium.launchPersistentContext(userDataDir, {
      channel: 'chromium',
      headless: true,
      viewport: { width: 1440, height: 1100 },
      acceptDownloads: true,
      downloadsPath: downloadsDir,
      args: [`--disable-extensions-except=${extensionPath}`, `--load-extension=${extensionPath}`],
    });

    try {
      await use(context);
    } finally {
      await context.close();
    }
  },

  serviceWorker: async ({ context }, use) => {
    let [serviceWorker] = context.serviceWorkers();
    if (!serviceWorker) {
      serviceWorker = await context.waitForEvent('serviceworker');
    }
    await use(serviceWorker);
  },

  extensionId: async ({ serviceWorker }, use) => {
    await use(new URL(serviceWorker.url()).host);
  },

  resetExtensionState: async ({ serviceWorker }, use) => {
    const reset = async (seed = {}) => {
      await serviceWorker.evaluate(async (payload) => {
        await chrome.storage.local.clear();
        await chrome.alarms.clearAll();

        if (chrome.permissions?.getAll) {
          const current = await chrome.permissions.getAll();
          if (current.origins?.length) {
            await chrome.permissions.remove({ origins: current.origins });
          }
        }

        if (Object.keys(payload).length > 0) {
          await chrome.storage.local.set(payload);
        }
      }, seed);
    };

    await reset();
    try {
      await use(reset);
    } finally {
      await reset();
    }
  },

  readExtensionState: async ({ serviceWorker }, use) => {
    const read = async (keys = null) =>
      serviceWorker.evaluate(async (requestedKeys) => {
        if (requestedKeys) {
          return await chrome.storage.local.get(requestedKeys);
        }
        return await chrome.storage.local.get(null);
      }, keys);

    await use(read);
  },

  serviceWorkerEval: async ({ serviceWorker }, use) => {
    const evaluate = async (pageFunction, arg) => serviceWorker.evaluate(pageFunction, arg);
    await use(evaluate);
  },

  listDownloadedFiles: async ({ downloadsDir }, use) => {
    const listFiles = async () => {
      const entries = [];

      async function walk(currentDir) {
        const dirEntries = await fs.readdir(currentDir, { withFileTypes: true });
        for (const entry of dirEntries) {
          const absolutePath = path.join(currentDir, entry.name);
          if (entry.isDirectory()) {
            await walk(absolutePath);
          } else {
            entries.push(absolutePath);
          }
        }
      }

      try {
        await walk(downloadsDir);
      } catch (error) {
        if (error?.code !== 'ENOENT') {
          throw error;
        }
      }

      return entries.sort();
    };

    await use(listFiles);
  },
});

export { expect };
