import { afterAll, expect, spyOn, test } from 'bun:test';
import { act } from 'react';
import { createRoot } from 'react-dom/client';
import { createElement, useState } from 'react';
import { Window } from 'happy-dom';
import { createInstance } from 'i18next';
import { I18nextProvider } from 'react-i18next';
import { MemoryRouter, useNavigate } from 'react-router-dom';
import { OAuthPage } from '../src/features/oauth/OAuthPage';
import { vertexApi } from '../src/services/api/vertex';
import { pluginsApi } from '../src/services/api/plugins';
import en from '../src/i18n/locales/en.json';
import { PageTransitionLayerContext } from '../src/components/common/PageTransitionLayer';

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

async function openVertex() {
  const button = Array.from(document.querySelectorAll('button')).find(
    (button) => button.textContent === 'Vertex AI'
  );
  if (button && !document.querySelector('input[type="file"]'))
    await act(async () => button.click());
}

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
    await openVertex();
    const file = new window.File(['{"project_id":"test"}'], 'key-alice@example.com.json', {
      type: 'application/json',
    });
    await openVertex();
    const input = document.querySelector('input[type="file"]') as HTMLInputElement;
    const files = new window.DataTransfer();
    files.items.add(file);
    input.files = files.files;
    await act(async () => input.dispatchEvent(new window.Event('change', { bubbles: true })));
    expect(document.body.innerHTML).toContain('Hidden auth-file name');
    expect(document.body.innerHTML).not.toContain('alice@example.com');

    const importButton = Array.from(document.querySelectorAll('button')).find(
      (button) => button.textContent === 'Import Vertex Credential'
    );
    await act(async () => importButton!.click());
    expect(imported).toHaveBeenCalledWith(file, undefined);
    expect(document.body.innerHTML).toContain('a***@e***.com');
    expect(document.body.innerHTML).toContain('key-a***@e***.com.json');
    expect(document.body.innerHTML).toContain('vertex-a***@e***.com-team.json');
    expect(document.body.innerHTML).not.toContain('alice@example.com');

    const reveal = Array.from(document.querySelectorAll('button')).find(
      (button) => button.textContent === 'Show email'
    );
    expect(reveal?.getAttribute('aria-pressed')).toBe('false');
    await act(async () => reveal!.click());
    expect(document.body.innerHTML).toContain('alice@example.com');
    expect(document.body.innerHTML).toContain('key-alice@example.com.json');
    expect(document.body.innerHTML).toContain('vertex-alice@example.com-team.json');
    expect(reveal?.getAttribute('aria-pressed')).toBe('true');
    expect(reveal?.textContent).toBe('Hide email');

    await act(async () =>
      Array.from(host.querySelectorAll('button'))
        .find((button) => button.textContent === 'Change route')!
        .click()
    );
    expect(document.body.innerHTML).not.toContain('alice@example.com');
    expect(document.body.innerHTML).toContain('a***@e***.com');
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
    await openVertex();
    const file = new window.File(['{}'], 'key-alice@example.com.json', {
      type: 'application/json',
    });
    const files = new window.DataTransfer();
    files.items.add(file);
    await openVertex();
    const input = document.querySelector('input[type="file"]') as HTMLInputElement;
    input.files = files.files;
    await act(async () => input.dispatchEvent(new window.Event('change', { bubbles: true })));
    const importButton = Array.from(document.querySelectorAll('button')).find(
      (button) => button.textContent === 'Import Vertex Credential'
    );
    await act(async () => importButton!.click());
    expect(document.body.textContent).toContain('Hidden email');
    expect(document.body.textContent).toContain('Hidden auth-file name');
    expect(document.body.innerHTML).not.toContain('alice@example.com');
    expect(document.body.innerHTML).not.toContain('bob@example.net');
    expect(document.body.innerHTML).not.toContain('not-an-address');
  } finally {
    await act(async () => root.unmount());
    host.remove();
    imported.mockRestore();
    plugins.mockRestore();
  }
});

test('Vertex reveal resets when its page becomes a stacked navigation layer', async () => {
  const plugins = spyOn(pluginsApi, 'list').mockResolvedValue({ plugins: [] });
  const host = document.createElement('div');
  document.body.append(host);
  const root = createRoot(host);
  function LayerHarness() {
    const [current, setCurrent] = useState(true);
    return createElement(
      MemoryRouter,
      null,
      createElement('button', { onClick: () => setCurrent(false) }, 'Leave layer'),
      createElement('button', { onClick: () => setCurrent(true) }, 'Return layer'),
      createElement(
        PageTransitionLayerContext.Provider,
        {
          value: current
            ? { status: 'current', isCurrentLayer: true, isAnimating: false }
            : { status: 'stacked', isCurrentLayer: false, isAnimating: false },
        },
        createElement(OAuthPage)
      )
    );
  }
  try {
    await act(async () =>
      root.render(createElement(I18nextProvider, { i18n }, createElement(LayerHarness)))
    );
    await openVertex();
    const input = document.querySelector('input[type="file"]') as HTMLInputElement;
    const files = new window.DataTransfer();
    files.items.add(
      new window.File(['{}'], 'key-alice@example.com.json', { type: 'application/json' })
    );
    input.files = files.files;
    await act(async () => input.dispatchEvent(new window.Event('change', { bubbles: true })));
    const reveal = Array.from(document.querySelectorAll('button')).find(
      (button) => button.textContent === 'Show email'
    )!;
    await act(async () => reveal.click());
    expect(document.body.innerHTML).toContain('alice@example.com');
    await act(async () =>
      Array.from(document.querySelectorAll('button'))
        .find((button) => button.textContent === 'Leave layer')!
        .click()
    );
    expect(document.body.innerHTML).not.toContain('alice@example.com');
    await act(async () =>
      Array.from(document.querySelectorAll('button'))
        .find((button) => button.textContent === 'Return layer')!
        .click()
    );
    expect(document.body.innerHTML).toContain('Hidden auth-file name');
    expect(document.body.innerHTML).not.toContain('alice@example.com');
  } finally {
    await act(async () => root.unmount());
    host.remove();
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
    await openVertex();
    const input = document.querySelector('input[type="file"]') as HTMLInputElement;
    const select = async (name: string) => {
      const files = new window.DataTransfer();
      files.items.add(new window.File(['{}'], name, { type: 'application/json' }));
      input.files = files.files;
      await act(async () => input.dispatchEvent(new window.Event('change', { bubbles: true })));
    };
    const importButton = Array.from(document.querySelectorAll('button')).find(
      (button) => button.textContent === 'Import Vertex Credential'
    )!;
    await select('first-alice@example.com.json');
    await act(async () => importButton.click());
    expect(importButton.disabled).toBe(true);
    await select('second-bob@example.net.json');
    expect(importButton.disabled).toBe(false);
    await act(async () => finishImport({ status: 'ok', email: 'alice@example.com' }));
    expect(document.body.innerHTML).not.toContain('alice@example.com');
    expect(document.body.textContent).not.toContain('Credential saved');
    expect(importButton.disabled).toBe(false);
  } finally {
    await act(async () => root.unmount());
    host.remove();
    imported.mockRestore();
    plugins.mockRestore();
  }
});
