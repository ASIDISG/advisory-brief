import { describe, expect, it, vi } from 'vitest';
import { createAnthropicGenerator, type AnthropicMessagesClient } from './anthropic';

function fakeClient(content: unknown[]): AnthropicMessagesClient {
  return { messages: { create: vi.fn().mockResolvedValue({ content }) } };
}

describe('createAnthropicGenerator', () => {
  it('extracts the text block and passes through the JSON schema', async () => {
    const client = fakeClient([{ type: 'text', text: '{"ok":true}' }]);
    const generator = createAnthropicGenerator(client);
    const result = await generator.generate('a prompt', { type: 'object' });

    expect(result).toBe('{"ok":true}');
    const callArgs = vi.mocked(client.messages.create).mock.calls[0][0];
    expect(callArgs.output_config?.format).toEqual({ type: 'json_schema', schema: { type: 'object' } });
    expect(callArgs.messages[0]).toEqual({ role: 'user', content: 'a prompt' });
  });

  it('throws a clear error when the response has no text block', async () => {
    const client = fakeClient([]);
    const generator = createAnthropicGenerator(client);
    await expect(generator.generate('x', {})).rejects.toThrow(/no text block/);
  });

  it('defaults to claude-sonnet-5 when no model is given and ANTHROPIC_MODEL is unset', async () => {
    const original = process.env.ANTHROPIC_MODEL;
    delete process.env.ANTHROPIC_MODEL;
    try {
      const client = fakeClient([{ type: 'text', text: '{}' }]);
      const generator = createAnthropicGenerator(client);
      await generator.generate('x', {});
      const callArgs = vi.mocked(client.messages.create).mock.calls[0][0];
      expect(callArgs.model).toBe('claude-sonnet-5');
    } finally {
      if (original !== undefined) process.env.ANTHROPIC_MODEL = original;
    }
  });
});
