import type { AudienceImpact, Claim, RawBrief, VerifiedBrief } from './schema';

/** Whitespace/case normalization for substring matching -- a real advisory pasted from
 * Discord/a webpage can have irregular whitespace (newlines, non-breaking spaces collapsed
 * by the browser) that would otherwise make an exact-match check reject a genuinely verbatim
 * quote. Case-insensitive for the same reason: a model restating "Mainnet" as "mainnet"
 * inside its own quote field shouldn't fail verification over capitalization alone. */
export function normalizeForMatch(s: string): string {
  return s.toLowerCase().replace(/\s+/g, ' ').trim();
}

/** A claim that failed verification is never silently dropped from the record -- it's
 * replaced with an explicit, visible "this was removed" marker so `whatHappened.length`
 * etc. don't just quietly shrink with no explanation in the rendered brief. */
function rejectedClaimPlaceholder(): Claim {
  return {
    text: 'A claim here could not be verified against the source advisory and was removed.',
    quote: null,
    unknown: true,
  };
}

/** What happened to one claim:
 *  - `verified`: it cites a quote, and that quote was found in the source.
 *  - `unknown`: the model marked it unknown and cites no quote, so there is nothing to check.
 *  - `rejected`: it cites a quote that was NOT found in the source, so it was removed.
 * `unknown` is counted separately and never as `verified`: a claim with no quote has not been
 * checked against anything. */
type ClaimStatus = 'verified' | 'unknown' | 'rejected';

interface CheckResult {
  claim: Claim;
  status: ClaimStatus;
}

interface Tally {
  total: number;
  verified: number;
  unknown: number;
  rejected: number;
}

function checkClaim(claim: Claim, normalizedSource: string): CheckResult {
  if (claim.unknown) {
    return { claim, status: 'unknown' };
  }
  const normalizedQuote = normalizeForMatch(claim.quote!);
  if (normalizedQuote.length > 0 && normalizedSource.includes(normalizedQuote)) {
    return { claim, status: 'verified' };
  }
  return { claim: rejectedClaimPlaceholder(), status: 'rejected' };
}

function checkAndCount(claim: Claim, normalizedSource: string, tally: Tally): Claim {
  const result = checkClaim(claim, normalizedSource);
  tally.total++;
  tally[result.status]++;
  return result.claim;
}

function checkClaims(claims: Claim[], normalizedSource: string, tally: Tally): Claim[] {
  return claims.map((c) => checkAndCount(c, normalizedSource, tally));
}

/**
 * The actual enforcement of Advisory Brief's core rule: this is CODE, not a model call,
 * deciding what survives into the brief a user sees. Every `Claim` with `unknown: false` must
 * carry a `quote` that is a real (normalized) substring of `sourceText`, or it's replaced with
 * a visible rejection placeholder. Every `urgency.deadlines` entry must likewise appear in the
 * source, or it's dropped from the list entirely (dates don't need a placeholder the way
 * claims do -- a missing date is just absent, not a broken sentence).
 *
 * This checks that quotes exist in the source. It does not check that a claim's wording is
 * supported by its quote, and claims marked unknown are counted separately because they carry
 * nothing to check.
 */
export function verifyBrief(raw: RawBrief, sourceText: string, sourceUrl: string | null, sourceLabel: string): VerifiedBrief {
  const normalizedSource = normalizeForMatch(sourceText);
  const tally: Tally = { total: 0, verified: 0, unknown: 0, rejected: 0 };

  const whatHappened = checkClaims(raw.whatHappened, normalizedSource, tally);

  const urgencyReason = checkAndCount(raw.urgency.reason, normalizedSource, tally);

  const affected: AudienceImpact[] = raw.affected.map((a) => ({
    ...a,
    explanation: checkAndCount(a.explanation, normalizedSource, tally),
  }));

  const whatToTellYourTeam = checkClaims(raw.whatToTellYourTeam, normalizedSource, tally);

  const rejectedDates: string[] = [];
  const deadlines = raw.urgency.deadlines.filter((d) => {
    if (normalizeForMatch(d).length > 0 && normalizedSource.includes(normalizeForMatch(d))) {
      return true;
    }
    rejectedDates.push(d);
    return false;
  });

  return {
    whatHappened,
    urgency: {
      level: raw.urgency.level,
      reason: urgencyReason,
      deadlines,
    },
    affected,
    whatToTellYourTeam,
    whatWeDontKnow: raw.whatWeDontKnow,
    verification: {
      totalClaims: tally.total,
      verifiedClaims: tally.verified,
      unknownClaims: tally.unknown,
      rejectedClaims: tally.rejected,
      rejectedDates,
    },
    sourceUrl,
    sourceLabel,
  };
}
