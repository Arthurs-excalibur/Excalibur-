import { Session, ExecutionState } from '../orchestrator/state';
import * as fs from 'fs';
import * as path from 'path';

export class SessionManager {
  private sessions: Map<string, Session> = new Map();

  private getSessionPath(workspacePath: string): string {
    return path.join(workspacePath, '.excalibur', 'session.json');
  }

  createSession(id: string, workspacePath: string): Session {
    // Try to load existing session from disk first
    const diskSession = this.loadSessionFromDisk(workspacePath);
    if (diskSession) {
      this.sessions.set(id, diskSession);
      return diskSession;
    }

    const initialState: ExecutionState = {
      sessionId: id,
      status: 'IDLE',
      currentAgent: 'none',
      stepIndex: 0,
      plan: [],
      logs: [],
      iterations: 0
    };

    const session: Session = {
      id,
      workspacePath,
      state: initialState,
      vfs: { files: {}, snapshotId: Date.now().toString() }, // Use object for persistence
      gitBranch: 'main',
    };

    this.sessions.set(id, session);
    this.saveSessionToDisk(session);
    return session;
  }

  getSession(id: string): Session | undefined {
    return this.sessions.get(id);
  }

  updateSessionState(id: string, partialState: Partial<ExecutionState>): Session {
    const session = this.getSession(id);
    if (!session) throw new Error(`Session not found: ${id}`);

    session.state = { ...session.state, ...partialState };
    this.saveSessionToDisk(session);
    return session;
  }

  private saveSessionToDisk(session: Session): void {
    try {
      const saveDir = path.join(session.workspacePath, '.excalibur');
      if (!fs.existsSync(saveDir)) fs.mkdirSync(saveDir, { recursive: true });
      fs.writeFileSync(this.getSessionPath(session.workspacePath), JSON.stringify(session, null, 2));
    } catch (e) {
      console.error('[SessionManager] Failed to save session:', e);
    }
  }

  private loadSessionFromDisk(workspacePath: string): Session | null {
    try {
      const p = this.getSessionPath(workspacePath);
      if (fs.existsSync(p)) {
        const raw = fs.readFileSync(p, 'utf-8');
        return JSON.parse(raw);
      }
    } catch (e) {
      console.error('[SessionManager] Failed to load session:', e);
    }
    return null;
  }

  deleteSession(id: string): void {
    const session = this.getSession(id);
    if (session) {
      try {
        const p = this.getSessionPath(session.workspacePath);
        if (fs.existsSync(p)) fs.unlinkSync(p);
      } catch {}
    }
    this.sessions.delete(id);
  }

  getAllSessions(): Session[] {
    return Array.from(this.sessions.values());
  }
}
