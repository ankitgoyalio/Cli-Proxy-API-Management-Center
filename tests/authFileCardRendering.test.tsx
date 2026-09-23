import { expect, mock, test } from 'bun:test';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { createInstance } from 'i18next';
import { I18nextProvider } from 'react-i18next';
import type { AuthFileItem } from '../src/types';
import en from '../src/i18n/locales/en.json';

mock.module('../src/features/authFiles/components/AuthFileQuotaSection', () => ({
  AuthFileQuotaSection: () => null,
}));

const i18n = createInstance();
await i18n.init({
  lng: 'en',
  resources: { en: { translation: en } },
  interpolation: { escapeValue: false },
});
const { AuthFileCard } = await import('../src/features/authFiles/components/AuthFileCard');

function render(file: AuthFileItem, distinguisher?: string) {
  return renderToStaticMarkup(
    createElement(
      I18nextProvider,
      { i18n },
      createElement(AuthFileCard, {
        file,
        compact: true,
        selected: false,
        distinguisher,
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

test('rendered auth-file entry has no full address in text, titles, or control names', () => {
  const html = render({
    name: 'codex-abc-alice@example.com-team.json',
    email: 'alice@example.com',
    type: 'codex',
  });
  expect(html).not.toContain('alice@example.com');
  expect(html).toContain('a***@e***.com');
  expect(html).toContain('Show email');
  expect(html).toContain('aria-pressed="false"');
  expect(html).toContain('codex-abc-a***@e***.com-team.json');
});

test('colliding card controls include the safe distinguisher', () => {
  const html = render(
    { name: 'codex-alice@example.com.json', email: 'alice@example.com', type: 'codex' },
    'idx-one'
  );
  expect(html).toContain('Credential idx-one');
  expect(html).toContain('Select credential codex-a***@e***.com.json Credential idx-one');
  expect(html).not.toContain('alice@example.com');
});
