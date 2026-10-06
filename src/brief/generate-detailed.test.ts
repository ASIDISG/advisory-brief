import { describe, expect, it } from 'vitest';
import { generateBrief, generateBriefDetailed } from './generate';
import { createAnthropicGenerator } from './providers/anthropic';
import { createGeminiGenerator } from './providers/gemini';
import type { RawJsonGenerator } from './providers/types';

const SOURCE = 'Stellar-core 29.0.0 lowers the maximum message size. Operators should plan an upgrade.';

function claim(quote: string) {
  return { text: 'A plain-language restatement.', quote, unknown: false };
}

const RAW_BRIEF = {
  whatHappened: [claim('lowers the maximum message size')],
  urgency: { level: 'MONITOR', reason: claim('Operators should plan an upgrade'), deadlines: [] },
  affected: (['wallet', 'anchor', 'fintech', 'exchange'] as const).map((audienceId) => ({
    audienceId,
    affected: 'UNCLEAR',
    explanation: { text: 'Not stated.', quote: null, unknown: true },
  })),
  whatToTellYourTeam: [claim('plan an upgrade'), claim('Stellar-core 29.0.0'), claim('maximum message size')],
  whatWeDontKnow: ['Whether the release is mandatory.'],
};

const fakeGenerator = (body: unknown): RawJsonGenerator => ({
  generate: async () => JSON.stringify(body),
});

const input = { sourceText: SOURCE, sourceUrl: null, sourceLabel: 'test' };

describe('generateBriefDetailed', () => {
  it('returns the raw model output alongside the verified brief', async () => {
    const result = await generateBriefDetailed(fakeGenerator(RAW_BRIEF), input);
    expect(result.raw.whatHappened[0]!.quote).toBe('lowers the maximum message size');
    expect(result.verified.verification.rejectedClaims).toBe(0);
  });

  it('shows a fabricated quote in raw and removes it from verified', async () => {
    const fabricated = { ...RAW_BRIEF, whatHappened: [claim('this sentence is not in the source')] };
    const result = await generateBriefDetailed(fakeGenerator(fabricated), input);
    expect(result.raw.whatHappened[0]!.quote).toBe('this sentence is not in the source');
    expect(result.verified.verification.rejectedClaims).toBe(1);
  });

  it('keeps generateBrief returning only the verified brief', async () => {
    const verified = await generateBrief(fakeGenerator(RAW_BRIEF), input);
    expect(verified.verification.totalClaims).toBeGreaterThan(0);
    expect('raw' in verified).toBe(false);
  });
});

describe('provider describe()', () => {
  it('reports the provider and the explicit model', () => {
    const gemini = createGeminiGenerator({ models: { generateContent: async () => ({ text: '{}' }) } }, 'some-model');
    expect(gemini.describe?.()).toEqual({ provider: 'gemini', model: 'some-model' });

    const anthropic = createAnthropicGenerator(
      { messages: { create: async () => ({ content: [] }) as never } },
      'another-model'
    );
    expect(anthropic.describe?.()).toEqual({ provider: 'anthropic', model: 'another-model' });
  });
});
