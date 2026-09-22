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

describe('promotion removal', () => {
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

  test('removes known APIMart and BestProxy promotional markers and assets', async () => {
    const paths = ['README.md', 'README_CN.md', 'src', 'assets'];
    const promotionMarkers = /apimart|bestproxy/i;

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
