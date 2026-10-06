/**
 * The minimal, provider-agnostic contract `generateBrief` actually needs: send a prompt,
 * constrained to return JSON matching a given schema, get raw text back. Everything
 * provider-specific (auth, request shape, response parsing) lives behind this, one file per
 * provider -- `generateBrief` itself never imports an SDK directly.
 */
export interface RawJsonGenerator {
  generate(prompt: string, jsonSchema: Record<string, unknown>): Promise<string>;
  /** Which provider and model a call would use, so a recording can say what produced it. */
  describe?(): { provider: string; model: string };
}
