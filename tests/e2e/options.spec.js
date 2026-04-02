import {
  buildAlarmSeedState,
  buildFileUrlSeedState,
  buildSeedState,
} from './helpers/sample-config.js';
import { expect, test } from './fixtures/extension.js';

test.describe('options page', () => {
  test('persists edited item details after save', async ({
    baseURL,
    extensionId,
    page,
    readExtensionState,
    resetExtensionState,
  }) => {
    await resetExtensionState();

    await page.goto(`chrome-extension://${extensionId}/options.html`);
    await resetExtensionState(buildSeedState(baseURL));
    await page.reload();

    const nameInput = page.locator('#name-input');
    const descriptionInput = page.locator('#description-input');
    const firstSidebarCard = page.locator('#items-list .item-list-card').first();
    const saveButton = page.locator('#save-all');

    await expect(nameInput).toHaveValue('Local capture target');
    await expect(firstSidebarCard).toContainText('Local capture target');

    await nameInput.fill('Local capture target updated');
    await descriptionInput.fill('Updated through Playwright system test.');
    await saveButton.click();

    await expect(saveButton).toBeDisabled();
    await page.reload();

    await expect(nameInput).toHaveValue('Local capture target updated');
    await expect(descriptionInput).toHaveValue('Updated through Playwright system test.');
    await expect(firstSidebarCard).toContainText('Local capture target updated');

    const stored = await readExtensionState(['items']);
    expect(stored.items[0].name).toBe('Local capture target updated');
    expect(stored.items[0].description).toBe('Updated through Playwright system test.');
  });

  test('updates the sidebar immediately while editing the selected item', async ({
    baseURL,
    extensionId,
    page,
    resetExtensionState,
  }) => {
    await resetExtensionState();

    await page.goto(`chrome-extension://${extensionId}/options.html`);
    await resetExtensionState(buildSeedState(baseURL));
    await page.reload();

    const nameInput = page.locator('#name-input');
    const descriptionInput = page.locator('#description-input');
    const firstSidebarCard = page.locator('#items-list .item-list-card').first();

    await nameInput.fill('Sidebar live update item');
    await descriptionInput.fill('Unsaved description visible in the sidebar.');

    await expect(firstSidebarCard).toContainText('Sidebar live update item');
    await expect(firstSidebarCard).toContainText('Unsaved description visible in the sidebar.');
    await expect(page.locator('#save-all')).toBeEnabled();
    await expect(page.locator('#unsaved-banner')).toContainText('unsaved');
  });

  test('filters the sidebar by search term and enabled status', async ({
    baseURL,
    extensionId,
    page,
    resetExtensionState,
  }) => {
    await resetExtensionState();

    await page.goto(`chrome-extension://${extensionId}/options.html`);
    await resetExtensionState(buildSeedState(baseURL));
    await page.reload();

    const cards = page.locator('#items-list .item-list-card');
    const searchInput = page.locator('#search-input');

    await expect(cards).toHaveCount(2);

    await searchInput.fill('archive');
    await expect(cards).toHaveCount(1);
    await expect(cards.first()).toContainText('Disabled archive item');

    await page.getByRole('button', { name: 'Enabled' }).click();
    await expect(page.locator('#items-list .small-text')).toBeVisible();

    await searchInput.fill('');
    await expect(cards).toHaveCount(1);
    await expect(cards.first()).toContainText('Local capture target');
  });

  test('syncs alarms when settings are saved', async ({
    baseURL,
    extensionId,
    page,
    resetExtensionState,
    serviceWorkerEval,
  }) => {
    await resetExtensionState();

    await page.goto(`chrome-extension://${extensionId}/options.html`);
    await resetExtensionState(buildAlarmSeedState(baseURL));
    await page.reload();

    await expect(page.locator('#name-input')).toHaveValue('Alarm enabled item');
    await page.locator('#description-input').fill('Alarm sync test update.');
    await page.locator('#save-all').click();

    await expect(page.locator('#save-all')).toBeDisabled();

    const alarms = await serviceWorkerEval(async () => {
      return await chrome.alarms.getAll();
    });
    const scheduledAlarms = alarms.filter((alarm) => alarm.name.startsWith('scheduled-item:'));

    expect(scheduledAlarms).toHaveLength(1);
    expect(scheduledAlarms[0].name).toBe(
      'scheduled-item:item_alarm_enabled:schedule_alarm_enabled'
    );
  });

  test('persists PDF output settings after save', async ({
    baseURL,
    extensionId,
    page,
    readExtensionState,
    resetExtensionState,
  }) => {
    await resetExtensionState();

    await page.goto(`chrome-extension://${extensionId}/options.html`);
    await resetExtensionState(buildSeedState(baseURL));
    await page.reload();

    await page.locator('#save-format').selectOption('pdf');
    await expect(page.locator('#pdf-landscape')).toBeVisible();

    await page.locator('#pdf-landscape').selectOption('true');
    await page.locator('#pdf-paper-size').selectOption('letter');
    await page.locator('#pdf-margin-preset').selectOption('none');
    await page.locator('#pdf-print-background').selectOption('false');
    await page.locator('#save-all').click();

    await expect(page.locator('#save-all')).toBeDisabled();
    await page.reload();

    await expect(page.locator('#save-format')).toHaveValue('pdf');
    await expect(page.locator('#pdf-landscape')).toHaveValue('true');
    await expect(page.locator('#pdf-paper-size')).toHaveValue('letter');
    await expect(page.locator('#pdf-margin-preset')).toHaveValue('none');
    await expect(page.locator('#pdf-print-background')).toHaveValue('false');

    const stored = await readExtensionState(['items']);
    expect(stored.items[0].saveFormat).toBe('pdf');
    expect(stored.items[0].pdfOptions).toEqual({
      landscape: true,
      paperSize: 'letter',
      marginPreset: 'none',
      printBackground: false,
    });
  });

  test('switches to JPEG output settings and persists quality', async ({
    baseURL,
    extensionId,
    page,
    readExtensionState,
    resetExtensionState,
  }) => {
    await resetExtensionState();

    await page.goto(`chrome-extension://${extensionId}/options.html`);
    await resetExtensionState(buildSeedState(baseURL));
    await page.reload();

    await page.locator('#save-format').selectOption('jpeg');
    await expect(page.locator('#image-jpeg-quality')).toBeVisible();
    await expect(page.locator('#pdf-landscape')).toHaveCount(0);

    await page.locator('#image-jpeg-quality').fill('72');
    await page.locator('#save-all').click();

    await expect(page.locator('#save-all')).toBeDisabled();
    await page.reload();

    await expect(page.locator('#save-format')).toHaveValue('jpeg');
    await expect(page.locator('#image-jpeg-quality')).toHaveValue('72');

    const stored = await readExtensionState(['items']);
    expect(stored.items[0].saveFormat).toBe('jpeg');
    expect(stored.items[0].imageOptions).toEqual({
      jpegQuality: 72,
    });
  });

  test('persists custom interval schedules after save', async ({
    baseURL,
    extensionId,
    page,
    readExtensionState,
    resetExtensionState,
  }) => {
    await resetExtensionState();

    await page.goto(`chrome-extension://${extensionId}/options.html`);
    await resetExtensionState(buildSeedState(baseURL));
    await page.reload();

    const modeSelect = page.locator(
      '[data-schedule-index="0"][data-schedule-field="scheduleMode"]'
    );
    const everyInput = page.locator(
      '[data-schedule-index="0"][data-schedule-field="intervalValue"]'
    );
    const unitSelect = page.locator(
      '[data-schedule-index="0"][data-schedule-field="intervalUnit"]'
    );

    await expect(modeSelect).toHaveValue('interval');
    await everyInput.fill('2');
    await unitSelect.selectOption('day');
    await page.locator('#save-all').click();

    await expect(page.locator('#save-all')).toBeDisabled();
    await page.reload();

    await expect(modeSelect).toHaveValue('interval');
    await expect(everyInput).toHaveValue('2');
    await expect(unitSelect).toHaveValue('day');

    const stored = await readExtensionState(['items']);
    expect(stored.items[0].schedules[0]).toMatchObject({
      scheduleMode: 'interval',
      intervalValue: 2,
      intervalUnit: 'day',
      intervalKey: 'custom',
    });
  });

  test('persists monthly schedules and calculates the next monthly run', async ({
    baseURL,
    extensionId,
    page,
    readExtensionState,
    resetExtensionState,
  }) => {
    await resetExtensionState();

    await page.goto(`chrome-extension://${extensionId}/options.html`);
    await resetExtensionState(buildSeedState(baseURL));
    await page.reload();

    await page
      .locator('[data-schedule-index="0"][data-schedule-field="startAt"]')
      .fill('2026-01-31T08:15');
    await page
      .locator('[data-schedule-index="0"][data-schedule-field="scheduleMode"]')
      .selectOption('monthly');
    const monthlyDayInput = page.locator(
      '[data-schedule-index="0"][data-schedule-field="monthlyDay"]'
    );
    await expect(monthlyDayInput).toBeVisible();
    await monthlyDayInput.fill('31');
    await page.locator('#save-all').click();

    await expect(page.locator('#save-all')).toBeDisabled();
    await page.reload();

    await expect(
      page.locator('[data-schedule-index="0"][data-schedule-field="scheduleMode"]')
    ).toHaveValue('monthly');
    await expect(monthlyDayInput).toHaveValue('31');

    const stored = await readExtensionState(['items']);
    expect(stored.items[0].schedules[0]).toMatchObject({
      scheduleMode: 'monthly',
      monthlyDay: 31,
      intervalKey: 'monthly',
    });

    const monthlyComputation = await page.evaluate(async () => {
      const shared = await import(chrome.runtime.getURL('lib/shared.js'));
      const schedule = shared.normalizeSchedule({
        startAt: '2026-01-31T08:15',
        scheduleMode: 'monthly',
        monthlyDay: 31,
        endAt: '',
        enabled: true,
      });
      const next = shared.nextOccurrenceForSchedule(schedule, new Date('2026-02-01T00:00:00'));
      const yyyy = next.getFullYear();
      const mm = String(next.getMonth() + 1).padStart(2, '0');
      const dd = String(next.getDate()).padStart(2, '0');
      const hh = String(next.getHours()).padStart(2, '0');
      const mi = String(next.getMinutes()).padStart(2, '0');
      return {
        nextLocal: `${yyyy}-${mm}-${dd}T${hh}:${mi}`,
      };
    });

    expect(monthlyComputation.nextLocal).toBe('2026-02-28T08:15');
  });

  test('persists retry settings after save', async ({
    baseURL,
    extensionId,
    page,
    readExtensionState,
    resetExtensionState,
  }) => {
    await resetExtensionState();

    await page.goto(`chrome-extension://${extensionId}/options.html`);
    await resetExtensionState(buildSeedState(baseURL));
    await page.reload();

    await page.locator('#retry-count').fill('2');
    await page.locator('#retry-delay-ms').fill('1500');
    await page.locator('#save-all').click();

    await expect(page.locator('#save-all')).toBeDisabled();
    await page.reload();

    await expect(page.locator('#retry-count')).toHaveValue('2');
    await expect(page.locator('#retry-delay-ms')).toHaveValue('1500');

    const stored = await readExtensionState(['items']);
    expect(stored.items[0].retryOptions).toEqual({
      maxRetries: 2,
      retryDelayMs: 1500,
    });
  });

  test('accepts file URLs and shows file access guidance', async ({
    extensionId,
    page,
    readExtensionState,
    resetExtensionState,
  }) => {
    await page.addInitScript(() => {
      chrome.extension.isAllowedFileSchemeAccess = (callback) => callback(false);
    });

    await resetExtensionState();

    await page.goto(`chrome-extension://${extensionId}/options.html`);
    await resetExtensionState(buildFileUrlSeedState());
    await page.reload();

    await expect(page.locator('#url-input')).toHaveValue(
      'file:///tmp/auto-page-capture-sample.html'
    );
    await expect(page.locator('.warning-box')).toContainText('Allow access to file URLs');
    await expect(page.locator('#grant-inline')).toBeDisabled();
    await expect(page.locator('#revoke-inline')).toBeDisabled();

    await page.locator('#url-input').fill('file:///tmp/auto-page-capture-updated.html');
    await page.locator('#url-input').blur();
    await expect(page.locator('#save-all')).toBeEnabled();
    await page.locator('#save-all').click();
    await expect(page.locator('#save-all')).toBeDisabled();

    const stored = await readExtensionState(['items']);
    expect(stored.items[0].url).toBe('file:///tmp/auto-page-capture-updated.html');
  });
});
