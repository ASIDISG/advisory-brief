import { describe, expect, it } from 'vitest';
import { toMarkdown, toSlackMessage } from './format';
import type { VerifiedBrief } from './schema';

function sampleBrief(): VerifiedBrief {
  return {
    whatHappened: [{ text: 'A release shipped.', quote: 'x', unknown: false }],
    urgency: {
      level: 'ACT_BEFORE_DEADLINE',
      reason: { text: 'Deadline approaching.', quote: 'x', unknown: false },
      deadlines: ['October 1st 1700 UTC'],
    },
    affected: [
      { audienceId: 'wallet', affected: 'YES', explanation: { text: 'Wallets are affected.', quote: 'x', unknown: false } },
      { audienceId: 'anchor', affected: 'UNCLEAR', explanation: { text: 'Not stated.', quote: null, unknown: true } },
      { audienceId: 'fintech', affected: 'NO', explanation: { text: 'Not affected.', quote: 'x', unknown: false } },
      { audienceId: 'exchange', affected: 'YES', explanation: { text: 'Exchanges are affected.', quote: 'x', unknown: false } },
    ],
    whatToTellYourTeam: [{ text: 'Upgrade before Oct 1.', quote: 'x', unknown: false }],
    whatWeDontKnow: ['The exact vulnerability is not described.'],
    verification: { totalClaims: 5, verifiedClaims: 4, rejectedClaims: 1, rejectedDates: [] },
    sourceUrl: 'https://example.com/advisory',
    sourceLabel: 'Example advisory',
  };
}

describe('toMarkdown', () => {
  it('includes every section and marks unknown claims explicitly', () => {
    const md = toMarkdown(sampleBrief());
    expect(md).toContain('## What happened');
    expect(md).toContain('## Urgency: ACT_BEFORE_DEADLINE');
    expect(md).toContain('## Are you affected?');
    expect(md).toContain('Wallet');
    expect(md).toContain('(unclear from the source)');
    expect(md).toContain('4/5 claims verified');
    expect(md).toContain('[Example advisory](https://example.com/advisory)');
  });
});

describe('toSlackMessage', () => {
  it('has no markdown headings and includes the key lines', () => {
    const msg = toSlackMessage(sampleBrief());
    expect(msg).not.toContain('##');
    expect(msg).toContain('*Urgency: ACT_BEFORE_DEADLINE*');
    expect(msg).toContain('Upgrade before Oct 1.');
    expect(msg).toContain('Deadline(s): October 1st 1700 UTC');
  });
});
