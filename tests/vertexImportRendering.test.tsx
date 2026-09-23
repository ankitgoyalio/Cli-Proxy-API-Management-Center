import { afterAll, expect, spyOn, test } from 'bun:test';
import { act } from 'react';
import { createRoot } from 'react-dom/client';
import { createElement } from 'react';
import { Window } from 'happy-dom';
import { createInstance } from 'i18next';
import { I18nextProvider } from 'react-i18next';
import { MemoryRouter, useNavigate } from 'react-router-dom';
import { OAuthPage } from '../src/pages/OAuthPage';
import { vertexApi } from '../src/services/api/vertex';
import { pluginsApi } from '../src/services/api/plugins';
import en from '../src/i18n/locales/en.json';

const window = new Window({ url: 'http://localhost/#/oauth' });
const globalNames = [
  'window',
  'document',
  'navigator',
  'HTMLElement',
  'MutationObserver',
  'IS_REACT_ACT_ENVIRONMENT',
] as const;
const originalGlobals = globalNames.map(
  (name) => [name, Object.getOwnPropertyDescriptor(globalThis, name)] as const
);
Object.assign(globalThis, {
  window,
  document: window.document,
  navigator: window.navigator,
  HTMLElement: window.HTMLElement,
  MutationObserver: window.MutationObserver,
});
globalThis.IS_REACT_ACT_ENVIRONMENT = true;
afterAll(async () => {
  for (const [name, descriptor] of originalGlobals) {
    if (descriptor) Object.defineProperty(globalThis, name, descriptor);
    else Reflect.deleteProperty(globalThis, name);
  }
  await window.happyDOM.close();
});

const i18n = createInstance();
await i18n.init({ lng: 'en', resources: { en: { translation: en } } });

function NavigateButton() {
  const navigate = useNavigate();
  return createElement('button', { onClick: () => navigate('/config') }, 'Change route');
}

test('Vertex import masks uploaded and returned names, reveals locally, and sends the original file', async () => {
  const imported = spyOn(vertexApi, 'importCredential').mockResolvedValue({
    status: 'ok',
    email: 'alice@example.com',
    'auth-file': 'vertex-alice@example.com-team.json',
  });
  const plugins = spyOn(pluginsApi, 'list').mockResolvedValue({ plugins: [] });
  const host = document.createElement('div');
  document.body.append(host);
  const root = createRoot(host);
  try {
    await act(async () =>
      root.render(
        createElement(
          I18nextProvider,
          { i18n },
          createElement(
            MemoryRouter,
            { initialEntries: ['/oauth'] },
            createElement(NavigateButton),
            createElement(OAuthPage)
          )
        )
      )
    );
    const file = new window.File(['{"project_id":"test"}'], 'key-alice@example.com.json', {
      type: 'application/json',
    });
    const input = host.querySelector('input[type="file"]') as HTMLInputElement;
    const files = new window.DataTransfer();
    files.items.add(file);
    input.files = files.files;
    await act(async () => input.dispatchEvent(new window.Event('change', { bubbles: true })));
    expect(host.innerHTML).toContain('Hidden auth-file name');
    expect(host.innerHTML).not.toContain('alice@example.com');

    const importButton = Array.from(host.querySelectorAll('button')).find(
      (button) => button.textContent === 'Import Vertex Credential'
    );
    await act(async () => importButton!.click());
    expect(imported).toHaveBeenCalledWith(file, undefined);
    expect(host.innerHTML).toContain('a***@e***.com');
    expect(host.innerHTML).toContain('key-a***@e***.com.json');
    expect(host.innerHTML).toContain('vertex-a***@e***.com-team.json');
    expect(host.innerHTML).not.toContain('alice@example.com');

    const reveal = Array.from(host.querySelectorAll('button')).find(
      (button) => button.textContent === 'Show email'
    );
    expect(reveal?.getAttribute('aria-pressed')).toBe('false');
    await act(async () => reveal!.click());
    expect(host.innerHTML).toContain('alice@example.com');
    expect(host.innerHTML).toContain('key-alice@example.com.json');
    expect(host.innerHTML).toContain('vertex-alice@example.com-team.json');
    expect(reveal?.getAttribute('aria-pressed')).toBe('true');
    expect(reveal?.textContent).toBe('Hide email');

    await act(async () => host.querySelector('button')!.click());
    expect(host.innerHTML).not.toContain('alice@example.com');
    expect(host.innerHTML).toContain('a***@e***.com');
  } finally {
    await act(async () => root.unmount());
    host.remove();
    imported.mockRestore();
    plugins.mockRestore();
  }
});

test('Vertex import hides malformed account fields and unresolved email-bearing filenames', async () => {
  const imported = spyOn(vertexApi, 'importCredential').mockResolvedValue({
    status: 'ok',
    email: 'not-an-address',
    'auth-file': 'vertex-bob@example.net.json',
  });
  const plugins = spyOn(pluginsApi, 'list').mockResolvedValue({ plugins: [] });
  const host = document.createElement('div');
  document.body.append(host);
  const root = createRoot(host);
  try {
    await act(async () =>
      root.render(
        createElement(
          I18nextProvider,
          { i18n },
          createElement(MemoryRouter, null, createElement(OAuthPage))
        )
      )
    );
    const file = new window.File(['{}'], 'key-alice@example.com.json', {
      type: 'application/json',
    });
    const files = new window.DataTransfer();
    files.items.add(file);
    const input = host.querySelector('input[type="file"]') as HTMLInputElement;
    input.files = files.files;
    await act(async () => input.dispatchEvent(new window.Event('change', { bubbles: true })));
    const importButton = Array.from(host.querySelectorAll('button')).find(
      (button) => button.textContent === 'Import Vertex Credential'
    );
    await act(async () => importButton!.click());
    expect(host.textContent).toContain('Hidden email');
    expect(host.textContent).toContain('Hidden auth-file name');
    expect(host.innerHTML).not.toContain('alice@example.com');
    expect(host.innerHTML).not.toContain('bob@example.net');
    expect(host.innerHTML).not.toContain('not-an-address');
  } finally {
    await act(async () => root.unmount());
    host.remove();
    imported.mockRestore();
    plugins.mockRestore();
  }
});

test('choosing another file during import leaves the new file ready to import', async () => {
  let finishImport!: (value: { status: 'ok'; email: string }) => void;
  const pending = new Promise<{ status: 'ok'; email: string }>((resolve) => {
    finishImport = resolve;
  });
  const imported = spyOn(vertexApi, 'importCredential').mockImplementation(() => pending);
  const plugins = spyOn(pluginsApi, 'list').mockResolvedValue({ plugins: [] });
  const host = document.createElement('div');
  document.body.append(host);
  const root = createRoot(host);
  try {
    await act(async () =>
      root.render(
        createElement(
          I18nextProvider,
          { i18n },
          createElement(MemoryRouter, null, createElement(OAuthPage))
        )
      )
    );
    const input = host.querySelector('input[type="file"]') as HTMLInputElement;
    const select = async (name: string) => {
      const files = new window.DataTransfer();
      files.items.add(new window.File(['{}'], name, { type: 'application/json' }));
      input.files = files.files;
      await act(async () => input.dispatchEvent(new window.Event('change', { bubbles: true })));
    };
    const importButton = Array.from(host.querySelectorAll('button')).find(
      (button) => button.textContent === 'Import Vertex Credential'
    )!;
    await select('first-alice@example.com.json');
    await act(async () => importButton.click());
    expect(importButton.disabled).toBe(true);
    await select('second-bob@example.net.json');
    expect(importButton.disabled).toBe(false);
    await act(async () => finishImport({ status: 'ok', email: 'alice@example.com' }));
    expect(host.innerHTML).not.toContain('alice@example.com');
    expect(host.textContent).not.toContain('Credential saved');
    expect(importButton.disabled).toBe(false);
  } finally {
    await act(async () => root.unmount());
    host.remove();
    imported.mockRestore();
    plugins.mockRestore();
  }
});
