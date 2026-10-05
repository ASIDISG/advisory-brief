import { afterEach, describe, expect, it, vi } from 'vitest';
import { GET } from './route';

const RELEASE = {
  tag_name: 'v28.0.1',
  name: 'v28.0.1',
  html_url: 'https://github.com/stellar/stellar-core/releases/tag/v28.0.1',
  published_at: '2026-09-01T07:01:54Z',
  body: '## Stability Improvements\n\n- Deduplicate query messages',
  draft: false,
  prerelease: false,
};

describe('GET /api/sources/stellar-core (mocked fetch, no network)', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('returns the latest stable releases as advisories', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: true, json: async () => [RELEASE] }));
    const res = await GET();
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.advisories).toHaveLength(1);
    expect(data.advisories[0].sourceLabel).toContain('v28.0.1');
  });

  it('returns a 502 with the reason when GitHub fails', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({ ok: false, status: 403, statusText: 'rate limit exceeded' })
    );
    const res = await GET();
    expect(res.status).toBe(502);
    const data = await res.json();
    expect(data.error).toContain('403');
  });
});
