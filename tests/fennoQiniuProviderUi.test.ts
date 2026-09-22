import { describe, expect, test } from 'bun:test';
import { readFileSync } from 'node:fs';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { createInstance } from 'i18next';
import { I18nextProvider } from 'react-i18next';
import { ProviderCategoryList } from '../src/features/providers/components/ProviderCategoryList';
import { ProviderResourcePanel } from '../src/features/providers/components/ProviderResourcePanel';
import { FENNO_AI_CODEX_BASE_URL } from '../src/features/providers/fennoAI';
import { QINIU_CLOUD_BASE_URL_OPTIONS } from '../src/features/providers/qiniuCloud';
import type { ProviderBrand, ProviderGroup } from '../src/features/providers/types';
import { buildProviderGroups } from '../src/features/providers/useProviderWorkbench';
import en from '../src/i18n/locales/en.json';

const i18n = createInstance();
await i18n.init({ lng: 'en', resources: { en: { translation: en } } });

const noop = () => {};

const expectNoPromotion = (markup: string) => {
  expect(markup).not.toMatch(/register|sign up|affiliate|[?&]aff=/i);
  expect(markup).not.toContain('https://s.qiniu.com');
};

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

const configuredGroup = (brand: ProviderBrand) => {
  const qiniu = QINIU_CLOUD_BASE_URL_OPTIONS[0];
  const config =
    brand === 'fennoAI'
      ? {
          codexApiKeys: [
            { apiKey: 'synthetic-fenno-codex-key', baseUrl: FENNO_AI_CODEX_BASE_URL },
          ],
        }
      : {
          openaiCompatibility: [
            {
              name: 'qiniuCloud',
              baseUrl: qiniu.openaiBaseUrl,
              apiKeyEntries: [{ apiKey: 'synthetic-qiniu-openai-key' }],
            },
          ],
          geminiApiKeys: [
            { apiKey: 'synthetic-qiniu-gemini-key', baseUrl: qiniu.geminiBaseUrl },
          ],
        };

  return buildProviderGroups(config).find(({ id }) => id === brand)!;
};

describe('FennoAI and Qiniu provider UI', () => {
  test('lists both providers alongside ordinary integrations without a preferred category', () => {
    const groups = buildProviderGroups({});
    const markup = renderToStaticMarkup(
      createElement(
        I18nextProvider,
        { i18n },
        createElement(ProviderCategoryList, {
          groups,
          activeBrand: 'fennoAI',
          onSelect: noop,
        })
      )
    );

    expect(markup).toContain('FennoAI');
    expect(markup).toContain('Qiniu Cloud');
    expect(markup).not.toContain('Quick Fill');
    expect(markup.match(/<aside/g)).toHaveLength(1);
  });

  for (const brand of ['fennoAI', 'qiniuCloud'] as const) {
    test(`${brand} offers ordinary setup without registration promotion when unconfigured`, () => {
      const markup = renderPanel({ id: brand, resources: [] });

      expect(markup).toContain('No resources yet, click &quot;New&quot; to add.');
      expect(markup).toContain('<span>New</span>');
      expectNoPromotion(markup);
    });

    test(`${brand} keeps configured resources manageable without promotional navigation`, () => {
      const group = configuredGroup(brand);

      expect(group.resources).toHaveLength(1);
      const markup = renderPanel(group);
      expect(markup).toContain('aria-label="View"');
      expect(markup).toContain('aria-label="Edit"');
      expect(markup).toContain('aria-label="Delete"');
      expectNoPromotion(markup);
    });
  }

  test('contains no referral destinations or obsolete registration copy', () => {
    for (const file of [
      'src/features/providers/fennoAI.ts',
      'src/features/providers/qiniuCloud.ts',
      'src/features/providers/sponsorDefinitions.ts',
      'src/features/providers/components/ProviderResourcePanel.tsx',
    ]) {
      expect(readFileSync(file, 'utf8')).not.toMatch(/api\.fenno\.ai\/register|s\.qiniu\.com|affiliate/i);
    }

    for (const locale of ['en', 'zh-CN', 'zh-TW', 'ru']) {
      const catalog = JSON.parse(readFileSync(`src/i18n/locales/${locale}.json`, 'utf8')) as {
        providersPage: {
          categories: Record<string, string>;
          sponsor: Record<string, string>;
        };
      };
      expect(catalog.providersPage.categories).not.toHaveProperty('quickFill');
      expect(catalog.providersPage.sponsor).not.toHaveProperty('registerLink');
    }
  });
});
