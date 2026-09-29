import { z } from 'zod';

/** Closed set, matching the product spec exactly -- the model cannot invent a fifth severity
 * label, since zod rejects anything outside this enum before a brief is ever shown. */
export const UrgencyLevel = z.enum(['ACT_NOW', 'ACT_BEFORE_DEADLINE', 'MONITOR', 'NO_ACTION']);
export type UrgencyLevel = z.infer<typeof UrgencyLevel>;

/**
 * The core grounding primitive. Every factual statement in a brief is a Claim, not a bare
 * string -- so the grounding verifier (`src/brief/grounding.ts`) has something concrete to
 * check for every single assertion, not just the brief as a whole.
 *
 * Exactly one of `quote`/`unknown` applies:
 *   - `unknown: true`, `quote: null` -- the advisory genuinely doesn't say, and `text` says so.
 *   - `unknown: false`, `quote` a real, verbatim substring of the source (<=25 words) that
 *     `text` is a plain-language restatement of.
 * The model can express intent by setting `unknown`, but only the verifier's own substring
 * check (not this schema) determines whether a claim survives into the shown brief.
 */
export const ClaimSchema = z
  .object({
    text: z.string().min(1),
    quote: z.string().min(1).max(220).nullable(),
    unknown: z.boolean(),
  })
  // A single refine, not two chained ones: zod runs every `.refine()` in a chain regardless
  // of whether an earlier one already failed (they aren't short-circuiting), so a second
  // refine that assumes "unknown is false implies quote is non-null" -- an invariant only
  // the FIRST refine actually enforces -- can still run against a claim that violates it,
  // e.g. `{ quote: null, unknown: false }`. Confirmed live: that exact input crashed with
  // "Cannot read properties of null (reading 'trim')" from inside the word-count check,
  // instead of failing validation cleanly. One refine that checks both invariants together,
  // with the null case handled explicitly, has no such ordering hazard.
  .refine(
    (c) => {
      if (c.unknown) return c.quote === null;
      return c.quote !== null && wordCount(c.quote) <= 25;
    },
    {
      message:
        'A claim must have a null quote when unknown is true, and a non-null quote of 25 words or fewer otherwise.',
    }
  );
export type Claim = z.infer<typeof ClaimSchema>;

function wordCount(s: string): number {
  return s.trim().split(/\s+/).filter(Boolean).length;
}

export const AudienceIdSchema = z.enum(['wallet', 'anchor', 'fintech', 'exchange']);
export type AudienceId = z.infer<typeof AudienceIdSchema>;

export const AudienceImpactSchema = z.object({
  audienceId: AudienceIdSchema,
  affected: z.enum(['YES', 'NO', 'UNCLEAR']),
  explanation: ClaimSchema,
});
export type AudienceImpact = z.infer<typeof AudienceImpactSchema>;

/** Raw model output, before grounding verification runs. Never shown to a user directly --
 * see `VerifiedBrief` below, which is what the verifier produces and the UI actually renders. */
export const RawBriefSchema = z.object({
  whatHappened: z.array(ClaimSchema).min(1).max(5),
  urgency: z.object({
    level: UrgencyLevel,
    reason: ClaimSchema,
    /** Each entry must itself appear verbatim in the source text -- enforced by the
     * verifier, not this schema, since that's a cross-check against the source, not a
     * shape constraint. */
    deadlines: z.array(z.string()),
  }),
  affected: z.array(AudienceImpactSchema).length(4),
  whatToTellYourTeam: z.array(ClaimSchema).min(3).max(5),
  /** Explicit gaps the advisory doesn't cover. These are meta-statements about absence, not
   * claims about the advisory's content, so they carry no quote to verify. */
  whatWeDontKnow: z.array(z.string().min(1)).min(1),
});
export type RawBrief = z.infer<typeof RawBriefSchema>;

/** What verification actually did, shown to the user rather than hidden -- if the model
 * fabricated a claim, the brief says so instead of silently presenting a shorter list. */
export const VerificationSummarySchema = z.object({
  totalClaims: z.number().int().nonnegative(),
  verifiedClaims: z.number().int().nonnegative(),
  rejectedClaims: z.number().int().nonnegative(),
  rejectedDates: z.array(z.string()),
});
export type VerificationSummary = z.infer<typeof VerificationSummarySchema>;

export const VerifiedBriefSchema = z.object({
  whatHappened: z.array(ClaimSchema),
  urgency: z.object({
    level: UrgencyLevel,
    reason: ClaimSchema,
    deadlines: z.array(z.string()),
  }),
  affected: z.array(AudienceImpactSchema),
  whatToTellYourTeam: z.array(ClaimSchema),
  whatWeDontKnow: z.array(z.string()),
  verification: VerificationSummarySchema,
  sourceUrl: z.string().url().nullable(),
  sourceLabel: z.string(),
});
export type VerifiedBrief = z.infer<typeof VerifiedBriefSchema>;
