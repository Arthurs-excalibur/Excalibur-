import * as fs from 'fs';
import * as path from 'path';

export class FileSystemTools {
  private workspacePath: string;

  constructor(workspacePath: string) {
    this.workspacePath = path.resolve(workspacePath);
  }

  private resolvePath(targetPath: string): string {
    const resolvedPath = path.resolve(this.workspacePath, targetPath);
    if (!resolvedPath.startsWith(this.workspacePath)) {
      throw new Error("Security Error: Cannot access files outside the workspace");
    }
    return resolvedPath;
  }

  async createFile(targetPath: string, content: string = ''): Promise<void> {
    const filePath = this.resolvePath(targetPath);
    await fs.promises.mkdir(path.dirname(filePath), { recursive: true });
    await fs.promises.writeFile(filePath, content, 'utf-8');
  }

  async editFile(targetPath: string, content: string): Promise<void> {
    const filePath = this.resolvePath(targetPath);
    if (!fs.existsSync(filePath)) {
      throw new Error(`File not found: ${targetPath}`);
    }
    await fs.promises.writeFile(filePath, content, 'utf-8');
  }

  async deleteFile(targetPath: string): Promise<void> {
    const filePath = this.resolvePath(targetPath);
    if (!fs.existsSync(filePath)) {
      throw new Error(`File not found: ${targetPath}`);
    }
    await fs.promises.unlink(filePath);
  }

  async readFile(targetPath: string): Promise<string> {
    const filePath = this.resolvePath(targetPath);
    if (!fs.existsSync(filePath)) {
      throw new Error(`File not found: ${targetPath}`);
    }
    return await fs.promises.readFile(filePath, 'utf-8');
  }

  async listFiles(targetPath: string = '.'): Promise<string[]> {
    const dirPath = this.resolvePath(targetPath);
    if (!fs.existsSync(dirPath)) {
      throw new Error(`Directory not found: ${targetPath}`);
    }
    
    const entries = await fs.promises.readdir(dirPath, { withFileTypes: true });
    return entries.map(entry => entry.name);
  }
}
