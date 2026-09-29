# Security Policy

## Reporting a vulnerability

Please do not open a public GitHub issue for a security vulnerability. Instead, use GitHub's
[private vulnerability reporting](https://github.com/stellarbrief/advisory-brief/security/advisories/new)
for this repository, or open a regular issue asking a maintainer to reach out privately if
that option isn't available to you.

## Scope

This project processes text you paste or fetch from a public source and sends it to the
Anthropic API. It does not itself execute untrusted code, hold user funds, or have any
on-chain component. Relevant concerns include (but aren't limited to):

- Prompt injection via advisory text that could cause the tool to misrepresent grounding
  (e.g. a crafted source designed to make a fabricated quote pass the substring check).
- Leakage of `ANTHROPIC_API_KEY` or `GITHUB_TOKEN` through logs, error messages, or client-side
  code.
- Cross-site scripting via unsanitized rendering of model output or advisory text in the UI.

## Supported versions

This project is pre-1.0; only the `main` branch receives fixes.
