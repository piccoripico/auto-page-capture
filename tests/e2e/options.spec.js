import { buildAlarmSeedState, buildSeedState } from './helpers/sample-config.js';
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
});
