import { describe, expect, spyOn, test } from 'bun:test';
import { readFileSync } from 'node:fs';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { MemoryRouter } from 'react-router-dom';
import { createInstance } from 'i18next';
import { I18nextProvider } from 'react-i18next';
import { apiClient } from '@/services/api/client';
import { oauthApi } from '@/services/api/oauth';
import { createOAuthAttempts } from '@/pages/oauthAttempts';
import { OAuthPage } from '@/pages/OAuthPage';
import en from '@/i18n/locales/en.json';

const i18n = createInstance();
await i18n.init({ lng: 'en', resources: { en: { translation: en } } });

describe('Kimi regional login', () => {
  test('uses separate management endpoints and preserves cancellation', async () => {
    const get = spyOn(apiClient, 'get').mockResolvedValue({ url: 'https://example.test' });
    const controller = new AbortController();
    try {
      await oauthApi.startAuth('kimi', controller.signal);
      expect(get).toHaveBeenLastCalledWith('/kimi-auth-url', {
        params: undefined,
        signal: controller.signal,
      });
      await oauthApi.startAuth('kimi-ai', controller.signal);
      expect(get).toHaveBeenLastCalledWith('/kimi-ai-auth-url', {
        params: undefined,
        signal: controller.signal,
      });
    } finally {
      get.mockRestore();
    }
  });

  test('keeps regional login attempts independent', () => {
    const attempts = createOAuthAttempts({ setTimeout: () => 0, clearTimeout: () => {} });
    try {
      const china = attempts.begin('kimi');
      const international = attempts.begin('kimi-ai');
      attempts.begin('kimi-ai');
      expect(china.signal.aborted).toBe(false);
      expect(international.signal.aborted).toBe(true);
    } finally {
      attempts.invalidateAll();
    }
  });

  test('offers both regional login cards without registration promotion', () => {
    const markup = renderToStaticMarkup(
      createElement(
        I18nextProvider,
        { i18n },
        createElement(MemoryRouter, null, createElement(OAuthPage))
      )
    );

    expect(markup).toContain('Kimi China (kimi.com)');
    expect(markup).toContain('Log in to Kimi China');
    expect(markup).toContain('Kimi International (kimi.ai)');
    expect(markup).toContain('Log in to Kimi International');
    expect(markup).not.toMatch(/register|sign up|affiliate|aff=/i);
    expect(markup).not.toContain('platform.kimi.');
  });

  for (const locale of ['en', 'zh-CN', 'zh-TW', 'ru']) {
    test(`provides complete regional login translations (${locale})`, () => {
      const { auth_login: messages } = JSON.parse(
        readFileSync(`src/i18n/locales/${locale}.json`, 'utf8')
      ) as { auth_login: Record<string, string> };
      for (const key of Object.keys(messages).filter((key) => key.startsWith('kimi_'))) {
        if (key.startsWith('kimi_ai_')) continue;
        expect(messages[key.replace('kimi_', 'kimi_ai_')]).toBeTruthy();
      }
      expect(messages.kimi_oauth_title).toContain('kimi.com');
      expect(messages.kimi_ai_oauth_title).toContain('kimi.ai');
    });
  }
});
