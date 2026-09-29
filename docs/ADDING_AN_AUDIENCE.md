# Adding an audience profile

An audience profile is a JSON file in `src/audiences/`, matching the `AudienceProfile` shape
in `src/audiences/index.ts`:

```json
{
  "id": "custodian",
  "label": "Custodian",
  "description": "One or two sentences describing this audience.",
  "typicalInfrastructure": ["...", "..."],
  "questionsToAsk": ["...", "..."],
  "whoToNotify": ["...", "..."]
}
```

## Steps

1. Add `src/audiences/<id>.json` with the shape above.
2. Import it and add it to the `AUDIENCES` array in `src/audiences/index.ts`.
3. Update `AudienceProfile['id']`'s union type and `AudienceIdSchema` (in
   `src/brief/schema.ts`) to include the new id.
4. Update the prompt in `src/brief/generate.ts` if it lists audiences explicitly (it currently
   does, to keep the model's per-audience output order predictable).

That's it — no changes to `src/brief/grounding.ts` or the verification logic; a new audience's
claims go through the exact same quote-verification path as the built-in four.

## Why this isn't fully data-driven yet

Right now the model prompt hardcodes the four built-in audience ids and their order, rather
than generating the list from `AUDIENCES` at runtime. Making that fully dynamic (so adding an
audience genuinely needs zero code changes, not three) is a good "Medium" issue — see
`ISSUES_BACKLOG.md`.
