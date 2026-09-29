'use client';

import { useState } from 'react';
import { AUDIENCES } from '@/src/audiences/index';
import { toMarkdown, toSlackMessage } from '@/src/brief/format';
import type { VerifiedBrief } from '@/src/brief/schema';

const FIXTURE_1 = {
  sourceUrl: 'https://discord.com/channels/897514728459468821/900374272751591424/1554246285765382295',
  sourceLabel: 'Stellar Discord announcement, Sept 24, 2026',
  text: "A new security-focused Protocol 29 release is out, with the Testnet vote scheduled for September 29th 1700 UTC and Mainnet on October 1st 1700 UTC. Stellar-core 29.0.0-3589.4eb833373 fixes recently identified vulnerabilities, which to the best of our knowledge have not been exploited. It's available from the apt stable repo or Docker Hub (https://hub.docker.com/r/stellar/stellar-core/tags). Horizon and RPC operators should pull stellar-horizon:29.0.0 (https://hub.docker.com/r/stellar/stellar-horizon/tags) or stellar-rpc:29.0.0 (https://hub.docker.com/r/stellar/stellar-rpc/tags), which bundle the new core binary with no other relevant changes.",
};

const URGENCY_COLORS: Record<string, string> = {
  ACT_NOW: 'bg-red-100 text-red-800 border-red-300',
  ACT_BEFORE_DEADLINE: 'bg-amber-100 text-amber-800 border-amber-300',
  MONITOR: 'bg-blue-100 text-blue-800 border-blue-300',
  NO_ACTION: 'bg-green-100 text-green-800 border-green-300',
};

export default function Home() {
  const [sourceText, setSourceText] = useState('');
  const [sourceUrl, setSourceUrl] = useState('');
  const [sourceLabel, setSourceLabel] = useState('');
  const [brief, setBrief] = useState<VerifiedBrief | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeAudience, setActiveAudience] = useState<string>('wallet');
  const [copyStatus, setCopyStatus] = useState<string | null>(null);

  function loadFixture() {
    setSourceText(FIXTURE_1.text);
    setSourceUrl(FIXTURE_1.sourceUrl);
    setSourceLabel(FIXTURE_1.sourceLabel);
    setBrief(null);
    setError(null);
  }

  async function generate() {
    setLoading(true);
    setError(null);
    setBrief(null);
    try {
      const res = await fetch('/api/brief', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sourceText,
          sourceUrl: sourceUrl || null,
          sourceLabel: sourceLabel || 'Pasted advisory text',
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? 'Something went wrong.');
        return;
      }
      setBrief(data.brief as VerifiedBrief);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setLoading(false);
    }
  }

  async function copy(text: string, label: string) {
    await navigator.clipboard.writeText(text);
    setCopyStatus(`Copied ${label} to clipboard.`);
    setTimeout(() => setCopyStatus(null), 2000);
  }

  return (
    <main className="mx-auto max-w-3xl px-6 py-10">
      <h1 className="text-2xl font-bold">Advisory Brief</h1>
      <p className="mt-2 text-sm text-gray-600">
        Turn a Stellar security advisory or release announcement into a plain-language brief for
        non-engineers. Every claim is checked against the source text in code, not just asked of
        the model — an unverifiable claim is removed and counted, not hidden.
      </p>

      <div className="mt-6 space-y-3">
        <textarea
          className="w-full rounded border border-gray-300 p-3 text-sm"
          rows={8}
          placeholder="Paste the advisory or release announcement text here..."
          value={sourceText}
          onChange={(e) => setSourceText(e.target.value)}
        />
        <div className="flex gap-3">
          <input
            className="flex-1 rounded border border-gray-300 p-2 text-sm"
            placeholder="Source URL (optional)"
            value={sourceUrl}
            onChange={(e) => setSourceUrl(e.target.value)}
          />
          <input
            className="flex-1 rounded border border-gray-300 p-2 text-sm"
            placeholder="Source label (e.g. Stellar Discord announcement)"
            value={sourceLabel}
            onChange={(e) => setSourceLabel(e.target.value)}
          />
        </div>
        <div className="flex gap-3">
          <button
            type="button"
            onClick={generate}
            disabled={loading || sourceText.trim().length === 0}
            className="rounded bg-black px-4 py-2 text-sm font-medium text-white disabled:opacity-40"
          >
            {loading ? 'Generating…' : 'Generate brief'}
          </button>
          <button
            type="button"
            onClick={loadFixture}
            className="rounded border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700"
          >
            Load a real example (Protocol 29)
          </button>
        </div>
      </div>

      {error && (
        <div className="mt-6 rounded border border-red-300 bg-red-50 p-3 text-sm text-red-800">{error}</div>
      )}

      {brief && (
        <div className="mt-8 space-y-6 rounded border border-gray-200 p-5">
          <section>
            <h2 className="font-semibold">What happened</h2>
            <ul className="mt-1 list-disc pl-5 text-sm">
              {brief.whatHappened.map((c, i) => (
                <li key={i}>{c.unknown ? <em className="text-gray-500">Unclear from the source.</em> : c.text}</li>
              ))}
            </ul>
          </section>

          <section>
            <span
              className={`inline-block rounded border px-2 py-1 text-xs font-semibold ${URGENCY_COLORS[brief.urgency.level] ?? ''}`}
            >
              {brief.urgency.level.replace(/_/g, ' ')}
            </span>
            <p className="mt-2 text-sm">{brief.urgency.reason.unknown ? 'Reason unclear from the source.' : brief.urgency.reason.text}</p>
            {brief.urgency.deadlines.length > 0 && (
              <p className="mt-1 text-sm text-gray-600">Deadline(s): {brief.urgency.deadlines.join(', ')}</p>
            )}
          </section>

          <section>
            <h2 className="font-semibold">Are you affected?</h2>
            <div className="mt-2 flex gap-2">
              {AUDIENCES.map((a) => (
                <button
                  key={a.id}
                  type="button"
                  onClick={() => setActiveAudience(a.id)}
                  className={`rounded px-3 py-1 text-xs font-medium ${
                    activeAudience === a.id ? 'bg-black text-white' : 'bg-gray-100 text-gray-700'
                  }`}
                >
                  {a.label}
                </button>
              ))}
            </div>
            {brief.affected
              .filter((a) => a.audienceId === activeAudience)
              .map((a) => (
                <div key={a.audienceId} className="mt-2 text-sm">
                  <span className="font-medium">{a.affected}</span> —{' '}
                  {a.explanation.unknown ? <em className="text-gray-500">Unclear from the source.</em> : a.explanation.text}
                </div>
              ))}
          </section>

          <section>
            <h2 className="font-semibold">What to tell your team</h2>
            <ul className="mt-1 list-disc pl-5 text-sm">
              {brief.whatToTellYourTeam.map((c, i) => (
                <li key={i}>{c.unknown ? <em className="text-gray-500">Unclear from the source.</em> : c.text}</li>
              ))}
            </ul>
          </section>

          <section>
            <h2 className="font-semibold">What we don&apos;t know</h2>
            <ul className="mt-1 list-disc pl-5 text-sm">
              {brief.whatWeDontKnow.map((item, i) => (
                <li key={i}>{item}</li>
              ))}
            </ul>
          </section>

          <section className="border-t border-gray-200 pt-3 text-xs text-gray-500">
            {brief.verification.verifiedClaims}/{brief.verification.totalClaims} claims verified against the source.
            {brief.verification.rejectedClaims > 0 &&
              ` ${brief.verification.rejectedClaims} unverifiable claim(s) were removed.`}
            {brief.verification.rejectedDates.length > 0 &&
              ` ${brief.verification.rejectedDates.length} date(s) not found in the source were dropped.`}
          </section>

          <section className="text-xs text-gray-500">
            {brief.sourceUrl ? (
              <a href={brief.sourceUrl} target="_blank" rel="noreferrer" className="underline">
                {brief.sourceLabel}
              </a>
            ) : (
              brief.sourceLabel
            )}
          </section>

          <div className="flex gap-3">
            <button
              type="button"
              onClick={() => copy(toMarkdown(brief), 'Markdown')}
              className="rounded border border-gray-300 px-3 py-1 text-xs font-medium"
            >
              Copy as Markdown
            </button>
            <button
              type="button"
              onClick={() => copy(toSlackMessage(brief), 'Slack message')}
              className="rounded border border-gray-300 px-3 py-1 text-xs font-medium"
            >
              Copy for Slack
            </button>
          </div>
          {copyStatus && <p className="text-xs text-green-700">{copyStatus}</p>}
        </div>
      )}
    </main>
  );
}
