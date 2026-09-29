# Contributing

## Setup

```bash
npm install
cp .env.example .env   # add your own ANTHROPIC_API_KEY
npm run dev
```

## Branch / PR flow

1. Fork the repo (or branch directly if you have write access).
2. Create a branch: `git checkout -b your-feature-name`.
3. Make your change, with tests for anything in `src/`.
4. Run the full local check before pushing: `npm run lint && npm run typecheck && npm run test && npm run build`.
5. Open a PR against `main`. CI runs the same four checks; all must pass before merge.

## Code style

TypeScript strict mode, ESLint's Next.js config (`npm run lint` to check, most issues
auto-fixable with `npm run lint -- --fix`). No unrelated formatting-only diffs in a
feature/fix PR, please — keep them separable.

## Running tests

`npm run test` runs the full Vitest suite. No network access or API key is required — every
test that would otherwise need the Anthropic API or GitHub's API mocks it (see
`src/brief/generate.test.ts` and `src/sources/github-releases.test.ts` for the pattern).

## How issues are rated

Every issue in [`ISSUES_BACKLOG.md`](ISSUES_BACKLOG.md) (and future ones added via the Stellar
Wave Program) is tagged **Trivial**, **Medium**, or **High**:

- **Trivial** — typos, small bug fixes, minor copy changes, a new audience profile, a new
  fixture, clearer error messages.
- **Medium** — a standard feature or a more involved bug fix: a new source plugin, dark mode,
  i18n scaffolding, persisted history, an accessibility pass.
- **High** — a complex feature, a refactor, or a new integration: shareable permalinks, rate
  limiting/abuse protection, an evaluation harness comparing briefs against hand-written gold
  briefs, a Slack/Discord webhook export.

If you're picking up a High-complexity issue for the first time, it's fine to open a draft PR
early and ask questions — better than a large PR landing with no discussion along the way.

## Adding a source or an audience

Both are designed to be additive, not core changes — see
[`docs/ADDING_A_SOURCE.md`](docs/ADDING_A_SOURCE.md) and
[`docs/ADDING_AN_AUDIENCE.md`](docs/ADDING_AN_AUDIENCE.md).
