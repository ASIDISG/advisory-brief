# Issues backlog

~20 scoped issues, ready to post to GitHub / the Stellar Wave Program. Complexity tiers match
`CONTRIBUTING.md`'s definitions exactly.

## Trivial (8)

### 1. Add a `custodian` audience profile
Add `src/audiences/custodian.json` following `docs/ADDING_AN_AUDIENCE.md`. A custodian
(third-party asset custody provider) has different infrastructure/notification needs than a
wallet or exchange — worth its own profile.
**Acceptance criteria:**
- [ ] `custodian.json` added with all required fields
- [ ] Added to `AUDIENCES` in `src/audiences/index.ts` and the id unions in `schema.ts`
- [ ] A test confirming it round-trips through `verifyBrief`
**Suggested files:** `src/audiences/custodian.json`, `src/audiences/index.ts`, `src/brief/schema.ts`

### 2. Add a `dao-treasury` audience profile
Same as above, for a DAO treasury multisig holding Stellar assets.
**Acceptance criteria:** same shape as #1.
**Suggested files:** `src/audiences/dao-treasury.json`, `src/audiences/index.ts`, `src/brief/schema.ts`

### 3. Add a second real fixture from an actual past stellar-core release
`src/brief/generate.test.ts` only has Fixture #1. Add a second real advisory text (a real past
`stellar-core` GitHub release body) as a fixture with its own expected-behavior assertions.
**Acceptance criteria:**
- [ ] Real release body copied verbatim into a new fixture constant
- [ ] At least 3 assertions on the verified brief's shape/content
**Suggested files:** `src/brief/generate.test.ts`

### 4. Improve the "no text block" and "invalid JSON" error messages
`generateBrief`'s current errors are functional but terse. Make them include enough context
(response `stop_reason`, a truncated preview of what was returned) to debug a real failure
without re-running with a debugger attached.
**Acceptance criteria:**
- [ ] Error messages include relevant context fields
- [ ] Existing tests in `generate.test.ts` still pass (adjust the `toThrow` matchers if needed)
**Suggested files:** `src/brief/generate.ts`

### 5. Add a loading skeleton instead of just button text
`app/page.tsx` currently just changes the button label to "Generating…". Add a proper loading
skeleton for the brief area so the wait doesn't look like nothing is happening.
**Acceptance criteria:**
- [ ] A skeleton/placeholder shown in the brief area while `loading` is true
- [ ] No layout shift when the real brief replaces it
**Suggested files:** `app/page.tsx`

### 6. Add README badges (CI status, license, Next.js version)
**Acceptance criteria:**
- [ ] CI badge linking to the Actions workflow
- [ ] License badge
- [ ] Badges render correctly on GitHub
**Suggested files:** `README.md`

### 7. Validate `sourceUrl` is well-formed before enabling "Generate brief"
Currently a malformed URL in the optional Source URL field only fails server-side (the API
route's zod validation). Add lightweight client-side validation so the error surfaces before
a round trip.
**Acceptance criteria:**
- [ ] Malformed URL shows an inline error without submitting
- [ ] Empty URL field is still allowed (it's optional)
**Suggested files:** `app/page.tsx`

### 8. Publish a JSON Schema file for `RawBrief`
`src/brief/generate.ts` already computes this at runtime via `z.toJSONSchema`. Export it to a
committed `schemas/raw-brief.schema.json` (via a small build script) so external tooling can
reference it without running the app.
**Acceptance criteria:**
- [ ] A script (e.g. `scripts/export-schema.ts`) writes the schema to a committed file
- [ ] A test or CI step confirms the committed file matches the live-generated schema (so it
      can't silently drift)
**Suggested files:** `scripts/export-schema.ts`, `schemas/raw-brief.schema.json`, `package.json`

## Medium (8)

### 9. Add a `stellar-rpc` GitHub Releases source
Follow `docs/ADDING_A_SOURCE.md` and the existing `github-releases.ts` pattern for the
`stellar/stellar-rpc` repo.
**Acceptance criteria:**
- [ ] New source file, ~20 lines, reusing `createGitHubReleasesSource`
- [ ] Mocked-fetch tests following `github-releases.test.ts`'s pattern
- [ ] Wired into whatever source list the UI/CLI exposes
**Suggested files:** `src/sources/stellar-rpc-releases.ts` (or similar), its test file

### 10. Add a `stellar/go` (Horizon) GitHub Releases source
Same pattern as #9, for `stellar/go`. Note Horizon releases are tagged differently
(`horizon-vX.Y.Z`) — verify the real tag format against the live API before filtering.
**Acceptance criteria:** same shape as #9, with the real tag format verified, not assumed.
**Suggested files:** new source file + test

### 11. Add an SDF blog RSS/Atom source
Implement `AdvisorySource` against the real SDF developer blog's feed (verify the actual feed
URL and item shape before writing the parser).
**Acceptance criteria:**
- [ ] Real feed URL confirmed and documented in the source file's comment
- [ ] Mocked-fetch tests using a real captured feed sample
**Suggested files:** new source file + test

### 12. Dark mode
Add a dark theme respecting `prefers-color-scheme`, matching the existing Tailwind setup.
**Acceptance criteria:**
- [ ] All existing UI elements have a readable dark variant
- [ ] Urgency badge colors remain distinguishable in dark mode
**Suggested files:** `app/page.tsx`, `app/globals.css`

### 13. Persist the last-generated brief in `localStorage`
So a page refresh doesn't lose the user's last brief. Scope it per source text (a hash or
truncated key) so it doesn't silently show a stale brief for different input.
**Acceptance criteria:**
- [ ] Refreshing the page restores the last brief if the source text box is unchanged
- [ ] Changing the source text clears the restored brief
**Suggested files:** `app/page.tsx`

### 14. Accessibility pass on the brief view
Audit and fix: color-contrast on the urgency badges, keyboard navigation through the audience
toggle buttons, ARIA labels on icon-only controls (there are none yet, but this should also
cover future ones).
**Acceptance criteria:**
- [ ] Automated check (e.g. axe-core in a test or CI step) passes with no serious violations
- [ ] Manual keyboard-only pass through the whole flow works
**Suggested files:** `app/page.tsx`, possibly a new test file

### 15. i18n scaffolding
Add a translation-key structure (even if only English is populated initially) so section
headings and static copy aren't hardcoded strings, in preparation for real localization.
**Acceptance criteria:**
- [ ] All static UI copy routed through a translation function/lookup
- [ ] Adding a second language file is documented
**Suggested files:** `app/page.tsx`, a new `src/i18n/` directory

### 16. A source picker UI (not just paste + one hardcoded fixture button)
Once issues #9–11 land, the UI needs a real way to pick a source and see its recent advisories,
not just the one hardcoded "Load a real example" button.
**Acceptance criteria:**
- [ ] A dropdown/list of available `AdvisorySource`s
- [ ] Selecting one calls `fetchLatest()` and lets the user pick a specific advisory
**Suggested files:** `app/page.tsx`, possibly a new component file

## High (4)

### 17. Shareable permalinks for a generated brief
Let a user share a link that reproduces a specific brief without re-calling the model (e.g. by
hashing/storing the verified brief server-side or encoding it compactly in the URL).
**Acceptance criteria:**
- [ ] A "Share" action producing a URL
- [ ] Opening that URL reproduces the same brief without a new model call
- [ ] A clear decision recorded on storage approach (server-side store vs. URL-encoded) and its
      tradeoffs (this touches "no database for the MVP" from `PLAN.md` — a real design
      discussion, not just an implementation)
**Suggested files:** new API route, `app/page.tsx`, `docs/ARCHITECTURE.md` update

### 18. Rate limiting / abuse protection on `/api/brief`
The route currently has no rate limiting; a public deployment could see its Anthropic API
budget drained by automated abuse.
**Acceptance criteria:**
- [ ] A real rate-limiting mechanism (IP-based at minimum) in front of `/api/brief`
- [ ] Tests covering the limit being enforced and reset
- [ ] Documented in `README.md`/`docs/ARCHITECTURE.md`
**Suggested files:** `app/api/brief/route.ts`, a new middleware/limiter module

### 19. An evaluation harness comparing briefs against hand-written gold briefs
Build a small harness: a set of real advisories with hand-written "ideal" briefs, run the real
generator against each, and score/report how close the output is (grounding-wise, at minimum —
did it correctly identify what's unknown vs. known, correct urgency level, etc.).
**Acceptance criteria:**
- [ ] At least 5 real advisory/gold-brief pairs
- [ ] A scoring script comparing generated vs. gold on urgency correctness and grounding rate
- [ ] Documented as a `npm run eval`-style script, separate from the Vitest suite (this calls
      the real API and costs real tokens, so it should not run in CI on every PR)
**Suggested files:** new `eval/` directory, `package.json` script

### 20. Slack/Discord webhook export
Beyond "Copy for Slack," add a direct webhook-based export so a brief can be posted to a
configured Slack/Discord channel without a manual copy-paste step.
**Acceptance criteria:**
- [ ] A configurable webhook URL (env var or per-session input, never logged)
- [ ] Uses the existing `toSlackMessage`/an equivalent Discord formatter
- [ ] Tests mocking the webhook call
**Suggested files:** `src/brief/format.ts`, new API route, `app/page.tsx`
