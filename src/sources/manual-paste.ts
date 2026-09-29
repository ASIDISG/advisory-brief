import type { Advisory, AdvisorySource } from './types';

/**
 * The "source" behind the UI's paste box. There is no "latest" to automatically fetch for
 * pasted text -- `fetchLatest()` returns an empty array rather than throwing, so this still
 * conforms to `AdvisorySource` uniformly alongside real automated sources (a UI that lists
 * "available sources" can include this one without a special case). The actual paste-to-brief
 * path goes through `toAdvisory` directly from the UI, not through `fetchLatest()`.
 */
export const manualPasteSource: AdvisorySource = {
  id: 'manual-paste',
  name: 'Paste text',
  async fetchLatest(): Promise<Advisory[]> {
    return [];
  },
};

export function toAdvisory(text: string): Advisory {
  return {
    sourceUrl: null,
    sourceLabel: 'Manually pasted text',
    text,
  };
}
