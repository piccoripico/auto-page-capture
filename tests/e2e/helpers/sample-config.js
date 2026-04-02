export function buildSeedState(baseURL) {
  const captureUrl = `${baseURL}/capture-target.html`;
  const laterUrl = `${baseURL}/capture-target.html?variant=secondary`;

  return {
    settingsVersion: 7,
    items: [
      {
        id: 'item_primary',
        name: 'Local capture target',
        description: 'Seed item for Playwright system tests.',
        enabled: true,
        url: captureUrl,
        saveFormat: 'html',
        schedules: [
          {
            id: 'schedule_primary',
            startAt: '2030-01-02T08:30',
            intervalKey: 'day1',
            endAt: '',
            enabled: true,
          },
        ],
        downloadFolder: '',
        filenamePrefix: 'capture-target',
        closeTabAfterSave: true,
        waitBeforeActionsMs: 500,
        waitAfterActionsMs: 500,
        actions: [],
      },
      {
        id: 'item_secondary',
        name: 'Disabled archive item',
        description: 'Secondary item used to exercise popup and sidebar counts.',
        enabled: false,
        url: laterUrl,
        saveFormat: 'mhtml',
        schedules: [
          {
            id: 'schedule_secondary',
            startAt: '2030-01-03T21:15',
            intervalKey: 'week1',
            endAt: '',
            enabled: true,
          },
        ],
        downloadFolder: '',
        filenamePrefix: 'archive-item',
        closeTabAfterSave: true,
        waitBeforeActionsMs: 1000,
        waitAfterActionsMs: 1000,
        actions: [],
      },
    ],
    recentHistory: [
      {
        id: 'hist_primary',
        itemId: 'item_primary',
        itemName: 'Local capture target',
        status: 'saved',
        trigger: 'manual',
        at: '2030-01-02T08:31:00.000Z',
        filename: 'capture-target_20300102_083100.html',
        message: '',
      },
      {
        id: 'hist_secondary',
        itemId: 'item_secondary',
        itemName: 'Disabled archive item',
        status: 'failed',
        trigger: 'schedule',
        at: '2030-01-03T21:16:00.000Z',
        filename: '',
        message: 'Site access is not granted for this origin.',
      },
    ],
    logs: [
      {
        id: 'log_primary',
        itemId: 'item_primary',
        itemName: 'Local capture target',
        status: 'saved',
        trigger: 'manual',
        at: '2030-01-02T08:31:00.000Z',
        filename: 'capture-target_20300102_083100.html',
        message: 'Saved HTML snapshot.',
      },
      {
        id: 'log_secondary',
        itemId: 'item_secondary',
        itemName: 'Disabled archive item',
        status: 'failed',
        trigger: 'schedule',
        at: '2030-01-03T21:16:00.000Z',
        filename: '',
        message: 'Site access is not granted for this origin.',
      },
    ],
    lastRunByItem: {
      item_primary: {
        at: '2030-01-02T08:31:00.000Z',
        ymd: '2030-01-02',
        status: 'saved',
        trigger: 'manual',
        filename: 'capture-target_20300102_083100.html',
        message: 'Saved HTML snapshot.',
      },
      item_secondary: {
        at: '2030-01-03T21:16:00.000Z',
        ymd: '2030-01-03',
        status: 'failed',
        trigger: 'schedule',
        filename: '',
        message: 'Site access is not granted for this origin.',
      },
    },
    appSettings: {
      logLimit: 300,
      uiLanguage: 'en',
    },
  };
}

export function buildActionRunSeedState(baseURL) {
  const actions = [
    {
      id: 'action_click_activate',
      type: 'clickText',
      enabled: true,
      selector: 'button',
      text: 'Activate workflow',
      textSourceSelector: '',
      operator: 'equals',
      waitAfterMs: 600,
    },
    {
      id: 'action_wait_ready',
      type: 'waitForAttribute',
      enabled: true,
      selectorType: 'css',
      selector: '#status-text',
      attributeName: 'data-ready',
      operator: 'equals',
      expectedValue: 'true',
      timeoutMs: 5_000,
    },
    {
      id: 'action_set_value',
      type: 'setValue',
      enabled: true,
      selector: '#edition-input',
      value: 'Tokyo edition',
      dispatchInput: true,
      dispatchChange: true,
      waitAfterMs: 50,
    },
  ];

  return {
    settingsVersion: 7,
    items: [
      {
        id: 'item_action_run',
        name: 'Interactive capture target',
        description: 'Runs page actions before saving an HTML snapshot.',
        enabled: true,
        url: `${baseURL}/capture-target.html`,
        saveFormat: 'html',
        schedules: [
          {
            id: 'schedule_action_run',
            startAt: '2030-02-01T09:00',
            intervalKey: 'day1',
            endAt: '',
            enabled: true,
          },
        ],
        downloadFolder: 'system-tests',
        filenamePrefix: 'interactive-capture',
        closeTabAfterSave: true,
        waitBeforeActionsMs: 100,
        waitAfterActionsMs: 100,
        actions,
      },
    ],
    recentHistory: [],
    logs: [],
    lastRunByItem: {},
    appSettings: {
      logLimit: 300,
      uiLanguage: 'en',
    },
  };
}

export function buildMultiFormatManualSeedState(baseURL) {
  const baseItem = buildActionRunSeedState(baseURL).items[0];
  const formats = [
    {
      id: 'item_manual_html',
      name: 'Manual HTML capture',
      saveFormat: 'html',
      filenamePrefix: 'manual-html-capture',
    },
    {
      id: 'item_manual_mhtml',
      name: 'Manual MHTML capture',
      saveFormat: 'mhtml',
      filenamePrefix: 'manual-mhtml-capture',
    },
    {
      id: 'item_manual_pdf',
      name: 'Manual PDF capture',
      saveFormat: 'pdf',
      filenamePrefix: 'manual-pdf-capture',
    },
    {
      id: 'item_manual_png',
      name: 'Manual PNG capture',
      saveFormat: 'png',
      filenamePrefix: 'manual-png-capture',
    },
    {
      id: 'item_manual_jpeg',
      name: 'Manual JPEG capture',
      saveFormat: 'jpeg',
      filenamePrefix: 'manual-jpeg-capture',
    },
    {
      id: 'item_manual_webp',
      name: 'Manual WebP capture',
      saveFormat: 'webp',
      filenamePrefix: 'manual-webp-capture',
    },
  ];

  return {
    settingsVersion: 7,
    items: formats.map((format, index) => ({
      ...baseItem,
      id: format.id,
      name: format.name,
      description: `Manual smoke item for ${format.saveFormat.toUpperCase()}.`,
      saveFormat: format.saveFormat,
      filenamePrefix: format.filenamePrefix,
      schedules: [
        {
          id: `schedule_manual_${format.saveFormat}`,
          startAt: `2030-02-01T${String((index % 6) + 9).padStart(2, '0')}:00`,
          intervalKey: 'day1',
          endAt: '',
          enabled: true,
        },
      ],
      actions: baseItem.actions.map((action, actionIndex) => ({
        ...action,
        id: `${format.id}_action_${actionIndex + 1}`,
      })),
    })),
    recentHistory: [],
    logs: [],
    lastRunByItem: {},
    appSettings: {
      logLimit: 300,
      uiLanguage: 'en',
    },
  };
}

export function buildAlarmSeedState(baseURL) {
  return {
    settingsVersion: 7,
    items: [
      {
        id: 'item_alarm_enabled',
        name: 'Alarm enabled item',
        description: 'Enabled item that should create one scheduled alarm.',
        enabled: true,
        url: `${baseURL}/capture-target.html`,
        saveFormat: 'html',
        schedules: [
          {
            id: 'schedule_alarm_enabled',
            startAt: '2030-03-02T10:15',
            intervalKey: 'day1',
            endAt: '',
            enabled: true,
          },
        ],
        downloadFolder: '',
        filenamePrefix: 'alarm-enabled',
        closeTabAfterSave: true,
        waitBeforeActionsMs: 100,
        waitAfterActionsMs: 100,
        actions: [],
      },
      {
        id: 'item_alarm_disabled',
        name: 'Alarm disabled item',
        description: 'Disabled item that should not create alarms.',
        enabled: false,
        url: `${baseURL}/capture-target.html?variant=disabled`,
        saveFormat: 'html',
        schedules: [
          {
            id: 'schedule_alarm_disabled',
            startAt: '2030-03-02T11:30',
            intervalKey: 'day1',
            endAt: '',
            enabled: true,
          },
        ],
        downloadFolder: '',
        filenamePrefix: 'alarm-disabled',
        closeTabAfterSave: true,
        waitBeforeActionsMs: 100,
        waitAfterActionsMs: 100,
        actions: [],
      },
    ],
    recentHistory: [],
    logs: [],
    lastRunByItem: {},
    appSettings: {
      logLimit: 300,
      uiLanguage: 'en',
    },
  };
}

export function buildRetrySeedState(baseURL) {
  return {
    settingsVersion: 11,
    items: [
      {
        id: 'item_retry_success',
        name: 'Retry capture target',
        description: 'Succeeds on the second attempt after a transient capture failure.',
        enabled: true,
        url: `${baseURL}/capture-target.html`,
        saveFormat: 'mhtml',
        schedules: [
          {
            id: 'schedule_retry_success',
            startAt: '2030-03-04T09:30',
            scheduleMode: 'interval',
            intervalValue: 1,
            intervalUnit: 'day',
            endAt: '',
            enabled: true,
          },
        ],
        downloadFolder: '',
        filenamePrefix: 'retry-capture',
        closeTabAfterSave: true,
        waitBeforeActionsMs: 100,
        waitAfterActionsMs: 100,
        retryOptions: {
          maxRetries: 1,
          retryDelayMs: 100,
        },
        actions: [],
      },
    ],
    recentHistory: [],
    logs: [],
    lastRunByItem: {},
    appSettings: {
      logLimit: 300,
      uiLanguage: 'en',
    },
  };
}

export function buildFileUrlSeedState(fileUrl = 'file:///tmp/auto-page-capture-sample.html') {
  return {
    settingsVersion: 11,
    items: [
      {
        id: 'item_file_url',
        name: 'Local file capture',
        description: 'Item used to exercise file URL validation and permission guidance.',
        enabled: true,
        url: fileUrl,
        saveFormat: 'html',
        schedules: [
          {
            id: 'schedule_file_url',
            startAt: '2030-03-06T10:00',
            scheduleMode: 'interval',
            intervalValue: 1,
            intervalUnit: 'day',
            endAt: '',
            enabled: true,
          },
        ],
        downloadFolder: '',
        filenamePrefix: 'local-file-capture',
        closeTabAfterSave: true,
        waitBeforeActionsMs: 100,
        waitAfterActionsMs: 100,
        actions: [],
      },
    ],
    recentHistory: [],
    logs: [],
    lastRunByItem: {},
    appSettings: {
      logLimit: 300,
      uiLanguage: 'en',
    },
  };
}
