import { describe, expect, test } from 'bun:test';
import { readFileSync } from 'node:fs';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { createInstance } from 'i18next';
import { I18nextProvider } from 'react-i18next';
import { ProviderResourcePanel } from '../src/features/providers/components/ProviderResourcePanel';
import type { ProviderGroup } from '../src/features/providers/types';
import {
  APIKEY_FUN_OPENAI_BASE_URL,
  APIKEY_FUN_STANDARD_BASE_URL,
} from '../src/features/providers/sponsor';
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

describe('APIKEY.FUN provider UI', () => {
  test('offers ordinary provider setup without registration promotion when unconfigured', () => {
    const markup = renderPanel({ id: 'apikeyFun', resources: [] });

    expect(markup).toContain('No resources yet, click &quot;New&quot; to add.');
    expect(markup).toContain('<span>New</span>');
    expect(markup).not.toMatch(/register|affiliate|aff=/i);
    expect(markup).not.toContain('https://apikey.fan');
  });

  test('offers one neutral dashboard action and ordinary management actions when configured', () => {
    const group = buildProviderGroups({
      openaiCompatibility: [
        {
          name: 'apikeyFun',
          baseUrl: APIKEY_FUN_OPENAI_BASE_URL,
          apiKeyEntries: [{ apiKey: 'synthetic-openai-key' }],
        },
      ],
      codexApiKeys: [{ apiKey: 'synthetic-codex-key', baseUrl: APIKEY_FUN_OPENAI_BASE_URL }],
      claudeApiKeys: [{ apiKey: 'synthetic-claude-key', baseUrl: APIKEY_FUN_STANDARD_BASE_URL }],
    }).find(({ id }) => id === 'apikeyFun');

    expect(group?.resources).toHaveLength(1);
    const markup = renderPanel(group!);

    expect(markup.match(/href="https:\/\/apikey\.fan\/dashboard"/g)).toHaveLength(1);
    expect(markup).not.toMatch(/register|affiliate|aff=/i);
    expect(markup).toContain('OpenAI');
    expect(markup).toContain('Anthropic');
    expect(markup).toContain('Codex API (Responses)');
    expect(markup).toContain('aria-label="View"');
    expect(markup).toContain('aria-label="Edit"');
    expect(markup).toContain('aria-label="Delete"');
  });

  test('uses the ordinary provider route instead of a dedicated quick-start surface', () => {
    const routeSource = readFileSync('src/router/MainRoutes.tsx', 'utf8');
    const layoutSource = readFileSync('src/components/layout/MainLayout.tsx', 'utf8');
    const workbenchSource = readFileSync(
      'src/features/providers/ProvidersWorkbenchPage.tsx',
      'utf8'
    );

    expect(routeSource).not.toContain("'/quick-start'");
    expect(layoutSource).not.toContain("'/quick-start'");
    expect(layoutSource).not.toContain('quickStartNavItem');
    expect(workbenchSource).not.toContain("group.id !== 'apikeyFun'");
  });
});
