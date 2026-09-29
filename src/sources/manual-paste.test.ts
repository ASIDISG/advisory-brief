import { describe, expect, it } from 'vitest';
import { manualPasteSource, toAdvisory } from './manual-paste';

describe('manual-paste source', () => {
  it('conforms to the AdvisorySource interface', () => {
    expect(typeof manualPasteSource.id).toBe('string');
    expect(typeof manualPasteSource.name).toBe('string');
    expect(typeof manualPasteSource.fetchLatest).toBe('function');
  });

  it('fetchLatest returns an empty list rather than throwing', async () => {
    await expect(manualPasteSource.fetchLatest()).resolves.toEqual([]);
  });

  it('toAdvisory wraps pasted text with a null source url', () => {
    const advisory = toAdvisory('some advisory text');
    expect(advisory.text).toBe('some advisory text');
    expect(advisory.sourceUrl).toBeNull();
  });
});
