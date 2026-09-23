import { afterAll, expect, mock, test } from 'bun:test';
import { createElement } from 'react';
import { createRoot } from 'react-dom/client';
import { act } from 'react';
import { Window } from 'happy-dom';
import { MemoryRouter, useNavigate } from 'react-router-dom';
import { createInstance } from 'i18next';
import { I18nextProvider } from 'react-i18next';
import type { PrefixProxyEditorState } from '../src/features/authFiles/hooks/useAuthFilesPrefixProxyEditor';
import en from '../src/i18n/locales/en.json';

const window = new Window({ url: 'http://localhost/#/auth-files' });
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

mock.module('../src/features/authFiles/components/AuthFileExcludedModelsField', () => ({
  AuthFileExcludedModelsField: () => null,
}));

const i18n = createInstance();
await i18n.init({ lng: 'en', resources: { en: { translation: en } } });
const { AuthFileDetailsSheet } =
  await import('../src/features/authFiles/components/AuthFileDetailsSheet');

function NavigateButton() {
  const navigate = useNavigate();
  return createElement('button', { onClick: () => navigate('/config') }, 'Change route');
}

function makeEditor(json: Record<string, unknown> | null): PrefixProxyEditorState {
  const name = 'codex-abc-alice@example.com-team.json';
  return {
    fileName: name,
    fileInfoText: JSON.stringify({ name, email: 'alice@example.com', type: 'codex' }),
    loading: false,
    saving: false,
    error: null,
    originalText: '',
    rawText: '',
    invalidContentPreview: 'bad content alice@example.com ' + name,
    json,
    providerKey: 'codex',
    prefix: '',
    proxyUrl: '',
    priority: '',
    weight: '',
    weightError: null,
    disableCooling: false,
    disableCoolingTouched: false,
    websockets: false,
    websocketsTouched: false,
    usingApi: false,
    usingApiTouched: false,
    note: '',
    noteTouched: false,
    excludedModelsText: '',
    excludedModelsTouched: false,
    headersText: '',
    headersTouched: false,
    headersError: null,
  };
}

test('details sheet masks both previews, reveals locally, and copies original source', async () => {
  const host = document.createElement('div');
  document.body.append(host);
  const root = createRoot(host);
  const copied: string[] = [];
  const json = {
    email: 'alice@example.com',
    name: 'codex-abc-alice@example.com-team.json',
    metadata: { email: 'bob@example.net' },
    note: 'contact carol@example.org',
  };
  const original = JSON.stringify(json);
  const render = async (editor: PrefixProxyEditorState | null) => {
    await act(async () => {
      root.render(
        createElement(
          MemoryRouter,
          null,
          createElement(
            I18nextProvider,
            { i18n },
            createElement(NavigateButton),
            createElement(AuthFileDetailsSheet, {
              editor,
              updatedText: editor?.json ? original : '',
              dirty: false,
              disableControls: false,
              onClose: () => {},
              onCopyText: (text) => {
                copied.push(text);
              },
              onSave: () => {},
              onChange: () => {},
            })
          )
        )
      );
    });
  };
  await render(makeEditor(json));
  const visible = () =>
    document.body.textContent +
    Array.from(document.querySelectorAll('textarea'))
      .map((item) => item.value)
      .join(' ');
  expect(visible()).not.toContain('alice@example.com');
  expect(visible()).not.toContain('bob@example.net');
  expect(visible()).not.toContain('carol@example.org');
  expect(visible()).toContain('codex-abc-a***@e***.com-team.json');
  const reveal = Array.from(document.querySelectorAll('button')).find((button) =>
    button.textContent?.includes('Show email')
  );
  expect(reveal).toBeDefined();
  await act(async () => reveal!.click());
  expect(visible()).toContain('alice@example.com');
  expect(visible()).toContain('bob@example.net');
  const copy = Array.from(document.querySelectorAll('button')).find(
    (button) => button.textContent?.trim() === 'Copy'
  );
  await act(async () => copy!.click());
  expect(copied).toEqual([original]);
  const changeRoute = Array.from(document.querySelectorAll('button')).find(
    (button) => button.textContent === 'Change route'
  );
  await act(async () => changeRoute!.click());
  expect(visible()).not.toContain('alice@example.com');
  await render(null);
  await render(makeEditor(null));
  expect(visible()).not.toContain('alice@example.com');
  expect(visible()).toContain('bad content');
  const invalidReveal = Array.from(document.querySelectorAll('button')).find((button) =>
    button.textContent?.includes('Show email')
  );
  await act(async () => invalidReveal!.click());
  expect(visible()).toContain('bad content alice@example.com');
  await render(null);
  const ambiguous = makeEditor(null);
  ambiguous.fileInfoText = JSON.stringify({ name: ambiguous.fileName, type: 'codex' });
  ambiguous.invalidContentPreview = 'bad content';
  await render(ambiguous);
  expect(visible()).toContain('Hidden auth-file name');
  expect(visible()).not.toContain('alice@example.com');
  await act(async () => root.unmount());
  host.remove();
});
