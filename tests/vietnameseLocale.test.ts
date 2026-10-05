import { expect, test } from 'bun:test';
import en from '@/i18n/locales/en.json';
import vi from '@/i18n/locales/vi.json';
import { LANGUAGE_LABEL_KEYS, SUPPORTED_LANGUAGES } from '@/utils/constants';
import { getInitialLanguage, isSupportedLanguage } from '@/utils/language';

const flatten = (catalog: Record<string, unknown>, prefix = ''): Record<string, string> =>
  Object.fromEntries(
    Object.entries(catalog).flatMap(([key, value]) =>
      typeof value === 'string'
        ? [[`${prefix}${key}`, value]]
        : Object.entries(flatten(value as Record<string, unknown>, `${prefix}${key}.`))
    )
  );

test('Vietnamese covers fork translations and preserves interpolation parameters', () => {
  const source = flatten(en);
  const translated = flatten(vi);
  expect(Object.keys(translated).sort()).toEqual(Object.keys(source).sort());
  for (const [key, value] of Object.entries(source)) {
    expect(translated[key].trim().length).toBeGreaterThan(0);
    expect([...translated[key].matchAll(/{{\s*([^}]+)\s*}}/g)].map((m) => m[1]).sort()).toEqual(
      [...value.matchAll(/{{\s*([^}]+)\s*}}/g)].map((m) => m[1]).sort()
    );
  }
  expect(vi.system_info.independence_statement).toContain('không liên kết');
  expect(vi.plugin_store.badge_upstream_published).toBe('Do upstream phát hành');
  expect(vi.plugin_store.security_banner_text).toContain('không phát hành hay chứng thực');
});

test('Vietnamese is selectable and detected from a Vietnamese browser locale', () => {
  expect(isSupportedLanguage('vi')).toBe(true);
  expect(SUPPORTED_LANGUAGES).toContain('vi');
  expect(LANGUAGE_LABEL_KEYS.vi).toBe('language.vietnamese');
  const names = ['window', 'navigator'] as const;
  const descriptors = names.map(
    (name) => [name, Object.getOwnPropertyDescriptor(globalThis, name)] as const
  );
  try {
    Object.defineProperty(globalThis, 'window', { configurable: true, value: undefined });
    Object.defineProperty(globalThis, 'navigator', {
      configurable: true,
      value: { languages: ['vi-VN'], language: 'vi-VN' },
    });
    expect(getInitialLanguage()).toBe('vi');
  } finally {
    for (const [name, descriptor] of descriptors) {
      if (descriptor) Object.defineProperty(globalThis, name, descriptor);
      else Reflect.deleteProperty(globalThis, name);
    }
  }
});
