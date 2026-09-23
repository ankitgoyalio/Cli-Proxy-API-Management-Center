import { describe, expect, test } from 'bun:test';
import { existsSync, mkdtempSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { build } from 'vite';
import { ProxyUrlField } from '@/features/config/components/fields/sharedFields';
import { forkPolicy } from '@/policies/forkPolicy';
import { DEFAULT_VISUAL_VALUES } from '@/types/visualConfig';

const localeFiles = ['en', 'ru', 'zh-CN', 'zh-TW'] as const;

const hasTranslation = (catalog: Record<string, unknown>, key: string): boolean => {
  const segments = key.split('.');
  const leaf = segments.pop();
  if (!leaf) return false;

  const parent = segments.reduce<unknown>(
    (value, segment) =>
      value && typeof value === 'object' ? (value as Record<string, unknown>)[segment] : undefined,
    catalog
  );
  if (!parent || typeof parent !== 'object') return false;

  const entries = parent as Record<string, unknown>;
  return (
    typeof entries[leaf] === 'string' ||
    Object.entries(entries).some(
      ([candidate, value]) => candidate.startsWith(`${leaf}_`) && typeof value === 'string'
    )
  );
};

describe('promotion removal', () => {
  test('documents the fork independence statement in both READMEs', () => {
    expect(readFileSync('README.md', 'utf8')).toContain(
      'This independently maintained fork is not affiliated with, endorsed by, or sponsored by Router-For.ME or any provider listed in the application.'
    );
    expect(readFileSync('README_CN.md', 'utf8')).toContain(
      '此分支由独立维护，与 Router-For.ME 或应用中列出的任何提供商均无关联，也未获得其认可或赞助。'
    );
    expect(readFileSync('docs/decommercialization-audit.md', 'utf8')).toContain(
      '# De-commercialization audit'
    );
  });

  test('defines every statically referenced translation in each locale', () => {
    const translationKeys = new Set<string>();
    const translationPattern =
      /(?:\bt|i18n\.t)\(\s*['"]([^'"]+)['"]|i18nKey=['"]([^'"]+)['"]|\b[A-Za-z][A-Za-z0-9]*Key\s*:\s*['"]([^'"]+\.[^'"]+)['"]/g;

    for (const file of new Bun.Glob('src/**/*.{ts,tsx}').scanSync({ onlyFiles: true })) {
      const source = readFileSync(file, 'utf8');
      for (const match of source.matchAll(translationPattern)) {
        translationKeys.add(match[1] ?? match[2] ?? match[3]);
      }
    }

    for (const locale of localeFiles) {
      const catalog = JSON.parse(readFileSync(`src/i18n/locales/${locale}.json`, 'utf8')) as Record<
        string,
        unknown
      >;
      const missing = [...translationKeys].filter((key) => !hasTranslation(catalog, key));
      expect(missing).toEqual([]);
    }
  });

  test('keeps the proxy URL control without rendering an advertisement', () => {
    const markup = renderToStaticMarkup(
      createElement(ProxyUrlField, {
        values: {
          ...DEFAULT_VISUAL_VALUES,
          proxyUrl: 'socks5://proxy.example.test:1080/',
        },
        disabled: false,
        onChange: () => {},
      })
    );

    const labelTarget = markup.match(/<label for="([^"]+)">[^<]+<\/label>/)?.[1];
    expect(labelTarget).toBeTruthy();
    expect(markup).toContain(`<input id="${labelTarget}"`);
    expect(markup).toContain('value="socks5://proxy.example.test:1080/"');
    expect(markup).toContain('placeholder="socks5://user:pass@127.0.0.1:1080/"');
    expect(markup).not.toContain(' disabled=""');
    expect(markup).not.toContain('BestProxy');
    expect(markup).not.toContain('No suitable proxy?');
    expect(markup).not.toContain('rel="noopener noreferrer sponsored"');
  });

  test('removes known promotional markers and assets from source and production output', async () => {
    const paths = ['README.md', 'README_CN.md', 'src', 'assets'];
    const promotionMarkers =
      /apimart|bestproxy|apikey\.fan\/register|[?&](?:aff|ref|referral|utm_[a-z_]+)=|platform\.kimi\.(?:com|ai)|api\.fenno\.ai\/register|s\.qiniu\.com\/miI73q|first successful recharge|register now|register here/i;

    expect(forkPolicy.mayRenderPromotionalRegistration).toBe(false);
    for (const path of paths) {
      const glob = new Bun.Glob(`${path}/**/*`);
      const files = path.includes('.') ? [path] : [...glob.scanSync({ onlyFiles: true })];
      for (const file of files) {
        expect(file).not.toMatch(promotionMarkers);
        expect(readFileSync(file, 'utf8')).not.toMatch(promotionMarkers);
      }
    }

    expect(existsSync('assets/apimart-en.png')).toBe(false);
    expect(existsSync('assets/apimart-zh.png')).toBe(false);
    expect(existsSync('src/assets/icons/bestproxy.png')).toBe(false);

    const outDir = mkdtempSync(join(tmpdir(), 'management-center-promotion-check-'));
    try {
      await build({ logLevel: 'silent', build: { outDir, emptyOutDir: true } });
      expect(readFileSync(join(outDir, 'index.html'), 'utf8')).not.toMatch(promotionMarkers);
    } finally {
      rmSync(outDir, { recursive: true, force: true });
    }
  });
});
