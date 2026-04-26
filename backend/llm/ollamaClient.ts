// ─── LlamaServer Client (OpenAI-compatible) ───────────────────────────────────
// Targets the llama-server binary from llama.cpp, spawned by electron/main.ts.
// Uses the OpenAI /v1/chat/completions endpoint — no Ollama required.

export interface ChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

export interface ChatRequest {
  model: string;
  messages: ChatMessage[];
  stream?: boolean;
  response_format?: { type: 'json_object' };
  grammar?: string;
}

// llama-server is started by the Electron main process.
const LLAMA_SERVER_URL = 'http://127.0.0.1:8080';

export class OllamaClient {
  private baseUrl = LLAMA_SERVER_URL;

  async chatStream(
    request: ChatRequest,
    onChunk: (chunk: string) => void,
    signal?: AbortSignal
  ): Promise<void> {
    const response = await fetch(`${this.baseUrl}/v1/chat/completions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: request.model,
        messages: request.messages,
        stream: true,
        temperature: 0.2,
        response_format: request.response_format,
        grammar: request.grammar,
      }),
      signal,
    });

    if (!response.ok) {
      const errText = await response.text().catch(() => response.statusText);
      throw new Error(`llama-server error [${response.status}]: ${errText}`);
    }

    if (!response.body) throw new Error('No response body from llama-server');

    const reader = response.body.getReader();
    const decoder = new TextDecoder('utf-8');

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      const chunk = decoder.decode(value, { stream: true });
      const lines = chunk.split('\n').filter(Boolean);

      for (const line of lines) {
        // SSE format: "data: {...}" or "data: [DONE]"
        if (!line.startsWith('data:')) continue;
        const data = line.slice(5).trim();
        if (data === '[DONE]') return;
        try {
          const parsed = JSON.parse(data);
          const content = parsed.choices?.[0]?.delta?.content;
          if (content) onChunk(content);
        } catch {
          // Incomplete JSON chunk — skip
        }
      }
    }
  }

  async chat(request: ChatRequest, signal?: AbortSignal): Promise<string> {
    const response = await fetch(`${this.baseUrl}/v1/chat/completions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: request.model,
        messages: request.messages,
        stream: false,
        temperature: 0.2,
        response_format: request.response_format,
        grammar: request.grammar,
      }),
      signal,
    });

    if (!response.ok) {
      const errText = await response.text().catch(() => response.statusText);
      throw new Error(`llama-server error [${response.status}]: ${errText}. Is llama-server running? Check Electron logs.`);
    }

    const data = await response.json();
    return data.choices?.[0]?.message?.content || '';
  }
}

