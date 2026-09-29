export interface Advisory {
  sourceUrl: string | null;
  sourceLabel: string;
  text: string;
  /** ISO 8601 if the source provides a real publish date; omitted rather than guessed
   * otherwise -- an invented date here would defeat the whole point of the grounding rule. */
  publishedAt?: string;
}

/** Common interface every input source implements. Adding a new source (stellar-rpc,
 * stellar/go/Horizon, the SDF blog RSS feed, stellar-protocol CAPs) means adding one file
 * implementing this interface, not touching `src/brief/` at all. */
export interface AdvisorySource {
  id: string;
  name: string;
  fetchLatest(): Promise<Advisory[]>;
}
