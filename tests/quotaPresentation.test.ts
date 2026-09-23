import { describe, expect, test } from 'bun:test';
import { presentQuotaFileName, presentQuotaName } from '../src/features/quota/presentation';
import { getQuotaCacheKey } from '../src/utils/quota/identity';

describe('quota presentation', () => {
  test('masks a filename while retaining its raw cache identity', () => {
    const file = {
      name: 'codex-alice@example.com.json',
      email: 'alice@example.com',
      type: 'codex',
    };
    expect(presentQuotaFileName(file, 'Hidden auth-file name')).toBe('codex-a***@e***.com.json');
    expect(presentQuotaName(file, false, 'Hidden auth-file name')).toBe('codex-a***@e***.com.json');
    expect(getQuotaCacheKey(file)).toBe('codex-alice@example.com.json');
  });

  test('hides unresolved email-bearing filenames and masks Devin Account labels', () => {
    const unresolved = { name: 'codex-alice@example.com.json', type: 'codex' };
    expect(presentQuotaFileName(unresolved, 'Hidden auth-file name')).toBe('Hidden auth-file name');

    const devin = { name: 'devin-profile.json', email: 'bob@example.com', type: 'devin' };
    expect(presentQuotaName(devin, false, 'Hidden auth-file name')).toBe(
      'devin-profile.json · b***@e***.com'
    );
    expect(presentQuotaName(devin, true, 'Hidden auth-file name')).toBe(
      'devin-profile.json · bob@example.com'
    );
  });
});
