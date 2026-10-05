import { NextResponse } from 'next/server';
import { stellarCoreReleasesSource } from '../../../../src/sources/github-releases';

export async function GET() {
  try {
    const advisories = await stellarCoreReleasesSource.fetchLatest();
    return NextResponse.json({ advisories });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
