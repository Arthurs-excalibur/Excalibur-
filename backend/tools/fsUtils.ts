import * as fs from 'fs'
import * as path from 'path'

export interface FSTreeNode {
  name: string
  type: 'file' | 'folder'
  path: string
  children?: FSTreeNode[]
}

const IGNORE_LIST = [
  'node_modules', '.git', 'dist', 'dist-electron', 'release', '.next', 'out', 
  '.trunk', 'venv', 'env', '__pycache__', 'build', '.vscode', '.idea',
  '.ico', '.png', '.jpg', '.jpeg', '.pdf', '.svg', '.gif', '.woff', '.woff2', '.ttf', '.eot'
]

export function buildFileTree(currentPath: string, depth: number, maxDepth: number): FSTreeNode | null {
  if (depth > maxDepth) return null
  
  const base = path.basename(currentPath)
  if (IGNORE_LIST.includes(base)) return null

  try {
    const stats = fs.statSync(currentPath)
    
    if (stats.isFile()) {
      return { 
        name: base, 
        type: 'file', 
        path: currentPath.replace(/\\/g, '/') 
      }
    }

    if (stats.isDirectory()) {
      const entries = fs.readdirSync(currentPath, { withFileTypes: true })
      const children = entries
        .map(e => buildFileTree(path.join(currentPath, e.name), depth + 1, maxDepth))
        .filter((node): node is FSTreeNode => node !== null)

      return { 
        name: base, 
        type: 'folder', 
        path: currentPath.replace(/\\/g, '/'), 
        children 
      }
    }
  } catch (e) {
    console.error(`[FSUtils] Failed to process path ${currentPath}:`, e)
  }

  return null
}

export function safeReadFileSync(workspacePath: string, targetPath: string): string {
  try {
    const absPath = path.isAbsolute(targetPath) 
      ? targetPath 
      : path.resolve(workspacePath, targetPath)
      
    // Basic security check: ensure it's within workspace
    if (!absPath.startsWith(path.resolve(workspacePath))) {
      console.warn(`[Security] Attempted to read file outside workspace: ${absPath}`)
      return ''
    }

    if (fs.existsSync(absPath) && fs.statSync(absPath).isFile()) {
      return fs.readFileSync(absPath, 'utf-8')
    }
  } catch (e) {
    console.error(`[FSUtils] Failed to read file ${targetPath}:`, e)
  }
  return ''
}

export function listDirectorySync(workspacePath: string, targetPath: string) {
  try {
    const absPath = path.isAbsolute(targetPath) 
      ? targetPath 
      : path.resolve(workspacePath, targetPath)

    if (!absPath.startsWith(path.resolve(workspacePath))) {
      throw new Error('Path outside workspace')
    }

    const entries = fs.readdirSync(absPath, { withFileTypes: true })
    return entries.map(entry => ({
      name: entry.name,
      path: path.join(absPath, entry.name).replace(/\\/g, '/'),
      type: entry.isDirectory() ? 'folder' : 'file'
    }))
  } catch (e) {
    console.error(`[FSUtils] Failed to list directory ${targetPath}:`, e)
    return []
  }
}

export function basicSearchSync(workspacePath: string, query: string) {
  const IGNORE = ['node_modules', '.git', 'dist', 'dist-electron', 'release']
  const results: { path: string; line: number; content: string }[] = []
  const workspaceAbs = path.resolve(workspacePath)
  
  function searchDir(currentPath: string) {
    const base = path.basename(currentPath)
    if (IGNORE.includes(base)) return

    const stats = fs.statSync(currentPath)
    if (stats.isDirectory()) {
      const entries = fs.readdirSync(currentPath)
      for (const entry of entries) {
        searchDir(path.join(currentPath, entry))
      }
    } else if (stats.isFile()) {
      const ext = path.extname(currentPath).toLowerCase()
      const textExts = ['.ts', '.tsx', '.js', '.jsx', '.html', '.css', '.md', '.json', '.txt', '.py']
      if (textExts.includes(ext)) {
        const content = fs.readFileSync(currentPath, 'utf-8')
        const lines = content.split('\n')
        lines.forEach((line, i) => {
          if (line.includes(query)) {
            results.push({
              path: currentPath.replace(/\\/g, '/').replace(workspaceAbs.replace(/\\/g, '/'), ''),
              line: i + 1,
              content: line.trim()
            })
          }
        })
      }
    }
  }

  try {
    searchDir(workspaceAbs)
  } catch (e) {
    console.error(`[FSUtils] Search failed:`, e)
  }
  return results.slice(0, 50)
}
