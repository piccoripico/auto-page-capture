import {
  deriveOriginPattern,
  executionStatusLabel,
  formatDateTime,
  isFileSchemeAccessAllowed,
  isFileUrl,
  itemNextOccurrence,
  loadConfig,
  saveFormatLabel,
  scheduleLabel,
} from './lib/shared.js';
import { applyI18n, resolveLocale, t } from './lib/i18n.js';

const isPopoutWindow = new URLSearchParams(location.search).get('mode') === 'window';
if (isPopoutWindow) {
  document.body.classList.add('popout');
}

const itemsEl = document.getElementById('items');
const historyEl = document.getElementById('history');
const statusEl = document.getElementById('status');
const popoutButtonEl = document.getElementById('popout-popup');
if (isPopoutWindow && popoutButtonEl) {
  popoutButtonEl.hidden = true;
}

let currentPageLocale = resolveLocale('browser');

function setPageLocale(locale) {
  currentPageLocale = locale;
  document.documentElement.lang = locale;
  document.title = t('app.name', {}, locale);
  applyI18n(document, locale);
}

function setStatus(message, isError = false) {
  statusEl.textContent = message;
  statusEl.classList.toggle('status-error', isError);
}

function appendTextNode(parent, tagName, text) {
  const node = document.createElement(tagName);
  node.textContent = text;
  parent.append(node);
  return node;
}

function basenameFromPathLike(text) {
  const normalized = String(text || '').trim().replace(/\\/g, '/');
  if (!normalized) {
    return '';
  }
  const parts = normalized.split('/').filter(Boolean);
  return parts.at(-1) || normalized;
}

function compactHistoryMessage(message, maxLength = 120) {
  const normalized = String(message || '')
    .trim()
    .replace(/\s+/g, ' ');
  if (!normalized) {
    return '';
  }
  const sentenceMatch = normalized.match(/^(.+?[.!?。！？])(?:\s|$)/);
  if (sentenceMatch?.[1]) {
    return sentenceMatch[1];
  }
  return normalized.length > maxLength ? `${normalized.slice(0, maxLength - 3)}...` : normalized;
}

function historyDetailText(entry) {
  if (entry.filename) {
    return basenameFromPathLike(entry.filename);
  }
  return compactHistoryMessage(entry.message);
}

async function permissionMissing(item) {
  try {
    if (!item.url) {
      return false;
    }
    if (isFileUrl(item.url)) {
      return !(await isFileSchemeAccessAllowed());
    }
    const origin = deriveOriginPattern(item.url);
    return !(await chrome.permissions.contains({ origins: [origin] }));
  } catch {
    return false;
  }
}

async function render() {
  const config = await loadConfig();
  const locale = resolveLocale(config.appSettings?.uiLanguage || 'browser');
  setPageLocale(locale);
  const permissionMap = Object.fromEntries(
    await Promise.all(config.items.map(async (item) => [item.id, await permissionMissing(item)]))
  );

  document.getElementById('summary-enabled').textContent = String(
    config.items.filter((x) => x.enabled).length
  );
  document.getElementById('summary-needs').textContent = String(
    config.items.filter((x) => x.enabled && permissionMap[x.id]).length
  );
  document.getElementById('summary-history').textContent = String(
    (config.recentHistory || []).length
  );

  itemsEl.innerHTML = '';
  config.items.forEach((item) => {
    const row = document.createElement('div');
    row.className = `item-row${permissionMap[item.id] ? ' needs-permission' : ''}${!item.enabled ? ' disabled' : ''}`;

    const next = itemNextOccurrence(item);
    const main = document.createElement('div');
    main.className = 'item-main';
    const pill = document.createElement('span');
    pill.className = `pill${permissionMap[item.id] ? ' warn' : ''}`;
    pill.textContent = permissionMap[item.id]
      ? t('sidebar.status.needsPermission', {}, locale)
      : item.enabled
        ? t('sidebar.status.ok', {}, locale)
        : t('sidebar.status.disabled', {}, locale);
    const title = document.createElement('h3');
    title.textContent = item.name;
    const detail = document.createElement('p');
    detail.textContent = `${next ? scheduleLabel(next.schedule, locale) : t('shared.timeUnset', {}, locale)} / ${saveFormatLabel(item.saveFormat, locale)}`;
    const host = document.createElement('p');
    host.textContent = item.url || t('permission.urlUnset', {}, locale);
    main.append(pill, title, detail, host);

    const actions = document.createElement('div');
    actions.className = 'item-actions';

    if (permissionMap[item.id]) {
      if (isFileUrl(item.url)) {
        const helpButton = document.createElement('button');
        helpButton.textContent = t('permission.fileAccessAction', {}, locale);
        helpButton.addEventListener('click', () => {
          setStatus(t('permission.fileAccessBody', {}, locale), true);
        });
        actions.append(helpButton);
      } else {
        const grantButton = document.createElement('button');
        grantButton.textContent = t('permission.grantTop', {}, locale);
        grantButton.addEventListener('click', async () => {
          try {
            const origin = deriveOriginPattern(item.url);
            const ok = await chrome.permissions.request({ origins: [origin] });
            if (!ok) {
              setStatus(t('status.permissionDenied', {}, locale), true);
            }
            await render();
          } catch (error) {
            setStatus(error.message || String(error), true);
          }
        });
        actions.append(grantButton);
      }
    } else {
      const runButton = document.createElement('button');
      runButton.className = 'primary';
      runButton.textContent = t('common.run', {}, locale);
      runButton.disabled = !item.enabled;
      runButton.addEventListener('click', async () => {
        setStatus(t('popup.status.running', { name: item.name }, locale));
        const res = await chrome.runtime.sendMessage({ type: 'run-item-now', itemId: item.id });
        if (res.ok) {
          setStatus(t('popup.status.completed', { name: item.name }, locale));
          await render();
        } else {
          setStatus(
            res.error || res.entry?.message || t('popup.status.runFailed', {}, locale),
            true
          );
        }
      });
      actions.append(runButton);
    }

    row.append(main, actions);
    itemsEl.append(row);
  });

  historyEl.innerHTML = '';
  const recentHistory = config.recentHistory || [];
  if (recentHistory.length === 0) {
    const row = document.createElement('div');
    row.className = 'history-row';
    appendTextNode(row, 'p', t('popup.historyEmpty', {}, locale));
    historyEl.append(row);
  } else {
    recentHistory.forEach((entry) => {
      const row = document.createElement('div');
      row.className = 'history-row';
      const main = document.createElement('div');
      main.className = 'history-main';
      const title = appendTextNode(main, 'strong', entry.itemName);
      title.className = 'history-title';
      const meta = appendTextNode(
        main,
        'p',
        `${executionStatusLabel(entry.status, entry.errorCode || '', locale)} / ${formatDateTime(entry.at, locale)}`
      );
      meta.className = 'history-meta';
      const detailText = historyDetailText(entry);
      if (detailText) {
        const detail = appendTextNode(main, 'p', detailText);
        detail.className = 'history-detail';
        detail.title = entry.filename || String(entry.message || '').trim();
      }
      row.append(main);
      historyEl.append(row);
    });
  }
}

document
  .getElementById('open-options')
  .addEventListener('click', () => chrome.runtime.openOptionsPage());
if (popoutButtonEl) {
  popoutButtonEl.addEventListener('click', async () => {
    const url = chrome.runtime.getURL('popup.html?mode=window');
    try {
      const existingTabs = await chrome.tabs.query({
        url: [url, `${chrome.runtime.getURL('popup.html')}*`],
      });
      const existing = existingTabs.find(
        (tab) => typeof tab.id === 'number' && typeof tab.windowId === 'number'
      );
      if (existing) {
        await chrome.windows.update(existing.windowId, { focused: true });
        if (typeof existing.id === 'number') {
          await chrome.tabs.update(existing.id, { active: true });
        }
      } else if (chrome.windows?.create) {
        await chrome.windows.create({ url, type: 'popup', width: 720, height: 920 });
      } else {
        await chrome.tabs.create({ url });
      }
      if (!isPopoutWindow) {
        window.close();
      }
    } catch (error) {
      setStatus(error.message || String(error), true);
    }
  });
}
document
  .getElementById('refresh')
  .addEventListener('click', () =>
    render().catch((error) => setStatus(error.message || String(error), true))
  );
document.getElementById('clear-history').addEventListener('click', async () => {
  const res = await chrome.runtime.sendMessage({ type: 'clear-history' });
  if (!res.ok) {
    setStatus(res.error || t('popup.status.clearHistoryFailed', {}, currentPageLocale), true);
    return;
  }
  setStatus(t('popup.status.clearHistoryDone', {}, currentPageLocale));
  await render();
});

render().catch((error) => setStatus(error.message || String(error), true));
