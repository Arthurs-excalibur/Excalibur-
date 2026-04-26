import * as fs from 'fs';
import * as path from 'path';

export class VirtualFSLayer {
  private workspacePath: string;
  public dirtyFiles: Map<string, string | null>; 
  private snapshots: Map<string, string | null>[] = [];

  constructor(workspacePath: string) {
    this.workspacePath = path.resolve(workspacePath);
    this.dirtyFiles = new Map();
  }

  checkpoint(): void {
    this.snapshots.push(new Map(this.dirtyFiles));
  }

  rollback(): void {
    const last = this.snapshots.pop();
    if (last) {
      this.dirtyFiles = last;
    }
  }

  async applyPatch(targetPath: string, search: string, replace: string): Promise<void> {
    const current = await this.readFile(targetPath);
    if (!current.includes(search)) {
      throw new Error(`Patch failure: Could not find exact search block in ${targetPath}. Ensure whitespace match.`);
    }
    // Only replace first occurrence for safety
    const updated = current.replace(search, replace);
    this.writeFile(targetPath, updated);
  }

  private resolvePath(targetPath: string): string {
    const resolved = path.resolve(this.workspacePath, targetPath);
    if (!resolved.startsWith(this.workspacePath)) {
      throw new Error(`Security Error: Path ${targetPath} is outside workspace boundaries.`);
    }
    return resolved;
  }

  async readFile(targetPath: string): Promise<string> {
    const filePath = this.resolvePath(targetPath);
    if (this.dirtyFiles.has(filePath)) {
      const content = this.dirtyFiles.get(filePath);
      if (content === null) throw new Error(`File not found (deleted in VFS): ${targetPath}`);
      return content || '';
    }
    if (!fs.existsSync(filePath)) {
      throw new Error(`File not found on disk: ${targetPath}`);
    }
    return await fs.promises.readFile(filePath, 'utf-8');
  }

  writeFile(targetPath: string, content: string): void {
    const filePath = this.resolvePath(targetPath);
    this.dirtyFiles.set(filePath, content);
  }

  deleteFile(targetPath: string): void {
    const filePath = this.resolvePath(targetPath);
    this.dirtyFiles.set(filePath, null); 
  }

  reset(): void {
    this.dirtyFiles.clear();
  }

  async commitToDisk(): Promise<void> {
    for (const [filePath, content] of this.dirtyFiles.entries()) {
      if (content === null) {
        if (fs.existsSync(filePath)) {
          await fs.promises.unlink(filePath);
        }
      } else {
        await fs.promises.mkdir(path.dirname(filePath), { recursive: true });
        await fs.promises.writeFile(filePath, content, 'utf-8');
      }
    }
    this.dirtyFiles.clear();
  }
}
