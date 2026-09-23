import { describe, expect, test } from 'bun:test';
import {
  presentAuthFile,
  presentAuthFileName,
  maskAccountEmail,
  distinguishAuthFiles,
} from '../src/features/authFiles/presentation';

describe('auth-file account presentation', () => {
  test('keeps one recognition character and only the final domain suffix', () => {
    expect(maskAccountEmail('alice@example.com')).toBe('a***@e***.com');
    expect(maskAccountEmail('a@b.co')).toBe('a***@b***.co');
    expect(maskAccountEmail('alice@mail.example.co.uk')).toBe('a***@m***.uk');
    expect(maskAccountEmail('broken-address')).toBeNull();
  });

  test('masks an exact known address in the name and hides uncertain names', () => {
    expect(
      presentAuthFileName(
        'codex-abc-alice@example.com-team.json',
        'alice@example.com',
        false,
        'Hidden auth-file name'
      )
    ).toBe('codex-abc-a***@e***.com-team.json');
    expect(
      presentAuthFileName(
        'codex-abc-alice@example.com-team.json',
        '',
        false,
        'Hidden auth-file name'
      )
    ).toBe('Hidden auth-file name');
    expect(
      presentAuthFileName(
        'codex-abc-alice@example.com-other@x.test.json',
        'alice@example.com',
        false,
        'Hidden auth-file name'
      )
    ).toBe('Hidden auth-file name');
  });

  test('hides malformed email fields and allows deliberate reveal', () => {
    const file = { name: 'codex-alice@example.com.json', email: 'broken-address' };
    expect(presentAuthFile(file, false, 'Hidden email', 'Hidden auth-file name').primary).toBe(
      'Hidden email'
    );
    expect(presentAuthFile(file, true, 'Hidden email', 'Hidden auth-file name').primary).toBe(
      'broken-address'
    );
  });

  test('adds safe distinguishers only to colliding entries', () => {
    const files = [
      { name: 'one.json', email: 'alice@example.com', authIndex: 'idx-one' },
      { name: 'two.json', email: 'amy@example.com', authIndex: 'idx-two' },
      { name: 'three.json', email: 'bob@example.com' },
    ];
    const names = distinguishAuthFiles(files, 'Hidden email', 'Hidden auth-file name');
    expect(names.get('one.json')).toBe('idx-one');
    expect(names.get('two.json')).toBe('idx-two');
    expect(names.has('three.json')).toBe(false);
  });
});

test('all supported languages provide reveal and hidden-value copy', async () => {
  for (const locale of ['en', 'zh-CN', 'zh-TW', 'ru']) {
    const messages = (await import(`../src/i18n/locales/${locale}.json`)).default.auth_files;
    for (const key of [
      'show_email',
      'hide_email',
      'hidden_email',
      'hidden_auth_file_name',
      'credential_distinguisher',
    ]) {
      expect(messages[key]).toBeTruthy();
    }
  }
});
