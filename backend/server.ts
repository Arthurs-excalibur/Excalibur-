import { SessionManager } from './sessions/sessionManager';
import { OrchestratorLoop } from './orchestrator/loop';

export class ExcaliburBackend {
  private sessionManager: SessionManager;
  private orchestrator: OrchestratorLoop;

  constructor() {
    this.sessionManager = new SessionManager();
    this.orchestrator   = new OrchestratorLoop(this.sessionManager);
  }

  handleInitializeSession(sessionId: string, workspacePath: string) {
    // Upsert: if session already exists (e.g. re-open same project), reset its state
    const existing = this.sessionManager.getSession(sessionId);
    if (existing) return existing;
    return this.sessionManager.createSession(sessionId, workspacePath);
  }

  handleGetSession(sessionId: string) {
    return this.sessionManager.getSession(sessionId);
  }

  async handleStartTask(sessionId: string, taskDescription: string, context: any, onEvent: (event: any) => void) {
    try {
      await this.orchestrator.runTask(sessionId, taskDescription, context, onEvent);
    } catch (e: any) {
      onEvent({ type: 'kernel_error', data: { message: e.message } });
    }
  }

  handleStopTask(sessionId: string) {
    this.orchestrator.stopExecution(sessionId);
  }

  async handleCommitDiff(sessionId: string, filePath: string, content: string) {
    return this.orchestrator.commitDiff(sessionId, filePath, content);
  }

  // ─── Electron IPC Bindings ──────────────────────────────────────────────────

  setupIpcHandlers(ipcMain: any) {
    // Session lifecycle
    ipcMain.handle('ai:session:create', (_: any, { id, workspacePath }: { id: string; workspacePath: string }) => {
      return this.handleInitializeSession(id, workspacePath);
    });

    ipcMain.handle('ai:session:get', (_: any, id: string) => {
      return this.handleGetSession(id);
    });

    // Task execution (fire-and-forget → events stream back to renderer)
    ipcMain.on('ai:task:start', (event: any, { sessionId, task, context }: { sessionId: string; task: string; context: any }) => {
      this.handleStartTask(sessionId, task, context, (updateEvent) => {
        event.sender.send(`ai:update:${sessionId}`, updateEvent);
      });
    });

    ipcMain.on('ai:task:stop', (_: any, sessionId: string) => {
      this.handleStopTask(sessionId);
    });

    // Diff accept — user approved a change; write to disk and git commit
    ipcMain.handle('ai:commit:diff', async (_: any, { sessionId, filePath, content }: {
      sessionId: string;
      filePath: string;
      content: string;
    }) => {
      try {
        await this.handleCommitDiff(sessionId, filePath, content);
        return { success: true };
      } catch (e: any) {
        return { success: false, error: e.message };
      }
    });
  }
}
