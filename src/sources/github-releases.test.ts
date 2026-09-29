import { afterEach, describe, expect, it, vi } from 'vitest';
import { createGitHubReleasesSource } from './github-releases';

const REAL_SHAPED_RELEASE = {
  tag_name: 'v28.0.1',
  name: 'v28.0.1',
  html_url: 'https://github.com/stellar/stellar-core/releases/tag/v28.0.1',
  published_at: '2026-09-01T07:01:54Z',
  body: '## Stability Improvements\n\n- Deduplicate query messages',
  draft: false,
  prerelease: false,
};

describe('github-releases source (mocked fetch, no network)', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('conforms to the AdvisorySource interface', () => {
    const source = createGitHubReleasesSource('stellar', 'stellar-core');
    expect(typeof source.id).toBe('string');
    expect(typeof source.name).toBe('string');
    expect(typeof source.fetchLatest).toBe('function');
  });

  it('maps a real-shaped release into an Advisory', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => [REAL_SHAPED_RELEASE],
      })
    );
    const source = createGitHubReleasesSource('stellar', 'stellar-core');
    const advisories = await source.fetchLatest();

    expect(advisories).toHaveLength(1);
    expect(advisories[0].sourceUrl).toBe(REAL_SHAPED_RELEASE.html_url);
    expect(advisories[0].sourceLabel).toContain('v28.0.1');
    expect(advisories[0].text).toContain('Deduplicate query messages');
    expect(advisories[0].publishedAt).toBe(REAL_SHAPED_RELEASE.published_at);
  });

  it('filters out drafts and prereleases', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => [
          { ...REAL_SHAPED_RELEASE, draft: true },
          { ...REAL_SHAPED_RELEASE, prerelease: true, tag_name: 'v29.0.0-rc1' },
          REAL_SHAPED_RELEASE,
        ],
      })
    );
    const source = createGitHubReleasesSource('stellar', 'stellar-core');
    const advisories = await source.fetchLatest();
    expect(advisories).toHaveLength(1);
  });

  it('throws a clear error on a non-ok response instead of silently returning nothing', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: false, status: 502, statusText: 'Bad Gateway' }));
    const source = createGitHubReleasesSource('stellar', 'stellar-core');
    await expect(source.fetchLatest()).rejects.toThrow(/502/);
  });
});
