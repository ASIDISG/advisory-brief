---
name: New source
about: Propose or track adding a new AdvisorySource
labels: enhancement, new-source
---

**Source name** (e.g. `stellar-rpc` releases, SDF blog RSS, `stellar-protocol` CAPs)

**Where the raw advisory text comes from** (API endpoint, feed URL, etc. — link the real docs)

**Does it need auth?** (API key, token, none)

**Anything unusual about its text format** that the grounding verifier's whitespace/case
normalization might not handle (e.g. embedded HTML, non-UTF-8 content)

See [`docs/ADDING_A_SOURCE.md`](../../docs/ADDING_A_SOURCE.md) for the interface to implement.
