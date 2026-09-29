# Advisory Brief

Turn a Stellar security advisory or release announcement into a plain-language brief for
**non-engineers** — business owners, compliance leads, and product managers at wallets,
anchors, fintechs, and exchanges. Node operators already get advisories written for them;
everyone downstream of a node operator gets protocol jargon and has to translate it under
time pressure. This tool does that translation, with a hard constraint: it never states more
than the source advisory actually says.

## Why this is grounded, not just summarized

Most LLM summarizers will confidently restate, embellish, or hallucinate a plausible-sounding
detail. This one is structurally prevented from doing that:

- The model returns structured JSON, and every factual claim carries either a verbatim
  `quote` (≤25 words) or an explicit `unknown: true` — never a bare, unverifiable assertion.
- **Code, not the model, verifies every quote is a real substring of the source** (after
  whitespace/case normalization). A claim that fails is stripped and counted in a
  "verification" summary shown to the user, not hidden.
- Any date must itself appear in the source text, or it's dropped from the brief.
- `urgency` is a closed enum (`ACT_NOW` / `ACT_BEFORE_DEADLINE` / `MONITOR` / `NO_ACTION`),
  validated with zod — the model can't invent a new severity label.

See [`src/brief/grounding.ts`](src/brief/grounding.ts) for the actual enforcement.

## Quickstart

```bash
git clone https://github.com/stellarbrief/advisory-brief.git
cd advisory-brief
npm install
cp .env.example .env   # add ANTHROPIC_API_KEY, or GEMINI_API_KEY for a free-tier alternative
npm run dev
```

No Anthropic access? Get a free `GEMINI_API_KEY` at [aistudio.google.com](https://aistudio.google.com) — no card required — and put it in `.env` instead. `app/api/brief/route.ts` uses whichever one is set.

Open `http://localhost:3000`, click "Load a real example," and click "Generate brief."

## How it works

- `src/brief/schema.ts` — the `Claim` primitive and the full brief schema (zod).
- `src/brief/grounding.ts` — the actual quote/date verification logic.
- `src/brief/generate.ts` — provider-agnostic prompt construction and orchestration, using a
  JSON Schema generated directly from the zod schema (so the model's contract and the
  validation schema can never drift apart).
- `src/brief/providers/` — the Anthropic and Gemini implementations, each using that SDK's own
  real native structured-output feature
  ([Anthropic](https://platform.claude.com/docs/en/build-with-claude/structured-outputs),
  Gemini's `responseJsonSchema`) — not a tool-use/function-calling workaround.
- `src/sources/` — one file per input source (`manual-paste`, GitHub Releases for
  `stellar/stellar-core`), behind a common `AdvisorySource` interface. Adding a new source is
  a small, self-contained file — see [`ADDING_A_SOURCE.md`](docs/ADDING_A_SOURCE.md).
- `src/audiences/` — one JSON profile per audience (`wallet`, `anchor`, `fintech`,
  `exchange`). Adding a new audience is adding one JSON file — see
  [`ADDING_AN_AUDIENCE.md`](docs/ADDING_AN_AUDIENCE.md).

## Roadmap

See [`ISSUES_BACKLOG.md`](ISSUES_BACKLOG.md) for ~20 scoped, ready-to-pick-up issues, and
[`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md) for the fuller design writeup.

## Contributing via Stellar Wave

This repo is applying to the [Stellar Wave Program](https://docs.drips.network/wave/), where
maintainers list scoped issues and outside contributors solve them for points. See
[`CONTRIBUTING.md`](CONTRIBUTING.md) for setup, the PR flow, and how issues are rated.

## License

MIT — see [`LICENSE`](LICENSE).
