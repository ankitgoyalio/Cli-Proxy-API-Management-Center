import { afterAll, expect, spyOn, test } from 'bun:test';
import { act, createElement } from 'react';
import { createRoot } from 'react-dom/client';
import { Window } from 'happy-dom';
import { createInstance } from 'i18next';
import { I18nextProvider } from 'react-i18next';
import { SiwcBindDialog } from '../src/features/oauth/components/SiwcBindDialog';
import { authFilesApi } from '../src/services/api/authFiles';
import { apiClient } from '../src/services/api/client';
import { oauthApi } from '../src/services/api/oauth';
import en from '../src/i18n/locales/en.json';

const window = new Window({ url: 'http://localhost/#/oauth' });
const names = [
  'window',
  'document',
  'navigator',
  'HTMLElement',
  'MutationObserver',
  'IS_REACT_ACT_ENVIRONMENT',
] as const;
const originals = names.map(
  (name) => [name, Object.getOwnPropertyDescriptor(globalThis, name)] as const
);
Object.assign(globalThis, {
  window,
  document: window.document,
  navigator: window.navigator,
  HTMLElement: window.HTMLElement,
  MutationObserver: window.MutationObserver,
  IS_REACT_ACT_ENVIRONMENT: true,
});
afterAll(async () => {
  for (const [name, descriptor] of originals) {
    if (descriptor) Object.defineProperty(globalThis, name, descriptor);
    else Reflect.deleteProperty(globalThis, name);
  }
  await window.happyDOM.close();
});
const i18n = createInstance();
await i18n.init({ lng: 'en', resources: { en: { translation: en } } });

const button = (label: string) =>
  Array.from(document.querySelectorAll('button')).find((item) => item.textContent === label)!;

test('SIWC picker masks colliding identities, permits local reveal, and awaits cancellation before retry', async () => {
  const targets = spyOn(authFilesApi, 'list').mockResolvedValue({
    files: ['alice', 'alex'].map((name) => ({
      name: `codex-${name}@example.test.json`,
      email: `${name}@example.test`,
      type: 'codex',
      siwcBindSupported: true,
    })),
  });
  const client = apiClient.captureConnection();
  const start = spyOn(client, 'post').mockResolvedValue({
    status: 'ok',
    state: 'synthetic',
    url: 'https://example.test/auth',
    flow: 'siwc_bind',
    expires_in: 300,
  });
  let finishCancellation!: () => void;
  const cancel = spyOn(client, 'delete').mockImplementation(
    () =>
      new Promise<void>((resolve) => {
        finishCancellation = resolve;
      })
  );
  const capture = spyOn(apiClient, 'captureConnection').mockReturnValue(client);
  const poll = spyOn(oauthApi, 'getAuthStatus').mockRejectedValue(
    new Error('synthetic polling failure')
  );
  const host = document.createElement('div');
  document.body.append(host);
  const root = createRoot(host);
  try {
    await act(async () =>
      root.render(
        createElement(
          I18nextProvider,
          { i18n },
          createElement(SiwcBindDialog, {
            open: true,
            onClose: () => {},
            onViewAuthFiles: () => {},
          })
        )
      )
    );
    expect(document.body.textContent).not.toContain('alice@example.test');
    expect(document.querySelector('[title*="alice@example.test"]')).toBeNull();
    await act(async () => button('Show email').click());
    expect(document.body.textContent).toContain('alice@example.test');
    expect(document.body.textContent).toContain('alex@example.test');
    await act(async () => button('Hide email').click());
    const radio = document.querySelector('input[type="radio"]') as HTMLInputElement;
    await act(async () => radio.click());
    await act(async () => button('Start authorization').click());
    expect(start).toHaveBeenCalledTimes(1);
    expect(document.body.textContent).not.toContain('alice@example.test');
    await act(async () => new Promise((resolve) => setTimeout(resolve, 2100)));
    expect(button('Start over')).toBeDefined();
    await act(async () => button('Start over').click());
    expect(cancel).toHaveBeenCalledTimes(1);
    await act(async () => button('Start authorization').click());
    expect(start).toHaveBeenCalledTimes(1);
    await act(async () => finishCancellation());
    expect(start).toHaveBeenCalledTimes(2);
  } finally {
    await act(async () => root.unmount());
    finishCancellation?.();
    host.remove();
    for (const mock of [targets, start, cancel, capture, poll]) mock.mockRestore();
  }
});
