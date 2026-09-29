# Adding a source

A source fetches raw advisory text from somewhere. Implement the `AdvisorySource` interface
from `src/sources/types.ts`:

```ts
export interface Advisory {
  sourceUrl: string | null;
  sourceLabel: string;
  text: string;
  publishedAt?: string; // ISO 8601, only if the source genuinely provides one
}

export interface AdvisorySource {
  id: string;
  name: string;
  fetchLatest(): Promise<Advisory[]>;
}
```

See `src/sources/github-releases.ts` for a real, complete example (GitHub Releases for
`stellar/stellar-core`), and its test file for the pattern of mocking `fetch` so tests need no
real network access.

## Rules

- **Verify the real API/feed shape before writing the parser.** Don't guess field names —
  `github-releases.ts`'s own comment shows checking the real GitHub API response directly
  before writing the mapping. An assumed field name that's wrong fails silently in production
  and loudly in review; check it once, up front, instead.
- **Never invent a `publishedAt`.** Omit the field if the source doesn't provide a real
  timestamp — a fabricated date defeats the entire point of this project's grounding rule.
- **Write a mocked-fetch test** covering: interface conformance, a real-shaped success
  response, and at least one failure mode (non-ok response, empty response, etc.) that throws
  a clear error rather than silently returning nothing.

## Adding your source to the UI

Once implemented, add it to the source list wherever the UI/CLI enumerates available sources
(currently just `manual-paste` is wired into `app/page.tsx`; a source picker for multiple
sources is itself a good "Medium" issue — see `ISSUES_BACKLOG.md`).
