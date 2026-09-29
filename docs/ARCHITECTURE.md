# Architecture

## Data flow

1. A user pastes text, or the UI/CLI calls an `AdvisorySource.fetchLatest()` (`src/sources/`).
2. The raw text + optional source URL/label are POSTed to `/api/brief` (`app/api/brief/route.ts`).
3. `generateBrief` (`src/brief/generate.ts`) calls the Anthropic API with a native
   structured-output constraint: the JSON Schema is generated directly from `RawBriefSchema`
   (`src/brief/schema.ts`) via zod v4's `z.toJSONSchema`, so the model's contract and the
   validation schema can never drift apart.
4. The raw, schema-conformant response is parsed with `RawBriefSchema.parse` (shape-only
   validation — this does NOT mean every quote is real).
5. `verifyBrief` (`src/brief/grounding.ts`) is the actual enforcement: every claim's `quote` is
   checked as a real (whitespace/case-normalized) substring of the source text. A claim that
   fails is replaced with a visible rejection placeholder, not silently dropped. Every date in
   `urgency.deadlines` is checked the same way.
6. The resulting `VerifiedBrief` (schema-valid AND grounding-verified) is the only thing the
   UI ever renders.

## Why grounding is enforced in code, not just requested in the prompt

A sufficiently well-crafted prompt can reduce hallucination, but it cannot eliminate it, and it
cannot prove after the fact that a given claim was real. Asking the model to also return the
literal source substring behind every claim turns "trust the model" into "verify a substring
match" — a cheap, deterministic, testable check that doesn't depend on the model's honesty on
any given call. See `src/brief/grounding.test.ts` for the tests exercising this directly with a
fabricated quote.

## Why native structured outputs, not tool-use

Claude's API also supports forcing structured output via a fake "tool call" (`tool_choice`).
This project uses the newer, more direct `output_config.format` (JSON Schema) constraint
instead — see `src/brief/generate.ts`'s module comment and
[the structured-outputs docs](https://platform.claude.com/docs/en/build-with-claude/structured-outputs).
Both approaches produce a schema-conformant response; grounding verification still applies
identically to either.

## Extension points

- **Sources** (`src/sources/`): implement `AdvisorySource` (`id`, `name`, `fetchLatest()`).
  See [`ADDING_A_SOURCE.md`](ADDING_A_SOURCE.md).
- **Audiences** (`src/audiences/`): add a JSON profile. See
  [`ADDING_AN_AUDIENCE.md`](ADDING_AN_AUDIENCE.md).

Neither extension point requires touching `src/brief/` (the grounding/generation core) at all.
