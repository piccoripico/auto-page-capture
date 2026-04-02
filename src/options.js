import {
  ACTION_TYPES,
  PDF_MARGIN_OPTIONS,
  PDF_PAPER_SIZE_OPTIONS,
  SAVE_FORMATS,
  SCHEDULE_INTERVAL_UNIT_OPTIONS,
  SCHEDULE_MODE_OPTIONS,
  createBlankItem,
  deepClone,
  deriveOriginPattern,
  executionStatusLabel,
  formatDateTime,
  loadConfig,
  normalizeAction,
  normalizeAppSettings,
  normalizeItem,
  normalizeSchedule,
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

function currentLocale() {
  return resolveLocale(state.appSettings.uiLanguage);
}

function currentRequiredMark() {
  return t('common.requiredMark', {}, currentLocale());
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
  setDirty(hasUnsavedChanges());
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

function requiredMark(locale = currentLocale()) {
  return `<span class="required-symbol">${escapeHtml(t('common.requiredMark', {}, locale))}</span>`;
}

function localizedLabelHtml(key, params = {}, locale = currentLocale()) {
  const mark = t('common.requiredMark', {}, locale);
  const translated = escapeHtml(t(key, params, locale));
  const markEscaped = escapeHtml(mark);
  if (!markEscaped || !translated.includes(markEscaped)) {
    return translated;
  }
  return translated.replaceAll(markEscaped, requiredMark(locale));
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

function scheduleRowHtml(schedule, index) {
  const locale = currentLocale();
  const scheduleModeOptions = SCHEDULE_MODE_OPTIONS.map(
    (x) =>
      `<option value="${x.value}" ${x.value === schedule.scheduleMode ? 'selected' : ''}>${escapeHtml(t(x.labelKey, {}, locale))}</option>`
  ).join('');
  const intervalUnitOptions = SCHEDULE_INTERVAL_UNIT_OPTIONS.map(
    (x) =>
      `<option value="${x.value}" ${x.value === schedule.intervalUnit ? 'selected' : ''}>${escapeHtml(t(x.labelKey, {}, locale))}</option>`
  ).join('');
  const startText = toDateTimeLocalValue(schedule.startAt || '');
  const endText = toDateTimeLocalValue(schedule.endAt || '');
  const recurrenceFields =
    schedule.scheduleMode === 'interval'
      ? `
          <label class="field">
            <span>${localizedLabelHtml('schedule.every', { required: currentRequiredMark() }, locale)}</span>
            <input type="number" min="1" step="1" data-schedule-index="${index}" data-schedule-field="intervalValue" value="${escapeHtml(schedule.intervalValue)}" />
          </label>
          <label class="field">
            <span>${localizedLabelHtml('schedule.unit', { required: currentRequiredMark() }, locale)}</span>
            <select data-schedule-index="${index}" data-schedule-field="intervalUnit">${intervalUnitOptions}</select>
          </label>
        `
      : schedule.scheduleMode === 'monthly'
        ? `
          <label class="field">
            <span>${localizedLabelHtml('schedule.monthlyDay', { required: currentRequiredMark() }, locale)}</span>
            <input type="number" min="1" max="31" step="1" data-schedule-index="${index}" data-schedule-field="monthlyDay" value="${escapeHtml(schedule.monthlyDay)}" />
          </label>
          <div class="field">
            <span>${escapeHtml(t('schedule.unit', {}, locale))}</span>
            <div class="small-text">${escapeHtml(t('schedule.monthlyHint', {}, locale))}</div>
          </div>
        `
        : `
          <div class="field">
            <span>${escapeHtml(t('schedule.every', {}, locale))}</span>
            <div class="small-text">${escapeHtml(t('schedule.onceHint', {}, locale))}</div>
          </div>
          <div></div>
        `;
  return `
    <div class="schedule-card ${schedule.enabled ? 'enabled' : 'disabled'}" data-schedule-index="${index}">
      <label class="schedule-enable-rail" title="${escapeHtml(t('action.enableTitle', {}, locale))}">
        <input type="checkbox" data-schedule-index="${index}" data-schedule-field="enabled" ${schedule.enabled ? 'checked' : ''} />
      </label>
      <div class="schedule-main">
        <div class="schedule-head">
          <div class="schedule-title">
            <div class="badge">${escapeHtml(t('schedule.title', { index: index + 1 }, locale))}</div>
          </div>
          ${index === 0 ? '' : `<button type="button" data-action="remove-schedule" class="ghost danger">${escapeHtml(t('common.delete', {}, locale))}</button>`}
        </div>
        <div class="grid-5 schedule-grid-single">
          <label class="field">
            <span>${localizedLabelHtml('schedule.startAt', { required: currentRequiredMark() }, locale)}</span>
            <input type="datetime-local" step="60" data-schedule-index="${index}" data-schedule-field="startAt" value="${escapeHtml(startText)}" />
          </label>
          <label class="field">
            <span>${localizedLabelHtml('schedule.mode', { required: currentRequiredMark() }, locale)}</span>
            <select data-schedule-index="${index}" data-schedule-field="scheduleMode">${scheduleModeOptions}</select>
          </label>
          ${recurrenceFields}
          <label class="field">
            <span>${escapeHtml(t('schedule.endAt', {}, locale))}</span>
            <input type="datetime-local" step="60" data-schedule-index="${index}" data-schedule-field="endAt" value="${escapeHtml(endText)}" />
          </label>
        </div>
      </div>
    </div>
  `;
}

function actionFieldsHtml(action, index) {
  const locale = currentLocale();
  switch (action.type) {
    case 'clickSelector':
      return `
        <label class="field"><span>${localizedLabelHtml('fields.cssSelector', { required: currentRequiredMark() }, locale)}</span><input data-action-index="${index}" data-action-field="selector" value="${escapeHtml(action.selector)}" /></label>
        <label class="field"><span>${escapeHtml(t('fields.waitMs', {}, locale))}</span><input type="number" data-action-index="${index}" data-action-field="waitAfterMs" value="${escapeHtml(action.waitAfterMs)}" placeholder="${escapeHtml(t('fields.msPlaceholder1000', {}, locale))}" /></label>
      `;
    case 'clickXPath':
      return `
        <label class="field"><span>${localizedLabelHtml('fields.xpath', { required: currentRequiredMark() }, locale)}</span><input data-action-index="${index}" data-action-field="xpath" value="${escapeHtml(action.xpath)}" /></label>
        <label class="field"><span>${escapeHtml(t('fields.waitMs', {}, locale))}</span><input type="number" data-action-index="${index}" data-action-field="waitAfterMs" value="${escapeHtml(action.waitAfterMs)}" placeholder="${escapeHtml(t('fields.msPlaceholder1000', {}, locale))}" /></label>
      `;
    case 'setValue':
      return `
        <label class="field"><span>${localizedLabelHtml('fields.cssSelector', { required: currentRequiredMark() }, locale)}</span><input data-action-index="${index}" data-action-field="selector" value="${escapeHtml(action.selector)}" /></label>
        <label class="field"><span>${localizedLabelHtml('fields.value', { required: currentRequiredMark() }, locale)}</span><input data-action-index="${index}" data-action-field="value" value="${escapeHtml(action.value)}" /></label>
        <label class="field"><span>${localizedLabelHtml('fields.dispatchInput', { required: currentRequiredMark() }, locale)}</span><select data-action-index="${index}" data-action-field="dispatchInput">
          <option value="true" ${action.dispatchInput ? 'selected' : ''}>${escapeHtml(t('common.on', {}, locale))}</option>
          <option value="false" ${!action.dispatchInput ? 'selected' : ''}>${escapeHtml(t('common.off', {}, locale))}</option>
        </select></label>
        <label class="field"><span>${localizedLabelHtml('fields.dispatchChange', { required: currentRequiredMark() }, locale)}</span><select data-action-index="${index}" data-action-field="dispatchChange">
          <option value="true" ${action.dispatchChange ? 'selected' : ''}>${escapeHtml(t('common.on', {}, locale))}</option>
          <option value="false" ${!action.dispatchChange ? 'selected' : ''}>${escapeHtml(t('common.off', {}, locale))}</option>
        </select></label>
      `;
    case 'waitForExists':
      return `
        <label class="field"><span>${localizedLabelHtml('fields.selectorType', { required: currentRequiredMark() }, locale)}</span><select data-action-index="${index}" data-action-field="selectorType">
          <option value="css" ${action.selectorType !== 'xpath' ? 'selected' : ''}>${escapeHtml(t('selectorType.css', {}, locale))}</option>
          <option value="xpath" ${action.selectorType === 'xpath' ? 'selected' : ''}>${escapeHtml(t('selectorType.xpath', {}, locale))}</option>
        </select></label>
        <label class="field"><span>${localizedLabelHtml('fields.selector', { required: currentRequiredMark() }, locale)}</span><input data-action-index="${index}" data-action-field="selector" value="${escapeHtml(action.selector)}" /></label>
        <label class="field"><span>${escapeHtml(t('fields.timeoutMs', {}, locale))}</span><input type="number" data-action-index="${index}" data-action-field="timeoutMs" value="${escapeHtml(action.timeoutMs)}" placeholder="${escapeHtml(t('fields.msPlaceholder10000', {}, locale))}" /></label>
      `;
    case 'waitForNotExists':
      return `
        <label class="field"><span>${localizedLabelHtml('fields.selectorType', { required: currentRequiredMark() }, locale)}</span><select data-action-index="${index}" data-action-field="selectorType">
          <option value="css" ${action.selectorType !== 'xpath' ? 'selected' : ''}>${escapeHtml(t('selectorType.css', {}, locale))}</option>
          <option value="xpath" ${action.selectorType === 'xpath' ? 'selected' : ''}>${escapeHtml(t('selectorType.xpath', {}, locale))}</option>
        </select></label>
        <label class="field"><span>${localizedLabelHtml('fields.selector', { required: currentRequiredMark() }, locale)}</span><input data-action-index="${index}" data-action-field="selector" value="${escapeHtml(action.selector)}" /></label>
        <label class="field"><span>${escapeHtml(t('fields.timeoutMs', {}, locale))}</span><input type="number" data-action-index="${index}" data-action-field="timeoutMs" value="${escapeHtml(action.timeoutMs)}" placeholder="${escapeHtml(t('fields.msPlaceholder10000', {}, locale))}" /></label>
      `;
    case 'waitForAttribute':
      return `
        <label class="field"><span>${localizedLabelHtml('fields.selectorType', { required: currentRequiredMark() }, locale)}</span><select data-action-index="${index}" data-action-field="selectorType">
          <option value="css" ${action.selectorType !== 'xpath' ? 'selected' : ''}>${escapeHtml(t('selectorType.css', {}, locale))}</option>
          <option value="xpath" ${action.selectorType === 'xpath' ? 'selected' : ''}>${escapeHtml(t('selectorType.xpath', {}, locale))}</option>
        </select></label>
        <label class="field"><span>${localizedLabelHtml('fields.selector', { required: currentRequiredMark() }, locale)}</span><input data-action-index="${index}" data-action-field="selector" value="${escapeHtml(action.selector)}" /></label>
        <label class="field"><span>${localizedLabelHtml('fields.attributeName', { required: currentRequiredMark() }, locale)}</span><input data-action-index="${index}" data-action-field="attributeName" value="${escapeHtml(action.attributeName || '')}" /></label>
        <label class="field"><span>${localizedLabelHtml('fields.expectedValue', { required: currentRequiredMark() }, locale)}</span><input data-action-index="${index}" data-action-field="expectedValue" value="${escapeHtml(action.expectedValue || '')}" /></label>
        <label class="field"><span>${localizedLabelHtml('fields.operator', { required: currentRequiredMark() }, locale)}</span><select data-action-index="${index}" data-action-field="operator">
          <option value="equals" ${action.operator === 'equals' ? 'selected' : ''}>${escapeHtml(t('operator.equals', {}, locale))}</option>
          <option value="notEquals" ${action.operator === 'notEquals' ? 'selected' : ''}>${escapeHtml(t('operator.notEquals', {}, locale))}</option>
          <option value="contains" ${action.operator === 'contains' ? 'selected' : ''}>${escapeHtml(t('operator.contains', {}, locale))}</option>
        </select></label>
        <label class="field"><span>${escapeHtml(t('fields.timeoutMs', {}, locale))}</span><input type="number" data-action-index="${index}" data-action-field="timeoutMs" value="${escapeHtml(action.timeoutMs)}" placeholder="${escapeHtml(t('fields.msPlaceholder10000', {}, locale))}" /></label>
      `;
    case 'wait':
      return `<label class="field"><span>${escapeHtml(t('fields.fixedWaitMs', {}, locale))}</span><input type="number" data-action-index="${index}" data-action-field="ms" value="${escapeHtml(action.ms)}" placeholder="${escapeHtml(t('fields.msPlaceholder1000', {}, locale))}" /></label>`;
    case 'clickText':
    default:
      return `
        <label class="field"><span>${localizedLabelHtml('fields.selector', { required: currentRequiredMark() }, locale)}</span><input data-action-index="${index}" data-action-field="selector" value="${escapeHtml(action.selector)}" /></label>
        <label class="field"><span>${escapeHtml(t('fields.textSourceSelector', {}, locale))}</span><input data-action-index="${index}" data-action-field="textSourceSelector" value="${escapeHtml(action.textSourceSelector || '')}" /></label>
        <label class="field"><span>${localizedLabelHtml('fields.text', { required: currentRequiredMark() }, locale)}</span><input data-action-index="${index}" data-action-field="text" value="${escapeHtml(action.text)}" /></label>
        <label class="field"><span>${localizedLabelHtml('fields.operator', { required: currentRequiredMark() }, locale)}</span><select data-action-index="${index}" data-action-field="operator">
          <option value="equals" ${action.operator !== 'contains' ? 'selected' : ''}>${escapeHtml(t('operator.equals', {}, locale))}</option>
          <option value="contains" ${action.operator === 'contains' ? 'selected' : ''}>${escapeHtml(t('operator.contains', {}, locale))}</option>
        </select></label>
        <label class="field"><span>${escapeHtml(t('fields.waitAfterClick', {}, locale))}</span><input type="number" data-action-index="${index}" data-action-field="waitAfterMs" value="${escapeHtml(action.waitAfterMs)}" placeholder="${escapeHtml(t('fields.msPlaceholder1000', {}, locale))}" /></label>
      `;
  }
}

function renderActions(container, item) {
  const locale = currentLocale();
  container.innerHTML = '';
  if (!item.actions.length) {
    const empty = document.createElement('div');
    empty.className = 'small-text';
    empty.textContent = t('action.empty', {}, locale);
    container.append(empty);
    return;
  }
  item.actions.forEach((action, index) => {
    const node = actionTemplate.content.firstElementChild.cloneNode(true);
    node.classList.toggle('enabled', action.enabled !== false);
    node.classList.toggle('disabled', action.enabled === false);
    node.querySelector('.step-badge').textContent = t('action.step', { index: index + 1 }, locale);
    const select = node.querySelector('[data-field="type"]');
    select.innerHTML = ACTION_TYPES.map(
      (x) =>
        `<option value="${x.value}" ${x.value === action.type ? 'selected' : ''}>${escapeHtml(t(x.labelKey, {}, locale))}</option>`
    ).join('');
    select.dataset.actionIndex = String(index);
    const enabledToggle = node.querySelector('[data-action-field="enabled"]');
    enabledToggle.dataset.actionIndex = String(index);
    enabledToggle.checked = action.enabled !== false;
    const buttons = node.querySelectorAll('[data-action]');
    buttons.forEach((btn) => (btn.dataset.actionIndex = String(index)));
    node.querySelector('.action-fields').innerHTML = actionFieldsHtml(action, index);
    applyI18n(node, locale);
    container.append(node);
  });
}

function renderOutputSettings(item, locale) {
  if (item.saveFormat === 'pdf') {
    const paperSizeOptions = PDF_PAPER_SIZE_OPTIONS.map(
      (x) =>
        `<option value="${x.value}" ${x.value === item.pdfOptions.paperSize ? 'selected' : ''}>${escapeHtml(t(x.labelKey, {}, locale))}</option>`
    ).join('');
    const marginOptions = PDF_MARGIN_OPTIONS.map(
      (x) =>
        `<option value="${x.value}" ${x.value === item.pdfOptions.marginPreset ? 'selected' : ''}>${escapeHtml(t(x.labelKey, {}, locale))}</option>`
    ).join('');
    return `
      <section class="group-card optional">
        <div class="group-head">
          <div><h3>${escapeHtml(t('groups.output', {}, locale))}</h3></div>
        </div>
        <div class="grid-2 compact-grid">
          <label class="field"><span>${escapeHtml(t('fields.pdfOrientation', {}, locale))}</span><select id="pdf-landscape"><option value="false" ${!item.pdfOptions.landscape ? 'selected' : ''}>${escapeHtml(t('fields.orientationPortrait', {}, locale))}</option><option value="true" ${item.pdfOptions.landscape ? 'selected' : ''}>${escapeHtml(t('fields.orientationLandscape', {}, locale))}</option></select></label>
          <label class="field"><span>${escapeHtml(t('fields.pdfPaperSize', {}, locale))}</span><select id="pdf-paper-size">${paperSizeOptions}</select></label>
          <label class="field"><span>${escapeHtml(t('fields.pdfMargins', {}, locale))}</span><select id="pdf-margin-preset">${marginOptions}</select></label>
          <label class="field"><span>${escapeHtml(t('fields.pdfBackground', {}, locale))}</span><select id="pdf-print-background"><option value="true" ${item.pdfOptions.printBackground ? 'selected' : ''}>${escapeHtml(t('fields.pdfBackgroundTrue', {}, locale))}</option><option value="false" ${!item.pdfOptions.printBackground ? 'selected' : ''}>${escapeHtml(t('fields.pdfBackgroundFalse', {}, locale))}</option></select></label>
        </div>
      </section>
    `;
  }
  if (item.saveFormat === 'jpeg') {
    return `
      <section class="group-card optional">
        <div class="group-head">
          <div><h3>${escapeHtml(t('groups.output', {}, locale))}</h3></div>
        </div>
        <div class="grid-2 compact-grid">
          <label class="field"><span>${escapeHtml(t('fields.jpegQuality', {}, locale))}</span><input id="image-jpeg-quality" type="number" min="1" max="100" step="1" value="${escapeHtml(item.imageOptions.jpegQuality)}" placeholder="90" /></label>
        </div>
      </section>
    `;
  }
  return '';
}

function renderAuthSettings(item, locale) {
  return `
    <section class="group-card optional">
      <div class="group-head">
        <div>
          <h3>${escapeHtml(t('groups.authChecks', {}, locale))}</h3>
          <p>${escapeHtml(t('groups.authChecksHelp', {}, locale))}</p>
        </div>
      </div>
      <div class="grid-2 compact-grid">
        <label class="field"><span>${escapeHtml(t('fields.authFailureUrlPattern', {}, locale))}</span><input id="auth-url-pattern" value="${escapeHtml(item.authOptions.loginFailureUrlPattern)}" placeholder="${escapeHtml(t('fields.authFailureUrlPatternPlaceholder', {}, locale))}" /></label>
        <label class="field"><span>${escapeHtml(t('fields.authSelectorType', {}, locale))}</span><select id="auth-selector-type"><option value="css" ${item.authOptions.requiredSelectorType !== 'xpath' ? 'selected' : ''}>${escapeHtml(t('selectorType.css', {}, locale))}</option><option value="xpath" ${item.authOptions.requiredSelectorType === 'xpath' ? 'selected' : ''}>${escapeHtml(t('selectorType.xpath', {}, locale))}</option></select></label>
        <label class="field"><span>${escapeHtml(t('fields.authSelector', {}, locale))}</span><input id="auth-selector" value="${escapeHtml(item.authOptions.requiredSelector)}" placeholder="${escapeHtml(t('fields.authSelectorPlaceholder', {}, locale))}" /></label>
      </div>
    </section>
  `;
}

function renderRecoverySettings(item, locale) {
  return `
    <section class="group-card optional">
      <div class="group-head">
        <div>
          <h3>${escapeHtml(t('groups.recovery', {}, locale))}</h3>
          <p>${escapeHtml(t('groups.recoveryHelp', {}, locale))}</p>
        </div>
      </div>
      <div class="grid-2 compact-grid">
        <label class="field"><span>${escapeHtml(t('fields.retryCount', {}, locale))}</span><input id="retry-count" type="number" min="0" max="5" step="1" value="${escapeHtml(item.retryOptions.maxRetries)}" placeholder="0" /></label>
        <label class="field"><span>${escapeHtml(t('fields.retryDelayMs', {}, locale))}</span><input id="retry-delay-ms" type="number" min="0" step="100" value="${escapeHtml(item.retryOptions.retryDelayMs)}" placeholder="${escapeHtml(t('fields.msPlaceholder1000', {}, locale))}" /></label>
      </div>
    </section>
  `;
}

function renderDetail() {
  const locale = currentLocale();
  const item = getSelectedItem();
  const detailPanel = detailRootEl.closest('.detail');
  if (!item) {
    detailPanel?.classList.remove('item-disabled');
    detailRootEl.innerHTML = `<div class="detail-empty">${escapeHtml(t('detail.empty', {}, locale))}</div>`;
    return;
  }
  detailPanel?.classList.toggle('item-disabled', item.enabled === false);
  const validation = state.validationMap[item.id] || validateItem(item, locale);
  const permissionMissing = !state.permissionMap[item.id] && !!item.url;
  const permissionResolvable = Boolean(item.url);
  const formatOptions = SAVE_FORMATS.map(
    (x) =>
      `<option value="${x.value}" ${x.value === item.saveFormat ? 'selected' : ''}>${escapeHtml(t(x.labelKey, {}, locale))}</option>`
  ).join('');
  detailRootEl.innerHTML = `
    <div class="detail-top">
      <div class="row-between">
        <div class="badge">${escapeHtml(t('shared.itemName', { index: state.items.findIndex((x) => x.id === item.id) + 1 }, locale))}</div>
        <div class="row-between" style="gap:8px">
          <button id="delete-item" class="danger ghost">${escapeHtml(t('detail.deleteItem', {}, locale))}</button>
        </div>
      </div>
      <input id="name-input" class="inline-title" value="${escapeHtml(item.name)}" placeholder="${escapeHtml(t('detail.itemNamePlaceholder', {}, locale))}" />
      <textarea id="description-input" class="inline-description" placeholder="${escapeHtml(t('detail.itemDescriptionPlaceholder', {}, locale))}">${escapeHtml(item.description)}</textarea>
      ${!validation.ok ? `<div class="invalid-hint">${escapeHtml(validation.errors[0])}</div>` : ''}
    </div>
    <div class="detail-grid">
      ${
        permissionMissing
          ? `
        <div class="warning-box">
          <div>
            <strong>${escapeHtml(t('permission.title', {}, locale))}</strong>
            <div>${escapeHtml(t('permission.body', { url: item.url }, locale))}</div>
          </div>
          <button id="grant-top">${escapeHtml(t('permission.grantTop', {}, locale))}</button>
        </div>`
          : ''
      }

      <section class="group-card required">
        <div class="grid-2 compact-grid">
          <label class="field"><span>${localizedLabelHtml('fields.url', { required: currentRequiredMark() }, locale)}</span><input id="url-input" value="${escapeHtml(item.url)}" placeholder="https://example.com/page" /></label>
          <label class="field"><span>${localizedLabelHtml('fields.saveFormat', { required: currentRequiredMark() }, locale)}</span><select id="save-format">${formatOptions}</select></label>
        </div>
      </section>

      <section class="group-card required">
        <div class="group-head">
          <div><h3>${escapeHtml(t('groups.schedule', {}, locale))}</h3></div>
          <button id="add-schedule">${escapeHtml(t('groups.addSchedule', {}, locale))}</button>
        </div>
        <div class="schedule-list" id="schedule-list">${item.schedules.map((schedule, index) => scheduleRowHtml(schedule, index)).join('')}</div>
      </section>

      <section class="group-card optional">
        <div class="group-head">
          <div><h3>${escapeHtml(t('groups.options', {}, locale))}</h3></div>
        </div>
        <div class="grid-2 compact-grid">
          <label class="field"><span>${escapeHtml(t('fields.downloadFolder', {}, locale))}</span><input id="download-folder" value="${escapeHtml(item.downloadFolder)}" placeholder="${escapeHtml(t('fields.downloadFolderPlaceholder', {}, locale))}" /></label>
          <label class="field"><span>${escapeHtml(t('fields.filenamePrefix', {}, locale))}</span><input id="filename-prefix" value="${escapeHtml(item.filenamePrefix)}" placeholder="${escapeHtml(t('fields.filenamePrefixPlaceholder', {}, locale))}" /></label>
        </div>
        <div class="grid-4 compact-grid" style="margin-top:12px">
          <label class="field"><span>${escapeHtml(t('fields.waitBefore', {}, locale))}</span><input id="wait-before" type="number" min="0" step="100" value="${escapeHtml(item.waitBeforeActionsMs)}" placeholder="${escapeHtml(t('fields.msPlaceholder1000', {}, locale))}" /></label>
          <label class="field"><span>${escapeHtml(t('fields.waitAfter', {}, locale))}</span><input id="wait-after" type="number" min="0" step="100" value="${escapeHtml(item.waitAfterActionsMs)}" placeholder="${escapeHtml(t('fields.msPlaceholder1000', {}, locale))}" /></label>
          <div></div>
          <label class="field"><span>${localizedLabelHtml('fields.closeTab', { required: currentRequiredMark() }, locale)}</span><select id="close-tab"><option value="true" ${item.closeTabAfterSave ? 'selected' : ''}>${escapeHtml(t('fields.closeTabTrue', {}, locale))}</option><option value="false" ${!item.closeTabAfterSave ? 'selected' : ''}>${escapeHtml(t('fields.closeTabFalse', {}, locale))}</option></select></label>
        </div>
        <div class="permission-inline-row" style="margin-top:12px;">
          <span class="small-text">${escapeHtml(t('permission.allowedOrigin', {}, locale))}</span>
          <span class="permission-origin">${escapeHtml(
            (() => {
              try {
                return item.url
                  ? deriveOriginPattern(item.url)
                  : t('permission.urlUnset', {}, locale);
              } catch {
                return t('permission.urlInvalid', {}, locale);
              }
            })()
          )}</span>
          <button id="grant-inline" ${!permissionMissing || !permissionResolvable ? 'disabled' : ''}>${escapeHtml(t('common.grant', {}, locale))}</button>
          <button id="revoke-inline" class="ghost" ${permissionMissing || !permissionResolvable ? 'disabled' : ''}>${escapeHtml(t('common.revoke', {}, locale))}</button>
        </div>
      </section>

      ${renderAuthSettings(item, locale)}

      ${renderRecoverySettings(item, locale)}

      ${renderOutputSettings(item, locale)}

      <section class="group-card optional">
        <div class="group-head">
          <div><h3>${escapeHtml(t('groups.actions', {}, locale))}</h3><p>${escapeHtml(t('groups.actionsHelp', {}, locale))}</p></div>
          <button id="add-action">${escapeHtml(t('groups.addAction', {}, locale))}</button>
        </div>
        <div id="action-list" class="action-list"></div>
      </section>
    </div>
  `;
  renderActions(document.getElementById('action-list'), item);
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
    const origin = deriveOriginPattern(item.url);
    const ok = await chrome.permissions.request({ origins: [origin] });
    await refreshPermissions();
    renderAll();
    setStatus(
      ok
        ? t('status.permissionGranted', {}, currentLocale())
        : t('status.permissionDenied', {}, currentLocale()),
      !ok
    );
  } catch (error) {
    setStatus(error.message || String(error), true);
  }
}

async function revokePermission(item) {
  try {
    const origin = deriveOriginPattern(item.url);
    const ok = await chrome.permissions.remove({ origins: [origin] });
    await refreshPermissions();
    renderAll();
    setStatus(
      ok
        ? t('status.permissionRevoked', {}, currentLocale())
        : t('status.permissionRevokeDenied', {}, currentLocale()),
      !ok
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
    updateDirtyState();
    renderSidebar();
    renderDetail();
    return;
  }
  if (target.id === 'download-folder') {
    item.downloadFolder = target.value;
    updateDirtyState();
    return;
  }
  if (target.id === 'filename-prefix') {
    item.filenamePrefix = target.value;
    updateDirtyState();
    return;
  }
  if (target.id === 'wait-before') {
    item.waitBeforeActionsMs = target.value === '' ? '' : Number(target.value);
    updateDirtyState();
    return;
  }
  if (target.id === 'wait-after') {
    item.waitAfterActionsMs = target.value === '' ? '' : Number(target.value);
    updateDirtyState();
    return;
  }
  if (target.id === 'close-tab') {
    item.closeTabAfterSave = target.value === 'true';
    updateDirtyState();
    return;
  }
  if (target.id === 'auth-url-pattern') {
    item.authOptions.loginFailureUrlPattern = target.value;
    updateDirtyState();
    return;
  }
  if (target.id === 'auth-selector-type') {
    item.authOptions.requiredSelectorType = target.value;
    updateDirtyState();
    return;
  }
  if (target.id === 'auth-selector') {
    item.authOptions.requiredSelector = target.value;
    updateDirtyState();
    return;
  }
  if (target.id === 'retry-count') {
    item.retryOptions.maxRetries = target.value === '' ? '' : Number(target.value);
    updateDirtyState();
    return;
  }
  if (target.id === 'retry-delay-ms') {
    item.retryOptions.retryDelayMs = target.value === '' ? '' : Number(target.value);
    updateDirtyState();
    return;
  }
  if (target.id === 'pdf-landscape') {
    item.pdfOptions.landscape = target.value === 'true';
    updateDirtyState();
    return;
  }
  if (target.id === 'pdf-paper-size') {
    item.pdfOptions.paperSize = target.value;
    updateDirtyState();
    return;
  }
  if (target.id === 'pdf-margin-preset') {
    item.pdfOptions.marginPreset = target.value;
    updateDirtyState();
    return;
  }
  if (target.id === 'pdf-print-background') {
    item.pdfOptions.printBackground = target.value === 'true';
    updateDirtyState();
    return;
  }
  if (target.id === 'image-jpeg-quality') {
    item.imageOptions.jpegQuality = target.value === '' ? '' : Number(target.value);
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
      } else {
        nextSchedule[field] = target.type === 'checkbox' ? target.checked : target.value;
      }
      item.schedules[scheduleIndex] = normalizeSchedule(
        nextSchedule,
        nextSchedule.startAt || schedule.startAt
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
            ? target.value === ''
              ? ''
              : Number(target.value)
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
