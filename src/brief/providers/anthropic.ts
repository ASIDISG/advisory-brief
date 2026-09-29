import type Anthropic from '@anthropic-ai/sdk';
import type { RawJsonGenerator } from './types';

/** The minimal slice of the real `Anthropic` client this provider actually calls. Depending
 * on this instead of the full `Anthropic` class means a test's fake client only has to
 * implement one method to satisfy the type -- structurally, no `any`/unsafe cast required --
 * while a real `Anthropic` instance still satisfies it automatically. */
export interface AnthropicMessagesClient {
  messages: {
    create(params: Anthropic.MessageCreateParamsNonStreaming): Promise<Anthropic.Message>;
  };
}

/**
 * Uses Claude's real native structured-output constraint (`output_config.format`) so the
 * response text is schema-conformant JSON, not a tool-use workaround -- see
 * https://platform.claude.com/docs/en/build-with-claude/structured-outputs.
 */
export function createAnthropicGenerator(client: AnthropicMessagesClient, model?: string): RawJsonGenerator {
  return {
    async generate(prompt: string, jsonSchema: Record<string, unknown>): Promise<string> {
      const message = await client.messages.create({
        model: model || process.env.ANTHROPIC_MODEL || 'claude-sonnet-5',
        max_tokens: 4096,
        output_config: {
          format: { type: 'json_schema', schema: jsonSchema },
        },
        messages: [{ role: 'user', content: prompt }],
      });

      const textBlock = message.content.find((b): b is Anthropic.TextBlock => b.type === 'text');
      if (!textBlock) {
        throw new Error('Anthropic generator: model response contained no text block to parse as JSON.');
      }
      return textBlock.text;
    },
  };
}
