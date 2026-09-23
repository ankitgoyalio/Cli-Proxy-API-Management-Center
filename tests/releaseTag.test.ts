import { describe, expect, test } from 'bun:test';
import { validateReleaseTag } from '../scripts/validateReleaseTag';

describe('release tag validation', () => {
  test.each(['v2026.09.23.1', 'v2026.09.23.2', 'v2028.02.29.10'])(
    'accepts UTC Calendar Versioning tag %s',
    (tag) => {
      expect(validateReleaseTag(tag)).toBeNull();
    }
  );

  test.each([
    '',
    '2026.09.23.1',
    'v2026.9.23.1',
    'v2026.09.23',
    'v2026.09.23.0',
    'v2026.09.23.01',
    'v2026.09.23.1-beta',
  ])('rejects malformed tag %s', (tag) => {
    expect(validateReleaseTag(tag)).toContain('vYYYY.MM.DD.N');
  });

  test.each(['v2026.02.29.1', 'v2026.04.31.1', 'v2026.13.01.1'])(
    'rejects invalid date %s',
    (tag) => {
      expect(validateReleaseTag(tag)).toMatch(/valid UTC calendar date|vYYYY\.MM\.DD\.N/);
    }
  );
});
