import { SessionManager } from '../sessions/sessionManager';
import { PlannerAgent } from '../agents/planner';
import { CoderAgent } from '../agents/coder';
import { DebuggerAgent } from '../agents/debugger';
import { VerifierAgent } from '../agents/verifier';
import { MemoryManager } from '../tools/memory';
import { VirtualFSLayer } from '../simulation/virtualFS';
import { ToolRouter } from '../tools/router';
import { GitTools } from '../tools/git';
import { buildFileTree, safeReadFileSync } from '../tools/fsUtils';
import * as path from 'path';
import * as fs from 'fs';

// ─── Diff Types (mirrored from renderer types) ────────────────────────────────
export interface DiffEntry {
  id: string;
  file: string;
  before: string;
  after: string;
  timestamp: number;
}

export class OrchestratorLoop {
  private sessionManager: SessionManager;
  private abortControllers: Map<string, AbortController> = new Map();
  private MAX_ITERATIONS = 15; // Increased for autonomous recovery

  constructor(sessionManager: SessionManager) {
    this.sessionManager = sessionManager;
  }

  async runTask(sessionId: string, taskDescription: string, context: any, onEvent: (event: any) => void) {
    const session = this.sessionManager.getSession(sessionId);
    if (!session) throw new Error(`Session ${sessionId} not found`);

    const abortController = new AbortController();
    this.abortControllers.set(sessionId, abortController);
    const signal = abortController.signal;

    const planner = new PlannerAgent();
    const coder = new CoderAgent();
    const debuggerAgent = new DebuggerAgent();
    const verifier = new VerifierAgent(session.workspacePath);
    const memory = new MemoryManager(session.workspacePath);
    const vfs = new VirtualFSLayer(session.workspacePath);
    const router = new ToolRouter(session.workspacePath, vfs);

    const log = (msg: string, status?: any) => {
      onEvent({ type: 'kernel_log', data: { message: msg } });
      const currentLogs = this.sessionManager.getSession(sessionId)!.state.logs;
      this.sessionManager.updateSessionState(sessionId, {
        logs: [...currentLogs, msg],
        ...(status ? { status } : {}),
      });
    };

    let nodeCount = 0;
    const MAX_NODES = 150;

    const treeToText = (node: any, indent = '', depth = 0): string => {
      if (!node || nodeCount > MAX_NODES) return '';
      nodeCount++;

      let text = `${indent}${node.type === 'folder' ? '📂' : '📄'} ${node.name}\n`;
      
      if (node.children) {
        if (depth >= 3 && node.children.length > 5) {
          text += `${indent}  ... (${node.children.length} more items)\n`;
        } else {
          node.children.forEach((c: any) => {
            text += treeToText(c, indent + '  ', depth + 1);
          });
        }
      }
      return text;
    };

    const safeReadFile = (filePath: string): string => {
      try {
        const abs = path.resolve(session.workspacePath, filePath);
        if (fs.existsSync(abs)) return fs.readFileSync(abs, 'utf-8');
      } catch { /* ignore */ }
      return '';
    };

    let iterations = 0;
    let stepContext = taskDescription;

    try {
      // ── 0. SCANNING ─────────────────────────────────────────────────────────
      onEvent({ type: 'kernel_intent', data: 'analyzing_project_structure' });
      log('Scanning project structure (aware depth: 3)...', 'PLANNING');
      
      const tree = buildFileTree(session.workspacePath, 0, 3);
      const projectStructure = treeToText(tree);
      const projectMemoryText = memory.toString();

      // Read active file content if provided in context
      let activeFileContent = '';
      if (context?.activeFile) {
        log(`Reading active file: ${path.basename(context.activeFile)}`);
        activeFileContent = safeReadFileSync(session.workspacePath, context.activeFile);
      }
      
      const enrichedContext = {
        ...context,
        activeFileContent
      };

      // ── 1. PLANNING ─────────────────────────────────────────────────────────
      onEvent({ type: 'kernel_intent', data: 'generating_plan' });
      log('Transition: PLANNING', 'PLANNING');
      this.sessionManager.updateSessionState(sessionId, { currentAgent: 'planner' });

      let plan;
      try {
        log('Generating plan from LLM...');
        plan = await planner.generatePlan(taskDescription, projectStructure, projectMemoryText, enrichedContext, signal);
      } catch (e: any) {
        throw new Error(`Planner failed: ${e.message}`);
      }

      const planSteps: any[] = plan.steps.map((s: string, i: number) => ({
        id: `step-${i}`,
        description: s,
        status: 'pending',
      }));

      this.sessionManager.updateSessionState(sessionId, { plan: planSteps });
      log(`Plan established: "${plan.goal}" — ${planSteps.length} steps.`);
      onEvent({ type: 'kernel_plan', data: { goal: plan.goal, steps: plan.steps } });

      // Persist goal to project memory
      memory.update({ projectGoal: plan.goal });

      // ── 2. EXECUTOR LOOP ─────────────────────────────────────────────────────
      for (let i = 0; i < planSteps.length; i++) {
        const step = planSteps[i];
        step.status = 'in_progress';
        this.sessionManager.updateSessionState(sessionId, { stepIndex: i });
        onEvent({ type: 'kernel_step', data: { index: i } });
        log(`Step ${i + 1}/${planSteps.length}: ${step.description}`);

        let stepSuccess = false;
        let retryCount = 0;
        let lastError = '';
        let rePlanNeeded = false;

        while (!stepSuccess && iterations < this.MAX_ITERATIONS) {
          iterations++;
          this.sessionManager.updateSessionState(sessionId, { iterations });
          signal.throwIfAborted();

          // ── CHECKPOINT ────────────────────────────────────────────────────
          vfs.checkpoint();

          // ── CODING ────────────────────────────────────────────────────────
          onEvent({ type: 'kernel_intent', data: 'brainstorming_solution' });
          log(`Transition: CODING (Iteration ${iterations})`, 'CODING');
          this.sessionManager.updateSessionState(sessionId, { currentAgent: 'coder' });

          let toolAction;
          try {
            toolAction = await coder.generateCodeAction(
              stepContext,
              step.description,
              projectStructure,
              projectMemoryText,
              enrichedContext,
              (token) => onEvent({ type: 'kernel_token', data: token }), // LIVE STREAMING
              signal
            );
            log(`Tool selected: ${toolAction.type}${toolAction.path ? ` → ${toolAction.path}` : ''}`);
          } catch (e: any) {
            log(`Tool validation failed: ${e.message}`);
            retryCount++;
            if (retryCount >= 3) throw new Error('Coder failed JSON validation 3 times. Halting.');
            stepContext = `Previous attempt produced invalid JSON. ${stepContext}`;
            continue;
          }

          const filePath = toolAction.path || '';
          const contentBefore = filePath ? safeReadFile(filePath) : '';

          // ── EXECUTING (via VirtualFS) ─────────────────────────────────────
          onEvent({ type: 'kernel_intent', data: `executing_${toolAction.type}` });
          log('Transition: EXECUTING', 'SIMULATING');
          let execResult = '';
          try {
            execResult = await router.executeTool(toolAction);

            // ── VERIFICATION ────────────────────────────────────────────────
            if (['create_file', 'edit_file', 'write_file', 'patch_file'].includes(toolAction.type)) {
              log(`Verifying: ${filePath}...`);
              const verifyRes = await verifier.verify(filePath);
              if (!verifyRes.success) {
                log(`Verification FAILED: ${verifyRes.error}`, 'DEBUGGING');
                throw new Error(`Syntax Error detected in ${filePath}: ${verifyRes.error}`);
              }
              log(`Verification PASSED: ${filePath}`);
            }

            log(`Execution result: ${execResult}`);
            stepSuccess = true;

            // Stage diff if a file was modified
            if (filePath && ['create_file', 'edit_file', 'write_file', 'patch_file'].includes(toolAction.type)) {
              const contentAfter = await vfs.readFile(filePath);
              const diff: DiffEntry = {
                id: `diff-${Date.now()}-${i}`,
                file: filePath,
                before: contentBefore,
                after: contentAfter,
                timestamp: Date.now(),
              };
              onEvent({ type: 'kernel_diff', data: diff });
            }

            // Bridge context
            stepContext = [
              taskDescription,
              `Successfully completed: ${step.description}`,
              `Result: ${execResult}`,
            ].join('\n');

          } catch (e: any) {
            log(`STALLED — Recovery Mode: ${e.message}`, 'DEBUGGING');
            this.sessionManager.updateSessionState(sessionId, { currentAgent: 'debugger' });
            lastError = e.message;

            // ROLLBACK in Virtual FS
            log(`Rolling back due to error...`);
            vfs.rollback();

            let fixInstruction: string;
            try {
              fixInstruction = await debuggerAgent.analyzeError(stepContext, e.message, signal, execResult);
              log(`Debugger Advice: ${fixInstruction}`);
            } catch (debugErr: any) {
              fixInstruction = 'Try a simpler approach.';
            }

            stepContext = `PRIOR ATTEMPT FAILED.\nError: ${e.message}\nAdvice: ${fixInstruction}\nContext: ${taskDescription}`;
            
            // If we've failed twice on the same step, force a re-plan
            retryCount++;
            if (retryCount >= 2) {
              rePlanNeeded = true;
            }
            continue;
          }
        }

        if (rePlanNeeded || (i > 0 && i % 3 === 0)) {
          log('Transition: RE-PLANNING', 'PLANNING');
          const updatedPlan = await planner.generatePlan(
            `UPDATE PLAN based on current progress.\nOriginal Goal: ${plan.goal}\nRemaining Steps: ${planSteps.slice(i+1).map(s => s.description).join(', ')}`,
            projectStructure,
            memory.toString(),
            enrichedContext,
            signal
          );
          // Splice remaining steps with new ones
          planSteps.splice(i + 1, planSteps.length - (i + 1), ...updatedPlan.steps.map((s: string, j: number) => ({
            id: `step-${i+1+j}`,
            description: s,
            status: 'pending',
          })));
          this.sessionManager.updateSessionState(sessionId, { plan: planSteps });
          log(`Plan revised. ${planSteps.length - (i + 1)} new steps established.`);
        }

        if (!stepSuccess) throw new Error(`Step ${i + 1} failed. Last error: ${lastError}`);
        step.status = 'done';
      }

      log('Transition: AWAITING_REVIEW', 'COMPLETED');
      this.sessionManager.updateSessionState(sessionId, { currentAgent: 'none' });

      const dirtyCount = vfs.dirtyFiles.size;
      log(`Task complete. ${dirtyCount} file(s) staged. Review in the Review panel.`);
      onEvent({ type: 'kernel_complete', data: { staged: dirtyCount } });

    } catch (error: any) {
      if (error.name === 'AbortError') {
        log('Execution aborted by user.', 'IDLE');
        onEvent({ type: 'kernel_aborted' });
      } else {
        log(`Kernel Panic: ${error.message}`, 'FAILED');
        onEvent({ type: 'kernel_error', data: { message: error.message } });
      }
    } finally {
      this.abortControllers.delete(sessionId);
    }
  }

  async commitDiff(sessionId: string, filePath: string, content: string): Promise<void> {
    const session = this.sessionManager.getSession(sessionId);
    if (!session) throw new Error(`Session ${sessionId} not found`);

    const git = new GitTools(session.workspacePath);
    const vfs = new VirtualFSLayer(session.workspacePath);
    vfs.writeFile(filePath, content);
    await vfs.commitToDisk();
    await git.commitChanges(`Excalibur: Accepted diff for ${path.basename(filePath)}`);
  }

  stopExecution(sessionId: string) {
    const controller = this.abortControllers.get(sessionId);
    if (controller) controller.abort();
  }
}
