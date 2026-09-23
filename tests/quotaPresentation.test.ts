import { describe, expect, test } from 'bun:test';
import {
  canRevealQuotaName,
  presentQuotaFileName,
  presentQuotaName,
} from '../src/features/quota/presentation';
import { getQuotaCacheKey } from '../src/utils/quota/identity';

describe('quota presentation', () => {
  test('masks a filename while retaining its raw cache identity', () => {
    const file = {
      name: 'codex-alice@example.com.json',
      email: 'alice@example.com',
      type: 'codex',
    };
    expect(presentQuotaFileName(file, 'Hidden auth-file name')).toBe('codex-a***@e***.com.json');
    expect(presentQuotaName(file, false, 'Hidden auth-file name', 'Hidden email')).toBe(
      'codex-a***@e***.com.json'
    );
    expect(getQuotaCacheKey(file)).toBe('codex-alice@example.com.json');
  });

  test('hides unresolved email-bearing filenames and masks Devin Account labels', () => {
    const unresolved = { name: 'codex-alice@example.com.json', type: 'codex' };
    expect(presentQuotaFileName(unresolved, 'Hidden auth-file name')).toBe('Hidden auth-file name');

    const devin = { name: 'devin-profile.json', email: 'bob@example.com', type: 'devin' };
    expect(presentQuotaName(devin, false, 'Hidden auth-file name', 'Hidden email')).toBe(
      'devin-profile.json · b***@e***.com'
    );
    expect(presentQuotaName(devin, true, 'Hidden auth-file name', 'Hidden email')).toBe(
      'devin-profile.json · bob@example.com'
    );
  });

  test('hides a malformed Devin email and permits deliberate reveal', () => {
    const devin = { name: 'devin-profile.json', email: 'broken-address', type: 'devin' };
    expect(presentQuotaName(devin, false, 'Hidden auth-file name', 'Hidden email')).toBe(
      'devin-profile.json · Hidden email'
    );
    expect(canRevealQuotaName(devin)).toBe(true);
    expect(presentQuotaName(devin, true, 'Hidden auth-file name', 'Hidden email')).toBe(
      'devin-profile.json · broken-address'
    );
  });

  test('hides both filename and account when a malformed email appears inside the name', () => {
    const file = { name: 'codex-user@invalid.json', email: 'user@invalid', type: 'codex' };
    expect(presentQuotaName(file, false, 'Hidden auth-file name', 'Hidden email')).toBe(
      'Hidden auth-file name · Hidden email'
    );
    expect(canRevealQuotaName(file)).toBe(true);
  });

  test('shows a masked account cue when the quota filename contains no email', () => {
    const file = { name: 'codex-profile.json', email: 'alice@example.com', type: 'codex' };
    expect(presentQuotaName(file, false, 'Hidden auth-file name', 'Hidden email')).toBe(
      'codex-profile.json · a***@e***.com'
    );
    expect(canRevealQuotaName(file)).toBe(true);
    expect(presentQuotaName(file, true, 'Hidden auth-file name', 'Hidden email')).toBe(
      'codex-profile.json · alice@example.com'
    );
  });
});
