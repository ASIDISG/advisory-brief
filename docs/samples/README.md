# Samples

Real recordings of the real generator and verifier, kept so the output and the verifier's
behavior can be inspected without an API key. A recording is **not live functionality**: it is
what one real run produced, on one date, with one model.

Each `*.recording.json` contains:

- `provenance`: when it was recorded, which provider and model, which commit of this repo
  (and whether the working tree had uncommitted changes), and the command used.
- `source`: the exact release text, URL and label that was given to the tool.
- `raw`: what the model returned, schema-valid but **not yet checked** against the source.
- `verified`: what the verifier let through, with its counts of verified and removed claims.

Comparing `raw` with `verified` shows exactly what the quote check caught. It also shows what
it can't catch: a claim whose quote is real but whose wording goes beyond it.

## Recording one yourself

```bash
npx tsx scripts/record-brief.ts --tag v29.0.0
```

Requires Node 22 or newer and either `ANTHROPIC_API_KEY` or `GEMINI_API_KEY`, set in your
environment or in a local `.env` file. `.env` is gitignored.

## Handling the key

- The key is read from the environment only. The script never prints it or writes it to the
  recording, and error output prints only the error message.
- Never commit a key, paste one into an issue or PR, or put one in browser code. This project
  has no browser-side use of a key.
- Nothing here is built around one provider. The script uses the same provider selection as the
  API route (`src/brief/providers/resolve.ts`): Anthropic if its key is set, otherwise Gemini.

## Free-tier limits

The recordings in this directory were made with a free-tier key where noted in their
provenance. Free tiers have request-rate and daily limits that the provider sets and can change,
and they can behave differently for structured (JSON) output than for plain text: when this
project was first built, one Gemini model alias returned "high demand" errors only for JSON
requests, and older model names returned 404 for new accounts. Check your provider's current
limits before relying on a free key, and don't enable paid billing just to record a sample.
A recording is a one-off: a single request per run.
