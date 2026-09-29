import { describe, expect, it, vi } from 'vitest';
import { generateBrief } from './generate';
import type { RawJsonGenerator } from './providers/types';
import type { RawBrief } from './schema';

const FIXTURE_1_SOURCE =
  "A new security-focused Protocol 29 release is out, with the Testnet vote scheduled for " +
  "September 29th 1700 UTC and Mainnet on October 1st 1700 UTC. Stellar-core 29.0.0-3589.4eb833373 " +
  "fixes recently identified vulnerabilities, which to the best of our knowledge have not been " +
  "exploited. It's available from the apt stable repo or Docker Hub " +
  "(https://hub.docker.com/r/stellar/stellar-core/tags). Horizon and RPC operators should pull " +
  "stellar-horizon:29.0.0 (https://hub.docker.com/r/stellar/stellar-horizon/tags) or " +
  "stellar-rpc:29.0.0 (https://hub.docker.com/r/stellar/stellar-rpc/tags), which bundle the new " +
  "core binary with no other relevant changes.";

/** A well-formed mocked model response matching Fixture #1's expected behavior from the spec:
 * ACT_BEFORE_DEADLINE with the Oct 1 deadline, "not exploited" stated as such, "what we don't
 * know" noting the vulnerabilities aren't described, and providers-only users told to ask
 * their provider. No network call happens in this test -- `generateBrief` is provider-
 * agnostic (see `src/brief/providers/`), so it's exercised here through a plain fake
 * `RawJsonGenerator`, independent of which real provider (Anthropic, Gemini) a deployment
 * actually uses. */
function mockedRawBriefResponse(): RawBrief {
  return {
    whatHappened: [
      {
        text: 'A new security-focused Protocol 29 release fixes recently identified vulnerabilities.',
        quote: 'A new security-focused Protocol 29 release is out',
        unknown: false,
      },
    ],
    urgency: {
      level: 'ACT_BEFORE_DEADLINE',
      reason: {
        text: 'The vulnerabilities are stated as not exploited so far, but Mainnet adopts the fix on a fixed date.',
        quote: 'to the best of our knowledge have not been exploited',
        unknown: false,
      },
      deadlines: ['October 1st 1700 UTC'],
    },
    affected: [
      {
        audienceId: 'wallet',
        affected: 'UNCLEAR',
        explanation: { text: 'Wallets should ask their node/RPC provider whether they have upgraded.', quote: null, unknown: true },
      },
      {
        audienceId: 'anchor',
        affected: 'UNCLEAR',
        explanation: { text: 'Anchors should ask their node/RPC provider whether they have upgraded.', quote: null, unknown: true },
      },
      {
        audienceId: 'fintech',
        affected: 'UNCLEAR',
        explanation: { text: 'Fintechs relying on a third-party provider should ask that provider.', quote: null, unknown: true },
      },
      {
        audienceId: 'exchange',
        affected: 'YES',
        explanation: {
          text: 'Operators running their own stellar-core, Horizon, or RPC nodes are directly affected.',
          quote: 'Horizon and RPC operators should pull',
          unknown: false,
        },
      },
    ],
    whatToTellYourTeam: [
      { text: 'A security release is out; Mainnet adopts it Oct 1 1700 UTC.', quote: 'Mainnet on October 1st 1700 UTC', unknown: false },
      { text: 'The known vulnerabilities have not been exploited so far.', quote: 'have not been exploited', unknown: false },
      { text: 'If we rely on a provider for nodes, ask them if they have upgraded.', quote: null, unknown: true },
    ],
    whatWeDontKnow: ['The advisory does not describe what the vulnerabilities actually are.'],
  };
}

function fakeGenerator(rawText: string): RawJsonGenerator {
  return { generate: vi.fn().mockResolvedValue(rawText) };
}

describe('generateBrief (mocked provider, no network)', () => {
  it('produces a verified brief matching Fixture #1s expected behavior', async () => {
    const generator = fakeGenerator(JSON.stringify(mockedRawBriefResponse()));
    const result = await generateBrief(generator, {
      sourceText: FIXTURE_1_SOURCE,
      sourceUrl: 'https://discord.com/channels/897514728459468821/900374272751591424/1554246285765382295',
      sourceLabel: 'Stellar Discord announcement, Sept 24, 2026',
    });

    expect(result.urgency.level).toBe('ACT_BEFORE_DEADLINE');
    expect(result.urgency.deadlines).toContain('October 1st 1700 UTC');
    expect(result.whatWeDontKnow.join(' ')).toMatch(/does not describe/);
    expect(result.verification.rejectedClaims).toBe(0);
    expect(generator.generate).toHaveBeenCalledTimes(1);
  });

  it('passes the RawBrief JSON Schema to the generator', async () => {
    const generator = fakeGenerator(JSON.stringify(mockedRawBriefResponse()));
    await generateBrief(generator, { sourceText: FIXTURE_1_SOURCE, sourceUrl: null, sourceLabel: 'test' });
    const [, schema] = vi.mocked(generator.generate).mock.calls[0];
    expect(schema).toHaveProperty('type', 'object');
    expect(schema).toHaveProperty('properties.whatHappened');
  });

  it('strips a claim whose quote is fabricated, even though the model shape is valid', async () => {
    const rawBrief = mockedRawBriefResponse();
    rawBrief.whatHappened = [
      { text: 'This never happened.', quote: 'text that is not anywhere in the real source', unknown: false },
    ];
    const generator = fakeGenerator(JSON.stringify(rawBrief));
    const result = await generateBrief(generator, { sourceText: FIXTURE_1_SOURCE, sourceUrl: null, sourceLabel: 'test' });

    expect(result.whatHappened[0].unknown).toBe(true);
    expect(result.verification.rejectedClaims).toBe(1);
  });

  it('throws when the model response is not valid JSON', async () => {
    const generator = fakeGenerator('not json at all');
    await expect(
      generateBrief(generator, { sourceText: FIXTURE_1_SOURCE, sourceUrl: null, sourceLabel: 'test' })
    ).rejects.toThrow();
  });

  it('throws when the model response is not valid per RawBriefSchema', async () => {
    const generator = fakeGenerator(JSON.stringify({ nonsense: true }));
    await expect(
      generateBrief(generator, { sourceText: FIXTURE_1_SOURCE, sourceUrl: null, sourceLabel: 'test' })
    ).rejects.toThrow();
  });
});
