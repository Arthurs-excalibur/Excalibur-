import { OllamaClient, ChatRequest } from '../llm/ollamaClient';
import { ToolOutput, ValidationLayer } from '../simulation/validator';

export class CoderAgent {
  private llmClient: OllamaClient;

  constructor() {
    this.llmClient = new OllamaClient();
  }

  async generateCodeAction(
    taskContext: string, 
    stepDescription: string, 
    projectStructure: string, 
    projectMemory: string,
    editorContext: any,
    onToken?: (token: string) => void,
    signal?: AbortSignal
  ): Promise<ToolOutput> {
    const systemPrompt = `You are an expert AI software engineer. You execute EXACTLY ONE tool call at a time to accomplish the current step.

EDITOR CONTEXT (Current visibility):
- Active File: ${editorContext?.activeFile || 'None'}
- Selection: ${editorContext?.selection ? `"${editorContext.selection.text}"` : 'None'}
- Content: ${editorContext?.activeFileContent ? "\n```\n" + editorContext.activeFileContent + "\n```" : 'None'}

PROJECT STRUCTURE (High-level only):
${projectStructure}

### CONTEXT DISCOVERY RULES:
1. The PROJECT STRUCTURE above is pruned to save space. 
2. If you need to see files inside a directory not listed in detail, use "list_directory".
3. If you need to see the content of a file to understand how to patch it, use "read_file".
4. Always explore before making assumptions about exported members or file paths.

### EFFICIENCY & LATENCY RULES:
1. **Prefer "patch_file"** over "write_file" for all existing files.
2. In "patch_file":
   - The "search" block MUST be a unique, exact, and contiguous block of code from the file.
   - Include enough surrounding lines to ensure uniqueness.
   - You MUST match whitespace and indentation exactly.
3. Use "write_file" ONLY for creating entirely new files or total rewrites (last resort).
4. Use "read_file" or "list_directory" if you lack context about a file's content or structure.

### TOOL SCHEMAS:
- patch_file: { "type": "patch_file", "path": "relative/path.ext", "search": "old code...", "replace": "new code..." }
- write_file: { "type": "write_file", "path": "relative/path.ext", "content": "full content..." }
- read_file: { "type": "read_file", "path": "relative/path.ext" }
- list_directory: { "type": "list_directory", "path": "relative/dir" }
- search: { "type": "search", "command": "query" }
- run_command: { "type": "run_command", "command": "shell cmd" }
- delete_file: { "type": "delete_file", "path": "relative/path.ext" }

### RESPONSE FORMAT:
- You MUST output ONLY a raw JSON object matching the schemas above. 
- No conversation, no markdown wrappers, no prose.`;

    const request: ChatRequest = {
      model: 'local',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: `CONTEXT:\n${taskContext}\n\nCURRENT STEP:\n${stepDescription}` }
      ],
      stream: !!onToken,
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

    let responseText = '';
    if (onToken) {
      await this.llmClient.chatStream(request, (chunk) => {
        responseText += chunk;
        onToken(chunk);
      }, signal);
    } else {
      responseText = await this.llmClient.chat(request, signal);
    }

    return ValidationLayer.parseToolOutput(responseText);
  }
}
