import {
  buildAlarmSeedState,
  buildFileUrlSeedState,
  buildSeedState,
} from './helpers/sample-config.js';
import { expect, test } from './fixtures/extension.js';

function actionCard(page, index) {
  return page.locator('#action-list .action-card').nth(index);
}

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
    await expect(page.locator('#pdf-margin-preset')).toHaveValue('default');

    const marginOptions = await page
      .locator('#pdf-margin-preset')
      .evaluate((node) => Array.from(node.options).map((option) => option.value));
    expect(marginOptions).toEqual(['none', 'narrow', 'default', 'wide', 'extraWide']);

    await page.locator('#pdf-landscape').selectOption('true');
    await page.locator('#pdf-paper-size').selectOption('b3');
    await page.locator('#pdf-margin-preset').selectOption('none');
    await page.locator('#pdf-print-background').selectOption('false');
    await page.locator('#pdf-scale-percent').selectOption('50');
    await page.locator('#pdf-display-header-footer').selectOption('false');
    await page.locator('#pdf-prefer-css-page-size').selectOption('false');
    await page.locator('#pdf-generate-document-outline').selectOption('false');
    await page.locator('#save-all').click();

    await expect(page.locator('#save-all')).toBeDisabled();
    await page.reload();

    await expect(page.locator('#save-format')).toHaveValue('pdf');
    await expect(page.locator('#pdf-landscape')).toHaveValue('true');
    await expect(page.locator('#pdf-paper-size')).toHaveValue('b3');
    await expect(page.locator('#pdf-margin-preset')).toHaveValue('none');
    await expect(page.locator('#pdf-print-background')).toHaveValue('false');
    await expect(page.locator('#pdf-scale-percent')).toHaveValue('50');
    await expect(page.locator('#pdf-display-header-footer')).toHaveValue('false');
    await expect(page.locator('#pdf-prefer-css-page-size')).toHaveValue('false');
    await expect(page.locator('#pdf-generate-document-outline')).toHaveValue('false');

    const stored = await readExtensionState(['items']);
    expect(stored.items[0].saveFormat).toBe('pdf');
    expect(stored.items[0].pdfOptions).toEqual({
      landscape: true,
      displayHeaderFooter: false,
      preferCssPageSize: false,
      generateDocumentOutline: false,
      paperSize: 'b3',
      marginPreset: 'none',
      printBackground: false,
      scalePercent: 50,
    });
  });

  test('shows required marks only for freeform inputs that fail validation when left blank', async ({
    baseURL,
    extensionId,
    page,
    resetExtensionState,
  }) => {
    await resetExtensionState();

    await page.goto(`chrome-extension://${extensionId}/options.html`);
    await resetExtensionState(buildSeedState(baseURL));
    await page.reload();

    await expect(page.locator('[data-role="label-url"] .required-symbol')).toHaveText('(*)');
    await expect(page.locator('[data-role="label-save-format"] .required-symbol')).toHaveCount(0);
    await expect(page.locator('[data-role="label-download-folder"] .required-symbol')).toHaveCount(
      0
    );
    await expect(page.locator('[data-role="label-wait-before"] .required-symbol')).toHaveCount(0);
    await expect(page.locator('[data-role="label-close-tab"] .required-symbol')).toHaveCount(0);
    await expect(page.locator('[data-role="label-schedule-start"] .required-symbol')).toHaveText(
      '(*)'
    );
    await expect(page.locator('[data-role="label-schedule-mode"] .required-symbol')).toHaveCount(0);

    await page.locator('#save-format').selectOption('pdf');
    await expect(page.locator('[data-role="label-pdf-paper-size"] .required-symbol')).toHaveCount(
      0
    );

    await page.locator('#add-action').click();
    await expect(page.locator('[data-role="label-selector"] .required-symbol')).toHaveText('(*)');
    await expect(page.locator('[data-role="label-text"] .required-symbol')).toHaveText('(*)');
    await expect(page.locator('[data-role="label-operator"] .required-symbol')).toHaveCount(0);
    await expect(page.locator('[data-role="label-wait-after-click"] .required-symbol')).toHaveCount(
      0
    );
  });

  test('shows a URL hint for supported schemes', async ({
    baseURL,
    extensionId,
    page,
    resetExtensionState,
  }) => {
    await resetExtensionState();

    await page.goto(`chrome-extension://${extensionId}/options.html`);
    await resetExtensionState(buildSeedState(baseURL));
    await page.reload();

    const urlField = page.locator('label.field').filter({ has: page.locator('#url-input') });
    await expect(urlField.locator('.field-label-row')).toContainText('URL');
    await expect(urlField.locator('.field-help-inline')).toHaveText(
      'Supported: http://, https://, file://'
    );
    await expect(page.locator('[data-role="permission-label"]')).toHaveText('Granted origin');
    await expect(page.locator('#permission-origin-text')).toHaveText(
      `${new URL(baseURL).origin}/*`
    );
  });

  test('shows a preview of the saved file path', async ({
    baseURL,
    extensionId,
    page,
    resetExtensionState,
  }) => {
    await resetExtensionState();

    await page.goto(`chrome-extension://${extensionId}/options.html`);
    await resetExtensionState(buildSeedState(baseURL));
    await page.reload();

    await expect(page.locator('#output-path-preview')).toHaveText(
      '[Browser default downloads folder]/capture-target_20300102_030405.html'
    );

    await page.locator('#download-folder').fill('reports/daily');
    await page.locator('#filename-prefix').fill('team snapshot');
    await page.locator('#save-format').selectOption('pdf');

    await expect(page.locator('#output-path-preview')).toHaveText(
      '[Browser default downloads folder]/reports/daily/team_snapshot_20300102_030405.pdf'
    );
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
    await expect(page.locator('#image-jpeg-quality')).toHaveAttribute(
      'placeholder',
      'Leave blank to use 90'
    );

    await page.locator('#image-jpeg-quality').fill('140');
    await page.locator('#name-input').click();
    await expect(page.locator('#image-jpeg-quality')).toHaveValue('100');
    await page.locator('#save-all').click();

    await expect(page.locator('#save-all')).toBeDisabled();
    await page.reload();

    await expect(page.locator('#save-format')).toHaveValue('jpeg');
    await expect(page.locator('#image-jpeg-quality')).toHaveValue('100');

    const stored = await readExtensionState(['items']);
    expect(stored.items[0].saveFormat).toBe('jpeg');
    expect(stored.items[0].imageOptions).toEqual({
      jpegQuality: 100,
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

  test('shows the next run time for each schedule card', async ({
    baseURL,
    extensionId,
    page,
    resetExtensionState,
  }) => {
    await resetExtensionState();

    await page.goto(`chrome-extension://${extensionId}/options.html`);
    await resetExtensionState(buildSeedState(baseURL));
    await page.reload();

    await expect(page.locator('[data-role="schedule-next-run-value"]').first()).toContainText(
      '2030'
    );
  });

  test('requires a complete start date/time before save', async ({
    baseURL,
    extensionId,
    page,
    resetExtensionState,
  }) => {
    await resetExtensionState();

    await page.goto(`chrome-extension://${extensionId}/options.html`);
    await resetExtensionState(buildSeedState(baseURL));
    await page.reload();

    const startAt = page.locator('[data-schedule-index="0"][data-schedule-field="startAt"]');

    await startAt.evaluate((node) => {
      node.value = '';
      node.dispatchEvent(new Event('input', { bubbles: true }));
    });

    await expect(page.locator('#save-all')).toBeDisabled();
    await expect(page.locator('#detail-validation')).toContainText(
      'Enter both the date and time for start date/time'
    );

    await startAt.fill('2030-01-02T09:45');

    await expect(page.locator('#detail-validation')).toBeHidden();
    await expect(page.locator('#save-all')).toBeEnabled();
  });

  test('persists action settings for all supported action types after save', async ({
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

    await expect(page.locator('#action-list .small-text')).toContainText('No actions configured.');

    for (let index = 0; index < 8; index += 1) {
      await page.locator('#add-action').click();
    }

    await expect(page.locator('#action-list .action-card')).toHaveCount(8);

    await actionCard(page, 0).locator('[data-field="type"]').selectOption('clickText');
    await actionCard(page, 0).locator('[data-action-field="selector"]').fill('.menu button');
    await actionCard(page, 0)
      .locator('[data-action-field="textSourceSelector"]')
      .fill('.menu button .label');
    await actionCard(page, 0).locator('[data-action-field="text"]').fill('Run now');
    await actionCard(page, 0).locator('[data-action-field="operator"]').selectOption('contains');
    await actionCard(page, 0).locator('[data-action-field="waitAfterMs"]').fill('1200');

    await actionCard(page, 1).locator('[data-field="type"]').selectOption('clickSelector');
    await actionCard(page, 1).locator('[data-action-field="selector"]').fill('#submit-button');
    await actionCard(page, 1).locator('[data-action-field="waitAfterMs"]').fill('900');

    await actionCard(page, 2).locator('[data-field="type"]').selectOption('clickXPath');
    await actionCard(page, 2)
      .locator('[data-action-field="xpath"]')
      .fill('//button[@data-role="download"]');
    await actionCard(page, 2).locator('[data-action-field="waitAfterMs"]').fill('700');

    await actionCard(page, 3).locator('[data-field="type"]').selectOption('setValue');
    await actionCard(page, 3).locator('[data-action-field="selector"]').fill('#edition-input');
    await actionCard(page, 3).locator('[data-action-field="value"]').fill('Osaka edition');
    await actionCard(page, 3).locator('[data-action-field="dispatchInput"]').selectOption('false');
    await actionCard(page, 3).locator('[data-action-field="dispatchChange"]').selectOption('true');

    await actionCard(page, 4).locator('[data-field="type"]').selectOption('waitForExists');
    await actionCard(page, 4).locator('[data-action-field="selectorType"]').selectOption('xpath');
    await actionCard(page, 4)
      .locator('[data-action-field="selector"]')
      .fill('//div[@id="status-text"]');
    await actionCard(page, 4).locator('[data-action-field="timeoutMs"]').fill('2200');

    await actionCard(page, 5).locator('[data-field="type"]').selectOption('waitForNotExists');
    await actionCard(page, 5).locator('[data-action-field="selectorType"]').selectOption('css');
    await actionCard(page, 5).locator('[data-action-field="selector"]').fill('.loading-indicator');
    await actionCard(page, 5).locator('[data-action-field="timeoutMs"]').fill('3300');

    await actionCard(page, 6).locator('[data-field="type"]').selectOption('waitForAttribute');
    await actionCard(page, 6).locator('[data-action-field="selectorType"]').selectOption('css');
    await actionCard(page, 6).locator('[data-action-field="selector"]').fill('#status-text');
    await actionCard(page, 6).locator('[data-action-field="attributeName"]').fill('data-ready');
    await actionCard(page, 6).locator('[data-action-field="expectedValue"]').fill('true');
    await actionCard(page, 6).locator('[data-action-field="operator"]').selectOption('equals');
    await actionCard(page, 6).locator('[data-action-field="timeoutMs"]').fill('4400');

    await actionCard(page, 7).locator('[data-field="type"]').selectOption('wait');
    await actionCard(page, 7).locator('[data-action-field="ms"]').fill('1500');

    await expect(page.locator('#save-all')).toBeEnabled();
    await page.locator('#save-all').click();
    await expect(page.locator('#save-all')).toBeDisabled();

    await page.reload();

    await expect(page.locator('#action-list .action-card')).toHaveCount(8);
    await expect(actionCard(page, 0).locator('[data-field="type"]')).toHaveValue('clickText');
    await expect(actionCard(page, 0).locator('[data-action-field="text"]')).toHaveValue('Run now');
    await expect(actionCard(page, 3).locator('[data-field="type"]')).toHaveValue('setValue');
    await expect(actionCard(page, 3).locator('[data-action-field="value"]')).toHaveValue(
      'Osaka edition'
    );
    await expect(actionCard(page, 7).locator('[data-field="type"]')).toHaveValue('wait');
    await expect(actionCard(page, 7).locator('[data-action-field="ms"]')).toHaveValue('1500');

    const stored = await readExtensionState(['items']);
    expect(stored.items[0].actions).toMatchObject([
      {
        type: 'clickText',
        selector: '.menu button',
        textSourceSelector: '.menu button .label',
        text: 'Run now',
        operator: 'contains',
        waitAfterMs: 1200,
      },
      {
        type: 'clickSelector',
        selector: '#submit-button',
        waitAfterMs: 900,
      },
      {
        type: 'clickXPath',
        xpath: '//button[@data-role="download"]',
        waitAfterMs: 700,
      },
      {
        type: 'setValue',
        selector: '#edition-input',
        value: 'Osaka edition',
        dispatchInput: false,
        dispatchChange: true,
        waitAfterMs: 1000,
      },
      {
        type: 'waitForExists',
        selectorType: 'xpath',
        selector: '//div[@id="status-text"]',
        timeoutMs: 2200,
      },
      {
        type: 'waitForNotExists',
        selectorType: 'css',
        selector: '.loading-indicator',
        timeoutMs: 3300,
      },
      {
        type: 'waitForAttribute',
        selectorType: 'css',
        selector: '#status-text',
        attributeName: 'data-ready',
        expectedValue: 'true',
        operator: 'equals',
        timeoutMs: 4400,
      },
      {
        type: 'wait',
        ms: 1500,
      },
    ]);
  });

  test('blocks saving while action validation errors remain and recovers after fixing them', async ({
    baseURL,
    extensionId,
    page,
    resetExtensionState,
  }) => {
    await resetExtensionState();

    await page.goto(`chrome-extension://${extensionId}/options.html`);
    await resetExtensionState(buildSeedState(baseURL));
    await page.reload();

    await page.locator('#add-action').click();

    await expect(page.locator('#save-all')).toBeDisabled();
    await expect(page.locator('#detail-validation')).toContainText('Step 1: enter text (*)');

    await actionCard(page, 0).locator('[data-action-field="text"]').fill('Publish report');

    await expect(page.locator('#save-all')).toBeEnabled();

    await page.locator('#save-all').click();
    await expect(page.locator('#save-all')).toBeDisabled();
    await page.reload();
    await expect(page.locator('#detail-validation')).toBeHidden();
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
    await expect(page.locator('[data-role="permission-label"]')).toHaveText('File URL access');
    await expect(page.locator('#permission-origin-text')).toHaveText('Not enabled');
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

  test('hides file URL guidance when file access is already enabled', async ({
    extensionId,
    page,
    resetExtensionState,
  }) => {
    await page.addInitScript(() => {
      chrome.extension.isAllowedFileSchemeAccess = (callback) => callback(true);
    });

    await resetExtensionState();

    await page.goto(`chrome-extension://${extensionId}/options.html`);
    await resetExtensionState(buildFileUrlSeedState());
    await page.reload();

    await expect(page.locator('[data-role="permission-label"]')).toHaveText('File URL access');
    await expect(page.locator('#permission-origin-text')).toHaveText('Enabled');
    await expect(page.locator('#permission-warning')).toHaveCount(0);
    await expect(page.locator('#file-access-note')).toBeHidden();
  });

  test('removes the permission warning frame after permission is granted', async ({
    baseURL,
    extensionId,
    page,
    resetExtensionState,
  }) => {
    const originPattern = `${new URL(baseURL).origin}/*`;

    await page.addInitScript((expectedOriginPattern) => {
      let granted = false;
      const originalContains = chrome.permissions.contains.bind(chrome.permissions);

      chrome.permissions.contains = async (details) => {
        if (details?.origins?.length === 1 && details.origins[0] === expectedOriginPattern) {
          return granted;
        }
        return await originalContains(details);
      };

      chrome.permissions.request = async (details) => {
        if (details?.origins?.length === 1 && details.origins[0] === expectedOriginPattern) {
          granted = true;
          return true;
        }
        return false;
      };

      chrome.permissions.remove = async (details) => {
        if (details?.origins?.length === 1 && details.origins[0] === expectedOriginPattern) {
          granted = false;
          return true;
        }
        return false;
      };
    }, originPattern);

    await resetExtensionState();

    await page.goto(`chrome-extension://${extensionId}/options.html`);
    await resetExtensionState(buildSeedState(baseURL));
    await page.reload();

    await expect(page.locator('#permission-warning')).toBeVisible();
    await page.locator('#grant-top').click();
    await expect(page.locator('#permission-warning')).toHaveCount(0);
  });
});
