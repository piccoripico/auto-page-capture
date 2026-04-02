import {
  RECENT_HISTORY_LIMIT,
  STORAGE_KEYS,
  alarmNameFor,
  buildFilename,
  getDefaultItems,
  deriveOriginPattern,
  DOM_SNAPSHOT_FORMATS,
  fileExtensionFor,
  hasAuthCheckConfigured,
  IMAGE_SAVE_FORMATS,
  isFileSchemeAccessAllowed,
  isFileUrl,
  itemNextOccurrence,
  loadConfig,
  localYmd,
  normalizeAppSettings,
  normalizeItem,
  PAGE_CAPTURE_FORMATS,
  parseAlarmName,
  PDF_MARGIN_MAP,
  PDF_PAPER_SIZE_MAP,
  PDF_SAVE_FORMATS,
  saveConfig,
  WAIT_POLL_INTERVAL_MS,
} from './lib/shared.js';
import { resolveLocale, t } from './lib/i18n.js';

const runningItemIds = new Set();
const queuedItemIds = new Set();
const pendingFilenameQueue = [];
let executionQueue = Promise.resolve();

function createExecutionError(code, message, extra = {}) {
  const error = new Error(message);
  error.code = code;
  Object.assign(error, extra);
  return error;
}

async function getCurrentLocale() {
  const { appSettings } = await loadConfig();
  return resolveLocale(appSettings?.uiLanguage || 'browser');
}

function buildPageActionMessages(locale) {
  return {
    waitForExists: t('sw.waitForExistsTimeout', {}, locale),
    waitForNotExists: t('sw.waitForNotExistsTimeout', {}, locale),
    waitForAttribute: t('sw.waitForAttributeTimeout', {}, locale),
  };
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function ensureInitialized() {
  const data = await chrome.storage.local.get([
    STORAGE_KEYS.ITEMS,
    STORAGE_KEYS.RECENT_HISTORY,
    STORAGE_KEYS.LOGS,
    STORAGE_KEYS.LAST_RUN_BY_ITEM,
    STORAGE_KEYS.APP_SETTINGS,
  ]);

  const updates = {};
  if (!Array.isArray(data.items)) {
    updates[STORAGE_KEYS.ITEMS] = getDefaultItems();
  }
  if (!Array.isArray(data.recentHistory)) {
    updates[STORAGE_KEYS.RECENT_HISTORY] = [];
  }
  if (!Array.isArray(data.logs)) {
    updates[STORAGE_KEYS.LOGS] = [];
  }
  if (!data.lastRunByItem || typeof data.lastRunByItem !== 'object') {
    updates[STORAGE_KEYS.LAST_RUN_BY_ITEM] = {};
  }
  if (!data.appSettings || typeof data.appSettings !== 'object') {
    updates[STORAGE_KEYS.APP_SETTINGS] = normalizeAppSettings({});
  }
  if (Object.keys(updates).length > 0) {
    await chrome.storage.local.set(updates);
  }
}

async function syncAlarms() {
  await ensureInitialized();
  const { items } = await loadConfig();
  const alarms = await chrome.alarms.getAll();
  for (const alarm of alarms) {
    if (alarm.name.startsWith('scheduled-item:')) {
      await chrome.alarms.clear(alarm.name);
    }
  }

  for (const item of items) {
    if (!item.enabled || !item.url) {
      continue;
    }
    for (const schedule of item.schedules || []) {
      if (schedule.enabled === false) {
        continue;
      }
      const next = itemNextOccurrence({ ...item, schedules: [schedule] });
      if (!next?.at) {
        continue;
      }
      await chrome.alarms.create(alarmNameFor(item.id, schedule.id), { when: next.at.getTime() });
    }
  }
}

async function appendLog(entry) {
  const { logs, recentHistory, lastRunByItem, appSettings } = await loadConfig();
  const logLimit = appSettings.logLimit;
  const nextLogs = [entry, ...logs].slice(0, logLimit);
  const recentEntry = {
    id: entry.id,
    itemId: entry.itemId,
    itemName: entry.itemName,
    status: entry.status,
    errorCode: entry.errorCode || '',
    trigger: entry.trigger,
    at: entry.at,
    filename: entry.filename || '',
    message: entry.message || '',
  };
  const nextRecentHistory = [recentEntry, ...recentHistory].slice(0, RECENT_HISTORY_LIMIT);
  const nextLastRun = {
    ...lastRunByItem,
    [entry.itemId]: {
      at: entry.at,
      ymd: localYmd(new Date(entry.at)),
      status: entry.status,
      errorCode: entry.errorCode || '',
      trigger: entry.trigger,
      filename: entry.filename || '',
      message: entry.message || '',
    },
  };

  await chrome.storage.local.set({
    [STORAGE_KEYS.LOGS]: nextLogs,
    [STORAGE_KEYS.RECENT_HISTORY]: nextRecentHistory,
    [STORAGE_KEYS.LAST_RUN_BY_ITEM]: nextLastRun,
  });
}

async function ensureHostPermissionForItem(item) {
  const origin = deriveOriginPattern(item.url);
  if (isFileUrl(item.url)) {
    const hasFileAccess = await isFileSchemeAccessAllowed();
    if (!hasFileAccess) {
      throw createExecutionError(
        'permission',
        'Allow access to file URLs is not enabled. Open the extension details page and enable it.'
      );
    }
    return;
  }
  const hasPermission = await chrome.permissions.contains({ origins: [origin] });
  if (!hasPermission) {
    throw createExecutionError('permission', `Site access is not granted for ${origin}`);
  }
}

function checkSelectorInPage(selectorType = 'css', selector = '') {
  function findByXPath(xpath) {
    const result = document.evaluate(
      xpath,
      document,
      null,
      XPathResult.FIRST_ORDERED_NODE_TYPE,
      null
    );
    return result.singleNodeValue;
  }

  try {
    const target =
      selectorType === 'xpath' ? findByXPath(selector) : document.querySelector(selector);
    return { ok: Boolean(target) };
  } catch (error) {
    return { ok: false, error: error?.message || String(error) };
  }
}

async function verifyAuthenticatedState(tabId, item) {
  const authOptions = item.authOptions || {};
  if (!hasAuthCheckConfigured(authOptions)) {
    return;
  }

  const tab = await chrome.tabs.get(tabId);
  const currentUrl = String(tab?.url || '');
  const loginFailureUrlPattern = String(authOptions.loginFailureUrlPattern || '').trim();
  if (loginFailureUrlPattern && currentUrl.includes(loginFailureUrlPattern)) {
    throw createExecutionError(
      'auth',
      `Authentication expired: redirected to a URL containing "${loginFailureUrlPattern}".`
    );
  }

  const requiredSelector = String(authOptions.requiredSelector || '').trim();
  if (!requiredSelector) {
    return;
  }

  const results = await chrome.scripting.executeScript({
    target: { tabId },
    func: checkSelectorInPage,
    args: [authOptions.requiredSelectorType || 'css', requiredSelector],
  });
  const result = results?.[0]?.result || { ok: false };
  if (result.error) {
    throw createExecutionError(
      'auth',
      `Authentication check failed: selector could not be evaluated (${result.error}).`
    );
  }
  if (!result.ok) {
    throw createExecutionError(
      'auth',
      `Authentication expired: required selector was not found (${requiredSelector}).`
    );
  }
}

function waitForTabComplete(tabId, timeoutMs = 60000) {
  return new Promise((resolve, reject) => {
    let done = false;
    const cleanup = () => {
      chrome.tabs.onUpdated.removeListener(listener);
      clearTimeout(timer);
    };
    const finish = (fn, value) => {
      if (done) {
        return;
      }
      done = true;
      cleanup();
      fn(value);
    };
    const listener = (updatedTabId, changeInfo) => {
      if (updatedTabId === tabId && changeInfo.status === 'complete') {
        finish(resolve);
      }
    };
    const timer = setTimeout(
      () => finish(reject, new Error('Timed out waiting for tab to finish loading.')),
      timeoutMs
    );
    chrome.tabs.onUpdated.addListener(listener);
    chrome.tabs
      .get(tabId)
      .then((tab) => {
        if (tab.status === 'complete') {
          finish(resolve);
        }
      })
      .catch((err) => finish(reject, err));
  });
}

function executeActionInPage(action, messages = {}) {
  const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
  function getComparableText(node, textSourceSelector) {
    if (!node) {
      return '';
    }
    if (textSourceSelector) {
      const target = node.querySelector(textSourceSelector);
      return (target?.textContent || '').trim();
    }
    return (node.textContent || '').trim();
  }
  function clickElement(el) {
    el.scrollIntoView({ block: 'center', inline: 'nearest' });
    el.click();
  }
  function findByXPath(xpath) {
    const result = document.evaluate(
      xpath,
      document,
      null,
      XPathResult.FIRST_ORDERED_NODE_TYPE,
      null
    );
    return result.singleNodeValue;
  }
  function findTextMatches(selector, text, operator, textSourceSelector) {
    const nodes = Array.from(document.querySelectorAll(selector || 'button'));
    const expected = String(text || '');
    return nodes.filter((node) => {
      const candidate = getComparableText(node, textSourceSelector);
      if ((operator || 'equals') === 'contains') {
        return candidate.includes(expected);
      }
      return candidate === expected;
    });
  }
  function findBySelector(selectorType, selector) {
    if (selectorType === 'xpath') {
      return findByXPath(selector);
    }
    return document.querySelector(selector);
  }
  function attributeMatches(el, currentAction) {
    if (!el) {
      return false;
    }
    const actual = el.getAttribute(currentAction.attributeName || '');
    switch (currentAction.operator || 'equals') {
      case 'equals':
        return actual === String(currentAction.expectedValue ?? '');
      case 'notEquals':
        return actual !== String(currentAction.expectedValue ?? '');
      case 'contains':
        return (
          typeof actual === 'string' && actual.includes(String(currentAction.expectedValue ?? ''))
        );
      default:
        return false;
    }
  }
  async function waitForPredicate(currentAction, predicate, describe) {
    const timeoutMs = Math.max(100, Number(currentAction.timeoutMs || 10000));
    const started = Date.now();
    let lastValue = null;
    while (Date.now() - started < timeoutMs) {
      const el = findBySelector(currentAction.selectorType, currentAction.selector);
      lastValue =
        currentAction.type === 'waitForAttribute'
          ? el
            ? el.getAttribute(currentAction.attributeName || '')
            : null
          : !!el;
      if (predicate(el)) {
        return { ok: true, lastValue };
      }
      await sleep(WAIT_POLL_INTERVAL_MS);
    }
    const el = findBySelector(currentAction.selectorType, currentAction.selector);
    lastValue =
      currentAction.type === 'waitForAttribute'
        ? el
          ? el.getAttribute(currentAction.attributeName || '')
          : null
        : !!el;
    if (predicate(el)) {
      return { ok: true, lastValue };
    }
    throw new Error(
      `${describe} timed out: selectorType=${currentAction.selectorType || 'css'}, selector=${currentAction.selector}, lastValue=${String(lastValue)}`
    );
  }
  return (async () => {
    if (!action || action.enabled === false) {
      return { ok: true, skipped: true, detail: 'disabled' };
    }
    switch (action.type) {
      case 'wait': {
        await sleep(Number(action.ms || 0));
        return { ok: true, detail: `Waited ${action.ms} ms` };
      }
      case 'waitForExists': {
        const result = await waitForPredicate(
          action,
          (el) => !!el,
          messages.waitForExists || 'Wait for element to appear'
        );
        return { ok: true, detail: `${action.selector} / last=${String(result.lastValue)}` };
      }
      case 'waitForNotExists': {
        const result = await waitForPredicate(
          action,
          (el) => !el,
          messages.waitForNotExists || 'Wait for element to disappear'
        );
        return { ok: true, detail: `${action.selector} / last=${String(result.lastValue)}` };
      }
      case 'waitForAttribute': {
        const result = await waitForPredicate(
          action,
          (el) => attributeMatches(el, action),
          messages.waitForAttribute || 'Wait for attribute value'
        );
        return {
          ok: true,
          detail: `${action.attributeName} ${action.operator} ${action.expectedValue} / ${action.selector} / last=${String(result.lastValue)}`,
        };
      }
      case 'clickSelector': {
        const matches = Array.from(document.querySelectorAll(action.selector));
        const el = matches[0] || null;
        if (!el) {
          throw new Error(`Selector not found: ${action.selector}`);
        }
        clickElement(el);
        return { ok: true, detail: `${action.selector} / matched=${matches.length}` };
      }
      case 'clickXPath': {
        const result = document.evaluate(
          action.xpath,
          document,
          null,
          XPathResult.ORDERED_NODE_SNAPSHOT_TYPE,
          null
        );
        const count = result.snapshotLength;
        const el = count > 0 ? result.snapshotItem(0) : null;
        if (!el) {
          throw new Error(`XPath not found: ${action.xpath}`);
        }
        clickElement(el);
        return { ok: true, detail: `${action.xpath} / matched=${count}` };
      }
      case 'setValue': {
        const matches = Array.from(document.querySelectorAll(action.selector));
        const el = matches[0] || null;
        if (!el) {
          throw new Error(`Selector not found: ${action.selector}`);
        }
        const isSupported =
          el instanceof HTMLInputElement ||
          el instanceof HTMLTextAreaElement ||
          el instanceof HTMLSelectElement;
        if (!isSupported) {
          throw new Error(`Unsupported target element for setValue: ${action.selector}`);
        }
        if (el instanceof HTMLInputElement && el.type === 'file') {
          throw new Error(`File inputs are not supported by setValue: ${action.selector}`);
        }
        const expectedValue = String(action.value ?? '');
        el.focus();
        el.value = expectedValue;
        if (action.dispatchInput) {
          el.dispatchEvent(new Event('input', { bubbles: true }));
        }
        if (action.dispatchChange) {
          el.dispatchEvent(new Event('change', { bubbles: true }));
        }
        await sleep(Number(action.waitAfterMs || 0));
        const actualValue = String(el.value ?? '');
        if (actualValue !== expectedValue) {
          throw new Error(
            `Value verification failed: selector=${action.selector}, expected=${expectedValue}, actual=${actualValue}`
          );
        }
        return {
          ok: true,
          detail: `${action.selector} / matched=${matches.length} / value=${actualValue}`,
        };
      }
      case 'clickText':
      default: {
        const matches = findTextMatches(
          action.selector || 'button',
          action.text || '',
          action.operator || 'equals',
          action.textSourceSelector || ''
        );
        const el = matches[0] || null;
        if (!el) {
          throw new Error(`Text target not found: ${action.text}`);
        }
        clickElement(el);
        return {
          ok: true,
          detail: `${action.operator === 'contains' ? 'contains' : 'equals'} ${action.text || ''}${action.textSourceSelector ? ` (${action.textSourceSelector})` : ''} / matched=${matches.length}`,
        };
      }
    }
  })();
}

function isNavigationAction(actionType) {
  return (
    actionType === 'clickSelector' || actionType === 'clickXPath' || actionType === 'clickText'
  );
}

function isFrameRemovedError(error) {
  const message = String(error?.message || error || '');
  return (
    /Frame with ID \d+ was removed/i.test(message) ||
    /The frame was removed/i.test(message) ||
    /Cannot access contents of url/i.test(message)
  );
}

function htmlSerializer() {
  const clonedRoot = document.documentElement.cloneNode(true);
  const liveControls = document.querySelectorAll('input, textarea, select');
  const clonedControls = clonedRoot.querySelectorAll('input, textarea, select');

  liveControls.forEach((liveControl, index) => {
    const clonedControl = clonedControls[index];
    if (!clonedControl) {
      return;
    }

    if (
      liveControl instanceof HTMLTextAreaElement &&
      clonedControl instanceof HTMLTextAreaElement
    ) {
      clonedControl.textContent = liveControl.value;
      return;
    }

    if (liveControl instanceof HTMLSelectElement && clonedControl instanceof HTMLSelectElement) {
      Array.from(clonedControl.options).forEach((option, optionIndex) => {
        const selected = Boolean(liveControl.options[optionIndex]?.selected);
        option.selected = selected;
        if (selected) {
          option.setAttribute('selected', '');
        } else {
          option.removeAttribute('selected');
        }
      });
      return;
    }

    if (liveControl instanceof HTMLInputElement && clonedControl instanceof HTMLInputElement) {
      const type = String(liveControl.type || '').toLowerCase();
      if (type === 'checkbox' || type === 'radio') {
        if (liveControl.checked) {
          clonedControl.setAttribute('checked', '');
        } else {
          clonedControl.removeAttribute('checked');
        }
        return;
      }
      if (type !== 'file') {
        clonedControl.value = liveControl.value;
        clonedControl.setAttribute('value', liveControl.value);
      }
    }
  });

  const doctype = document.doctype
    ? `<!DOCTYPE ${document.doctype.name}${document.doctype.publicId ? ` PUBLIC "${document.doctype.publicId}"` : ''}${document.doctype.systemId ? ` "${document.doctype.systemId}"` : ''}>\n`
    : '';
  return doctype + clonedRoot.outerHTML;
}

function base64ToBytes(base64Text) {
  const binary = atob(base64Text || '');
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i += 1) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}

function bytesToDataUrl(bytes, mimeType) {
  let binary = '';
  const chunkSize = 0x8000;
  for (let i = 0; i < bytes.length; i += chunkSize) {
    binary += String.fromCharCode(...bytes.subarray(i, i + chunkSize));
  }
  return `data:${mimeType};base64,${btoa(binary)}`;
}

async function blobToDataUrl(blob, mimeType = 'application/octet-stream') {
  const buffer = await blob.arrayBuffer();
  return bytesToDataUrl(new Uint8Array(buffer), mimeType);
}

function waitForDownload(downloadId, timeoutMs = 120000) {
  return new Promise((resolve, reject) => {
    let done = false;
    const cleanup = () => {
      chrome.downloads.onChanged.removeListener(listener);
      clearTimeout(timer);
    };
    const finish = async (ok, value) => {
      if (done) {
        return;
      }
      done = true;
      cleanup();
      ok ? resolve(value) : reject(value);
    };
    const listener = async (delta) => {
      if (delta.id !== downloadId || !delta.state?.current) {
        return;
      }
      if (delta.state.current === 'complete') {
        const [item] = await chrome.downloads.search({ id: downloadId });
        await finish(true, item);
      } else if (delta.state.current === 'interrupted') {
        const [item] = await chrome.downloads.search({ id: downloadId });
        await finish(false, new Error(item?.error || 'Download interrupted.'));
      }
    };
    const timer = setTimeout(async () => {
      const [item] = await chrome.downloads.search({ id: downloadId });
      if (item?.state === 'complete') {
        await finish(true, item);
      } else {
        await finish(false, new Error('Timed out waiting for download completion.'));
      }
    }, timeoutMs);
    chrome.downloads.onChanged.addListener(listener);
  });
}

async function downloadBlobAsFile(blob, filename) {
  const mime = blob.type || 'application/octet-stream';
  const dataUrl = await blobToDataUrl(blob, mime);
  pendingFilenameQueue.push({ filename, conflictAction: 'uniquify', url: dataUrl });
  try {
    const downloadId = await chrome.downloads.download({
      url: dataUrl,
      filename,
      saveAs: false,
      conflictAction: 'uniquify',
    });
    const item = await waitForDownload(downloadId, 120000);
    return { downloadId, filename: item?.filename || filename };
  } catch (error) {
    if (pendingFilenameQueue[0]?.url === dataUrl) {
      pendingFilenameQueue.shift();
    }
    throw error;
  }
}

async function resolveFilenamePrefix(tabId, item) {
  const explicit = String(item.filenamePrefix || '').trim();
  if (explicit) {
    return explicit;
  }
  try {
    const tab = await chrome.tabs.get(tabId);
    const title = String(tab?.title || '').trim();
    if (title) {
      return title;
    }
  } catch {}
  return item.name || 'capture';
}

async function withDebugger(tabId, callback) {
  const target = { tabId };
  let attached = false;
  let lastError = null;
  for (const version of ['1.3', '0.1']) {
    try {
      await chrome.debugger.attach(target, version);
      attached = true;
      break;
    } catch (error) {
      lastError = error;
    }
  }
  if (!attached) {
    throw lastError || new Error('Failed to attach debugger.');
  }
  try {
    return await callback(target);
  } finally {
    try {
      await chrome.debugger.detach(target);
    } catch {}
  }
}

async function capturePdfViaDebugger(tabId, pdfOptions = {}) {
  return withDebugger(tabId, async (target) => {
    const paper = PDF_PAPER_SIZE_MAP[pdfOptions.paperSize] || PDF_PAPER_SIZE_MAP.a4;
    const margin = PDF_MARGIN_MAP[pdfOptions.marginPreset] || PDF_MARGIN_MAP.default;
    const result = await chrome.debugger.sendCommand(target, 'Page.printToPDF', {
      printBackground: pdfOptions.printBackground !== false,
      preferCSSPageSize: true,
      displayHeaderFooter: false,
      landscape: pdfOptions.landscape === true,
      paperWidth: paper.width,
      paperHeight: paper.height,
      marginTop: margin.inches,
      marginBottom: margin.inches,
      marginLeft: margin.inches,
      marginRight: margin.inches,
    });
    if (!result?.data) {
      throw new Error('Page.printToPDF returned no data.');
    }
    return new Blob([base64ToBytes(result.data)], { type: 'application/pdf' });
  });
}

async function captureImageViaDebugger(tabId, format, imageOptions = {}) {
  return withDebugger(tabId, async (target) => {
    const jpegQuality = Math.max(1, Math.min(100, Number(imageOptions.jpegQuality ?? 90) || 90));
    const metrics = await chrome.debugger.sendCommand(target, 'Page.getLayoutMetrics');
    const cssContentSize = metrics?.cssContentSize || metrics?.contentSize;
    const width = Math.max(1, Math.ceil(cssContentSize?.width || 1280));
    const height = Math.max(1, Math.ceil(cssContentSize?.height || 720));
    await chrome.debugger.sendCommand(target, 'Emulation.setDeviceMetricsOverride', {
      mobile: false,
      width,
      height,
      deviceScaleFactor: 1,
      screenWidth: width,
      screenHeight: height,
      positionX: 0,
      positionY: 0,
      dontSetVisibleSize: false,
    });
    try {
      const params = {
        format,
        fromSurface: true,
        captureBeyondViewport: true,
        clip: { x: 0, y: 0, width, height, scale: 1 },
      };
      if (format === 'jpeg') {
        params.quality = jpegQuality;
      }
      const result = await chrome.debugger.sendCommand(target, 'Page.captureScreenshot', params);
      if (!result?.data) {
        throw new Error('Page.captureScreenshot returned no data.');
      }
      const mime =
        format === 'jpeg' ? 'image/jpeg' : format === 'webp' ? 'image/webp' : 'image/png';
      return new Blob([base64ToBytes(result.data)], { type: mime });
    } finally {
      try {
        await chrome.debugger.sendCommand(target, 'Emulation.clearDeviceMetricsOverride');
      } catch {}
    }
  });
}

async function saveTabSnapshot(tabId, item) {
  const resolvedPrefix = await resolveFilenamePrefix(tabId, item);
  const targetFilename = buildFilename(item, new Date(), resolvedPrefix);
  if (DOM_SNAPSHOT_FORMATS.has(item.saveFormat)) {
    const results = await chrome.scripting.executeScript({
      target: { tabId },
      func: htmlSerializer,
    });
    const html = results?.[0]?.result || '';
    const blob = new Blob([html], { type: 'text/html;charset=utf-8' });
    const saved = await downloadBlobAsFile(blob, targetFilename);
    return { filename: saved.filename, format: item.saveFormat };
  }
  if (PAGE_CAPTURE_FORMATS.has(item.saveFormat)) {
    const blob = await chrome.pageCapture.saveAsMHTML({ tabId });
    if (!blob) {
      throw new Error('pageCapture returned no data.');
    }
    const saved = await downloadBlobAsFile(blob, targetFilename);
    return { filename: saved.filename, format: item.saveFormat };
  }
  if (PDF_SAVE_FORMATS.has(item.saveFormat)) {
    const blob = await capturePdfViaDebugger(tabId, item.pdfOptions);
    const saved = await downloadBlobAsFile(blob, targetFilename);
    return { filename: saved.filename, format: item.saveFormat };
  }
  if (IMAGE_SAVE_FORMATS.has(item.saveFormat)) {
    const blob = await captureImageViaDebugger(tabId, item.saveFormat, item.imageOptions);
    const saved = await downloadBlobAsFile(blob, targetFilename);
    return { filename: saved.filename, format: item.saveFormat };
  }
  throw new Error(`Unsupported save format: ${item.saveFormat}`);
}

function summarizeActionLog(actionLog = []) {
  if (!Array.isArray(actionLog) || actionLog.length === 0) {
    return '';
  }
  return actionLog
    .slice(0, 8)
    .map((entry) => {
      const prefix = entry?.ok === false ? 'FAIL' : 'OK';
      const type = String(entry?.type || 'action');
      const detail = String(entry?.detail || '').trim();
      return detail ? `${prefix} ${type}: ${detail}` : `${prefix} ${type}`;
    })
    .join(' | ');
}

function isRetryableError(error) {
  const code = String(error?.code || '');
  if (code === 'auth' || code === 'permission') {
    return false;
  }
  const text = String(error?.message || error || '').toLowerCase();
  return [
    'timed out',
    'timeout',
    'interrupted',
    'net::',
    'target closed',
    'returned no data',
    'disconnected',
  ].some((marker) => text.includes(marker));
}

function successMessage(actionSummary, attemptNumber, maxAttempts) {
  const base = actionSummary || 'Saved successfully.';
  if (attemptNumber > 1) {
    return `${base} Recovered on attempt ${attemptNumber}/${maxAttempts}.`;
  }
  return base;
}

function failureMessage(error, attemptNumber, maxAttempts) {
  const base = error?.message || String(error);
  if (attemptNumber > 1) {
    return `Failed after ${attemptNumber}/${maxAttempts} attempts. Last error: ${base}`;
  }
  return base;
}

async function executeItemAttempt(item) {
  let tabId = null;
  try {
    await ensureHostPermissionForItem(item);
    const tab = await chrome.tabs.create({ url: item.url, active: false });
    tabId = tab.id;
    await waitForTabComplete(tabId, 60000);
    await sleep(item.waitBeforeActionsMs || 0);
    const locale = await getCurrentLocale();
    const pageMessages = buildPageActionMessages(locale);
    const actionLog = [];
    for (const action of item.actions || []) {
      if (action?.enabled === false) {
        actionLog.push({ actionId: action.id, type: action.type, ok: true, detail: 'disabled' });
        continue;
      }
      let actionResult = null;
      try {
        const actionResults = await chrome.scripting.executeScript({
          target: { tabId },
          func: executeActionInPage,
          args: [action, pageMessages],
        });
        actionResult = actionResults?.[0]?.result || { ok: true, detail: '' };
      } catch (error) {
        if (isNavigationAction(action?.type) && isFrameRemovedError(error)) {
          actionResult = { ok: true, detail: 'navigation started', navigated: true };
        } else {
          const actionError = new Error(
            error?.message || String(error) || t('sw.actionFailed', {}, locale)
          );
          actionLog.push({
            actionId: action?.id,
            type: action?.type,
            ok: false,
            detail: actionError.message,
          });
          actionError.actionLog = actionLog;
          throw actionError;
        }
      }
      if (!actionResult?.ok) {
        const actionError = new Error(actionResult.error || t('sw.actionFailed', {}, locale));
        actionLog.push({
          actionId: action?.id,
          type: action?.type,
          ok: false,
          detail: actionError.message,
        });
        actionError.actionLog = actionLog;
        throw actionError;
      }
      actionLog.push({
        actionId: action?.id,
        type: action?.type,
        ok: true,
        detail: actionResult.detail || '',
      });
      if (isNavigationAction(action?.type)) {
        await waitForTabComplete(tabId, 60000);
        await sleep(Number(action.waitAfterMs || 0));
      }
    }
    await sleep(item.waitAfterActionsMs || 0);
    await verifyAuthenticatedState(tabId, item);
    const saved = await saveTabSnapshot(tabId, item);
    return { saved, actionLog };
  } finally {
    if (tabId !== null && item.closeTabAfterSave !== false) {
      try {
        await chrome.tabs.remove(tabId);
      } catch {}
    }
  }
}

async function executeItemNow(item, trigger = 'manual') {
  if (runningItemIds.has(item.id)) {
    return { ok: false, skipped: true, message: 'This item is already running.' };
  }
  runningItemIds.add(item.id);
  const maxAttempts = 1 + Math.max(0, Number(item.retryOptions?.maxRetries || 0));
  const retryDelayMs = Math.max(0, Number(item.retryOptions?.retryDelayMs || 1000) || 1000);
  let lastError = null;
  let attemptNumber = 0;
  try {
    for (attemptNumber = 1; attemptNumber <= maxAttempts; attemptNumber += 1) {
      try {
        const { saved, actionLog } = await executeItemAttempt(item);
        const entry = {
          id: crypto.randomUUID(),
          itemId: item.id,
          itemName: item.name,
          status: 'success',
          errorCode: '',
          trigger,
          at: new Date().toISOString(),
          filename: saved.filename,
          fileFormat: saved.format,
          message: successMessage(summarizeActionLog(actionLog || []), attemptNumber, maxAttempts),
          actionLog: actionLog || [],
          attemptCount: attemptNumber,
          maxAttempts,
        };
        await appendLog(entry);
        return { ok: true, entry };
      } catch (error) {
        lastError = error;
        if (attemptNumber >= maxAttempts || !isRetryableError(error)) {
          break;
        }
        await sleep(retryDelayMs);
      }
    }

    const entry = {
      id: crypto.randomUUID(),
      itemId: item.id,
      itemName: item.name,
      status: 'error',
      errorCode: lastError?.code || '',
      trigger,
      at: new Date().toISOString(),
      filename: '',
      fileFormat: fileExtensionFor(item.saveFormat),
      message: failureMessage(lastError, attemptNumber, maxAttempts),
      actionLog: lastError?.actionLog || [],
      attemptCount: attemptNumber,
      maxAttempts,
    };
    await appendLog(entry);
    return { ok: false, entry };
  } finally {
    runningItemIds.delete(item.id);
  }
}

function executeItem(item, trigger = 'manual') {
  if (queuedItemIds.has(item.id) || runningItemIds.has(item.id)) {
    return Promise.resolve({
      ok: false,
      skipped: true,
      message: 'This item is already running or queued.',
    });
  }
  queuedItemIds.add(item.id);
  const run = executionQueue.then(
    async () => {
      queuedItemIds.delete(item.id);
      return executeItemNow(item, trigger);
    },
    async () => {
      queuedItemIds.delete(item.id);
      return executeItemNow(item, trigger);
    }
  );
  executionQueue = run.then(
    () => undefined,
    () => undefined
  );
  return run.finally(() => queuedItemIds.delete(item.id));
}

chrome.downloads.onDeterminingFilename.addListener((downloadItem, suggest) => {
  const pending = pendingFilenameQueue[0];
  if (pending && downloadItem?.url === pending.url) {
    pendingFilenameQueue.shift();
    suggest({ filename: pending.filename, conflictAction: pending.conflictAction || 'uniquify' });
    return;
  }
  suggest();
});

chrome.runtime.onInstalled.addListener(async () => {
  await ensureInitialized();
  await syncAlarms();
});

chrome.runtime.onStartup.addListener(async () => {
  await ensureInitialized();
  await syncAlarms();
});

chrome.alarms.onAlarm.addListener(async (alarm) => {
  const ref = parseAlarmName(alarm.name);
  if (!ref) {
    return;
  }
  const { items } = await loadConfig();
  const item = items.find((x) => x.id === ref.itemId);
  if (!item || !item.enabled) {
    await syncAlarms();
    return;
  }
  await executeItem(item, 'alarm');
  await syncAlarms();
});

chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  (async () => {
    await ensureInitialized();
    switch (message?.type) {
      case 'get-config': {
        const config = await loadConfig();
        sendResponse({ ok: true, ...config });
        return;
      }
      case 'save-config': {
        const items = (message.items || []).map(normalizeItem);
        const appSettings = normalizeAppSettings(message.appSettings || {});
        const saved = await saveConfig({ items, appSettings });
        await syncAlarms();
        sendResponse({ ok: true, ...saved });
        return;
      }
      case 'run-item-now': {
        const { items } = await loadConfig();
        const item = items.find((x) => x.id === message.itemId);
        if (!item) {
          sendResponse({ ok: false, error: 'Item not found.' });
          return;
        }
        const result = await executeItem(item, 'manual');
        sendResponse(result);
        return;
      }
      case 'sync-alarms': {
        await syncAlarms();
        sendResponse({ ok: true });
        return;
      }
      case 'clear-history': {
        await chrome.storage.local.set({ [STORAGE_KEYS.RECENT_HISTORY]: [] });
        sendResponse({ ok: true });
        return;
      }
      default:
        sendResponse({ ok: false, error: 'Unknown message type.' });
    }
  })().catch((error) => sendResponse({ ok: false, error: error?.message || String(error) }));
  return true;
});
