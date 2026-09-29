# PLAN.md

## What this is

Advisory Brief turns Stellar security advisories and release announcements into plain-language
briefs for non-engineers: business owners, compliance leads, and product managers at wallets,
anchors, fintechs, and exchanges. Node operators already get advisories written for them by SDF;
everyone downstream of a node operator gets a wall of protocol jargon and has to translate it
themselves under time pressure. This tool does that translation, with a hard constraint that it
never states more than the source advisory actually says.

## Core differentiator

Most LLM summarizers will confidently restate, embellish, or hallucinate details that sound
plausible. This one can't, by construction:

- The model returns structured JSON only, and every factual claim carries either a verbatim
  `quote` (≤25 words) lifted from the source text, or an explicit `unknown: true`.
- Code — not the model — verifies each quote is a real substring of the source (after
  whitespace/case normalization). A claim whose quote doesn't actually appear in the source is
  stripped and counted in a visible "verification" summary the user sees, not hidden.
- Any date in the output must itself appear in the source text, or it's dropped.
- `urgency` is a closed enum, validated with zod — the model can't invent a new severity label.

This is what "grounding" means here: not a vibe, a mechanical, testable constraint the model
cannot get around, however it's prompted.

## Architecture

- `src/sources/` — one file per input source behind a common `AdvisorySource` interface
  (`id`, `name`, `fetchLatest()`). Ships with `manual-paste` and a GitHub Releases source for
  `stellar/stellar-core`. Adding `stellar-rpc`, `stellar/go` (Horizon), or an RSS feed later is a
  ~20-line file, not a core change.
- `src/audiences/` — one JSON profile per audience (`wallet`, `anchor`, `fintech`, `exchange`):
  label, description, typical infrastructure, questions to ask, who to notify. Adding a new
  audience (e.g. `custodian`) is adding a JSON file.
- `src/brief/` — prompt construction, the Anthropic API call, the zod schema, the grounding
  verifier, and urgency derivation. This is where the core rule actually lives.
- `app/` — the UI: paste box (or source picker), audience toggle, brief view, "Copy as Markdown"
  and "Copy for Slack".
- `fixtures/` — real advisory texts paired with expected-behavior assertions, used by both the
  test suite and manual review.

## Stack

Next.js 16 (App Router) + TypeScript strict + Tailwind v4, zod for schemas, Vitest for tests.
No database; deployable to Vercel with zero extra config.

**LLM provider (added after initial build):** `src/brief/providers/` abstracts the model call
behind a `RawJsonGenerator` interface so the app works with either `@anthropic-ai/sdk`
(`ANTHROPIC_API_KEY`, model from `ANTHROPIC_MODEL`, default `claude-sonnet-5` — correcting a
typo'd default from the original spec draft, `claude-sonnet-5-5` is not a real model id) or
`@google/genai` (`GEMINI_API_KEY`, model from `GEMINI_MODEL`, default `gemini-3.1-flash-lite`
— confirmed live end-to-end, including a real grounding-verification pass: `gemini-2.5-flash`
is rejected outright for new users (404, recommending `gemini-3.8-flash`), and
`gemini-flash-latest` (Google's own stay-current alias, the more future-proof choice in
principle) reliably returned a real 503 for `responseMimeType: application/json` requests
specifically -- plain text generation on the same model worked every time. `gemini-3.1-flash-
lite` was tried next and correctly handled a real structured-output call against this
project's actual schema on the first attempt; see `src/brief/providers/gemini.ts` for the
full account) —
added specifically so contributors without paid Anthropic access can still run and test the
app for free via Google AI Studio's free tier. `app/api/brief/route.ts` picks whichever key is
present, Anthropic first if both are set. Both providers use each SDK's real native
structured-output feature (Anthropic's `output_config.format`, Gemini's
`responseJsonSchema`), not a tool-use/function-calling workaround — verified against each
SDK's own installed type definitions, not assumed.

## Build order

1. PLAN.md (this file), repo scaffold, CI, lint/test setup — done in this pass.
2. Schemas + grounding verifier + tests, before any UI or real model call.
3. Brief generator against a mocked model response, then the real Anthropic call.
4. Sources + audiences.
5. UI.
6. Docs, contribution templates, `ISSUES_BACKLOG.md`.
7. Final pass: lint, typecheck, test, production build.

## Decisions and open items

- The Discord fixture link (`fixtures`/Fixture #1) was confirmed reachable and correctly dated
  by the repo owner directly — used as-is, not defaulted to `source_url: null`.
- Ambiguous requirements are resolved with the simplest reading that still satisfies the
  grounding rule; anything genuinely uncertain about a real Stellar fact is marked `unknown`
  rather than guessed.
- Next.js 16's own generated `AGENTS.md` flagged real API drift from older training data —
  route handlers were checked directly against the bundled `node_modules/next/dist/docs/`
  before writing any route, not assumed from memory.
