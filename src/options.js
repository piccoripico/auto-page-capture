import {
  ACTION_TYPES,
  PDF_MARGIN_OPTIONS,
  PDF_PAPER_SIZE_OPTIONS,
  PDF_SCALE_PERCENT_OPTIONS,
  SAVE_FORMATS,
  SCHEDULE_INTERVAL_UNIT_OPTIONS,
  SCHEDULE_MODE_OPTIONS,
  buildFilename,
  createBlankItem,
  deepClone,
  deriveOriginPattern,
  canRequestOriginPermission,
  executionStatusLabel,
  formatDateTime,
  isFileSchemeAccessAllowed,
  isFileUrl,
  loadConfig,
  normalizeAction,
  normalizeAppSettings,
  normalizeItem,
  normalizePdfOptions,
  normalizeSchedule,
  nextOccurrenceForSchedule,
  saveFormatLabel,
  summarizeItem,
  uid,
  validateItem,
} from './lib/shared.js';
import { LANGUAGE_OPTIONS, applyI18n, resolveLocale, t } from './lib/i18n.js';

const itemsListEl = document.getElementById('items-list');
const detailRootEl = document.getElementById('detail-root');
const searchInputEl = document.getElementById('search-input');
const logLimitInputEl = document.getElementById('log-limit');
const logsBodyEl = document.getElementById('logs-body');
const logsSummaryEl = document.getElementById('logs-summary');
const statusEl = document.getElementById('status');
const saveButtonEl = document.getElementById('save-all');
const cancelButtonEl = document.getElementById('cancel-all');
const unsavedBannerEl = document.getElementById('unsaved-banner');
const stickyFooterEl = document.querySelector('.sticky-footer');
const detailEmptyTemplate = document.getElementById('detail-empty-template');
const detailTemplate = document.getElementById('detail-pane-template');
const scheduleCardTemplate = document.getElementById('schedule-card-template');
const scheduleIntervalFieldsTemplate = document.getElementById('schedule-interval-fields-template');
const scheduleMonthlyFieldsTemplate = document.getElementById('schedule-monthly-fields-template');
const scheduleOnceFieldsTemplate = document.getElementById('schedule-once-fields-template');
const pdfOutputSettingsTemplate = document.getElementById('pdf-output-settings-template');
const jpegOutputSettingsTemplate = document.getElementById('jpeg-output-settings-template');
const actionClickSelectorFieldsTemplate = document.getElementById(
  'action-click-selector-fields-template'
);
const actionClickXPathFieldsTemplate = document.getElementById(
  'action-click-xpath-fields-template'
);
const actionSetValueFieldsTemplate = document.getElementById('action-set-value-fields-template');
const actionWaitForExistsFieldsTemplate = document.getElementById(
  'action-wait-for-exists-fields-template'
);
const actionWaitForNotExistsFieldsTemplate = document.getElementById(
  'action-wait-for-not-exists-fields-template'
);
const actionWaitForAttributeFieldsTemplate = document.getElementById(
  'action-wait-for-attribute-fields-template'
);
const actionWaitFieldsTemplate = document.getElementById('action-wait-fields-template');
const actionClickTextFieldsTemplate = document.getElementById('action-click-text-fields-template');
const actionEmptyTemplate = document.getElementById('action-empty-template');
const actionTemplate = document.getElementById('action-editor-template');
const exportItemsButtonEl = document.getElementById('export-items-json');
const importItemsReplaceButtonEl = document.getElementById('import-items-json-replace');
const importItemsAddButtonEl = document.getElementById('import-items-json-add');
const importItemsFileEl = document.getElementById('import-items-file');
const uiLanguageEl = document.getElementById('ui-language');

const state = {
  items: [],
  logs: [],
  appSettings: normalizeAppSettings({}),
  selectedId: null,
  filter: 'all',
  search: '',
  dirty: false,
  permissionMap: {},
  validationMap: {},
  savedSnapshot: '',
};

let pendingImportMode = 'replace';
const FIELD_LABEL_META = Object.freeze({
  url: { key: 'fields.url', required: true },
  saveFormat: { key: 'fields.saveFormat', required: false },
  downloadFolder: {
    key: 'fields.downloadFolder',
    required: false,
  },
  filenamePrefix: {
    key: 'fields.filenamePrefix',
    required: false,
  },
  waitBefore: { key: 'fields.waitBefore', required: false },
  waitAfter: { key: 'fields.waitAfter', required: false },
  closeTab: { key: 'fields.closeTab', required: false },
  scheduleStartAt: {
    key: 'schedule.startAt',
    required: true,
  },
  scheduleEndAt: { key: 'schedule.endAt', required: false },
  scheduleMode: { key: 'schedule.mode', required: false },
  scheduleEvery: { key: 'schedule.every', required: false },
  scheduleUnit: { key: 'schedule.unit', required: false },
  scheduleMonthlyDay: {
    key: 'schedule.monthlyDay',
    required: false,
  },
  pdfOrientation: {
    key: 'fields.pdfOrientation',
    required: false,
  },
  pdfPaperSize: {
    key: 'fields.pdfPaperSize',
    required: false,
  },
  pdfMargins: { key: 'fields.pdfMargins', required: false },
  pdfBackground: {
    key: 'fields.pdfBackground',
    required: false,
  },
  pdfScale: { key: 'fields.pdfScale', required: false },
  pdfHeaderFooter: { key: 'fields.pdfHeaderFooter', required: false },
  pdfCssPageSize: { key: 'fields.pdfPreferCssPageSize', required: false },
  pdfDocumentOutline: { key: 'fields.pdfDocumentOutline', required: false },
  jpegQuality: { key: 'fields.jpegQuality', required: false },
  cssSelector: { key: 'fields.cssSelector', required: true },
  xpath: { key: 'fields.xpath', required: true },
  value: { key: 'fields.value', required: true },
  dispatchInput: {
    key: 'fields.dispatchInput',
    required: false,
  },
  dispatchChange: {
    key: 'fields.dispatchChange',
    required: false,
  },
  selectorType: {
    key: 'fields.selectorType',
    required: false,
  },
  selector: { key: 'fields.selector', required: true },
  timeoutMs: { key: 'fields.timeoutMs', required: false },
  attributeName: {
    key: 'fields.attributeName',
    required: true,
  },
  expectedValue: {
    key: 'fields.expectedValue',
    required: true,
  },
  operator: { key: 'fields.operator', required: false },
  fixedWaitMs: {
    key: 'fields.fixedWaitMs',
    required: false,
  },
  textSourceSelector: {
    key: 'fields.textSourceSelector',
    required: false,
  },
  text: { key: 'fields.text', required: true },
  waitMs: { key: 'fields.waitMs', required: false },
  waitAfterClick: {
    key: 'fields.waitAfterClick',
    required: false,
  },
});

const FIELD_NUMBER_CONSTRAINTS = Object.freeze({
  'wait-before': { min: 0 },
  'wait-after': { min: 0 },
  'image-jpeg-quality': { min: 1, max: 100 },
});

const SCHEDULE_NUMBER_CONSTRAINTS = Object.freeze({
  intervalValue: { min: 1 },
  monthlyDay: { min: 1, max: 31 },
});

const ACTION_NUMBER_CONSTRAINTS = Object.freeze({
  waitAfterMs: { min: 0 },
  timeoutMs: { min: 100 },
  ms: { min: 0 },
});

function currentLocale() {
  return resolveLocale(state.appSettings.uiLanguage);
}

function localizeStaticPage() {
  const locale = currentLocale();
  document.documentElement.lang = locale;
  document.title = t('app.settingsTitle', {}, locale);
  applyI18n(document, locale);
  exportItemsButtonEl.textContent = t('header.exportItems', {}, locale);
  importItemsReplaceButtonEl.textContent = t('header.importItemsReplace', {}, locale);
  importItemsAddButtonEl.textContent = t('header.importItemsAdd', {}, locale);
}

function renderLanguageSelect() {
  const value = state.appSettings.uiLanguage || 'browser';
  uiLanguageEl.innerHTML = LANGUAGE_OPTIONS.map(
    (option) => `<option value="${escapeHtml(option.value)}">${escapeHtml(option.label)}</option>`
  ).join('');
  uiLanguageEl.value = value;
}

function escapeHtml(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function csvEscape(value) {
  const text = String(value ?? '');
  return /[",\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
}

function logsToCsv(logs) {
  const header = ['at', 'itemName', 'status', 'trigger', 'filename', 'message'];
  const lines = [header.join(',')];
  for (const entry of logs) {
    lines.push(
      [
        entry.at,
        entry.itemName,
        entry.status,
        entry.trigger,
        entry.filename || '',
        entry.message || '',
      ]
        .map(csvEscape)
        .join(',')
    );
  }
  return lines.join('\n');
}

function setStatus(message, isError = false) {
  statusEl.textContent = message || '';
  statusEl.classList.toggle('error', Boolean(isError));
}

function getSelectedItem() {
  return state.items.find((item) => item.id === state.selectedId) || null;
}

function buildStateSnapshot(items = state.items, appSettings = state.appSettings) {
  return JSON.stringify({
    items: items.map((item) => normalizeItem(item)),
    appSettings: normalizeAppSettings(appSettings),
  });
}

function commitUiLanguageToSavedSnapshot() {
  try {
    const parsed = JSON.parse(state.savedSnapshot || '{}');
    parsed.appSettings = normalizeAppSettings({
      ...(parsed.appSettings || {}),
      uiLanguage: state.appSettings.uiLanguage,
    });
    state.savedSnapshot = JSON.stringify({
      items: Array.isArray(parsed.items) ? parsed.items : [],
      appSettings: parsed.appSettings,
    });
  } catch {
    state.savedSnapshot = buildStateSnapshot(state.items, state.appSettings);
  }
}

function restoreFromSavedSnapshot() {
  try {
    const parsed = JSON.parse(state.savedSnapshot || '{}');
    state.items = deepClone(parsed.items || []).map((item) => normalizeItem(item));
    state.appSettings = normalizeAppSettings(parsed.appSettings || {});
    if (!state.items.some((item) => item.id === state.selectedId)) {
      state.selectedId = state.items[0]?.id || null;
    }
  } catch {
    // ignore malformed snapshot
  }
}

function hasUnsavedChanges() {
  return buildStateSnapshot() !== state.savedSnapshot;
}

function setDirty(value) {
  state.dirty = value;
  const invalidCount = Object.values(state.validationMap).filter((x) => !x.ok).length;
  saveButtonEl.disabled = !value || invalidCount > 0;
  cancelButtonEl.disabled = !value;
  const locale = currentLocale();
  unsavedBannerEl.textContent = value
    ? invalidCount > 0
      ? t('footer.unsavedInvalid', {}, locale)
      : t('footer.unsaved', {}, locale)
    : t('footer.noUnsaved', {}, locale);
  unsavedBannerEl.classList.toggle('dirty', value);
  stickyFooterEl?.classList.toggle('has-dirty', value);
}

function updateDirtyState() {
  refreshValidation();
  syncActiveDetailValidation();
  setDirty(hasUnsavedChanges());
}

function syncActiveDetailValidation() {
  const item = getSelectedItem();
  const validationEl = document.getElementById('detail-validation');
  if (!item || !validationEl) {
    return;
  }
  const validation = state.validationMap[item.id] || validateItem(item, currentLocale());
  validationEl.hidden = validation.ok;
  validationEl.textContent = validation.ok ? '' : validation.errors[0];
}

function refreshValidation() {
  const locale = currentLocale();
  state.validationMap = Object.fromEntries(
    state.items.map((item) => [item.id, validateItem(item, locale)])
  );
}

async function refreshPermissions() {
  const map = {};
  for (const item of state.items) {
    try {
      if (!item.url) {
        map[item.id] = false;
        continue;
      }
      if (isFileUrl(item.url)) {
        map[item.id] = await isFileSchemeAccessAllowed();
        continue;
      }
      const origin = deriveOriginPattern(item.url);
      map[item.id] = await chrome.permissions.contains({ origins: [origin] });
    } catch {
      map[item.id] = false;
    }
  }
  state.permissionMap = map;
}

function filteredItems() {
  const term = state.search.trim().toLowerCase();
  return state.items.filter((item) => {
    const permissionMissing = !state.permissionMap[item.id] && !!item.url;
    if (state.filter === 'needs' && !permissionMissing) {
      return false;
    }
    if (state.filter === 'enabled' && !item.enabled) {
      return false;
    }
    if (!term) {
      return true;
    }
    return `${item.name} ${item.description} ${item.url}`.toLowerCase().includes(term);
  });
}

function permissionBadgeHtml(item) {
  const locale = currentLocale();
  const permissionMissing = !state.permissionMap[item.id] && !!item.url;
  if (!item.enabled) {
    return `<span class="badge gray">${escapeHtml(t('sidebar.status.disabled', {}, locale))}</span>`;
  }
  if (permissionMissing) {
    return `<span class="badge warn">${escapeHtml(t('sidebar.status.needsPermission', {}, locale))}</span>`;
  }
  return `<span class="badge ok">${escapeHtml(t('sidebar.status.ok', {}, locale))}</span>`;
}

function renderSidebar() {
  const items = filteredItems();
  itemsListEl.innerHTML = '';
  if (items.length === 0) {
    const empty = document.createElement('div');
    empty.className = 'small-text';
    empty.textContent = t('sidebar.empty', {}, currentLocale());
    itemsListEl.append(empty);
    return;
  }

  items.forEach((item) => {
    const locale = currentLocale();
    const summary = summarizeItem(item, locale);
    const permissionMissing = !state.permissionMap[item.id] && !!item.url;
    const validation = state.validationMap[item.id];
    const itemNumber = state.items.findIndex((x) => x.id === item.id) + 1;
    const button = document.createElement('div');
    button.className = `item-list-card${state.selectedId === item.id ? ' selected' : ''}${permissionMissing ? ' needs-permission' : ''}${item.enabled ? ' enabled' : ' disabled'}`;
    button.dataset.itemId = item.id;
    button.tabIndex = 0;
    button.setAttribute('role', 'button');
    button.innerHTML = `
      <label class="item-enable-rail" title="${escapeHtml(t('action.enableTitle', {}, locale))}">
        <input aria-label="${escapeHtml(t('common.enable', {}, locale))}" type="checkbox" data-list-field="enabled" data-item-id="${item.id}" ${item.enabled ? 'checked' : ''} />
      </label>
      <div class="item-list-body">
        <div class="item-list-card-top">
          <div class="badge">Item ${itemNumber}</div>
          ${permissionBadgeHtml(item)}
        </div>
        <div class="item-title">${escapeHtml(item.name)}</div>
        <div class="item-desc">${escapeHtml(item.description || t('sidebar.noDescription', {}, locale))}</div>
        <div class="item-meta">
          <span>${escapeHtml(t('sidebar.next', { value: summary.nextLabel }, locale))}</span>
          <span>${escapeHtml(t('sidebar.format', { value: saveFormatLabel(item.saveFormat, locale) }, locale))}</span>
        </div>
        <div class="item-meta">
          <span>${escapeHtml(summary.host)}</span>
        </div>
        ${validation && !validation.ok ? `<div class="invalid-hint">${escapeHtml(validation.errors[0])}</div>` : ''}
      </div>
    `;
    button.addEventListener('click', (event) => {
      const target = event.target;
      if (target instanceof Element && target.closest('[data-list-field="enabled"]')) {
        return;
      }
      state.selectedId = item.id;
      renderSidebar();
      renderDetail();
    });
    button.addEventListener('keydown', (event) => {
      if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault();
        state.selectedId = item.id;
        renderSidebar();
        renderDetail();
      }
    });
    itemsListEl.append(button);
  });
}

function renderLogs() {
  logLimitInputEl.value = String(state.appSettings.logLimit);
  const locale = currentLocale();
  logsSummaryEl.textContent = t('logs.summary', { count: state.logs.length }, locale);
  logsBodyEl.innerHTML = '';
  if (!state.logs.length) {
    const row = document.createElement('tr');
    row.innerHTML = `<td colspan="5">${escapeHtml(t('logs.empty', {}, locale))}</td>`;
    logsBodyEl.append(row);
    return;
  }
  state.logs.slice(0, 50).forEach((entry) => {
    const row = document.createElement('tr');
    row.innerHTML = `
      <td>${escapeHtml(formatDateTime(entry.at, locale))}</td>
      <td>${escapeHtml(entry.itemName)}</td>
      <td>${escapeHtml(executionStatusLabel(entry.status, entry.errorCode || '', locale))}</td>
      <td>${escapeHtml(entry.trigger)}</td>
      <td>${escapeHtml(entry.filename || entry.message || '')}</td>
    `;
    logsBodyEl.append(row);
  });
}

function requiredMarkHtml(locale = currentLocale()) {
  return `<span class="required-symbol">${escapeHtml(t('common.requiredMark', {}, locale))}</span>`;
}

function baseLabelText(key, params = {}, locale = currentLocale()) {
  return t(key, { ...params, required: '' }, locale)
    .replace(/\s+/g, ' ')
    .trim();
}

function renderFieldLabelHtml(fieldKey, locale = currentLocale(), params = {}) {
  const meta = FIELD_LABEL_META[fieldKey];
  if (!meta) {
    return escapeHtml(baseLabelText(fieldKey, params, locale));
  }

  const labelText = escapeHtml(baseLabelText(meta.key, params, locale));
  if (meta.required) {
    return `${labelText} ${requiredMarkHtml(locale)}`;
  }
  return labelText;
}

function setFieldLabel(root, selector, fieldKey, locale, params = {}) {
  return setHtml(root, selector, renderFieldLabelHtml(fieldKey, locale, params));
}

function constrainNumberValue(rawValue, constraints = {}) {
  const numeric = Number(rawValue);
  if (!Number.isFinite(numeric)) {
    return '';
  }
  const min = Number.isFinite(constraints.min) ? constraints.min : -Infinity;
  const max = Number.isFinite(constraints.max) ? constraints.max : Infinity;
  return Math.max(min, Math.min(max, numeric));
}

function getConstrainedNumericInputValue(target, constraints = {}) {
  if (target.value === '') {
    return '';
  }
  const constrained = constrainNumberValue(target.value, constraints);
  if (constrained === '') {
    return '';
  }
  const normalized = String(constrained);
  if (target.value !== normalized) {
    target.value = normalized;
  }
  return constrained;
}

function toDateTimeLocalValue(value) {
  const text = String(value || '').trim();
  if (!text) {
    return '';
  }
  const m = text.match(/^(\d{4}-\d{2}-\d{2}T\d{2}:\d{2})/);
  if (m) {
    return m[1];
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

function cloneTemplate(templateEl) {
  return templateEl.content.cloneNode(true);
}

function populateSelectOptions(select, options, selectedValue, locale) {
  select.innerHTML = options
    .map(
      (option) => `<option value="${escapeHtml(option.value)}">${escapeHtml(option.label)}</option>`
    )
    .join('');
  select.value = String(selectedValue);
  if (select.value !== String(selectedValue) && options[0]) {
    select.value = String(options[0].value);
  }
  if (locale) {
    select.setAttribute('lang', locale);
  }
}

function setHtml(root, selector, html) {
  const el = root.querySelector(selector);
  if (el) {
    el.innerHTML = html;
  }
  return el;
}

function setText(root, selector, text) {
  const el = root.querySelector(selector);
  if (el) {
    el.textContent = text;
  }
  return el;
}

function buildScheduleRecurrenceFields(schedule, index, locale) {
  let fragment;
  if (schedule.scheduleMode === 'interval') {
    fragment = cloneTemplate(scheduleIntervalFieldsTemplate);
    setFieldLabel(fragment, '[data-role="label-schedule-every"]', 'scheduleEvery', locale);
    setFieldLabel(fragment, '[data-role="label-schedule-unit"]', 'scheduleUnit', locale);
    const intervalValueInput = fragment.querySelector('[data-schedule-field="intervalValue"]');
    intervalValueInput.dataset.scheduleIndex = String(index);
    intervalValueInput.value = String(schedule.intervalValue ?? '');
    populateSelectOptions(
      fragment.querySelector('[data-schedule-field="intervalUnit"]'),
      SCHEDULE_INTERVAL_UNIT_OPTIONS.map((option) => ({
        value: option.value,
        label: t(option.labelKey, {}, locale),
      })),
      schedule.intervalUnit,
      locale
    );
  } else if (schedule.scheduleMode === 'monthly') {
    fragment = cloneTemplate(scheduleMonthlyFieldsTemplate);
    setFieldLabel(
      fragment,
      '[data-role="label-schedule-monthly-day"]',
      'scheduleMonthlyDay',
      locale
    );
    const monthlyDayInput = fragment.querySelector('[data-schedule-field="monthlyDay"]');
    monthlyDayInput.dataset.scheduleIndex = String(index);
    monthlyDayInput.value = String(schedule.monthlyDay ?? '');
  } else {
    fragment = cloneTemplate(scheduleOnceFieldsTemplate);
  }
  applyI18n(fragment, locale);
  fragment.querySelectorAll('[data-schedule-field]').forEach((control) => {
    control.dataset.scheduleIndex = String(index);
  });
  return fragment;
}

function buildScheduleRow(schedule, index, locale) {
  const fragment = cloneTemplate(scheduleCardTemplate);
  const card = fragment.firstElementChild;
  applyI18n(fragment, locale);

  card.dataset.scheduleIndex = String(index);
  card.classList.toggle('enabled', schedule.enabled !== false);
  card.classList.toggle('disabled', schedule.enabled === false);

  card.querySelectorAll('[data-schedule-field]').forEach((control) => {
    control.dataset.scheduleIndex = String(index);
  });
  card.querySelectorAll('[data-action]').forEach((button) => {
    button.dataset.scheduleIndex = String(index);
  });

  card.querySelector('[data-schedule-field="enabled"]').checked = schedule.enabled !== false;
  card.querySelector('[data-action="remove-schedule"]').hidden = index === 0;
  setText(card, '[data-role="schedule-title"]', t('schedule.title', { index: index + 1 }, locale));
  setFieldLabel(card, '[data-role="label-schedule-start"]', 'scheduleStartAt', locale);
  setFieldLabel(card, '[data-role="label-schedule-end"]', 'scheduleEndAt', locale);
  setFieldLabel(card, '[data-role="label-schedule-mode"]', 'scheduleMode', locale);
  const nextRun = nextOccurrenceForSchedule(schedule);
  setText(
    card,
    '[data-role="schedule-next-run-value"]',
    nextRun ? formatDateTime(nextRun.toISOString(), locale) : t('shared.timeUnset', {}, locale)
  );

  card.querySelector('[data-schedule-field="startAt"]').value = toDateTimeLocalValue(
    schedule.startAt || ''
  );
  card.querySelector('[data-schedule-field="endAt"]').value = toDateTimeLocalValue(
    schedule.endAt || ''
  );
  populateSelectOptions(
    card.querySelector('[data-schedule-field="scheduleMode"]'),
    SCHEDULE_MODE_OPTIONS.map((option) => ({
      value: option.value,
      label: t(option.labelKey, {}, locale),
    })),
    schedule.scheduleMode,
    locale
  );
  card
    .querySelector('[data-role="schedule-repeat-grid"]')
    .append(buildScheduleRecurrenceFields(schedule, index, locale));
  return card;
}

function buildActionFieldsNode(action, index, locale) {
  const selectorTypeOptions = [
    { value: 'css', label: t('selectorType.css', {}, locale) },
    { value: 'xpath', label: t('selectorType.xpath', {}, locale) },
  ];
  const booleanOptions = [
    { value: 'true', label: t('common.on', {}, locale) },
    { value: 'false', label: t('common.off', {}, locale) },
  ];
  const operatorOptions = [
    { value: 'equals', label: t('operator.equals', {}, locale) },
    { value: 'notEquals', label: t('operator.notEquals', {}, locale) },
    { value: 'contains', label: t('operator.contains', {}, locale) },
  ];
  const clickTextOperatorOptions = operatorOptions.filter((option) => option.value !== 'notEquals');

  let fragment;
  switch (action.type) {
    case 'clickSelector':
      fragment = cloneTemplate(actionClickSelectorFieldsTemplate);
      setFieldLabel(fragment, '[data-role="label-css-selector"]', 'cssSelector', locale);
      setFieldLabel(fragment, '[data-role="label-wait-ms"]', 'waitMs', locale);
      fragment.querySelector('[data-action-field="selector"]').value = action.selector;
      fragment.querySelector('[data-action-field="waitAfterMs"]').value = String(
        action.waitAfterMs
      );
      break;
    case 'clickXPath':
      fragment = cloneTemplate(actionClickXPathFieldsTemplate);
      setFieldLabel(fragment, '[data-role="label-xpath"]', 'xpath', locale);
      setFieldLabel(fragment, '[data-role="label-wait-ms"]', 'waitMs', locale);
      fragment.querySelector('[data-action-field="xpath"]').value = action.xpath;
      fragment.querySelector('[data-action-field="waitAfterMs"]').value = String(
        action.waitAfterMs
      );
      break;
    case 'setValue':
      fragment = cloneTemplate(actionSetValueFieldsTemplate);
      setFieldLabel(fragment, '[data-role="label-css-selector"]', 'cssSelector', locale);
      setFieldLabel(fragment, '[data-role="label-value"]', 'value', locale);
      setFieldLabel(fragment, '[data-role="label-dispatch-input"]', 'dispatchInput', locale);
      setFieldLabel(fragment, '[data-role="label-dispatch-change"]', 'dispatchChange', locale);
      fragment.querySelector('[data-action-field="selector"]').value = action.selector;
      fragment.querySelector('[data-action-field="value"]').value = action.value;
      populateSelectOptions(
        fragment.querySelector('[data-action-field="dispatchInput"]'),
        booleanOptions,
        String(action.dispatchInput),
        locale
      );
      populateSelectOptions(
        fragment.querySelector('[data-action-field="dispatchChange"]'),
        booleanOptions,
        String(action.dispatchChange),
        locale
      );
      break;
    case 'waitForExists':
      fragment = cloneTemplate(actionWaitForExistsFieldsTemplate);
      setFieldLabel(fragment, '[data-role="label-selector-type"]', 'selectorType', locale);
      setFieldLabel(fragment, '[data-role="label-selector"]', 'selector', locale);
      setFieldLabel(fragment, '[data-role="label-timeout-ms"]', 'timeoutMs', locale);
      populateSelectOptions(
        fragment.querySelector('[data-action-field="selectorType"]'),
        selectorTypeOptions,
        action.selectorType,
        locale
      );
      fragment.querySelector('[data-action-field="selector"]').value = action.selector;
      fragment.querySelector('[data-action-field="timeoutMs"]').value = String(action.timeoutMs);
      break;
    case 'waitForNotExists':
      fragment = cloneTemplate(actionWaitForNotExistsFieldsTemplate);
      setFieldLabel(fragment, '[data-role="label-selector-type"]', 'selectorType', locale);
      setFieldLabel(fragment, '[data-role="label-selector"]', 'selector', locale);
      setFieldLabel(fragment, '[data-role="label-timeout-ms"]', 'timeoutMs', locale);
      populateSelectOptions(
        fragment.querySelector('[data-action-field="selectorType"]'),
        selectorTypeOptions,
        action.selectorType,
        locale
      );
      fragment.querySelector('[data-action-field="selector"]').value = action.selector;
      fragment.querySelector('[data-action-field="timeoutMs"]').value = String(action.timeoutMs);
      break;
    case 'waitForAttribute':
      fragment = cloneTemplate(actionWaitForAttributeFieldsTemplate);
      setFieldLabel(fragment, '[data-role="label-selector-type"]', 'selectorType', locale);
      setFieldLabel(fragment, '[data-role="label-selector"]', 'selector', locale);
      setFieldLabel(fragment, '[data-role="label-attribute-name"]', 'attributeName', locale);
      setFieldLabel(fragment, '[data-role="label-expected-value"]', 'expectedValue', locale);
      setFieldLabel(fragment, '[data-role="label-operator"]', 'operator', locale);
      setFieldLabel(fragment, '[data-role="label-timeout-ms"]', 'timeoutMs', locale);
      populateSelectOptions(
        fragment.querySelector('[data-action-field="selectorType"]'),
        selectorTypeOptions,
        action.selectorType,
        locale
      );
      fragment.querySelector('[data-action-field="selector"]').value = action.selector;
      fragment.querySelector('[data-action-field="attributeName"]').value =
        action.attributeName || '';
      fragment.querySelector('[data-action-field="expectedValue"]').value =
        action.expectedValue || '';
      populateSelectOptions(
        fragment.querySelector('[data-action-field="operator"]'),
        operatorOptions,
        action.operator,
        locale
      );
      fragment.querySelector('[data-action-field="timeoutMs"]').value = String(action.timeoutMs);
      break;
    case 'wait':
      fragment = cloneTemplate(actionWaitFieldsTemplate);
      setFieldLabel(fragment, '[data-role="label-fixed-wait-ms"]', 'fixedWaitMs', locale);
      fragment.querySelector('[data-action-field="ms"]').value = String(action.ms);
      break;
    case 'clickText':
    default:
      fragment = cloneTemplate(actionClickTextFieldsTemplate);
      setFieldLabel(fragment, '[data-role="label-selector"]', 'selector', locale);
      setFieldLabel(
        fragment,
        '[data-role="label-text-source-selector"]',
        'textSourceSelector',
        locale
      );
      setFieldLabel(fragment, '[data-role="label-text"]', 'text', locale);
      setFieldLabel(fragment, '[data-role="label-operator"]', 'operator', locale);
      setFieldLabel(fragment, '[data-role="label-wait-after-click"]', 'waitAfterClick', locale);
      fragment.querySelector('[data-action-field="selector"]').value = action.selector;
      fragment.querySelector('[data-action-field="textSourceSelector"]').value =
        action.textSourceSelector || '';
      fragment.querySelector('[data-action-field="text"]').value = action.text;
      populateSelectOptions(
        fragment.querySelector('[data-action-field="operator"]'),
        clickTextOperatorOptions,
        action.operator === 'contains' ? 'contains' : 'equals',
        locale
      );
      fragment.querySelector('[data-action-field="waitAfterMs"]').value = String(
        action.waitAfterMs
      );
      break;
  }

  applyI18n(fragment, locale);
  fragment.querySelectorAll('[data-action-field]').forEach((control) => {
    control.dataset.actionIndex = String(index);
  });
  return fragment;
}

function renderActions(container, item) {
  const locale = currentLocale();
  container.replaceChildren();
  if (!item.actions.length) {
    const empty = cloneTemplate(actionEmptyTemplate);
    setText(empty, '[data-role="empty-text"]', t('action.empty', {}, locale));
    container.append(empty);
    return;
  }
  item.actions.forEach((action, index) => {
    const node = actionTemplate.content.firstElementChild.cloneNode(true);
    node.classList.toggle('enabled', action.enabled !== false);
    node.classList.toggle('disabled', action.enabled === false);
    node.querySelector('.step-badge').textContent = t('action.step', { index: index + 1 }, locale);
    const select = node.querySelector('[data-field="type"]');
    populateSelectOptions(
      select,
      ACTION_TYPES.map((type) => ({
        value: type.value,
        label: t(type.labelKey, {}, locale),
      })),
      action.type,
      locale
    );
    select.dataset.actionIndex = String(index);
    const enabledToggle = node.querySelector('[data-action-field="enabled"]');
    enabledToggle.dataset.actionIndex = String(index);
    enabledToggle.checked = action.enabled !== false;
    const buttons = node.querySelectorAll('[data-action]');
    buttons.forEach((btn) => (btn.dataset.actionIndex = String(index)));
    const fieldsContainer = node.querySelector('.action-fields');
    fieldsContainer.replaceChildren(buildActionFieldsNode(action, index, locale));
    applyI18n(node, locale);
    container.append(node);
  });
}

function buildOutputSettingsNode(item, locale) {
  if (item.saveFormat === 'pdf') {
    const pdfOptions = normalizePdfOptions(item.pdfOptions);
    const fragment = cloneTemplate(pdfOutputSettingsTemplate);
    const root = fragment.firstElementChild;
    applyI18n(fragment, locale);
    setFieldLabel(root, '[data-role="label-pdf-orientation"]', 'pdfOrientation', locale);
    setFieldLabel(root, '[data-role="label-pdf-paper-size"]', 'pdfPaperSize', locale);
    setFieldLabel(root, '[data-role="label-pdf-margins"]', 'pdfMargins', locale);
    setFieldLabel(root, '[data-role="label-pdf-background"]', 'pdfBackground', locale);
    setFieldLabel(root, '[data-role="label-pdf-scale"]', 'pdfScale', locale);
    setFieldLabel(root, '[data-role="label-pdf-header-footer"]', 'pdfHeaderFooter', locale);
    setFieldLabel(root, '[data-role="label-pdf-css-page-size"]', 'pdfCssPageSize', locale);
    setFieldLabel(root, '[data-role="label-pdf-document-outline"]', 'pdfDocumentOutline', locale);
    populateSelectOptions(
      root.querySelector('#pdf-landscape'),
      [
        { value: 'false', label: t('fields.orientationPortrait', {}, locale) },
        { value: 'true', label: t('fields.orientationLandscape', {}, locale) },
      ],
      String(pdfOptions.landscape),
      locale
    );
    populateSelectOptions(
      root.querySelector('#pdf-paper-size'),
      PDF_PAPER_SIZE_OPTIONS.map((option) => ({
        value: option.value,
        label: t(option.labelKey, {}, locale),
      })),
      pdfOptions.paperSize,
      locale
    );
    populateSelectOptions(
      root.querySelector('#pdf-margin-preset'),
      PDF_MARGIN_OPTIONS.map((option) => ({
        value: option.value,
        label: t(option.labelKey, {}, locale),
      })),
      pdfOptions.marginPreset,
      locale
    );
    populateSelectOptions(
      root.querySelector('#pdf-print-background'),
      [
        { value: 'true', label: t('fields.pdfBackgroundTrue', {}, locale) },
        { value: 'false', label: t('fields.pdfBackgroundFalse', {}, locale) },
      ],
      String(pdfOptions.printBackground),
      locale
    );
    populateSelectOptions(
      root.querySelector('#pdf-scale-percent'),
      PDF_SCALE_PERCENT_OPTIONS.map((value) => ({
        value: String(value),
        label: `${value}%`,
      })),
      String(pdfOptions.scalePercent),
      locale
    );
    populateSelectOptions(
      root.querySelector('#pdf-display-header-footer'),
      [
        { value: 'false', label: t('fields.pdfHeaderFooterFalse', {}, locale) },
        { value: 'true', label: t('fields.pdfHeaderFooterTrue', {}, locale) },
      ],
      String(pdfOptions.displayHeaderFooter),
      locale
    );
    populateSelectOptions(
      root.querySelector('#pdf-prefer-css-page-size'),
      [
        { value: 'false', label: t('fields.pdfPreferCssPageSizeFalse', {}, locale) },
        { value: 'true', label: t('fields.pdfPreferCssPageSizeTrue', {}, locale) },
      ],
      String(pdfOptions.preferCssPageSize),
      locale
    );
    populateSelectOptions(
      root.querySelector('#pdf-generate-document-outline'),
      [
        { value: 'false', label: t('fields.pdfDocumentOutlineFalse', {}, locale) },
        { value: 'true', label: t('fields.pdfDocumentOutlineTrue', {}, locale) },
      ],
      String(pdfOptions.generateDocumentOutline),
      locale
    );
    return root;
  }
  if (item.saveFormat === 'jpeg') {
    const fragment = cloneTemplate(jpegOutputSettingsTemplate);
    const root = fragment.firstElementChild;
    applyI18n(fragment, locale);
    setFieldLabel(root, '[data-role="label-jpeg-quality"]', 'jpegQuality', locale);
    root.querySelector('#image-jpeg-quality').value = String(item.imageOptions.jpegQuality);
    return root;
  }
  return null;
}

function outputPathPreviewValue(item, locale) {
  const previewDate = new Date('2030-01-02T03:04:05');
  const previewPrefix = String(item.filenamePrefix || '').trim() || item.name || 'capture';
  return `${t('fields.outputPathPreviewRoot', {}, locale)}/${buildFilename(item, previewDate, previewPrefix)}`;
}

function renderDetail() {
  const locale = currentLocale();
  const item = getSelectedItem();
  const detailPanel = detailRootEl.closest('.detail');
  if (!item) {
    detailPanel?.classList.remove('item-disabled');
    const fragment = cloneTemplate(detailEmptyTemplate);
    applyI18n(fragment, locale);
    detailRootEl.replaceChildren(fragment);
    return;
  }
  detailPanel?.classList.toggle('item-disabled', item.enabled === false);
  const validation = state.validationMap[item.id] || validateItem(item, locale);
  const permissionMissing = !state.permissionMap[item.id] && !!item.url;
  const fileUrl = isFileUrl(item.url);
  const permissionResolvable = Boolean(item.url) && canRequestOriginPermission(item.url);
  const fragment = cloneTemplate(detailTemplate);
  applyI18n(fragment, locale);

  setText(
    fragment,
    '[data-role="item-number"]',
    t('shared.itemName', { index: state.items.findIndex((x) => x.id === item.id) + 1 }, locale)
  );
  setFieldLabel(fragment, '[data-role="label-url"]', 'url', locale);
  setFieldLabel(fragment, '[data-role="label-save-format"]', 'saveFormat', locale);
  setFieldLabel(fragment, '[data-role="label-download-folder"]', 'downloadFolder', locale);
  setFieldLabel(fragment, '[data-role="label-filename-prefix"]', 'filenamePrefix', locale);
  setFieldLabel(fragment, '[data-role="label-wait-before"]', 'waitBefore', locale);
  setFieldLabel(fragment, '[data-role="label-wait-after"]', 'waitAfter', locale);
  setFieldLabel(fragment, '[data-role="label-close-tab"]', 'closeTab', locale);

  const validationEl = fragment.querySelector('#detail-validation');
  validationEl.hidden = validation.ok;
  validationEl.textContent = validation.ok ? '' : validation.errors[0];

  fragment.querySelector('#name-input').value = item.name;
  fragment.querySelector('#description-input').value = item.description;
  fragment.querySelector('#url-input').value = item.url;
  fragment.querySelector('#download-folder').value = item.downloadFolder;
  fragment.querySelector('#filename-prefix').value = item.filenamePrefix;
  fragment.querySelector('#output-path-preview').textContent = outputPathPreviewValue(item, locale);
  fragment.querySelector('#wait-before').value = String(item.waitBeforeActionsMs);
  fragment.querySelector('#wait-after').value = String(item.waitAfterActionsMs);

  populateSelectOptions(
    fragment.querySelector('#save-format'),
    SAVE_FORMATS.map((option) => ({
      value: option.value,
      label: t(option.labelKey, {}, locale),
    })),
    item.saveFormat,
    locale
  );
  populateSelectOptions(
    fragment.querySelector('#close-tab'),
    [
      { value: 'true', label: t('fields.closeTabTrue', {}, locale) },
      { value: 'false', label: t('fields.closeTabFalse', {}, locale) },
    ],
    String(item.closeTabAfterSave),
    locale
  );

  const outputSettingsNode = buildOutputSettingsNode(item, locale);
  const outputSettingsSlot = fragment.querySelector('#output-settings-slot');
  outputSettingsSlot.replaceChildren();
  if (outputSettingsNode) {
    outputSettingsSlot.append(outputSettingsNode);
  }

  const permissionWarningEl = fragment.querySelector('#permission-warning');
  if (permissionMissing) {
    permissionWarningEl.hidden = false;
    fragment.querySelector('#permission-warning-title').textContent = t(
      fileUrl ? 'permission.fileAccessTitle' : 'permission.title',
      {},
      locale
    );
    fragment.querySelector('#permission-warning-body').textContent = t(
      fileUrl ? 'permission.fileAccessBody' : 'permission.body',
      fileUrl ? {} : { url: item.url },
      locale
    );
    fragment.querySelector('#grant-top').hidden = fileUrl;
  } else {
    permissionWarningEl.remove();
  }

  const scheduleList = fragment.querySelector('#schedule-list');
  item.schedules.forEach((schedule, index) => {
    scheduleList.append(buildScheduleRow(schedule, index, locale));
  });

  fragment.querySelector('[data-role="permission-label"]').textContent = t(
    fileUrl ? 'permission.fileAccessStatus' : 'permission.allowedOrigin',
    {},
    locale
  );

  const permissionOriginText = (() => {
    if (fileUrl) {
      return t(
        state.permissionMap[item.id]
          ? 'permission.fileAccessEnabled'
          : 'permission.fileAccessDisabled',
        {},
        locale
      );
    }
    try {
      return item.url ? deriveOriginPattern(item.url) : t('permission.urlUnset', {}, locale);
    } catch {
      return t('permission.urlInvalid', {}, locale);
    }
  })();
  fragment.querySelector('#permission-origin-text').textContent = permissionOriginText;
  fragment.querySelector('#grant-inline').disabled = !permissionMissing || !permissionResolvable;
  fragment.querySelector('#revoke-inline').disabled = permissionMissing || !permissionResolvable;
  fragment.querySelector('#file-access-note').hidden = !(fileUrl && permissionMissing);

  renderActions(fragment.querySelector('#action-list'), item);
  detailRootEl.replaceChildren(fragment);
}

function renderAll() {
  localizeStaticPage();
  renderLanguageSelect();
  refreshValidation();
  renderSidebar();
  renderDetail();
  renderLogs();
  updateDirtyState();
}

async function loadAll() {
  const config = await loadConfig();
  state.items = deepClone(config.items);
  state.logs = config.logs || [];
  state.appSettings = normalizeAppSettings(config.appSettings || {});
  state.selectedId = state.items[0]?.id || null;
  state.savedSnapshot = buildStateSnapshot(state.items, state.appSettings);
  await refreshPermissions();
  refreshValidation();
  renderAll();
}

async function requestPermission(item) {
  try {
    if (isFileUrl(item.url)) {
      setStatus(t('permission.fileAccessBody', {}, currentLocale()), true);
      return;
    }
    const origin = deriveOriginPattern(item.url);
    const ok = await chrome.permissions.request({ origins: [origin] });
    const granted = ok
      ? await chrome.permissions.contains({ origins: [origin] })
      : await chrome.permissions.contains({ origins: [origin] });
    state.permissionMap[item.id] = granted;
    await refreshPermissions();
    renderAll();
    setStatus(
      granted
        ? t('status.permissionGranted', {}, currentLocale())
        : t('status.permissionDenied', {}, currentLocale()),
      !granted
    );
  } catch (error) {
    setStatus(error.message || String(error), true);
  }
}

async function revokePermission(item) {
  try {
    if (isFileUrl(item.url)) {
      setStatus(t('permission.fileAccessBody', {}, currentLocale()), true);
      return;
    }
    const origin = deriveOriginPattern(item.url);
    const ok = await chrome.permissions.remove({ origins: [origin] });
    const stillGranted = await chrome.permissions.contains({ origins: [origin] });
    state.permissionMap[item.id] = stillGranted;
    await refreshPermissions();
    renderAll();
    setStatus(
      ok && !stillGranted
        ? t('status.permissionRevoked', {}, currentLocale())
        : t('status.permissionRevokeDenied', {}, currentLocale()),
      stillGranted
    );
  } catch (error) {
    setStatus(error.message || String(error), true);
  }
}

function addAction() {
  const item = getSelectedItem();
  if (!item) {
    return;
  }
  item.actions.push(normalizeAction({ type: 'clickText' }));
  updateDirtyState();
  renderDetail();
  renderSidebar();
}

function addSchedule() {
  const item = getSelectedItem();
  if (!item) {
    return;
  }
  item.schedules.push(
    normalizeSchedule({
      id: uid('sch'),
      startAt: '',
      scheduleMode: 'interval',
      intervalValue: 1,
      intervalUnit: 'day',
      endAt: '',
      enabled: true,
    })
  );
  updateDirtyState();
  renderDetail();
  renderSidebar();
}

function handleDetailClick(event) {
  const item = getSelectedItem();
  if (!item) {
    return;
  }
  const target = event.target.closest('button');
  if (!target) {
    return;
  }

  if (target.id === 'delete-item') {
    const idx = state.items.findIndex((x) => x.id === item.id);
    if (idx >= 0) {
      state.items.splice(idx, 1);
    }
    state.selectedId = state.items[Math.max(0, idx - 1)]?.id || state.items[0]?.id || null;
    updateDirtyState();
    renderAll();
    return;
  }
  if (target.id === 'grant-top' || target.id === 'grant-inline') {
    requestPermission(item);
    return;
  }
  if (target.id === 'revoke-inline') {
    revokePermission(item);
    return;
  }
  if (target.id === 'add-action') {
    addAction();
    return;
  }
  if (target.id === 'add-schedule') {
    addSchedule();
    return;
  }

  const actionIndex = Number(target.dataset.actionIndex);
  if (!Number.isNaN(actionIndex)) {
    if (target.dataset.action === 'delete') {
      item.actions.splice(actionIndex, 1);
    } else if (target.dataset.action === 'duplicate') {
      item.actions.splice(
        actionIndex + 1,
        0,
        normalizeAction(deepClone(item.actions[actionIndex]))
      );
    } else if (target.dataset.action === 'move-up' && actionIndex > 0) {
      [item.actions[actionIndex - 1], item.actions[actionIndex]] = [
        item.actions[actionIndex],
        item.actions[actionIndex - 1],
      ];
    } else if (target.dataset.action === 'move-down' && actionIndex < item.actions.length - 1) {
      [item.actions[actionIndex + 1], item.actions[actionIndex]] = [
        item.actions[actionIndex],
        item.actions[actionIndex + 1],
      ];
    }
    updateDirtyState();
    renderSidebar();
    renderDetail();
    return;
  }

  const scheduleIndex = Number(
    target.closest('[data-schedule-index]')?.dataset.scheduleIndex ?? target.dataset.scheduleIndex
  );
  if (!Number.isNaN(scheduleIndex) && target.dataset.action === 'remove-schedule') {
    item.schedules.splice(scheduleIndex, 1);
    updateDirtyState();
    renderDetail();
    renderSidebar();
  }
}

function handleDetailInput(event) {
  const item = getSelectedItem();
  if (!item) {
    return;
  }
  const target = event.target;
  if (
    !(
      target instanceof HTMLInputElement ||
      target instanceof HTMLTextAreaElement ||
      target instanceof HTMLSelectElement
    )
  ) {
    return;
  }

  if (target.id === 'name-input') {
    item.name = target.value;
    updateDirtyState();
    renderSidebar();
    const preview = document.getElementById('output-path-preview');
    if (preview) {
      preview.textContent = outputPathPreviewValue(item, currentLocale());
    }
    return;
  }
  if (target.id === 'description-input') {
    item.description = target.value;
    updateDirtyState();
    renderSidebar();
    return;
  }
  if (target.id === 'url-input') {
    if (event.type === 'input') {
      item.url = target.value;
      updateDirtyState();
      renderSidebar();
      return;
    }
    item.url = target.value.trim();
    if (target.value !== item.url) {
      target.value = item.url;
    }
    updateDirtyState();
    renderSidebar();
    refreshPermissions()
      .then(() => {
        renderSidebar();
        renderDetail();
      })
      .catch(() => {});
    return;
  }
  if (target.id === 'save-format') {
    item.saveFormat = target.value;
    if (item.saveFormat === 'pdf') {
      item.pdfOptions = normalizePdfOptions(item.pdfOptions);
    }
    updateDirtyState();
    renderSidebar();
    renderDetail();
    return;
  }
  if (target.id === 'download-folder') {
    item.downloadFolder = target.value;
    updateDirtyState();
    const preview = document.getElementById('output-path-preview');
    if (preview) {
      preview.textContent = outputPathPreviewValue(item, currentLocale());
    }
    return;
  }
  if (target.id === 'filename-prefix') {
    item.filenamePrefix = target.value;
    updateDirtyState();
    const preview = document.getElementById('output-path-preview');
    if (preview) {
      preview.textContent = outputPathPreviewValue(item, currentLocale());
    }
    return;
  }
  if (target.id === 'wait-before') {
    item.waitBeforeActionsMs = getConstrainedNumericInputValue(
      target,
      FIELD_NUMBER_CONSTRAINTS['wait-before']
    );
    updateDirtyState();
    return;
  }
  if (target.id === 'wait-after') {
    item.waitAfterActionsMs = getConstrainedNumericInputValue(
      target,
      FIELD_NUMBER_CONSTRAINTS['wait-after']
    );
    updateDirtyState();
    return;
  }
  if (target.id === 'close-tab') {
    item.closeTabAfterSave = target.value === 'true';
    updateDirtyState();
    return;
  }
  if (target.id === 'pdf-landscape') {
    item.pdfOptions = normalizePdfOptions({
      ...item.pdfOptions,
      landscape: target.value === 'true',
    });
    updateDirtyState();
    return;
  }
  if (target.id === 'pdf-paper-size') {
    item.pdfOptions = normalizePdfOptions({
      ...item.pdfOptions,
      paperSize: target.value,
    });
    updateDirtyState();
    return;
  }
  if (target.id === 'pdf-margin-preset') {
    item.pdfOptions = normalizePdfOptions({
      ...item.pdfOptions,
      marginPreset: target.value,
    });
    updateDirtyState();
    return;
  }
  if (target.id === 'pdf-print-background') {
    item.pdfOptions = normalizePdfOptions({
      ...item.pdfOptions,
      printBackground: target.value === 'true',
    });
    updateDirtyState();
    return;
  }
  if (target.id === 'pdf-scale-percent') {
    item.pdfOptions = normalizePdfOptions({
      ...item.pdfOptions,
      scalePercent: Number(target.value) || 100,
    });
    updateDirtyState();
    return;
  }
  if (target.id === 'pdf-display-header-footer') {
    item.pdfOptions = normalizePdfOptions({
      ...item.pdfOptions,
      displayHeaderFooter: target.value === 'true',
    });
    updateDirtyState();
    return;
  }
  if (target.id === 'pdf-prefer-css-page-size') {
    item.pdfOptions = normalizePdfOptions({
      ...item.pdfOptions,
      preferCssPageSize: target.value === 'true',
    });
    updateDirtyState();
    return;
  }
  if (target.id === 'pdf-generate-document-outline') {
    item.pdfOptions = normalizePdfOptions({
      ...item.pdfOptions,
      generateDocumentOutline: target.value === 'true',
    });
    updateDirtyState();
    return;
  }
  if (target.id === 'image-jpeg-quality') {
    item.imageOptions.jpegQuality = getConstrainedNumericInputValue(
      target,
      FIELD_NUMBER_CONSTRAINTS['image-jpeg-quality']
    );
    updateDirtyState();
    return;
  }
  const scheduleIndex = Number(target.dataset.scheduleIndex);
  if (!Number.isNaN(scheduleIndex) && item.schedules[scheduleIndex]) {
    const schedule = item.schedules[scheduleIndex];
    if (target.dataset.scheduleField) {
      const field = target.dataset.scheduleField;
      const nextSchedule = { ...schedule };
      if (field === 'startAt') {
        nextSchedule.startAt =
          event.type === 'input' ? String(target.value || '') : String(target.value || '').trim();
      } else if (field === 'endAt') {
        nextSchedule.endAt =
          event.type === 'input' ? String(target.value || '') : String(target.value || '').trim();
      } else if (target.type === 'number') {
        nextSchedule[field] = getConstrainedNumericInputValue(
          target,
          SCHEDULE_NUMBER_CONSTRAINTS[field] || {}
        );
      } else {
        nextSchedule[field] = target.type === 'checkbox' ? target.checked : target.value;
      }
      item.schedules[scheduleIndex] = normalizeSchedule(
        nextSchedule,
        field === 'startAt' ? nextSchedule.startAt : nextSchedule.startAt || schedule.startAt
      );
      updateDirtyState();
      renderSidebar();
      if (field === 'scheduleMode') {
        renderDetail();
        return;
      }
      if (event.type === 'input') {
        return;
      }
      return;
    }
  }

  const actionIndex = Number(target.dataset.actionIndex);
  if (!Number.isNaN(actionIndex) && item.actions[actionIndex]) {
    const action = item.actions[actionIndex];
    if (target.dataset.field === 'type') {
      item.actions[actionIndex] = normalizeAction({ type: target.value });
      updateDirtyState();
      renderSidebar();
      renderDetail();
      return;
    }
    if (target.dataset.actionField) {
      const field = target.dataset.actionField;
      action[field] =
        target.type === 'checkbox'
          ? target.checked
          : target.type === 'number'
            ? getConstrainedNumericInputValue(target, ACTION_NUMBER_CONSTRAINTS[field] || {})
            : field === 'dispatchInput' || field === 'dispatchChange'
              ? target.value === 'true'
              : target.value;
      updateDirtyState();
      renderSidebar();
      if (field === 'enabled') {
        renderDetail();
      }
    }
  }
}

async function saveAll() {
  refreshValidation();
  const invalidEntry = state.items.find((item) => !state.validationMap[item.id]?.ok);
  if (invalidEntry) {
    state.selectedId = invalidEntry.id;
    renderAll();
    setStatus(state.validationMap[invalidEntry.id].errors[0], true);
    return;
  }
  const response = await chrome.runtime.sendMessage({
    type: 'save-config',
    items: state.items.map(normalizeItem),
    appSettings: state.appSettings,
  });
  if (!response?.ok) {
    setStatus(response?.error || t('status.saveFailed', {}, currentLocale()), true);
    return;
  }
  state.items = deepClone(response.items || state.items);
  state.appSettings = normalizeAppSettings(response.appSettings || state.appSettings);
  state.savedSnapshot = buildStateSnapshot(state.items, state.appSettings);
  await refreshPermissions();
  refreshValidation();
  renderAll();
  setStatus(t('status.saved', {}, currentLocale()));
}

function buildItemsExportPayload() {
  return {
    format: 'auto-page-capture-items',
    version: 1,
    exportedAt: new Date().toISOString(),
    items: state.items.map((item) => normalizeItem(item)),
  };
}

function timestampForFilename(date = new Date()) {
  const yyyy = date.getFullYear();
  const mm = String(date.getMonth() + 1).padStart(2, '0');
  const dd = String(date.getDate()).padStart(2, '0');
  const hh = String(date.getHours()).padStart(2, '0');
  const mi = String(date.getMinutes()).padStart(2, '0');
  const ss = String(date.getSeconds()).padStart(2, '0');
  return `${yyyy}${mm}${dd}_${hh}${mi}${ss}`;
}

function normalizeImportedItems(rawItems, existingItems = []) {
  const itemIds = new Set((existingItems || []).map((item) => item?.id).filter(Boolean));
  return rawItems.map((rawItem, itemIndex) => {
    const item = normalizeItem(rawItem);
    if (!item.id || itemIds.has(item.id)) {
      item.id = uid('item');
    }
    itemIds.add(item.id);
    if (!String(item.name || '').trim()) {
      item.name = t('shared.itemName', { index: itemIndex + 1 }, currentLocale());
    }

    const scheduleIds = new Set();
    item.schedules = (item.schedules || []).map((schedule) => {
      const next = { ...schedule };
      if (!next.id || scheduleIds.has(next.id)) {
        next.id = uid('sch');
      }
      scheduleIds.add(next.id);
      return next;
    });

    const actionIds = new Set();
    item.actions = (item.actions || []).map((action) => {
      const next = normalizeAction(action);
      if (!next.id || actionIds.has(next.id)) {
        next.id = uid('act');
      }
      actionIds.add(next.id);
      return next;
    });

    return item;
  });
}

function parseImportedItemsJson(text) {
  let parsed;
  try {
    parsed = JSON.parse(text);
  } catch {
    throw new Error(t('status.importReadFailed', {}, currentLocale()));
  }

  const rawItems = Array.isArray(parsed)
    ? parsed
    : Array.isArray(parsed?.items)
      ? parsed.items
      : null;

  if (!rawItems) {
    throw new Error(t('status.importInvalidFormat', {}, currentLocale()));
  }
  if (rawItems.length === 0) {
    throw new Error(t('status.importEmpty', {}, currentLocale()));
  }
  return rawItems;
}

async function importItemsFromFile(file, mode = 'replace') {
  if (!file) {
    return;
  }
  const text = await file.text();
  const rawItems = parseImportedItemsJson(text);
  const importedItems = normalizeImportedItems(rawItems, mode === 'add' ? state.items : []);
  if (mode === 'add') {
    state.items = [...state.items, ...importedItems];
  } else {
    state.items = importedItems;
  }
  state.selectedId = importedItems[0]?.id || state.items[0]?.id || null;
  await refreshPermissions();
  refreshValidation();
  renderAll();
  setStatus(
    mode === 'add'
      ? t('status.importedItemsAdded', { count: importedItems.length }, currentLocale())
      : t('status.importedItemsReplaced', { count: importedItems.length }, currentLocale())
  );
}

function downloadTextFile(filename, text, mime = 'text/plain;charset=utf-8') {
  const blob = new Blob([text], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

// top-level events
searchInputEl.addEventListener('input', () => {
  state.search = searchInputEl.value;
  renderSidebar();
});

document.querySelectorAll('[data-filter]').forEach((button) => {
  button.addEventListener('click', () => {
    state.filter = button.dataset.filter;
    document
      .querySelectorAll('[data-filter]')
      .forEach((x) => x.classList.toggle('active', x === button));
    renderSidebar();
  });
});

document.getElementById('add-item').addEventListener('click', () => {
  const item = createBlankItem(state.items.length + 1, currentLocale());
  state.items.push(item);
  state.selectedId = item.id;
  updateDirtyState();
  renderAll();
});

itemsListEl.addEventListener('click', (event) => {
  const target = event.target;
  if (target instanceof HTMLInputElement && target.dataset.listField === 'enabled') {
    event.stopPropagation();
  }
});

itemsListEl.addEventListener('change', (event) => {
  const target = event.target;
  if (!(target instanceof HTMLInputElement)) {
    return;
  }
  if (target.dataset.listField === 'enabled') {
    const item = state.items.find((x) => x.id === target.dataset.itemId);
    if (!item) {
      return;
    }
    item.enabled = target.checked;
    updateDirtyState();
    renderSidebar();
    if (state.selectedId === item.id) {
      renderDetail();
    }
  }
});

detailRootEl.addEventListener('click', handleDetailClick);
detailRootEl.addEventListener('input', handleDetailInput);
detailRootEl.addEventListener('change', handleDetailInput);

logLimitInputEl.addEventListener('change', () => {
  state.appSettings.logLimit = Math.max(10, Math.min(5000, Number(logLimitInputEl.value || 300)));
  updateDirtyState();
});

exportItemsButtonEl.addEventListener('click', () => {
  const payload = buildItemsExportPayload();
  downloadTextFile(
    `auto_page_capture_items_${timestampForFilename()}.json`,
    JSON.stringify(payload, null, 2),
    'application/json;charset=utf-8'
  );
  setStatus(t('status.exportedItems', { count: payload.items.length }, currentLocale()));
});

importItemsReplaceButtonEl.addEventListener('click', () => {
  pendingImportMode = 'replace';
  importItemsFileEl.value = '';
  importItemsFileEl.click();
});

importItemsAddButtonEl.addEventListener('click', () => {
  pendingImportMode = 'add';
  importItemsFileEl.value = '';
  importItemsFileEl.click();
});

importItemsFileEl.addEventListener('change', async () => {
  try {
    const file = importItemsFileEl.files?.[0];
    await importItemsFromFile(file, pendingImportMode);
  } catch (error) {
    setStatus(error?.message || String(error), true);
  } finally {
    importItemsFileEl.value = '';
  }
});

document.getElementById('export-logs-json').addEventListener('click', () => {
  downloadTextFile(
    'auto_page_capture_logs.json',
    JSON.stringify(state.logs, null, 2),
    'application/json;charset=utf-8'
  );
});

document.getElementById('export-logs-csv').addEventListener('click', () => {
  downloadTextFile('auto_page_capture_logs.csv', logsToCsv(state.logs), 'text/csv;charset=utf-8');
});

saveButtonEl.addEventListener('click', () => {
  saveAll().catch((error) => setStatus(error.message || String(error), true));
});

cancelButtonEl.addEventListener('click', () => {
  if (!hasUnsavedChanges()) {
    return;
  }
  restoreFromSavedSnapshot();
  refreshPermissions()
    .then(() => {
      renderAll();
      setStatus(t('status.cancelledChanges', {}, currentLocale()));
    })
    .catch((error) => setStatus(error.message || String(error), true));
});

chrome.storage.onChanged.addListener((changes, area) => {
  if (area !== 'local') {
    return;
  }
  if (changes.logs) {
    state.logs = changes.logs.newValue || [];
    renderLogs();
  }
});

loadAll().catch((error) => setStatus(error.message || String(error), true));

uiLanguageEl.addEventListener('change', async () => {
  const previous = state.appSettings.uiLanguage;
  state.appSettings.uiLanguage = uiLanguageEl.value;
  renderAll();
  try {
    const normalized = normalizeAppSettings(state.appSettings);
    await chrome.storage.local.set({ appSettings: normalized });
    state.appSettings = normalized;
    commitUiLanguageToSavedSnapshot();
    updateDirtyState();
  } catch (error) {
    state.appSettings.uiLanguage = previous;
    renderAll();
    setStatus(error.message || String(error), true);
  }
});
