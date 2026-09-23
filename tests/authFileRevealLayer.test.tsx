import { afterAll, expect, mock, test } from 'bun:test';
import { act, createElement, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { Window } from 'happy-dom';
import { createInstance } from 'i18next';
import { I18nextProvider } from 'react-i18next';
import { PageTransitionLayerContext } from '../src/components/common/PageTransitionLayer';
import en from '../src/i18n/locales/en.json';

const browserWindow = new Window();
const originalDocument = Object.getOwnPropertyDescriptor(globalThis, 'document');
const originalWindow = Object.getOwnPropertyDescriptor(globalThis, 'window');
const originalAct = Object.getOwnPropertyDescriptor(globalThis, 'IS_REACT_ACT_ENVIRONMENT');
Object.assign(globalThis, { window: browserWindow, document: browserWindow.document });
globalThis.IS_REACT_ACT_ENVIRONMENT = true;
afterAll(async () => {
  for (const [name, descriptor] of [
    ['document', originalDocument],
    ['window', originalWindow],
    ['IS_REACT_ACT_ENVIRONMENT', originalAct],
  ] as const) {
    if (descriptor) Object.defineProperty(globalThis, name, descriptor);
    else Reflect.deleteProperty(globalThis, name);
  }
  await browserWindow.happyDOM.close();
});

mock.module('../src/features/authFiles/components/AuthFileQuotaSection', () => ({
  AuthFileQuotaSection: () => null,
}));

const i18n = createInstance();
await i18n.init({ lng: 'en', resources: { en: { translation: en } } });
const { AuthFileCard } = await import('../src/features/authFiles/components/AuthFileCard');

test('auth-file reveal masks immediately on route departure and stays masked on return', async () => {
  const host = document.createElement('div');
  document.body.append(host);
  const root = createRoot(host);
  let setCurrent!: (value: boolean) => void;
  function Harness() {
    const [current, updateCurrent] = useState(true);
    setCurrent = updateCurrent;
    return createElement(
      I18nextProvider,
      { i18n },
      createElement(
        PageTransitionLayerContext.Provider,
        {
          value: current
            ? { status: 'current', isCurrentLayer: true, isAnimating: false }
            : { status: 'stacked', isCurrentLayer: false, isAnimating: false },
        },
        createElement(AuthFileCard, {
          file: { name: 'codex-alice@example.com.json', email: 'alice@example.com', type: 'codex' },
          compact: true,
          selected: false,
          resolvedTheme: 'light',
          disableControls: false,
          deleting: null,
          statusUpdating: {},
          manualRefreshing: {},
          quotaFilterType: null,
          statusBarCache: new Map(),
          onShowModels: () => {},
          onDownload: () => {},
          onManualRefresh: () => {},
          onOpenPrefixProxyEditor: () => {},
          onDelete: () => {},
          onToggleStatus: () => {},
          onToggleSelect: () => {},
        })
      )
    );
  }
  await act(async () => root.render(createElement(Harness)));
  const reveal = () =>
    [...host.querySelectorAll('button')].find((button) =>
      /Show email|Hide email/.test(button.textContent ?? '')
    )!;
  await act(async () => reveal().click());
  expect(host.innerHTML).toContain('alice@example.com');
  await act(async () => setCurrent(false));
  expect(host.innerHTML).not.toContain('alice@example.com');
  expect(reveal().getAttribute('aria-pressed')).toBe('false');
  await act(async () => setCurrent(true));
  expect(host.innerHTML).not.toContain('alice@example.com');
  expect(reveal().textContent).toContain('Show email');
  await act(async () => root.unmount());
  host.remove();
});
