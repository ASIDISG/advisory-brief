import type { RawJsonGenerator } from './types';

/** The minimal slice of the real `GoogleGenAI` client this provider actually calls --
 * matching `AnthropicMessagesClient`'s pattern in `anthropic.ts` so both providers are
 * testable the same way, with a small fake object rather than an unsafe cast. */
export interface GeminiContentClient {
  models: {
    generateContent(params: {
      model: string;
      contents: string;
      config: { responseMimeType: string; responseJsonSchema: Record<string, unknown> };
    }): Promise<{ text?: string }>;
  };
}

/**
 * A free-tier alternative to the Anthropic provider, for contributors who don't have (or
 * don't want to pay for) Anthropic API access -- Google AI Studio issues Gemini API keys with
 * a real free tier and no card required. Uses Gemini's own native structured-output field,
 * `responseJsonSchema`, which -- per `@google/genai`'s own type-definition comment on it --
 * accepts a real JSON Schema (unlike the older, more restricted `responseSchema` field), the
 * same one `generateBrief` already builds via zod's `z.toJSONSchema`. `responseMimeType` must
 * also be set to `application/json` for `responseJsonSchema` to take effect; this is
 * documented in the SDK's own type definitions, not assumed.
 */
export function createGeminiGenerator(client: GeminiContentClient, model?: string): RawJsonGenerator {
  // Default confirmed live, not guessed: `gemini-flash-latest` (Google's own
  // stay-current alias, the more "correct" choice in principle) reliably returned a real
  // 503 "high demand" for `responseMimeType: application/json` requests specifically
  // (plain text generation on the same model succeeded every time) when this was tested.
  // `gemini-3.1-flash-lite` was tried next and handled a real structured-output call
  // (this project's actual schema) correctly on the first attempt. Revisit this default
  // if `gemini-flash-latest`'s JSON-mode capacity issue turns out to have been temporary.
  const resolveModel = () => model || process.env.GEMINI_MODEL || 'gemini-3.1-flash-lite';

  return {
    describe: () => ({ provider: 'gemini', model: resolveModel() }),
    async generate(prompt: string, jsonSchema: Record<string, unknown>): Promise<string> {
      // Gemini's `responseJsonSchema` supports a documented subset of JSON Schema keywords
      // that does not include the top-level `$schema` meta field zod's `toJSONSchema()`
      // always adds -- stripped here rather than risking the API rejecting or ignoring the
      // whole schema over one unsupported key it doesn't need.
      const schemaForGemini = { ...jsonSchema };
      delete schemaForGemini.$schema;

      const response = await client.models.generateContent({
        model: resolveModel(),
        contents: prompt,
        config: {
          responseMimeType: 'application/json',
          responseJsonSchema: schemaForGemini,
        },
      });

      if (!response.text) {
        throw new Error('Gemini generator: model response contained no text to parse as JSON.');
      }
      return response.text;
    },
  };
}
