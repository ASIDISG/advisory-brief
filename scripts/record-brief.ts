/**
 * Records one real brief: fetches a real stellar-core release, runs the real generator against
 * it, and saves the source, the raw model output, the verified brief and a provenance record.
 *
 *   npx tsx scripts/record-brief.ts --tag v29.0.0
 *
 * The API key is read from the environment (or a local, gitignored `.env`) and is never
 * printed or written to the output. Provider selection is the same as the API route: set
 * ANTHROPIC_API_KEY or GEMINI_API_KEY. See docs/samples/README.md.
 */
import { execFileSync } from 'node:child_process';
import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { generateBriefDetailed } from '../src/brief/generate';
import { resolveGenerator } from '../src/brief/providers/resolve';
import { stellarCoreReleasesSource } from '../src/sources/github-releases';

function arg(name: string): string | undefined {
  const i = process.argv.indexOf(`--${name}`);
  return i >= 0 ? process.argv[i + 1] : undefined;
}

function git(args: string[]): string | null {
  try {
    return execFileSync('git', args, { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] }).trim();
  } catch {
    return null;
  }
}

async function main(): Promise<void> {
  try {
    process.loadEnvFile('.env');
  } catch {
    // No local .env; the key may already be in the environment.
  }

  const generator = resolveGenerator();
  if (!generator) {
    console.error('Set ANTHROPIC_API_KEY or GEMINI_API_KEY (environment or a local .env file).');
    process.exit(1);
  }

  const tag = arg('tag');
  const advisories = await stellarCoreReleasesSource.fetchLatest();
  const advisory = tag ? advisories.find((a) => a.sourceLabel.endsWith(` ${tag}`)) : advisories[0];
  if (!advisory) {
    console.error(`No stable stellar-core release found${tag ? ` for tag ${tag}` : ''}.`);
    process.exit(1);
  }

  const { raw, verified } = await generateBriefDetailed(generator, {
    sourceText: advisory.text,
    sourceUrl: advisory.sourceUrl,
    sourceLabel: advisory.sourceLabel,
  });

  const releaseTag = advisory.sourceLabel.split(' ').pop() ?? 'unknown';
  const out = resolve(arg('out') ?? `docs/samples/stellar-core-${releaseTag}.recording.json`);
  const dirty = (git(['status', '--porcelain']) ?? '') !== '';

  const recording = {
    provenance: {
      kind: 'Recorded',
      description:
        'A real run of the real generator and verifier against a real release. Recorded once; not live.',
      recordedAt: new Date().toISOString(),
      tool: {
        repo: 'stellarbrief/advisory-brief',
        commit: git(['rev-parse', 'HEAD']) ?? 'unknown',
        workingTreeDirty: dirty,
      },
      generator: generator.describe?.() ?? { provider: 'unknown', model: 'unknown' },
      command: `npx tsx scripts/record-brief.ts${tag ? ` --tag ${tag}` : ''}`,
      sourceFetchedFrom: 'GitHub Releases API (stellar/stellar-core)',
    },
    source: {
      url: advisory.sourceUrl,
      label: advisory.sourceLabel,
      publishedAt: advisory.publishedAt ?? null,
      text: advisory.text,
    },
    raw,
    verified,
  };

  mkdirSync(dirname(out), { recursive: true });
  writeFileSync(out, `${JSON.stringify(recording, null, 2)}\n`, 'utf8');

  const v = verified.verification;
  console.log(`Wrote ${out}`);
  console.log(`Claims with a quote found in the source: ${v.verifiedClaims}/${v.totalClaims}`);
  console.log(`Removed: ${v.rejectedClaims} claim(s), ${v.rejectedDates.length} date(s)`);
  console.log(`Generator: ${JSON.stringify(recording.provenance.generator)}; working tree dirty: ${dirty}`);
}

main().catch((err) => {
  // Print only the message; never the environment or request details.
  console.error(`Recording failed: ${err instanceof Error ? err.message : String(err)}`);
  process.exit(1);
});
