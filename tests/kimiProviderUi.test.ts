import { describe, expect, test } from 'bun:test';
import { readFileSync } from 'node:fs';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { createInstance } from 'i18next';
import { I18nextProvider } from 'react-i18next';
import { ProviderResourcePanel } from '../src/features/providers/components/ProviderResourcePanel';
import type { ProviderGroup } from '../src/features/providers/types';
import { KIMI_OPENAI_BASE_URL } from '../src/features/providers/kimi';
import { buildProviderGroups } from '../src/features/providers/useProviderWorkbench';
import en from '../src/i18n/locales/en.json';

const i18n = createInstance();
await i18n.init({ lng: 'en', resources: { en: { translation: en } } });

const noop = () => {};

const renderPanel = (group: ProviderGroup) =>
  renderToStaticMarkup(
    createElement(
      I18nextProvider,
      { i18n },
      createElement(ProviderResourcePanel, {
        group,
        filter: '',
        onFilterChange: noop,
        filteredResources: group.resources,
        selectedId: null,
        onView: noop,
        onEdit: noop,
        onDelete: noop,
        onCreate: noop,
      })
    )
  );

describe('Kimi provider UI', () => {
  test('offers ordinary setup without registration promotion when unconfigured', () => {
    const markup = renderPanel({ id: 'kimi', resources: [] });

    expect(markup).toContain('No resources yet, click &quot;New&quot; to add.');
    expect(markup).toContain('<span>New</span>');
    expect(markup).not.toMatch(/register|sign up|affiliate|aff=|first successful recharge/i);
    expect(markup).not.toContain('platform.kimi.');
  });

  test('keeps configured Kimi resources manageable without promotional navigation', () => {
    const group = buildProviderGroups({
      openaiCompatibility: [
        {
          name: 'kimi',
          baseUrl: KIMI_OPENAI_BASE_URL,
          apiKeyEntries: [{ apiKey: 'synthetic-kimi-key' }],
        },
      ],
    }).find(({ id }) => id === 'kimi')!;

    expect(group.resources).toHaveLength(1);
    const markup = renderPanel(group);
    expect(markup).toContain('aria-label="View"');
    expect(markup).toContain('aria-label="Edit"');
    expect(markup).toContain('aria-label="Delete"');
    expect(markup).not.toMatch(/register|sign up|affiliate|aff=/i);
    expect(markup).not.toContain('platform.kimi.');
  });

  test('contains no Kimi registration destinations or obsolete promotional copy', () => {
    const sourceFiles = [
      'src/features/providers/kimi.ts',
      'src/features/providers/components/ProviderResourcePanel.tsx',
      'src/pages/OAuthPage.tsx',
    ];

    for (const file of sourceFiles) {
      expect(readFileSync(file, 'utf8')).not.toMatch(/platform\.kimi\.|aff=cliproxyapi/i);
    }

    for (const locale of ['en', 'zh-CN', 'zh-TW', 'ru']) {
      const catalog = JSON.parse(readFileSync(`src/i18n/locales/${locale}.json`, 'utf8')) as {
        auth_login: Record<string, string>;
        providersPage: { sponsor: Record<string, string> };
      };
      expect(catalog.auth_login).not.toHaveProperty('kimi_sign_up_button');
      expect(catalog.providersPage.sponsor).not.toHaveProperty('registerNow');
      expect(catalog.providersPage.sponsor).not.toHaveProperty('kimiPromo');
    }
  });
});
