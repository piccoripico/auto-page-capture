import { expect, test } from './fixtures/extension.js';

test.describe('shared logic', () => {
  test('normalizes legacy action payloads and applies defaults', async ({ extensionId, page }) => {
    await page.goto(`chrome-extension://${extensionId}/options.html`);

    const result = await page.evaluate(async () => {
      const shared = await import(chrome.runtime.getURL('lib/shared.js'));

      return {
        legacyAttributeWait: shared.normalizeAction({
          type: 'waitForState',
          conditionKind: 'attribute',
          selectorType: 'xpath',
          selector: '//main',
          attributeName: 'data-ready',
          expectedValue: 'yes',
          timeoutMs: '2500',
        }),
        clickSelectorWithBlankDelay: shared.normalizeAction({
          type: 'clickSelector',
          selector: '#run-button',
          waitAfterMs: '',
        }),
        setValueDispatchModes: shared.normalizeAction({
          type: 'setValue',
          selector: '#edition-input',
          value: 'Kyoto edition',
          dispatchInputMode: 'skip',
          dispatchChangeMode: 'dispatch',
        }),
        monthlySchedule: shared.normalizeSchedule({
          startAt: '2026-01-31T08:15',
          scheduleMode: 'monthly',
          monthlyDay: '31',
          endAt: '',
          enabled: true,
        }),
        pdfOptions: shared.normalizePdfOptions({
          paperSize: 'b0',
          marginPreset: 'extraWide',
          scalePercent: 125,
          displayHeaderFooter: true,
          preferCssPageSize: false,
          generateDocumentOutline: true,
          printBackground: false,
          landscape: true,
        }),
      };
    });

    expect(result.legacyAttributeWait).toMatchObject({
      type: 'waitForAttribute',
      selectorType: 'xpath',
      selector: '//main',
      attributeName: 'data-ready',
      expectedValue: 'yes',
      timeoutMs: 2500,
    });
    expect(result.clickSelectorWithBlankDelay).toMatchObject({
      type: 'clickSelector',
      selector: '#run-button',
      waitAfterMs: 1000,
    });
    expect(result.setValueDispatchModes).toMatchObject({
      type: 'setValue',
      selector: '#edition-input',
      value: 'Kyoto edition',
      dispatchInput: false,
      dispatchChange: true,
      waitAfterMs: 1000,
    });
    expect(result.monthlySchedule).toMatchObject({
      scheduleMode: 'monthly',
      monthlyDay: 31,
      intervalKey: 'monthly',
    });
    expect(result.pdfOptions).toMatchObject({
      paperSize: 'b0',
      marginPreset: 'extraWide',
      scalePercent: 125,
      displayHeaderFooter: true,
      preferCssPageSize: false,
      generateDocumentOutline: true,
      printBackground: false,
      landscape: true,
    });
  });

  test('validates invalid actions and invalid item schedules', async ({ extensionId, page }) => {
    await page.goto(`chrome-extension://${extensionId}/options.html`);

    const result = await page.evaluate(async () => {
      const shared = await import(chrome.runtime.getURL('lib/shared.js'));

      return {
        invalidClickText: shared.validateAction(
          { type: 'clickText', selector: '', text: '' },
          0,
          'en'
        ),
        invalidWaitForAttribute: shared.validateAction(
          {
            type: 'waitForAttribute',
            selector: '#status-text',
            attributeName: '',
            expectedValue: '',
          },
          1,
          'en'
        ),
        invalidItem: shared.validateItem(
          {
            url: 'https://example.com/report',
            saveFormat: 'html',
            schedules: [
              {
                startAt: '2026-03-02T10:15',
                scheduleMode: 'monthly',
                monthlyDay: 35,
                endAt: '2026-02-01T10:15',
                enabled: true,
              },
            ],
            actions: [{ type: 'clickXPath', xpath: '' }],
          },
          'en'
        ),
        invalidStartAt: shared.validateItem(
          {
            url: 'https://example.com/report',
            saveFormat: 'html',
            schedules: [
              {
                startAt: '2026-03-02',
                scheduleMode: 'interval',
                intervalValue: 1,
                intervalUnit: 'day',
                endAt: '',
                enabled: true,
              },
            ],
            actions: [],
          },
          'en'
        ),
      };
    });

    expect(result.invalidClickText.ok).toBe(false);
    expect(result.invalidClickText.errors).toEqual([
      'Step 1: enter a target selector (*).',
      'Step 1: enter text (*).',
    ]);

    expect(result.invalidWaitForAttribute.ok).toBe(false);
    expect(result.invalidWaitForAttribute.errors).toEqual([
      'Step 2: enter an attribute name (*).',
      'Step 2: enter a value (*).',
    ]);

    expect(result.invalidItem.ok).toBe(false);
    expect(result.invalidItem.errors).toEqual(
      expect.arrayContaining([
        'Schedule 1: enter a monthly day between 1 and 31.',
        'Schedule 1: the active period is invalid.',
        'Step 1: enter an XPath (*).',
      ])
    );
    expect(result.invalidStartAt.ok).toBe(false);
    expect(result.invalidStartAt.errors).toEqual(
      expect.arrayContaining(['Enter both the date and time for start date/time (*).'])
    );
  });
});
