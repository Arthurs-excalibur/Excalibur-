import { z } from 'zod';

export const PlannerOutputSchema = z.object({
  goal: z.string(),
  steps: z.array(z.string()),
});

export type PlannerOutput = z.infer<typeof PlannerOutputSchema>;

export const ToolOutputSchema = z.object({
  type: z.enum([
    "create_file", 
    "edit_file", 
    "patch_file", 
    "write_file", 
    "delete_file", 
    "run_command", 
    "read_file", 
    "list_directory", 
    "search"
  ]),
  path: z.string().optional(),
  content: z.string().optional(),
  command: z.string().optional(),
  search: z.string().optional(),
  replace: z.string().optional(),
});

export type ToolOutput = z.infer<typeof ToolOutputSchema>;

export class ValidationLayer {
  static parsePlannerOutput(rawText: string): PlannerOutput {
    try {
      // Try direct parse first (for grammar-enforced outputs)
      return PlannerOutputSchema.parse(JSON.parse(rawText.trim()));
    } catch {
      // Fallback to markdown extraction
      const match = rawText.match(/```json\n([\s\S]*?)\n```/) || rawText.match(/```([\s\S]*?)```/) || [null, rawText];
      const jsonStr = match[1].trim();
      return PlannerOutputSchema.parse(JSON.parse(jsonStr));
    }
  }

  static parseToolOutput(rawText: string): ToolOutput {
    try {
      // Try direct parse first
      return ToolOutputSchema.parse(JSON.parse(rawText.trim()));
    } catch {
      // Fallback to markdown extraction
      const match = rawText.match(/```json\n([\s\S]*?)\n```/) || rawText.match(/```([\s\S]*?)```/) || [null, rawText];
      const jsonStr = (match[1] || rawText).trim();
      return ToolOutputSchema.parse(JSON.parse(jsonStr));
    }
  }
}
