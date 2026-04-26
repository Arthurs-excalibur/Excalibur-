import { OllamaClient, ChatRequest } from '../llm/ollamaClient';
import { PlannerOutput, ValidationLayer } from '../simulation/validator';

export class PlannerAgent {
  private llmClient: OllamaClient;

  constructor() {
    this.llmClient = new OllamaClient();
  }

  async generatePlan(
    taskDescription: string, 
    projectStructure: string, 
    projectMemory: string,
    editorContext: any,
    signal?: AbortSignal
  ): Promise<PlannerOutput> {
    const systemPrompt = `You are the Planner Agent for an AI-powered IDE.
Break down the user coding task into clear, ordered steps.

EDITOR CONTEXT (Current visibility):
- Active File: ${editorContext?.activeFile || 'None'}
- Selection: ${editorContext?.selection ? `"${editorContext.selection.text}"` : 'None'}
- Content Table: ${editorContext?.activeFileContent ? "\n```\n" + editorContext.activeFileContent + "\n```" : 'None'}

PROJECT STRUCTURE (High-level only):
${projectStructure}

### CONTEXT DISCOVERY RULES:
1. The PROJECT STRUCTURE above is pruned to save space. 
2. If you need more information about a specific directory to create a better plan, your steps should include exploring that directory via "list_directory" or "read_file" as the first priority.
3. Plan for exploration explicitly if the task requires deep project knowledge.

PROJECT MEMORY:
${projectMemory}

CRITICAL: Your ENTIRE response must be a single JSON code block — no prose before or after it.
\`\`\`json
{
  "goal": "one sentence describing the overall goal",
  "steps": ["step 1 action", "step 2 action", "step 3 action"]
}
\`\`\`
Keep steps specific and actionable (e.g. "Create src/utils/auth.ts with JWT validation logic"). Max 6 steps.`;

    const request: ChatRequest = {
      model: 'local',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: taskDescription }
      ],
      stream: false,
      response_format: { type: 'json_object' },
      grammar: `
        root   ::= object
        object ::= "{" space ( pair ( "," space pair )* )? "}"
        pair   ::= string ":" space value
        string ::= "\\"" ( [^\\"\\\\] | "\\\\" ( [\\"\\\\/bfnrt] | "u" [0-9a-fA-F] [0-9a-fA-F] [0-9a-fA-F] [0-9a-fA-F] ) )* "\\""
        value  ::= string | number | object | array | "true" | "false" | "null"
        number ::= "-"? ( [0-9] | [1-9] [0-9]* ) ( "." [0-9]+ )? ( [eE] [+-]? [0-9]+ )?
        array  ::= "[" space ( value ( "," space value )* )? "]"
        space  ::= [ \\t\\n\\r]*
      `.trim()
    };

    const responseText = await this.llmClient.chat(request, signal);
    return ValidationLayer.parsePlannerOutput(responseText);
  }
}
