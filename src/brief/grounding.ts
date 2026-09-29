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

interface CheckResult {
  claim: Claim;
  wasRejected: boolean;
}

function checkClaim(claim: Claim, normalizedSource: string): CheckResult {
  if (claim.unknown) {
    return { claim, wasRejected: false };
  }
  const normalizedQuote = normalizeForMatch(claim.quote!);
  if (normalizedQuote.length > 0 && normalizedSource.includes(normalizedQuote)) {
    return { claim, wasRejected: false };
  }
  return { claim: rejectedClaimPlaceholder(), wasRejected: true };
}

function checkClaims(claims: Claim[], normalizedSource: string, tally: { total: number; verified: number; rejected: number }): Claim[] {
  return claims.map((c) => {
    tally.total++;
    const { claim, wasRejected } = checkClaim(c, normalizedSource);
    if (wasRejected) tally.rejected++;
    else tally.verified++;
    return claim;
  });
}

/**
 * The actual enforcement of Advisory Brief's core rule: this is CODE, not a model call,
 * deciding what survives into the brief a user sees. Every `Claim` with `unknown: false` must
 * carry a `quote` that is a real (normalized) substring of `sourceText`, or it's replaced with
 * a visible rejection placeholder. Every `urgency.deadlines` entry must likewise appear in the
 * source, or it's dropped from the list entirely (dates don't need a placeholder the way
 * claims do -- a missing date is just absent, not a broken sentence).
 */
export function verifyBrief(raw: RawBrief, sourceText: string, sourceUrl: string | null, sourceLabel: string): VerifiedBrief {
  const normalizedSource = normalizeForMatch(sourceText);
  const tally = { total: 0, verified: 0, rejected: 0 };

  const whatHappened = checkClaims(raw.whatHappened, normalizedSource, tally);

  tally.total++;
  const urgencyReasonResult = checkClaim(raw.urgency.reason, normalizedSource);
  if (urgencyReasonResult.wasRejected) tally.rejected++;
  else tally.verified++;

  const affected: AudienceImpact[] = raw.affected.map((a) => {
    tally.total++;
    const result = checkClaim(a.explanation, normalizedSource);
    if (result.wasRejected) tally.rejected++;
    else tally.verified++;
    return { ...a, explanation: result.claim };
  });

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
      reason: urgencyReasonResult.claim,
      deadlines,
    },
    affected,
    whatToTellYourTeam,
    whatWeDontKnow: raw.whatWeDontKnow,
    verification: {
      totalClaims: tally.total,
      verifiedClaims: tally.verified,
      rejectedClaims: tally.rejected,
      rejectedDates,
    },
    sourceUrl,
    sourceLabel,
  };
}
