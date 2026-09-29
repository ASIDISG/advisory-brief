import { describe, expect, it, vi } from 'vitest';
import { createGeminiGenerator, type GeminiContentClient } from './gemini';

function fakeClient(text?: string): GeminiContentClient {
  return { models: { generateContent: vi.fn().mockResolvedValue({ text }) } };
}

describe('createGeminiGenerator', () => {
  it('returns the response text and sets responseMimeType/responseJsonSchema correctly', async () => {
    const client = fakeClient('{"ok":true}');
    const generator = createGeminiGenerator(client);
    const result = await generator.generate('a prompt', { type: 'object', properties: {} });

    expect(result).toBe('{"ok":true}');
    const callArgs = vi.mocked(client.models.generateContent).mock.calls[0][0];
    expect(callArgs.config.responseMimeType).toBe('application/json');
    expect(callArgs.config.responseJsonSchema).toEqual({ type: 'object', properties: {} });
    expect(callArgs.contents).toBe('a prompt');
  });

  it('strips the top-level $schema key before sending, since Gemini does not support it', async () => {
    const client = fakeClient('{}');
    const generator = createGeminiGenerator(client);
    await generator.generate('x', { $schema: 'https://json-schema.org/draft/2020-12/schema', type: 'object' });

    const callArgs = vi.mocked(client.models.generateContent).mock.calls[0][0];
    expect(callArgs.config.responseJsonSchema).not.toHaveProperty('$schema');
    expect(callArgs.config.responseJsonSchema).toEqual({ type: 'object' });
  });

  it('throws a clear error when the response has no text', async () => {
    const client = fakeClient(undefined);
    const generator = createGeminiGenerator(client);
    await expect(generator.generate('x', {})).rejects.toThrow(/no text/);
  });

  it('defaults to gemini-3.1-flash-lite when no model is given and GEMINI_MODEL is unset', async () => {
    const original = process.env.GEMINI_MODEL;
    delete process.env.GEMINI_MODEL;
    try {
      const client = fakeClient('{}');
      const generator = createGeminiGenerator(client);
      await generator.generate('x', {});
      const callArgs = vi.mocked(client.models.generateContent).mock.calls[0][0];
      expect(callArgs.model).toBe('gemini-3.1-flash-lite');
    } finally {
      if (original !== undefined) process.env.GEMINI_MODEL = original;
    }
  });
});
