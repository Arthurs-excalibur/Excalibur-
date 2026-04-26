import * as child_process from 'child_process';
import * as path from 'path';

export interface VerificationResult {
  success: boolean;
  error?: string;
  logs?: string;
}

export class VerifierAgent {
  private workspacePath: string;

  constructor(workspacePath: string) {
    this.workspacePath = workspacePath;
  }

  async verify(filePath: string): Promise<VerificationResult> {
    const ext = path.extname(filePath).toLowerCase();
    
    // 1. TypeScript/JavaScript Syntax Check (Basic TSC check if possible)
    if (['.ts', '.tsx', '.js', '.jsx'].includes(ext)) {
       // We'll run a "fast" check using tsc --noEmit if it's available in the project
       return this.runCommand(`npx tsc "${filePath}" --noEmit --esModuleInterop --skipLibCheck`);
    }

    // Default success for unsupported types for now
    return { success: true };
  }

  private runCommand(cmd: string): Promise<VerificationResult> {
    return new Promise((resolve) => {
      child_process.exec(cmd, { cwd: this.workspacePath }, (error, stdout, stderr) => {
        if (error) {
          resolve({
            success: false,
            error: stderr || error.message,
            logs: stdout
          });
        } else {
          resolve({ success: true, logs: stdout });
        }
      });
    });
  }
}
