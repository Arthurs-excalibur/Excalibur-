import { OllamaClient, ChatRequest } from '../llm/ollamaClient';

export class DebuggerAgent {
  private llmClient: OllamaClient;

  constructor() {
    this.llmClient = new OllamaClient();
  }

  async analyzeError(
    taskContext: string,
    errorMessage: string,
    signal?: AbortSignal,
    lastOutput?: string
  ): Promise<string> {
    const systemPrompt = `You are the Debugger Agent for an AI-powered IDE.
A coding step has failed. Analyze the error and provide a SINGLE concrete fix instruction.

Your response must be ONE plain-text sentence describing exactly what the next attempt should do differently.
No JSON. No bullet points. No explanation. Just the fix instruction.

Example good response: "Use path.join instead of string concatenation for cross-platform compatibility."
Example bad response: "There are several potential issues here. First, let's consider..."`;

    const userContent = [
      `TASK CONTEXT: ${taskContext}`,
      `ERROR MESSAGE: ${errorMessage}`,
      lastOutput ? `LAST OUTPUT:\n${lastOutput}` : '',
    ].filter(Boolean).join('\n\n');

    const request: ChatRequest = {
      model: 'local', // llama-server uses whatever .gguf it was started with
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userContent }
      ],
      stream: false
    };

    const response = await this.llmClient.chat(request, signal);
    // Strip any accidental markdown or quotes
    return response.replace(/^["'`]+|["'`]+$/g, '').trim();
  }
}
