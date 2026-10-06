import { NextResponse } from 'next/server';
import { z } from 'zod';
import { generateBrief } from '@/src/brief/generate';
import { resolveGenerator } from '@/src/brief/providers/resolve';

const RequestSchema = z.object({
  sourceText: z.string().min(1).max(20000),
  sourceUrl: z.string().url().nullable(),
  sourceLabel: z.string().min(1),
});

// Not cached and not statically prerenderable -- a real, per-request model call, matching
// Next.js 16's Route Handler behavior for a POST (POST responses are never cached, unlike
// GET, per node_modules/next/dist/docs/01-app/01-getting-started/15-route-handlers.md).
export async function POST(request: Request) {
  const generator = resolveGenerator();
  if (!generator) {
    return NextResponse.json(
      { error: 'Neither ANTHROPIC_API_KEY nor GEMINI_API_KEY is configured on this server.' },
      { status: 500 }
    );
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Request body must be valid JSON.' }, { status: 400 });
  }

  const parsed = RequestSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.message }, { status: 400 });
  }

  try {
    const brief = await generateBrief(generator, parsed.data);
    return NextResponse.json({ brief });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: `Brief generation failed: ${message}` }, { status: 502 });
  }
}
