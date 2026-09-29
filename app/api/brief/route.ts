import Anthropic from '@anthropic-ai/sdk';
import { GoogleGenAI } from '@google/genai';
import { NextResponse } from 'next/server';
import { z } from 'zod';
import { generateBrief } from '@/src/brief/generate';
import { createAnthropicGenerator } from '@/src/brief/providers/anthropic';
import { createGeminiGenerator } from '@/src/brief/providers/gemini';
import type { RawJsonGenerator } from '@/src/brief/providers/types';

const RequestSchema = z.object({
  sourceText: z.string().min(1).max(20000),
  sourceUrl: z.string().url().nullable(),
  sourceLabel: z.string().min(1),
});

/** Picks whichever provider has a configured key -- Anthropic first if both are set, since
 * it's this project's primary target; Gemini as the free-tier fallback for contributors
 * without Anthropic access (see PLAN.md's "Gemini support" note). Neither SDK client is
 * constructed unless its own key is present, so a contributor who only has one key never
 * pays the (tiny) cost of instantiating the other. */
function resolveGenerator(): RawJsonGenerator | null {
  if (process.env.ANTHROPIC_API_KEY) {
    return createAnthropicGenerator(new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY }));
  }
  if (process.env.GEMINI_API_KEY) {
    return createGeminiGenerator(new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY }));
  }
  return null;
}

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
