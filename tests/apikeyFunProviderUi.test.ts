import { describe, expect, test } from 'bun:test';
import { readFileSync } from 'node:fs';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { createInstance } from 'i18next';
import { I18nextProvider } from 'react-i18next';
import { ProviderResourcePanel } from '../src/features/providers/components/ProviderResourcePanel';
import { ProviderSheet } from '../src/features/providers/sheets/ProviderSheet';
import type { ProviderGroup } from '../src/features/providers/types';
import type { UseProviderWorkbenchResult } from '../src/features/providers/useProviderWorkbench';
import {
  APIKEY_FUN_DIRECT_BASE_URL,
  APIKEY_FUN_OPENAI_BASE_URL,
  APIKEY_FUN_STANDARD_BASE_URL,
  getApiKeyFunUsageEndpoints,
  normalizeApiKeyFunUsagePayload,
} from '../src/features/providers/sponsor';
import { buildProviderGroups } from '../src/features/providers/useProviderWorkbench';
import en from '../src/i18n/locales/en.json';

const i18n = createInstance();
await i18n.init({ lng: 'en', resources: { en: { translation: en } } });

const noop = () => {};
const asyncNoop = async () => {};

const render = (element: ReturnType<typeof createElement>) =>
  renderToStaticMarkup(createElement(I18nextProvider, { i18n }, element));

const renderPanel = (group: ProviderGroup) =>
  render(
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
  );

const configuredApiKeyFunGroup = () =>
  buildProviderGroups({
    openaiCompatibility: [
      {
        name: 'apikeyFun',
        baseUrl: APIKEY_FUN_OPENAI_BASE_URL,
        apiKeyEntries: [{ apiKey: 'synthetic-openai-key' }],
      },
    ],
    codexApiKeys: [{ apiKey: 'synthetic-codex-key', baseUrl: APIKEY_FUN_OPENAI_BASE_URL }],
    claudeApiKeys: [{ apiKey: 'synthetic-claude-key', baseUrl: APIKEY_FUN_STANDARD_BASE_URL }],
  }).find(({ id }) => id === 'apikeyFun')!;

describe('APIKEY.FUN provider UI', () => {
  test('offers ordinary provider setup without registration promotion when unconfigured', () => {
    const markup = renderPanel({ id: 'apikeyFun', resources: [] });

    expect(markup).toContain('No resources yet, click &quot;New&quot; to add.');
    expect(markup).toContain('<span>New</span>');
    expect(markup).not.toMatch(/register|affiliate|aff=/i);
    expect(markup).not.toContain('https://apikey.fan');
  });

  test('offers one neutral dashboard action and ordinary management actions when configured', () => {
    const group = configuredApiKeyFunGroup();

    expect(group.resources).toHaveLength(1);
    const markup = renderPanel(group);

    expect(markup.match(/href="https:\/\/apikey\.fan\/dashboard"/g)).toHaveLength(1);
    expect(markup).not.toMatch(/register|affiliate|aff=/i);
    expect(markup).toContain('OpenAI');
    expect(markup).toContain('Anthropic');
    expect(markup).toContain('Codex API (Responses)');
    expect(markup).toContain('aria-label="View"');
    expect(markup).toContain('aria-label="Edit"');
    expect(markup).toContain('aria-label="Delete"');
  });

  test('keeps usage lookup reachable through the ordinary provider sheet', () => {
    const group = configuredApiKeyFunGroup();
    const workbench: UseProviderWorkbenchResult = {
      connected: true,
      isPending: false,
      isFetching: false,
      isError: false,
      errorMessage: null,
      snapshot: { fetchedAt: '2026-09-22T00:00:00.000Z', groups: [group] },
      refetch: asyncNoop,
      createProvider: asyncNoop,
      updateProvider: asyncNoop,
      deleteProvider: asyncNoop,
      toggleDisabled: asyncNoop,
      mutating: false,
      refreshSnapshot: noop,
    };
    const markup = render(
      createElement(ProviderSheet, {
        state: { open: true, brand: 'apikeyFun', mode: 'create', resource: null },
        onClose: noop,
        onSwitchToEdit: noop,
        workbench,
        onCreated: noop,
        onUpdated: noop,
      })
    );

    expect(markup).toContain('ai-providers');
    expect(markup).not.toContain('quick-start');
    expect(markup).toContain('<span>Check usage</span>');
    expect(markup).toContain('Grouped keys');
    expect(markup).toContain('form="');
    expect(markup).toContain('Create');
  });

  test('preserves direct and fallback usage lookup semantics', () => {
    expect(getApiKeyFunUsageEndpoints(APIKEY_FUN_DIRECT_BASE_URL)).toEqual([
      'https://slb.apikey.fan/v1/usage',
      'https://api.apikey.fan/v1/usage',
    ]);
    expect(
      normalizeApiKeyFunUsagePayload({
        is_active: true,
        quota: { remaining: 12, used: 8, limit: 20, unit: 'USD' },
      })
    ).toEqual({
      isValid: true,
      remaining: 12,
      used: 8,
      limit: 20,
      unit: 'USD',
    });
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
