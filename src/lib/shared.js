import { SUPPORTED_LOCALES, detectBrowserLocale, t } from './i18n.js';

export const STORAGE_KEYS = {
  SETTINGS_VERSION: 'settingsVersion',
  ITEMS: 'items',
  RECENT_HISTORY: 'recentHistory',
  LOGS: 'logs',
  LAST_RUN_BY_ITEM: 'lastRunByItem',
  APP_SETTINGS: 'appSettings',
};

export const SETTINGS_VERSION = 11;
export const RECENT_HISTORY_LIMIT = 30;
export const WAIT_POLL_INTERVAL_MS = 200;

export const ACTION_TYPES = [
  { value: 'clickText', labelKey: 'shared.action.clickText' },
  { value: 'clickSelector', labelKey: 'shared.action.clickSelector' },
  { value: 'clickXPath', labelKey: 'shared.action.clickXPath' },
  { value: 'setValue', labelKey: 'shared.action.setValue' },
  { value: 'waitForExists', labelKey: 'shared.action.waitForExists' },
  { value: 'waitForNotExists', labelKey: 'shared.action.waitForNotExists' },
  { value: 'waitForAttribute', labelKey: 'shared.action.waitForAttribute' },
  { value: 'wait', labelKey: 'shared.action.wait' },
];

export const SAVE_FORMATS = [
  { value: 'mhtml', labelKey: 'shared.saveFormat.mhtml' },
  { value: 'html', labelKey: 'shared.saveFormat.html' },
  { value: 'pdf', labelKey: 'shared.saveFormat.pdf' },
  { value: 'png', labelKey: 'shared.saveFormat.png' },
  { value: 'jpeg', labelKey: 'shared.saveFormat.jpeg' },
  { value: 'webp', labelKey: 'shared.saveFormat.webp' },
];

export const PDF_PAPER_SIZE_OPTIONS = [
  { value: 'a0', labelKey: 'shared.paperSize.a0', width: 33.11, height: 46.81 },
  { value: 'a1', labelKey: 'shared.paperSize.a1', width: 23.39, height: 33.11 },
  { value: 'a2', labelKey: 'shared.paperSize.a2', width: 16.54, height: 23.39 },
  { value: 'a3', labelKey: 'shared.paperSize.a3', width: 11.69, height: 16.54 },
  { value: 'a4', labelKey: 'shared.paperSize.a4', width: 8.27, height: 11.69 },
  { value: 'a5', labelKey: 'shared.paperSize.a5', width: 5.83, height: 8.27 },
  { value: 'a6', labelKey: 'shared.paperSize.a6', width: 4.13, height: 5.83 },
  { value: 'a7', labelKey: 'shared.paperSize.a7', width: 2.91, height: 4.13 },
  { value: 'a8', labelKey: 'shared.paperSize.a8', width: 2.05, height: 2.91 },
  { value: 'a9', labelKey: 'shared.paperSize.a9', width: 1.46, height: 2.05 },
  { value: 'a10', labelKey: 'shared.paperSize.a10', width: 1.02, height: 1.46 },
  { value: 'b0', labelKey: 'shared.paperSize.b0', width: 39.37, height: 55.67 },
  { value: 'b1', labelKey: 'shared.paperSize.b1', width: 27.83, height: 39.37 },
  { value: 'b2', labelKey: 'shared.paperSize.b2', width: 19.69, height: 27.83 },
  { value: 'b3', labelKey: 'shared.paperSize.b3', width: 13.9, height: 19.69 },
  { value: 'b4', labelKey: 'shared.paperSize.b4', width: 9.84, height: 13.9 },
  { value: 'b5', labelKey: 'shared.paperSize.b5', width: 6.93, height: 9.84 },
  { value: 'b6', labelKey: 'shared.paperSize.b6', width: 4.92, height: 6.93 },
  { value: 'b7', labelKey: 'shared.paperSize.b7', width: 3.46, height: 4.92 },
  { value: 'b8', labelKey: 'shared.paperSize.b8', width: 2.44, height: 3.46 },
  { value: 'b9', labelKey: 'shared.paperSize.b9', width: 1.73, height: 2.44 },
  { value: 'b10', labelKey: 'shared.paperSize.b10', width: 1.22, height: 1.73 },
  { value: 'letter', labelKey: 'shared.paperSize.letter', width: 8.5, height: 11 },
  { value: 'legal', labelKey: 'shared.paperSize.legal', width: 8.5, height: 14 },
  { value: 'executive', labelKey: 'shared.paperSize.executive', width: 7.25, height: 10.5 },
  { value: 'tabloid', labelKey: 'shared.paperSize.tabloid', width: 11, height: 17 },
];
export const PDF_PAPER_SIZE_MAP = Object.fromEntries(
  PDF_PAPER_SIZE_OPTIONS.map((x) => [x.value, x])
);

export const PDF_MARGIN_OPTIONS = [
  { value: 'none', labelKey: 'shared.pdfMargin.none', inches: 0 },
  { value: 'narrow', labelKey: 'shared.pdfMargin.narrow', inches: 0.2 },
  { value: 'default', labelKey: 'shared.pdfMargin.default', inches: 0.4 },
  { value: 'wide', labelKey: 'shared.pdfMargin.wide', inches: 0.6 },
  { value: 'extraWide', labelKey: 'shared.pdfMargin.extraWide', inches: 0.8 },
];
export const PDF_MARGIN_MAP = Object.fromEntries(PDF_MARGIN_OPTIONS.map((x) => [x.value, x]));

export const PDF_SCALE_PERCENT_OPTIONS = [
  50, 60, 70, 80, 90, 95, 100, 105, 110, 115, 120, 125, 130, 140, 150, 160, 175, 200,
];

export const SCHEDULE_INTERVALS = [
  { value: 'once', labelKey: 'shared.interval.once', minutes: null },
  { value: 'minute1', labelKey: 'shared.interval.minute1', minutes: 1 },
  { value: 'minute5', labelKey: 'shared.interval.minute5', minutes: 5 },
  { value: 'minute30', labelKey: 'shared.interval.minute30', minutes: 30 },
  { value: 'hour1', labelKey: 'shared.interval.hour1', minutes: 60 },
  { value: 'hour4', labelKey: 'shared.interval.hour4', minutes: 240 },
  { value: 'day1', labelKey: 'shared.interval.day1', minutes: 1440 },
  { value: 'week1', labelKey: 'shared.interval.week1', minutes: 10080 },
];
export const SCHEDULE_INTERVAL_MAP = Object.fromEntries(
  SCHEDULE_INTERVALS.map((x) => [x.value, x])
);

export const SCHEDULE_MODE_OPTIONS = [
  { value: 'once', labelKey: 'schedule.mode.once' },
  { value: 'interval', labelKey: 'schedule.mode.interval' },
  { value: 'monthly', labelKey: 'schedule.mode.monthly' },
];
export const SCHEDULE_MODE_MAP = Object.fromEntries(SCHEDULE_MODE_OPTIONS.map((x) => [x.value, x]));

export const SCHEDULE_INTERVAL_UNIT_OPTIONS = [
  { value: 'minute', labelKey: 'shared.intervalUnit.minute.other' },
  { value: 'hour', labelKey: 'shared.intervalUnit.hour.other' },
  { value: 'day', labelKey: 'shared.intervalUnit.day.other' },
  { value: 'week', labelKey: 'shared.intervalUnit.week.other' },
];
export const SCHEDULE_INTERVAL_UNIT_MAP = Object.fromEntries(
  SCHEDULE_INTERVAL_UNIT_OPTIONS.map((x) => [x.value, x])
);

const LEGACY_INTERVAL_DEFAULTS = {
  once: { scheduleMode: 'once', intervalUnit: 'day', intervalValue: 1 },
  minute1: { scheduleMode: 'interval', intervalUnit: 'minute', intervalValue: 1 },
  minute5: { scheduleMode: 'interval', intervalUnit: 'minute', intervalValue: 5 },
  minute30: { scheduleMode: 'interval', intervalUnit: 'minute', intervalValue: 30 },
  hour1: { scheduleMode: 'interval', intervalUnit: 'hour', intervalValue: 1 },
  hour4: { scheduleMode: 'interval', intervalUnit: 'hour', intervalValue: 4 },
  day1: { scheduleMode: 'interval', intervalUnit: 'day', intervalValue: 1 },
  week1: { scheduleMode: 'interval', intervalUnit: 'week', intervalValue: 1 },
};

const INTERVAL_UNIT_MINUTES = {
  minute: 1,
  hour: 60,
  day: 1440,
  week: 10080,
};

export const PDF_SAVE_FORMATS = new Set(['pdf']);
export const IMAGE_SAVE_FORMATS = new Set(['png', 'jpeg', 'webp']);
export const PAGE_CAPTURE_FORMATS = new Set(['mhtml']);
export const DOM_SNAPSHOT_FORMATS = new Set(['html']);

export function saveFormatLabel(value, locale = detectBrowserLocale()) {
  const format = SAVE_FORMATS.find((x) => x.value === value);
  return format ? t(format.labelKey, {}, locale) : String(value || '').toUpperCase();
}

export function normalizePdfOptions(raw = {}) {
  const paperSize = PDF_PAPER_SIZE_MAP[raw.paperSize] ? raw.paperSize : 'a4';
  const marginPreset = PDF_MARGIN_MAP[raw.marginPreset] ? raw.marginPreset : 'default';
  const numericScale = Number(raw.scalePercent ?? raw.scale);
  const scalePercent = PDF_SCALE_PERCENT_OPTIONS.includes(numericScale) ? numericScale : 100;
  return {
    landscape: raw.landscape === true,
    printBackground: raw.printBackground !== false,
    displayHeaderFooter: raw.displayHeaderFooter === true,
    preferCssPageSize: raw.preferCssPageSize !== false,
    generateDocumentOutline: raw.generateDocumentOutline === true,
    paperSize,
    marginPreset,
    scalePercent,
  };
}

export function normalizeImageOptions(raw = {}) {
  const jpegQuality = Math.max(1, Math.min(100, Number(raw.jpegQuality ?? 90) || 90));
  return {
    jpegQuality,
  };
}

export function normalizeAuthOptions(raw = {}) {
  return {
    loginFailureUrlPattern: String(raw.loginFailureUrlPattern || '').trim(),
    requiredSelectorType: raw.requiredSelectorType === 'xpath' ? 'xpath' : 'css',
    requiredSelector: String(raw.requiredSelector || '').trim(),
  };
}

export const DEFAULT_APP_SETTINGS = {
  logLimit: 300,
  uiLanguage: 'browser',
};

export function uid(prefix = 'id') {
  const raw = (
    globalThis.crypto?.randomUUID?.() || `${Date.now()}-${Math.random().toString(16).slice(2)}`
  ).replace(/[^a-zA-Z0-9_-]/g, '');
  return `${prefix}_${raw}`;
}

export function deepClone(value) {
  return JSON.parse(JSON.stringify(value));
}

export function sanitizeFolder(input, { allowBlank = false, fallback = 'AutoPageCapture' } = {}) {
  const source = input ?? fallback;
  const text = source.trim().replace(/\\/g, '/');
  const cleaned = text
    .split('/')
    .map((part) =>
      part
        .trim()
        .replace(/[<>:"|?*]/g, '_')
        .replace(/\.+$/g, '')
        .replace(/^\.+/g, '')
    )
    .filter(Boolean)
    .join('/');
  return cleaned || (allowBlank ? '' : fallback);
}

export function sanitizeFileNamePart(input, fallback = 'capture', allowBlank = false) {
  const source = input ?? fallback;
  const text = source
    .trim()
    .replace(/[<>:"/\\|?*]+/g, '_')
    .replace(/\s+/g, '_');
  return text || (allowBlank ? '' : fallback);
}

export function normalizeTime(value) {
  const text = String(value || '15:00').trim();
  const m = text.match(/^(\d{1,2}):(\d{2})$/);
  if (!m) {
    return '15:00';
  }
  const hh = Math.max(0, Math.min(23, Number(m[1])));
  const mm = Math.max(0, Math.min(59, Number(m[2])));
  return `${String(hh).padStart(2, '0')}:${String(mm).padStart(2, '0')}`;
}

export function normalizeDateTimeLocal(value) {
  const text = String(value || '').trim();
  if (!text) {
    return '';
  }
  const hasDateAndTime =
    /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(text) ||
    /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d+)?(?:Z|[+-]\d{2}:\d{2})?$/.test(text);
  if (!hasDateAndTime) {
    return '';
  }
  const d = new Date(text);
  if (Number.isNaN(d.getTime())) {
    return '';
  }
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  const hh = String(d.getHours()).padStart(2, '0');
  const mi = String(d.getMinutes()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}T${hh}:${mi}`;
}

function localDateTimeAt(timeText = '15:00', fromDate = new Date()) {
  const [hh, mm] = normalizeTime(timeText).split(':').map(Number);
  const d = new Date(fromDate);
  d.setSeconds(0, 0);
  d.setHours(hh, mm, 0, 0);
  const yyyy = d.getFullYear();
  const mon = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  const hour = String(d.getHours()).padStart(2, '0');
  const minute = String(d.getMinutes()).padStart(2, '0');
  return `${yyyy}-${mon}-${day}T${hour}:${minute}`;
}

function normalizePositiveInteger(value, fallback = 1) {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) {
    return fallback;
  }
  return Math.max(1, Math.round(parsed));
}

function normalizeMonthlyDay(value, fallback = 1) {
  return Math.max(1, Math.min(31, normalizePositiveInteger(value, fallback)));
}

function dayOfMonthFromDateTime(value, fallback = 1) {
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? fallback : d.getDate();
}

export function intervalMinutes(intervalKey) {
  const minutes = SCHEDULE_INTERVAL_MAP[intervalKey]?.minutes;
  return typeof minutes === 'number' && Number.isFinite(minutes) ? minutes : 1440;
}

function resolvedScheduleMode(schedule = {}) {
  if (SCHEDULE_MODE_MAP[schedule.scheduleMode]) {
    return schedule.scheduleMode;
  }
  return (LEGACY_INTERVAL_DEFAULTS[schedule.intervalKey] || LEGACY_INTERVAL_DEFAULTS.day1)
    .scheduleMode;
}

function resolvedScheduleIntervalUnit(schedule = {}) {
  if (SCHEDULE_INTERVAL_UNIT_MAP[schedule.intervalUnit]) {
    return schedule.intervalUnit;
  }
  return (LEGACY_INTERVAL_DEFAULTS[schedule.intervalKey] || LEGACY_INTERVAL_DEFAULTS.day1)
    .intervalUnit;
}

function resolvedScheduleIntervalValue(schedule = {}) {
  if (
    schedule.intervalValue !== undefined &&
    schedule.intervalValue !== null &&
    schedule.intervalValue !== ''
  ) {
    return normalizePositiveInteger(schedule.intervalValue, 1);
  }
  return (LEGACY_INTERVAL_DEFAULTS[schedule.intervalKey] || LEGACY_INTERVAL_DEFAULTS.day1)
    .intervalValue;
}

function resolvedScheduleMonthlyDay(schedule = {}) {
  return normalizeMonthlyDay(schedule.monthlyDay, dayOfMonthFromDateTime(schedule.startAt, 1));
}

function scheduleLegacyIntervalKey(schedule = {}) {
  const scheduleMode = resolvedScheduleMode(schedule);
  if (scheduleMode === 'once') {
    return 'once';
  }
  if (scheduleMode === 'monthly') {
    return 'monthly';
  }
  const intervalUnit = resolvedScheduleIntervalUnit(schedule);
  const intervalValue = resolvedScheduleIntervalValue(schedule);
  if (intervalUnit === 'minute' && intervalValue === 1) {
    return 'minute1';
  }
  if (intervalUnit === 'minute' && intervalValue === 5) {
    return 'minute5';
  }
  if (intervalUnit === 'minute' && intervalValue === 30) {
    return 'minute30';
  }
  if (intervalUnit === 'hour' && intervalValue === 1) {
    return 'hour1';
  }
  if (intervalUnit === 'hour' && intervalValue === 4) {
    return 'hour4';
  }
  if (intervalUnit === 'day' && intervalValue === 1) {
    return 'day1';
  }
  if (intervalUnit === 'week' && intervalValue === 1) {
    return 'week1';
  }
  return 'custom';
}

function intervalUnitLabel(intervalUnit, intervalValue, locale = detectBrowserLocale()) {
  const quantityKey = intervalValue === 1 ? 'one' : 'other';
  return t(`shared.intervalUnit.${intervalUnit}.${quantityKey}`, {}, locale);
}

export function scheduleIntervalDescription(schedule, locale = detectBrowserLocale()) {
  const scheduleMode = resolvedScheduleMode(schedule);
  if (scheduleMode === 'once') {
    return t('shared.interval.once', {}, locale);
  }
  if (scheduleMode === 'monthly') {
    return t('shared.interval.monthlyDay', { day: resolvedScheduleMonthlyDay(schedule) }, locale);
  }
  const intervalValue = resolvedScheduleIntervalValue(schedule);
  const intervalUnit = resolvedScheduleIntervalUnit(schedule);
  return t(
    'shared.interval.everyN',
    { count: intervalValue, unit: intervalUnitLabel(intervalUnit, intervalValue, locale) },
    locale
  );
}

export function scheduleLabel(schedule, locale = detectBrowserLocale()) {
  const interval = scheduleIntervalDescription(schedule, locale);
  if (!schedule?.startAt) {
    return t('shared.scheduleNotSet', { interval }, locale);
  }
  const d = new Date(schedule.startAt);
  if (Number.isNaN(d.getTime())) {
    return t('shared.scheduleNotSet', { interval }, locale);
  }
  const hh = String(d.getHours()).padStart(2, '0');
  const mm = String(d.getMinutes()).padStart(2, '0');
  return `${hh}:${mm} / ${interval}`;
}

export function executionStatusLabel(status, errorCode = '', locale = detectBrowserLocale()) {
  if (errorCode === 'auth') {
    return t('shared.runStatus.authError', {}, locale);
  }
  if (status === 'success') {
    return t('shared.runStatus.success', {}, locale);
  }
  if (status === 'error') {
    return t('shared.runStatus.error', {}, locale);
  }
  return String(status || '');
}

export function normalizeAppSettings(raw = {}) {
  const logLimit = Number(raw.logLimit ?? DEFAULT_APP_SETTINGS.logLimit);
  const uiLanguage =
    raw.uiLanguage === 'browser' || SUPPORTED_LOCALES.includes(raw.uiLanguage)
      ? raw.uiLanguage
      : DEFAULT_APP_SETTINGS.uiLanguage;
  return {
    logLimit: Number.isFinite(logLimit)
      ? Math.max(10, Math.min(5000, Math.round(logLimit)))
      : DEFAULT_APP_SETTINGS.logLimit,
    uiLanguage,
  };
}

function migrateLegacyWait(raw = {}) {
  if (raw.type !== 'waitForState') {
    return raw;
  }
  const kind = raw.conditionKind || 'exists';
  if (kind === 'notExists') {
    return { ...raw, type: 'waitForNotExists' };
  }
  if (kind === 'attribute') {
    return { ...raw, type: 'waitForAttribute' };
  }
  return { ...raw, type: 'waitForExists' };
}

export function normalizeAction(raw = {}) {
  const migrated = migrateLegacyWait(raw);
  const type = migrated.type || 'clickText';
  const base = {
    id: migrated.id || uid('act'),
    type,
  };

  switch (type) {
    case 'clickSelector':
      return {
        ...base,
        enabled: migrated.enabled !== false,
        selector: String(migrated.selector || 'button'),
        waitAfterMs: Math.max(
          0,
          migrated.waitAfterMs === '' ? 1000 : Number(migrated.waitAfterMs ?? 1000) || 1000
        ),
      };
    case 'clickXPath':
      return {
        ...base,
        enabled: migrated.enabled !== false,
        xpath: String(migrated.xpath || '//button'),
        waitAfterMs: Math.max(
          0,
          migrated.waitAfterMs === '' ? 1000 : Number(migrated.waitAfterMs ?? 1000) || 1000
        ),
      };
    case 'setValue':
      return {
        ...base,
        enabled: migrated.enabled !== false,
        selector: String(migrated.selector || 'input'),
        value: String(migrated.value ?? ''),
        dispatchInput: ['dispatch', 'skip'].includes(migrated.dispatchInputMode)
          ? migrated.dispatchInputMode === 'dispatch'
          : migrated.dispatchInput !== false,
        dispatchChange: ['dispatch', 'skip'].includes(migrated.dispatchChangeMode)
          ? migrated.dispatchChangeMode === 'dispatch'
          : migrated.dispatchChange !== false,
        waitAfterMs: Math.max(
          0,
          migrated.waitAfterMs === '' ? 1000 : Number(migrated.waitAfterMs ?? 1000) || 1000
        ),
      };
    case 'waitForExists':
      return {
        ...base,
        enabled: migrated.enabled !== false,
        selectorType: migrated.selectorType === 'xpath' ? 'xpath' : 'css',
        selector: String(
          migrated.selector || (migrated.selectorType === 'xpath' ? '//body' : 'body')
        ),
        timeoutMs: Math.max(100, Number(migrated.timeoutMs ?? 10000) || 10000),
      };
    case 'waitForNotExists':
      return {
        ...base,
        enabled: migrated.enabled !== false,
        selectorType: migrated.selectorType === 'xpath' ? 'xpath' : 'css',
        selector: String(
          migrated.selector || (migrated.selectorType === 'xpath' ? '//body' : 'body')
        ),
        timeoutMs: Math.max(100, Number(migrated.timeoutMs ?? 10000) || 10000),
      };
    case 'waitForAttribute':
      return {
        ...base,
        enabled: migrated.enabled !== false,
        selectorType: migrated.selectorType === 'xpath' ? 'xpath' : 'css',
        selector: String(
          migrated.selector || (migrated.selectorType === 'xpath' ? '//body' : 'body')
        ),
        attributeName: String(migrated.attributeName || 'aria-expanded'),
        operator: ['equals', 'notEquals', 'contains'].includes(migrated.operator)
          ? migrated.operator
          : 'equals',
        expectedValue: String(migrated.expectedValue ?? 'true'),
        timeoutMs: Math.max(100, Number(migrated.timeoutMs ?? 10000) || 10000),
      };
    case 'wait':
      return {
        ...base,
        enabled: migrated.enabled !== false,
        ms: Math.max(0, migrated.ms === '' ? 1000 : Number(migrated.ms ?? 1000) || 1000),
      };
    case 'clickText':
    default:
      return {
        ...base,
        enabled: migrated.enabled !== false,
        selector: String(migrated.selector || 'button'),
        text: String(migrated.text || ''),
        textSourceSelector: String(migrated.textSourceSelector || ''),
        operator: ['equals', 'contains'].includes(migrated.operator)
          ? migrated.operator
          : migrated.exact === false
            ? 'contains'
            : 'equals',
        waitAfterMs: Math.max(
          0,
          migrated.waitAfterMs === '' ? 1000 : Number(migrated.waitAfterMs ?? 1000) || 1000
        ),
      };
  }
}

function migrateLegacySchedule(raw = {}) {
  if (Object.prototype.hasOwnProperty.call(raw, 'startAt')) {
    return raw;
  }
  const legacyTime = normalizeTime(raw.startTime || raw.scheduleTime || '15:00');
  return {
    ...raw,
    startAt: localDateTimeAt(legacyTime),
  };
}

export function normalizeSchedule(raw = {}, fallbackDateTime = localDateTimeAt('15:00')) {
  const migrated = migrateLegacySchedule(raw);
  const startAt = normalizeDateTimeLocal(migrated.startAt || fallbackDateTime);
  const legacyDefaults =
    LEGACY_INTERVAL_DEFAULTS[migrated.intervalKey] || LEGACY_INTERVAL_DEFAULTS.day1;
  const scheduleMode = SCHEDULE_MODE_MAP[migrated.scheduleMode]
    ? migrated.scheduleMode
    : legacyDefaults.scheduleMode;
  const intervalUnit = SCHEDULE_INTERVAL_UNIT_MAP[migrated.intervalUnit]
    ? migrated.intervalUnit
    : legacyDefaults.intervalUnit;
  const intervalValue = normalizePositiveInteger(
    migrated.intervalValue,
    legacyDefaults.intervalValue
  );
  const monthlyDay = normalizeMonthlyDay(migrated.monthlyDay, dayOfMonthFromDateTime(startAt, 1));
  const nextSchedule = {
    id: migrated.id || uid('sch'),
    startAt,
    scheduleMode,
    intervalUnit,
    intervalValue,
    monthlyDay,
    endAt: normalizeDateTimeLocal(migrated.endAt || ''),
    enabled: migrated.enabled !== false,
  };
  return {
    ...nextSchedule,
    intervalKey: scheduleLegacyIntervalKey(nextSchedule),
  };
}

export function createDefaultSchedule(startAt = localDateTimeAt('15:00')) {
  return normalizeSchedule(
    { startAt, scheduleMode: 'interval', intervalValue: 1, intervalUnit: 'day' },
    startAt
  );
}

export function normalizeItem(raw = {}) {
  const actions = Array.isArray(raw.actions) ? raw.actions.map(normalizeAction) : [];
  const hasOwn = (key) => Object.prototype.hasOwnProperty.call(raw, key);
  const downloadFolderSource = hasOwn('downloadFolder') ? raw.downloadFolder : '';
  const filenamePrefixSource = hasOwn('filenamePrefix') ? raw.filenamePrefix : '';
  const pdfOptionsSource = hasOwn('pdfOptions') ? raw.pdfOptions : {};
  const imageOptionsSource = hasOwn('imageOptions') ? raw.imageOptions : {};
  const authOptionsSource = hasOwn('authOptions') ? raw.authOptions : {};
  const schedulesRaw =
    Array.isArray(raw.schedules) && raw.schedules.length > 0
      ? raw.schedules
      : [
          {
            startAt: localDateTimeAt(raw.scheduleTime || '15:00'),
            scheduleMode: 'interval',
            intervalValue: 1,
            intervalUnit: 'day',
          },
        ];
  const schedules = schedulesRaw.map((x, idx) =>
    normalizeSchedule(x, idx === 0 ? localDateTimeAt('15:00') : localDateTimeAt('15:00'))
  );
  if (schedules.length === 0) {
    schedules.push(createDefaultSchedule(localDateTimeAt('15:00')));
  }

  return {
    id: raw.id || uid('item'),
    name: String(raw.name || t('shared.newItem', {}, detectBrowserLocale())),
    description: String(raw.description || ''),
    enabled: raw.enabled !== false,
    url: String(raw.url || '').trim(),
    saveFormat: ['mhtml', 'html', 'pdf', 'png', 'jpeg', 'webp'].includes(raw.saveFormat)
      ? raw.saveFormat
      : 'mhtml',
    schedules,
    downloadFolder: sanitizeFolder(downloadFolderSource, { allowBlank: true, fallback: '' }),
    filenamePrefix: sanitizeFileNamePart(filenamePrefixSource, 'capture', true),
    closeTabAfterSave: raw.closeTabAfterSave !== false,
    waitBeforeActionsMs: Math.max(
      0,
      raw.waitBeforeActionsMs === '' ? 1000 : Number(raw.waitBeforeActionsMs ?? 1000) || 1000
    ),
    waitAfterActionsMs: Math.max(
      0,
      raw.waitAfterActionsMs === '' ? 1000 : Number(raw.waitAfterActionsMs ?? 1000) || 1000
    ),
    pdfOptions: normalizePdfOptions(pdfOptionsSource),
    imageOptions: normalizeImageOptions(imageOptionsSource),
    authOptions: normalizeAuthOptions(authOptionsSource),
    actions,
  };
}

export function createBlankItem(itemNumber = 1, locale = detectBrowserLocale()) {
  return normalizeItem({
    name: t('shared.itemName', { index: itemNumber }, locale),
    description: '',
    enabled: true,
    url: '',
    saveFormat: 'mhtml',
    schedules: [
      {
        startAt: localDateTimeAt('15:00'),
        scheduleMode: 'interval',
        intervalValue: 1,
        intervalUnit: 'day',
        endAt: '',
      },
    ],
    downloadFolder: '',
    filenamePrefix: '',
    actions: [],
    waitBeforeActionsMs: 1000,
    waitAfterActionsMs: 1000,
    closeTabAfterSave: true,
  });
}

export function createDefaultDailyPdfItem(locale = detectBrowserLocale()) {
  return normalizeItem({
    name: 'Homepage PDF sample',
    description: t('shared.default.dailyPdf.description', {}, locale),
    enabled: false,
    url: 'https://www.wikipedia.org/',
    saveFormat: 'pdf',
    schedules: [
      {
        startAt: localDateTimeAt('21:00'),
        scheduleMode: 'interval',
        intervalValue: 1,
        intervalUnit: 'day',
        endAt: '',
      },
    ],
    downloadFolder: '',
    filenamePrefix: '',
    closeTabAfterSave: true,
    waitBeforeActionsMs: 1000,
    waitAfterActionsMs: 1000,
    actions: [],
  });
}

export function createDefaultScreenshotItem(locale = detectBrowserLocale()) {
  return normalizeItem({
    name: t('shared.default.screenshot.name', {}, locale),
    description: t('shared.default.screenshot.description', {}, locale),
    enabled: false,
    url: 'https://www.billboard.com/charts/',
    saveFormat: 'png',
    schedules: [
      {
        startAt: localDateTimeAt('21:15'),
        scheduleMode: 'interval',
        intervalValue: 1,
        intervalUnit: 'day',
        endAt: '',
      },
    ],
    downloadFolder: '',
    filenamePrefix: '',
    closeTabAfterSave: true,
    waitBeforeActionsMs: 1000,
    waitAfterActionsMs: 1000,
    actions: [],
  });
}

export function createDefaultArchiveItem(locale = detectBrowserLocale()) {
  return normalizeItem({
    name: t('shared.default.archive.name', {}, locale),
    description: t('shared.default.archive.description', {}, locale),
    enabled: false,
    url: 'https://news.ycombinator.com/',
    saveFormat: 'mhtml',
    schedules: [
      {
        startAt: localDateTimeAt('21:30'),
        scheduleMode: 'interval',
        intervalValue: 1,
        intervalUnit: 'day',
        endAt: '',
      },
    ],
    downloadFolder: '',
    filenamePrefix: '',
    closeTabAfterSave: true,
    waitBeforeActionsMs: 1000,
    waitAfterActionsMs: 1000,
    actions: [],
  });
}

export function getDefaultItems(locale = detectBrowserLocale()) {
  return [
    createDefaultDailyPdfItem(locale),
    createDefaultScreenshotItem(locale),
    createDefaultArchiveItem(locale),
  ];
}

export function isFileUrl(urlText) {
  try {
    return new URL(urlText).protocol === 'file:';
  } catch {
    return false;
  }
}

export function canRequestOriginPermission(urlText) {
  try {
    const protocol = new URL(urlText).protocol;
    return protocol === 'https:' || protocol === 'http:';
  } catch {
    return false;
  }
}

export function deriveOriginPattern(urlText) {
  const url = new URL(urlText);
  if (url.protocol === 'file:') {
    return 'file:///*';
  }
  if (!(url.protocol === 'https:' || url.protocol === 'http:')) {
    throw new Error('Only http/https/file URLs are supported.');
  }
  return `${url.protocol}//${url.host}/*`;
}

export async function isFileSchemeAccessAllowed() {
  const extensionApi = globalThis.chrome?.extension;
  if (!extensionApi?.isAllowedFileSchemeAccess) {
    return false;
  }
  return await new Promise((resolve) => {
    try {
      extensionApi.isAllowedFileSchemeAccess((allowed) => resolve(Boolean(allowed)));
    } catch {
      resolve(false);
    }
  });
}

export function fileExtensionFor(format) {
  switch (format) {
    case 'html':
    case 'pdf':
    case 'png':
    case 'jpeg':
    case 'webp':
      return format;
    case 'mhtml':
    default:
      return 'mhtml';
  }
}

export function buildFilename(item, date = new Date(), resolvedPrefix = '') {
  const yyyy = date.getFullYear();
  const mm = String(date.getMonth() + 1).padStart(2, '0');
  const dd = String(date.getDate()).padStart(2, '0');
  const hh = String(date.getHours()).padStart(2, '0');
  const mi = String(date.getMinutes()).padStart(2, '0');
  const ss = String(date.getSeconds()).padStart(2, '0');
  const folder = sanitizeFolder(item.downloadFolder, { allowBlank: true, fallback: '' });
  const prefix = sanitizeFileNamePart(
    resolvedPrefix || item.filenamePrefix || item.name || 'capture',
    'capture'
  );
  const ext = fileExtensionFor(item.saveFormat);
  const basename = `${prefix}_${yyyy}${mm}${dd}_${hh}${mi}${ss}.${ext}`;
  return folder ? `${folder}/${basename}` : basename;
}

export function alarmNameFor(itemId, scheduleId) {
  return `scheduled-item:${itemId}:${scheduleId}`;
}

export function parseAlarmName(name) {
  if (!String(name || '').startsWith('scheduled-item:')) {
    return null;
  }
  const [, itemId, scheduleId] = String(name).split(':');
  if (!itemId || !scheduleId) {
    return null;
  }
  return { itemId, scheduleId };
}

export function localYmd(date = new Date()) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

function daysInMonth(year, monthIndex) {
  return new Date(year, monthIndex + 1, 0).getDate();
}

function buildMonthlyCandidate(anchor, year, monthIndex, monthlyDay) {
  const candidate = new Date(anchor);
  candidate.setSeconds(0, 0);
  candidate.setFullYear(year, monthIndex, 1);
  candidate.setDate(Math.min(monthlyDay, daysInMonth(year, monthIndex)));
  return candidate;
}

export function nextOccurrenceForSchedule(schedule, fromDate = new Date()) {
  if (!schedule || schedule.enabled === false) {
    return null;
  }
  const anchor = schedule.startAt ? new Date(schedule.startAt) : null;
  if (!(anchor instanceof Date) || Number.isNaN(anchor.getTime())) {
    return null;
  }
  const now = new Date(fromDate);
  const endAt = schedule.endAt ? new Date(schedule.endAt) : null;
  if (endAt && Number.isNaN(endAt.getTime())) {
    return null;
  }

  let next = new Date(anchor);
  const scheduleMode = resolvedScheduleMode(schedule);
  if (scheduleMode === 'once') {
    if (next.getTime() < now.getTime()) {
      return null;
    }
  } else if (scheduleMode === 'monthly') {
    if (next.getTime() < now.getTime()) {
      const monthlyDay = resolvedScheduleMonthlyDay(schedule);
      let year = now.getFullYear();
      let monthIndex = now.getMonth();
      next = buildMonthlyCandidate(anchor, year, monthIndex, monthlyDay);
      while (next.getTime() < now.getTime() || next.getTime() < anchor.getTime()) {
        monthIndex += 1;
        if (monthIndex > 11) {
          monthIndex = 0;
          year += 1;
        }
        next = buildMonthlyCandidate(anchor, year, monthIndex, monthlyDay);
      }
    }
  } else {
    const intervalMs =
      resolvedScheduleIntervalValue(schedule) *
      (INTERVAL_UNIT_MINUTES[resolvedScheduleIntervalUnit(schedule)] || 1440) *
      60 *
      1000;
    if (next.getTime() < now.getTime()) {
      const diff = now.getTime() - next.getTime();
      const steps = Math.floor(diff / intervalMs) + 1;
      next = new Date(next.getTime() + steps * intervalMs);
    }
  }
  if (endAt && next.getTime() > endAt.getTime()) {
    return null;
  }
  return next;
}

export function itemNextOccurrence(item, fromDate = new Date()) {
  const nextTimes = (item.schedules || [])
    .map((schedule) => ({ schedule, at: nextOccurrenceForSchedule(schedule, fromDate) }))
    .filter((x) => x.at instanceof Date && !Number.isNaN(x.at.getTime()))
    .sort((a, b) => a.at.getTime() - b.at.getTime());
  return nextTimes[0] || null;
}

export function formatDateTime(isoText, locale = detectBrowserLocale()) {
  if (!isoText) {
    return '-';
  }
  const d = new Date(isoText);
  if (Number.isNaN(d.getTime())) {
    return String(isoText);
  }
  return new Intl.DateTimeFormat(locale, {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  }).format(d);
}

export function humanAction(action, locale = detectBrowserLocale()) {
  switch (action.type) {
    case 'clickSelector':
      return t('shared.humanAction.clickSelector', { selector: action.selector }, locale);
    case 'clickXPath':
      return t('shared.humanAction.clickXPath', { xpath: action.xpath }, locale);
    case 'setValue':
      return t('shared.humanAction.setValue', { selector: action.selector }, locale);
    case 'waitForExists':
      return t(
        'shared.humanAction.waitForExists',
        {
          selectorType: t(
            action.selectorType === 'xpath' ? 'selectorType.xpath' : 'selectorType.css',
            {},
            locale
          ),
          selector: action.selector,
        },
        locale
      );
    case 'waitForNotExists':
      return t(
        'shared.humanAction.waitForNotExists',
        {
          selectorType: t(
            action.selectorType === 'xpath' ? 'selectorType.xpath' : 'selectorType.css',
            {},
            locale
          ),
          selector: action.selector,
        },
        locale
      );
    case 'waitForAttribute':
      return t(
        'shared.humanAction.waitForAttribute',
        {
          attributeName: action.attributeName,
          operator: t(`operator.${action.operator || 'equals'}`, {}, locale),
          expectedValue: action.expectedValue,
        },
        locale
      );
    case 'wait':
      return t('shared.humanAction.wait', { ms: action.ms }, locale);
    case 'clickText':
    default:
      return t(
        'shared.humanAction.clickText',
        {
          text: action.text || t('shared.empty', {}, locale),
          operator: t(
            `operator.${action.operator === 'contains' ? 'contains' : 'equals'}`,
            {},
            locale
          ),
        },
        locale
      );
  }
}

export function summarizeItem(item, locale = detectBrowserLocale()) {
  const next = itemNextOccurrence(item);
  return {
    host: (() => {
      try {
        if (!item.url) {
          return t('shared.hostUnset', {}, locale);
        }
        const url = new URL(item.url);
        return url.protocol === 'file:' ? t('shared.hostFile', {}, locale) : url.host;
      } catch {
        return t('shared.hostInvalid', {}, locale);
      }
    })(),
    nextLabel: next
      ? `${formatDateTime(next.at.toISOString(), locale)} / ${scheduleIntervalDescription(next.schedule, locale)}`
      : t('shared.timeUnset', {}, locale),
    scheduleCount: Array.isArray(item.schedules) ? item.schedules.length : 0,
  };
}

export function validateAction(action, index = 0, locale = detectBrowserLocale()) {
  const errors = [];
  if (!action || typeof action !== 'object') {
    errors.push(t('validation.invalidActionConfig', { index: index + 1 }, locale));
    return { ok: false, errors };
  }
  switch (action.type) {
    case 'clickText':
      if (!String(action.selector || '').trim()) {
        errors.push(t('validation.selectorRequired', { index: index + 1 }, locale));
      }
      if (!String(action.text || '').trim()) {
        errors.push(t('validation.textRequired', { index: index + 1 }, locale));
      }
      break;
    case 'clickSelector':
      if (!String(action.selector || '').trim()) {
        errors.push(t('validation.cssSelectorRequired', { index: index + 1 }, locale));
      }
      break;
    case 'clickXPath':
      if (!String(action.xpath || '').trim()) {
        errors.push(t('validation.xpathRequired', { index: index + 1 }, locale));
      }
      break;
    case 'setValue':
      if (!String(action.selector || '').trim()) {
        errors.push(t('validation.cssSelectorRequired', { index: index + 1 }, locale));
      }
      if (!String(action.value || '').trim()) {
        errors.push(t('validation.valueRequired', { index: index + 1 }, locale));
      }
      break;
    case 'waitForExists':
    case 'waitForNotExists':
      if (!String(action.selector || '').trim()) {
        errors.push(t('validation.selectorRequired', { index: index + 1 }, locale));
      }
      break;
    case 'waitForAttribute':
      if (!String(action.selector || '').trim()) {
        errors.push(t('validation.selectorRequired', { index: index + 1 }, locale));
      }
      if (!String(action.attributeName || '').trim()) {
        errors.push(t('validation.attributeNameRequired', { index: index + 1 }, locale));
      }
      if (!String(action.expectedValue || '').trim()) {
        errors.push(t('validation.valueRequired', { index: index + 1 }, locale));
      }
      break;
    case 'wait':
      break;
    default:
      errors.push(t('validation.unknownActionType', { index: index + 1 }, locale));
      break;
  }
  return { ok: errors.length === 0, errors };
}

export function validateItem(item, locale = detectBrowserLocale()) {
  const errors = [];
  if (!String(item.url || '').trim()) {
    errors.push(t('validation.urlRequired', {}, locale));
  } else {
    try {
      deriveOriginPattern(item.url);
    } catch {
      errors.push(t('validation.urlSupportedSchemes', {}, locale));
    }
  }
  if (!String(item.saveFormat || '').trim()) {
    errors.push(t('validation.saveFormatRequired', {}, locale));
  }
  const schedules = Array.isArray(item.schedules) ? item.schedules : [];
  if (schedules.length === 0) {
    errors.push(t('validation.scheduleRequired', {}, locale));
  }
  const first = schedules[0];
  if (!first || !normalizeDateTimeLocal(first.startAt || '')) {
    errors.push(t('validation.startAtRequired', {}, locale));
  }
  if (!first || !String(first.scheduleMode || '').trim()) {
    errors.push(t('validation.scheduleModeRequired', { index: 1 }, locale));
  }
  schedules.forEach((schedule, index) => {
    if (!normalizeDateTimeLocal(schedule.startAt || '')) {
      errors.push(t('validation.scheduleStartAtRequired', { index: index + 1 }, locale));
    }
    if (!String(schedule.scheduleMode || '').trim()) {
      errors.push(t('validation.scheduleModeRequired', { index: index + 1 }, locale));
    }
    if (resolvedScheduleMode(schedule) === 'interval') {
      if (!String(schedule.intervalUnit || '').trim()) {
        errors.push(t('validation.scheduleIntervalUnitRequired', { index: index + 1 }, locale));
      }
      if (
        schedule.intervalValue === '' ||
        !Number.isFinite(Number(schedule.intervalValue)) ||
        Number(schedule.intervalValue) < 1
      ) {
        errors.push(t('validation.scheduleIntervalValueRequired', { index: index + 1 }, locale));
      }
    }
    if (resolvedScheduleMode(schedule) === 'monthly') {
      if (
        schedule.monthlyDay === '' ||
        !Number.isFinite(Number(schedule.monthlyDay)) ||
        Number(schedule.monthlyDay) < 1 ||
        Number(schedule.monthlyDay) > 31
      ) {
        errors.push(t('validation.scheduleMonthlyDayInvalid', { index: index + 1 }, locale));
      }
    }
    if (schedule.startAt && schedule.endAt) {
      const s = new Date(schedule.startAt);
      const e = new Date(schedule.endAt);
      if (!Number.isNaN(s.getTime()) && !Number.isNaN(e.getTime()) && s.getTime() > e.getTime()) {
        errors.push(t('validation.scheduleRangeInvalid', { index: index + 1 }, locale));
      }
    }
  });
  const actions = Array.isArray(item.actions) ? item.actions : [];
  actions.forEach((action, index) => {
    const result = validateAction(action, index, locale);
    if (!result.ok) {
      errors.push(...result.errors);
    }
  });
  return { ok: errors.length === 0, errors };
}

export async function loadConfig() {
  const stored = await chrome.storage.local.get([
    STORAGE_KEYS.SETTINGS_VERSION,
    STORAGE_KEYS.ITEMS,
    STORAGE_KEYS.RECENT_HISTORY,
    STORAGE_KEYS.LOGS,
    STORAGE_KEYS.LAST_RUN_BY_ITEM,
    STORAGE_KEYS.APP_SETTINGS,
  ]);

  let items = Array.isArray(stored.items) ? stored.items.map(normalizeItem) : null;
  if (!items) {
    items = getDefaultItems();
  }

  return {
    settingsVersion: stored.settingsVersion || SETTINGS_VERSION,
    items,
    recentHistory: Array.isArray(stored.recentHistory) ? stored.recentHistory : [],
    logs: Array.isArray(stored.logs) ? stored.logs : [],
    lastRunByItem:
      stored.lastRunByItem && typeof stored.lastRunByItem === 'object' ? stored.lastRunByItem : {},
    appSettings: normalizeAppSettings(stored.appSettings || {}),
  };
}

export async function saveConfig({ items, appSettings }) {
  const normalizedItems = (items || []).map(normalizeItem);
  const normalizedAppSettings = normalizeAppSettings(appSettings || {});
  await chrome.storage.local.set({
    [STORAGE_KEYS.SETTINGS_VERSION]: SETTINGS_VERSION,
    [STORAGE_KEYS.ITEMS]: normalizedItems,
    [STORAGE_KEYS.APP_SETTINGS]: normalizedAppSettings,
  });
  return { items: normalizedItems, appSettings: normalizedAppSettings };
}
