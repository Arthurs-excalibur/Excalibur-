import { ToolOutput } from '../simulation/validator';
import { VirtualFSLayer } from '../simulation/virtualFS';
import { listDirectorySync, basicSearchSync } from './fsUtils';
import * as child_process from 'child_process';
import * as path from 'path';

export class ToolRouter {
  private vfs: VirtualFSLayer;
  private workspacePath: string;

  constructor(workspacePath: string, vfs: VirtualFSLayer) {
    this.workspacePath = path.resolve(workspacePath);
    this.vfs = vfs;
  }

  async executeTool(tool: ToolOutput): Promise<string> {
    switch (tool.type) {
      case 'read_file':
        if (!tool.path) throw new Error("Missing 'path' for read_file tool.");
        return await this.vfs.readFile(tool.path);

      case 'list_directory':
        const dir = tool.path || '.';
        const entries = listDirectorySync(this.workspacePath, dir);
        return entries
          .map((e: any) => `${e.type === 'folder' ? '[DIR]' : '[FILE]'} ${e.name}`)
          .join('\n');

      case 'search':
        if (!tool.command) throw new Error("Missing 'command' (query) for search tool.");
        const results = basicSearchSync(this.workspacePath, tool.command);
        if (results.length === 0) return "No matches found.";
        return results
          .map((r: any) => `${r.path}:${r.line}: ${r.content}`)
          .join('\n');

      case 'write_file':
      case 'create_file':
      case 'edit_file':
        if (!tool.path || tool.content === undefined) {
          throw new Error("Missing 'path' or 'content' for file write tool.");
        }
        this.vfs.writeFile(tool.path, tool.content);
        return `Successfully staged changes for ${tool.path}.`;

      case 'patch_file':
        if (!tool.path || tool.search === undefined || tool.replace === undefined) {
          throw new Error("Missing 'path', 'search', or 'replace' for patch_file tool.");
        }
        await this.vfs.applyPatch(tool.path, tool.search, tool.replace);
        return `Successfully patched ${tool.path}.`;
        
      case 'delete_file':
        if (!tool.path) throw new Error("Missing 'path' for delete tool.");
        this.vfs.deleteFile(tool.path);
        return `Successfully deleted ${tool.path} in Virtual FS.`;

      case 'run_command':
        if (!tool.command) throw new Error("Missing 'command' for run_command tool.");
        return await this.execShellCommand(tool.command);

      default:
        throw new Error(`Unknown tool type: ${tool.type}`);
    }
  }

  private execShellCommand(command: string): Promise<string> {
    const BLOCKED_COMMANDS = ['rm -rf /', 'format', 'mkfs', 'shutdown', 'del /s']
    if (BLOCKED_COMMANDS.some(blocked => command.toLowerCase().includes(blocked))) {
      throw new Error(`Security Exception: Command "${command}" is blocked.`);
    }

    return new Promise((resolve, reject) => {
      child_process.exec(command, { cwd: this.workspacePath, timeout: 20000 }, (error, stdout, stderr) => {
        if (error) {
          return reject(new Error(stderr || error.message));
        }
        resolve(stdout || "Command executed successfully with no output.");
      });
    });
  }
}
