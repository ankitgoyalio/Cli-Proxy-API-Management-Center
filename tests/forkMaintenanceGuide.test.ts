import { describe, expect, test } from 'bun:test';
import { readFileSync } from 'node:fs';

const guidePath = new URL('../docs/fork-maintenance.md', import.meta.url);
const agentGuidePath = new URL('../AGENTS.md', import.meta.url);

describe('fork maintenance guide', () => {
  test('documents the durable independence and synchronization policy', () => {
    const guide = readFileSync(guidePath, 'utf8');
    const normalizedGuide = guide.replace(/\s+/g, ' ');

    for (const term of [
      'Management Center',
      'Compatible Backend',
      'Provider Integration',
      'Promotion',
      'Upstream-Published Plugin',
    ]) {
      expect(guide).toContain(`**${term}**`);
    }

    expect(normalizedGuide).toMatch(/sponsor placement/i);
    expect(normalizedGuide).toMatch(/affiliate tracking/i);
    expect(normalizedGuide).toMatch(/signup solicitation/i);
    expect(normalizedGuide).toMatch(/preferential commercial treatment/i);
    expect(normalizedGuide).toMatch(/does not change (?:the )?trust/i);
    expect(normalizedGuide).toMatch(/does not imply endorsement/i);
    expect(normalizedGuide).toMatch(/`origin`.*ankitgoyalio\/Cli-Proxy-API-Management-Center/i);
    expect(normalizedGuide).toMatch(/`upstream`.*router-for-me\/Cli-Proxy-API-Management-Center/i);
    expect(normalizedGuide).toMatch(/fetch-only/i);
    expect(normalizedGuide).toMatch(/tags? (?:are )?disabled/i);
    expect(normalizedGuide).toMatch(/short-lived/i);
    expect(normalizedGuide).toMatch(/pull request.*fork(?:'s)? `main`/i);
    expect(normalizedGuide).toMatch(/upstream tags.*not.*automatically/i);
    expect(normalizedGuide).toMatch(/MIT attribution/i);
    expect(normalizedGuide).toMatch(/Git history/i);
    expect(normalizedGuide).toMatch(/GitHub fork relationship/i);
  });

  test('is linked from shared agent guidance', () => {
    const agentGuide = readFileSync(agentGuidePath, 'utf8');

    expect(agentGuide).toContain('[`docs/fork-maintenance.md`](docs/fork-maintenance.md)');
  });
});
