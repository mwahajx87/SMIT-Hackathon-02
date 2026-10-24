import { env } from '../../config/env.js';

/**
 * Universal LLM Client supporting tool-calling declarations, timeouts, and friendly fallback.
 */
export class LLMClient {
  constructor(config = {}) {
    this.apiKey = config.apiKey || env.AI_API_KEY;
    this.model = config.model || env.AI_MODEL || 'gemini-3.8-flash';
    this.provider = config.provider || env.AI_PROVIDER || 'gemini';
    this.timeoutMs = config.timeoutMs || env.AI_TIMEOUT_MS || 15000;
  }

  /**
   * Main completion method with timeout and structured tool support.
   */
  async generate({ systemPrompt, messages, tools = [] }) {
    if (!this.apiKey) {
      return {
        answer: null,
        toolCalls: [],
        fallback: true,
        reason: 'AI service API key is not configured on the server.'
      };
    }

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), this.timeoutMs);

    try {
      let baseUrl = env.AI_BASE_URL || 'https://generativelanguage.googleapis.com/v1beta/openai';
      if (baseUrl.endsWith('/')) {
        baseUrl = baseUrl.slice(0, -1);
      }

      const response = await fetch(`${baseUrl}/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${this.apiKey}`
        },
        body: JSON.stringify({
          model: this.model,
          messages: [
            { role: 'system', content: systemPrompt },
            ...messages
          ],
          tools: tools.length > 0 ? tools : undefined,
          temperature: 0.1
        }),
        signal: controller.signal
      });

      clearTimeout(timeout);

      if (!response.ok) {
        // Read raw body first so we never lose the real error
        const rawBody = await response.text().catch(() => '');
        let apiMessage = rawBody;
        try {
          const errJson = JSON.parse(rawBody);
          apiMessage = errJson.error?.message || errJson.message || rawBody;
        } catch (_) {}

        console.error(
          `[LLMClient] HTTP ${response.status} from AI provider` +
          ` (model=${this.model}, url=${baseUrl}/chat/completions):`,
          apiMessage
        );

        let reason;
        if (response.status === 401 || response.status === 403) {
          reason = 'AI API key is invalid or lacks permission. Get a valid key at aistudio.google.com/apikey and set AI_API_KEY in .env.';
        } else if (response.status === 404) {
          reason = `AI 404: model "${this.model}" not found OR API key is invalid/malformed. ` +
            `Valid models: gemini-3.8-flash, gemini-1.5-flash. ` +
            `Get a valid AIza... key at aistudio.google.com/apikey and set AI_API_KEY in .env.`;
        } else if (response.status === 429) {
          reason = 'AI provider rate limit exceeded. Please try again shortly.';
        } else {
          reason = `AI provider returned status ${response.status}: ${apiMessage}`;
        }
        throw new Error(reason);
      }

      const json = await response.json();
      const choice = json.choices?.[0]?.message;

      return {
        answer: choice?.content || '',
        toolCalls: choice?.tool_calls || [],
        fallback: false
      };
    } catch (err) {
      clearTimeout(timeout);
      return {
        answer: null,
        toolCalls: [],
        fallback: true,
        reason: err.name === 'AbortError' ? 'AI request timed out.' : err.message
      };
    }
  }
}

export const defaultLLMClient = new LLMClient();
