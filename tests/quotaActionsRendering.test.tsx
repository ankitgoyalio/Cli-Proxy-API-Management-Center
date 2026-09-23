import { afterAll, expect, test } from 'bun:test';
import { createElement, act } from 'react';
import { createRoot } from 'react-dom/client';
import { Window } from 'happy-dom';
import { createInstance } from 'i18next';
import { I18nextProvider } from 'react-i18next';
import { useQuotaActions } from '../src/features/quota/hooks/useQuotaActions';
import { useNotificationStore } from '../src/stores/useNotificationStore';
import { useQuotaStore } from '../src/stores/useQuotaStore';
import { QUOTA_ADAPTERS } from '../src/features/quota/providers';
import type { QuotaAdapter } from '../src/features/quota/providers';
import type { AuthFileItem } from '../src/types';
import en from '../src/i18n/locales/en.json';

const browserWindow = new Window({ url: 'http://localhost/#/quota' });
const originalDocument = Object.getOwnPropertyDescriptor(globalThis, 'document');
const originalWindow = Object.getOwnPropertyDescriptor(globalThis, 'window');
const originalAct = Object.getOwnPropertyDescriptor(globalThis, 'IS_REACT_ACT_ENVIRONMENT');
Object.assign(globalThis, { window: browserWindow, document: browserWindow.document });
globalThis.IS_REACT_ACT_ENVIRONMENT = true;
afterAll(async () => {
  if (originalDocument) Object.defineProperty(globalThis, 'document', originalDocument);
  else Reflect.deleteProperty(globalThis, 'document');
  if (originalWindow) Object.defineProperty(globalThis, 'window', originalWindow);
  else Reflect.deleteProperty(globalThis, 'window');
  if (originalAct) Object.defineProperty(globalThis, 'IS_REACT_ACT_ENVIRONMENT', originalAct);
  else Reflect.deleteProperty(globalThis, 'IS_REACT_ACT_ENVIRONMENT');
  await browserWindow.happyDOM.close();
});

const i18n = createInstance();
await i18n.init({ lng: 'en', resources: { en: { translation: en } } });

test('quota actions mask messages and retain raw request and cache identities', async () => {
  const file: AuthFileItem = {
    name: 'codex-alice@example.com.json',
    email: 'alice@example.com',
    type: 'codex',
  };
  const requested: string[] = [];
  let fail = false;
  const adapter: QuotaAdapter = {
    ...QUOTA_ADAPTERS.codex,
    fetchQuota: async (input) => {
      requested.push(input.name);
      if (fail) throw new Error(`Failed ${input.name}`);
      return {};
    },
    resetQuota: async (input) => {
      requested.push(input.name);
      if (fail) throw new Error(`Failed ${input.name}`);
      return {};
    },
    buildSuccessState: () => ({ status: 'success' }),
  };
  useQuotaStore.getState().clearQuotaCache();
  useNotificationStore.setState({ notifications: [] });
  let actions: ReturnType<typeof useQuotaActions> | undefined;
  function Harness() {
    actions = useQuotaActions(false);
    return null;
  }
  const host = document.createElement('div');
  document.body.append(host);
  const root = createRoot(host);
  await act(async () =>
    root.render(createElement(I18nextProvider, { i18n }, createElement(Harness)))
  );

  await act(async () => actions!.refreshQuota(file, adapter));
  expect(requested).toEqual([file.name]);
  expect(useQuotaStore.getState().codexQuota[file.name]?.status).toBe('success');
  expect(useNotificationStore.getState().notifications.at(-1)?.message).not.toContain(
    'alice@example.com'
  );

  await act(async () => actions!.resetQuota(file, adapter));
  const confirmation = useNotificationStore.getState().confirmation.options;
  expect(String(confirmation?.message)).toContain('a***@e***.com');
  expect(String(confirmation?.message)).not.toContain('alice@example.com');
  await act(async () => confirmation?.onConfirm());
  expect(requested).toEqual([file.name, file.name]);
  expect(useNotificationStore.getState().notifications.at(-1)?.message).not.toContain(
    'alice@example.com'
  );

  fail = true;
  await act(async () => actions!.refreshQuota(file, adapter));
  expect(useNotificationStore.getState().notifications.at(-1)?.message).not.toContain(
    'alice@example.com'
  );
  await act(async () => actions!.resetQuota(file, adapter));
  await act(async () => useNotificationStore.getState().confirmation.options?.onConfirm());
  expect(useNotificationStore.getState().notifications.at(-1)?.message).not.toContain(
    'alice@example.com'
  );

  await act(async () => root.unmount());
  host.remove();
});
