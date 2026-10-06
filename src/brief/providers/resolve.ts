import Anthropic from '@anthropic-ai/sdk';
import { GoogleGenAI } from '@google/genai';
import { createAnthropicGenerator } from './anthropic';
import { createGeminiGenerator } from './gemini';
import type { RawJsonGenerator } from './types';

/** Picks whichever provider has a configured key -- Anthropic first if both are set, since
 * it's this project's primary target; Gemini as the free-tier fallback for contributors
 * without Anthropic access. Neither SDK client is constructed unless its own key is present,
 * so a contributor who only has one key never pays the (tiny) cost of instantiating the other.
 * Shared by the API route and the recording script so both choose a provider the same way. */
export function resolveGenerator(env: NodeJS.ProcessEnv = process.env): RawJsonGenerator | null {
  if (env.ANTHROPIC_API_KEY) {
    return createAnthropicGenerator(new Anthropic({ apiKey: env.ANTHROPIC_API_KEY }));
  }
  if (env.GEMINI_API_KEY) {
    return createGeminiGenerator(new GoogleGenAI({ apiKey: env.GEMINI_API_KEY }));
  }
  return null;
}
