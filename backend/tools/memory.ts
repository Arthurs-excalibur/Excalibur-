import * as fs from 'fs'
import * as path from 'path'

export interface MemoryData {
  projectGoal?: string
  lastTasks?: string[]
  knownFiles?: Record<string, string>
  decisions?: string[]
}

export class MemoryManager {
  private memoryPath: string
  private data: MemoryData

  constructor(workspacePath: string) {
    const excaliburDir = path.resolve(workspacePath, '.excalibur')
    if (!fs.existsSync(excaliburDir)) {
      fs.mkdirSync(excaliburDir, { recursive: true })
    }
    this.memoryPath = path.join(excaliburDir, 'memory.json')
    this.data = this.load()
  }

  private load(): MemoryData {
    if (fs.existsSync(this.memoryPath)) {
      try {
        return JSON.parse(fs.readFileSync(this.memoryPath, 'utf-8'))
      } catch (e) {
        console.error('[Memory] Failed to load memory:', e)
      }
    }
    return {
      lastTasks: [],
      decisions: []
    }
  }

  public save() {
    try {
      fs.writeFileSync(this.memoryPath, JSON.stringify(this.data, null, 2))
    } catch (e) {
      console.error('[Memory] Failed to save memory:', e)
    }
  }

  public update(update: Partial<MemoryData>) {
    this.data = { ...this.data, ...update }
    this.save()
  }

  public addDecision(decision: string) {
    if (!this.data.decisions) this.data.decisions = []
    this.data.decisions.push(decision)
    this.save()
  }

  public toString(): string {
    return [
      `Overall Project Goal: ${this.data.projectGoal || 'Not set'}`,
      `Key Decisions: ${this.data.decisions?.slice(-5).join('; ') || 'None'}`,
      `Recent Context: AI task history is stored locally in .excalibur/memory.json`
    ].join('\n')
  }
}
