// Plain JSON imports (no `with { type: 'json' }` import attribute) -- both Vite (which runs
// our Vitest suite) and Next.js's own bundler handle a bare `.json` import natively; the
// import-attribute syntax is a raw-Node-ESM-loader requirement neither of those needs, and
// its exact required form has changed across Node versions (`assert` vs `with`), so avoiding
// it here avoids depending on a Node-version-specific detail this project doesn't need.
import anchor from './anchor.json';
import exchange from './exchange.json';
import fintech from './fintech.json';
import wallet from './wallet.json';

export interface AudienceProfile {
  id: 'wallet' | 'anchor' | 'fintech' | 'exchange';
  label: string;
  description: string;
  typicalInfrastructure: string[];
  questionsToAsk: string[];
  whoToNotify: string[];
}

/** Adding a new audience profile (e.g. `custodian`) is adding one JSON file here and one
 * line in this array -- no other code changes, matching the "modular so contributors can add
 * things without touching core" requirement. */
export const AUDIENCES: AudienceProfile[] = [wallet, anchor, fintech, exchange] as AudienceProfile[];

export function getAudience(id: string): AudienceProfile | undefined {
  return AUDIENCES.find((a) => a.id === id);
}
