import { describe, expect, test } from 'bun:test';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { PluginTrustBadge } from '../src/features/plugins/components/PluginTrustBadge';
import { requiresThirdPartyPluginWarning } from '../src/features/plugins/pluginResources';
import i18n from '../src/i18n';
import en from '../src/i18n/locales/en.json';
import ru from '../src/i18n/locales/ru.json';
import zhCN from '../src/i18n/locales/zh-CN.json';
import zhTW from '../src/i18n/locales/zh-TW.json';
import type { PluginStoreEntry } from '../src/types';

const pluginEntry = (sourceId: string, repository: string) =>
  ({ sourceId, repository }) as PluginStoreEntry;

describe('plugin store trust', () => {
  test('keeps the warning bypass only for upstream-published plugins from the built-in source', () => {
    expect(
      requiresThirdPartyPluginWarning(pluginEntry('official', 'router-for-me/example-plugin'))
    ).toBe(false);
    expect(
      requiresThirdPartyPluginWarning(pluginEntry('third-party', 'router-for-me/example-plugin'))
    ).toBe(true);
    expect(
      requiresThirdPartyPluginWarning(pluginEntry('official', 'someone-else/example-plugin'))
    ).toBe(true);
    expect(
      requiresThirdPartyPluginWarning(
        pluginEntry('official', 'ankitgoyalio/Cli-Proxy-API-Management-Center')
      )
    ).toBe(true);
  });

  test('renders upstream provenance for trusted plugins in every locale', async () => {
    const expectedLabels = {
      'zh-CN': '上游发布',
      'zh-TW': '上游發布',
      en: 'Upstream-published',
      ru: 'Опубликован upstream-проектом',
    } as const;

    for (const [locale, expectedLabel] of Object.entries(expectedLabels)) {
      await i18n.changeLanguage(locale);
      const markup = renderToStaticMarkup(
        createElement(PluginTrustBadge, {
          entry: pluginEntry('official', 'router-for-me/example-plugin'),
        })
      );
      expect(markup).toContain(expectedLabel);
      expect(markup).not.toContain('Third-party');
    }
  });

  test('renders the third-party warning for an unrelated publisher', async () => {
    await i18n.changeLanguage('en');

    const markup = renderToStaticMarkup(
      createElement(PluginTrustBadge, {
        entry: pluginEntry('official', 'someone-else/example-plugin'),
      })
    );

    expect(markup).toContain('Third-party');
    expect(markup).not.toContain('Upstream-published');
  });

  test('explains upstream provenance and fork non-endorsement in every locale', () => {
    const catalogs = [zhCN, zhTW, en, ru];

    expect(catalogs.map((catalog) => catalog.plugin_store.security_banner_text)).toEqual([
      '插件会在代理服务内部执行代码，可读取你的凭据与流量。router-for-me 组织下的插件由上游兼容后端项目发布；本独立维护的分支既不发布也不认可这些插件。其他插件均为第三方插件——请仅安装你信任的插件。',
      '插件會在代理服務內部執行程式碼，可讀取你的憑證與流量。router-for-me 組織下的插件由上游相容後端專案發布；本獨立維護的分支既不發布也不認可這些插件。其他插件均為第三方插件——請僅安裝你信任的插件。',
      "Plugins execute code inside the proxy service and can read your credentials and traffic. Plugins under the upstream Compatible Backend project's router-for-me organization are upstream-published; this independently maintained fork neither publishes nor endorses them. All other plugins are third-party — only install plugins you trust.",
      'Плагины выполняют код внутри прокси-сервиса и могут читать ваши учётные данные и трафик. Плагины из организации router-for-me опубликованы upstream-проектом совместимого бэкенда; этот независимо поддерживаемый форк не публикует и не одобряет их. Все остальные плагины являются сторонними — устанавливайте только те, которым доверяете.',
    ]);

    for (const catalog of catalogs) {
      const sourceDescription =
        catalog.config_management.visual.sections.system.plugin_store_sources_desc;
      expect(sourceDescription).not.toMatch(/official|официальн|官方/i);
      expect(sourceDescription).toMatch(/upstream|上游/i);
    }
  });
});
