import { describe, expect, test } from 'bun:test';
import en from '../src/i18n/locales/en.json';
import ru from '../src/i18n/locales/ru.json';
import zhCN from '../src/i18n/locales/zh-CN.json';
import zhTW from '../src/i18n/locales/zh-TW.json';
import { forkPolicy } from '../src/policies/forkPolicy';

describe('fork policy', () => {
  test('keeps every Management Center destination owned by this fork', () => {
    expect(forkPolicy.managementCenter).toEqual({
      source: 'https://github.com/ankitgoyalio/Cli-Proxy-API-Management-Center',
      issues: 'https://github.com/ankitgoyalio/Cli-Proxy-API-Management-Center/issues',
      releases: 'https://github.com/ankitgoyalio/Cli-Proxy-API-Management-Center/releases',
      updateArtifact:
        'https://github.com/ankitgoyalio/Cli-Proxy-API-Management-Center/releases/latest/download/management.html',
    });
  });

  test('identifies Compatible Backend destinations as upstream resources', () => {
    expect(forkPolicy.compatibleBackend).toEqual({
      source: 'https://github.com/router-for-me/CLIProxyAPI',
      help: 'https://help.router-for.me/',
    });
  });

  test('does not permit promotional registration actions', () => {
    expect(forkPolicy.mayRenderPromotionalRegistration).toBe(false);
  });

  test('owns the neutral dashboard destination for configured APIKEY.FUN integrations', () => {
    expect(forkPolicy.providerIntegrations.apikeyFun).toEqual({
      dashboard: 'https://apikey.fan/dashboard',
    });
    expect(forkPolicy.providerIntegrations.apikeyFun.dashboard).not.toMatch(/[?&](aff|ref)=/i);
  });

  test('localizes the independence statement in every supported language', () => {
    const statements = [zhCN, zhTW, en, ru].map(
      (catalog) => catalog.system_info.independence_statement
    );

    expect(statements).toEqual([
      '此分支由独立维护，与 Router-For.ME 或应用中列出的任何提供商均无关联，也未获得其认可或赞助。',
      '此分支由獨立維護，與 Router-For.ME 或應用程式中列出的任何供應商均無關聯，也未獲得其認可或贊助。',
      'This independently maintained fork is not affiliated with, endorsed by, or sponsored by Router-For.ME or any provider listed in the application.',
      'Этот независимо поддерживаемый форк не связан с Router-For.ME или каким-либо поставщиком, указанным в приложении, не одобрен и не спонсируется ими.',
    ]);
  });
});
