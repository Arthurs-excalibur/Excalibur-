import { app, BrowserWindow, ipcMain, dialog } from 'electron'
import path from 'path'
import fs from 'fs'
import { spawn, ChildProcess } from 'child_process'
import * as pty from 'node-pty'
import simpleGit from 'simple-git'
import { ExcaliburBackend } from '../backend/server'
import { buildFileTree } from '../backend/tools/fsUtils'

const SETTINGS_FILE = path.join(app.getPath('userData'), 'settings.json')

interface AppSettings {
  gpuLayers: number
  contextSize: number
  modelPath: string
}

const DEFAULT_SETTINGS: AppSettings = {
  gpuLayers: 24,
  contextSize: 4096,
  modelPath: ''
}

function getSettings(): AppSettings {
  try {
    if (fs.existsSync(SETTINGS_FILE)) {
      return { ...DEFAULT_SETTINGS, ...JSON.parse(fs.readFileSync(SETTINGS_FILE, 'utf-8')) }
    }
  } catch (e) {}
  return DEFAULT_SETTINGS
}

function saveSettings(settings: AppSettings) {
  fs.writeFileSync(SETTINGS_FILE, JSON.stringify(settings, null, 2))
}

process.env.DIST = path.join(__dirname, '../dist')
process.env.VITE_DEV_SERVER_URL = process.env['VITE_DEV_SERVER_URL']

let win: BrowserWindow | null

// ─── llama-server Child Process ───────────────────────────────────────────────

let llamaProcess: ChildProcess | null = null

function getLlamaServerPath(): string {
  // We are in /electron or /dist-electron. Root is ../
  const devPath  = path.resolve(__dirname, '../bin/llama-server.exe')
  const prodPath = path.join(process.resourcesPath || '', 'bin', 'llama-server.exe')
  
  if (fs.existsSync(devPath))  return devPath
  if (fs.existsSync(prodPath)) return prodPath
  return 'llama-server' // fallback to PATH
}

function getModelPath(): string {
  const devPath  = path.resolve(__dirname, '../models/qwen2.5-coder-7b-instruct-q4_k_m.gguf')
  const prodPath = path.join(process.resourcesPath || '', 'models', 'qwen2.5-coder-7b-instruct-q4_k_m.gguf')
  
  if (fs.existsSync(devPath))  return devPath
  if (fs.existsSync(prodPath)) return prodPath
  return ''
}

function startLlamaServer() {
  const settings = getSettings()
  const serverExe = getLlamaServerPath()
  const modelPath  = settings.modelPath || getModelPath()

  if (!modelPath) {
    console.error('[llama-server] Model file not found. LLM calls will fail.')
    return
  }

  // Update settings with detected model if it was empty
  if (!settings.modelPath) {
    settings.modelPath = modelPath
    saveSettings(settings)
  }

  console.log(`[llama-server] Starting with model: ${modelPath}`)

  llamaProcess = spawn(serverExe, [
    '--model',      modelPath,
    '--host',       '127.0.0.1',
    '--port',       '8080',
    '--ctx-size',   settings.contextSize.toString(),
    '--n-gpu-layers', settings.gpuLayers.toString(),
    '--log-disable',
  ], { stdio: ['ignore', 'pipe', 'pipe'] })

  llamaProcess.stdout?.on('data', (d) => {
    const msg = d.toString().trim()
    if (msg) console.log(`[llama-server] ${msg}`)
  })
  llamaProcess.stderr?.on('data', (d) => {
    const msg = d.toString().trim()
    if (msg) console.error(`[llama-server] ${msg}`)
  })

  llamaProcess.on('close', (code) => {
    console.log(`[llama-server] exited with code ${code}`)
    llamaProcess = null
    // Notify renderer if window is still open
    win?.webContents.send('llama:status', { running: false, code })
  })

  // Give it 2s to start, then inform renderer
  setTimeout(() => {
    const running = llamaProcess !== null && !llamaProcess.killed
    console.log(`[llama-server] Status check — running: ${running}`)
    win?.webContents.send('llama:status', { running, modelPath })
  }, 2000)
}

function stopLlamaServer() {
  if (llamaProcess && !llamaProcess.killed) {
    console.log('[llama-server] Shutting down...')
    llamaProcess.kill('SIGTERM')
    llamaProcess = null
  }
}

// ─── Window ───────────────────────────────────────────────────────────────────

function createWindow() {
  win = new BrowserWindow({
    width: 1400,
    height: 900,
    frame: false,
    transparent: true,
    backgroundColor: '#00000000',
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      nodeIntegration: true,
      contextIsolation: false,
    },
  })

  win.webContents.on('did-finish-load', () => {
    win?.webContents.send('main-process-message', (new Date).toLocaleString())
  })

  if (process.env.VITE_DEV_SERVER_URL) {
    win.loadURL(process.env.VITE_DEV_SERVER_URL)
  } else {
    win.loadFile(path.join(process.env.DIST, 'index.html'))
  }
}

app.on('window-all-closed', () => {
  stopLlamaServer()
  if (process.platform !== 'darwin') {
    app.quit()
    win = null
  }
})

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) createWindow()
})

app.whenReady().then(async () => {
  createWindow()
  
  // Fix Git Dubious Ownership issue globally for the user's workspace
  try {
     const { execSync } = require('child_process')
     execSync('git config --global --add safe.directory *')
     console.log('[Main] Applied Git safe.directory fix')
  } catch (e) {
     console.error('[Main] Failed to apply Git fix', e)
  }

  startLlamaServer()

  // Register Global Shortcuts
  const { globalShortcut } = require('electron')
  globalShortcut.register('CommandOrControl+Shift+P', () => {
    win?.webContents.send('command:palette:toggle')
  })
})

ipcMain.handle('llama:health', async () => {
  if (!llamaProcess || llamaProcess.killed) return { status: 'stopped' }
  try {
    const res = await fetch('http://127.0.0.1:8080/health')
    return await res.json()
  } catch (e) {
    return { status: 'error', error: String(e) }
  }
})

// ─── IPC: Window Controls ─────────────────────────────────────────────────────

ipcMain.handle('window:open-directory', async () => {
  if (!win) return null
  const result = await dialog.showOpenDialog(win, { properties: ['openDirectory'] })
  if (result.canceled) return null
  return result.filePaths[0]
})

ipcMain.on('window:minimize', () => { if (win) win.minimize() })
ipcMain.on('window:maximize', () => {
  if (!win) return
  win.isMaximized() ? win.unmaximize() : win.maximize()
})
ipcMain.on('window:close', () => { if (win) win.close() })

// ─── IPC: llama-server Status ─────────────────────────────────────────────────

ipcMain.handle('llama:status', () => ({
  running: llamaProcess !== null && !llamaProcess.killed,
}))

ipcMain.on('llama:restart', () => {
  stopLlamaServer()
  setTimeout(startLlamaServer, 500)
})

// ─── IPC: File System ─────────────────────────────────────────────────────────

// Safe path resolver — enforces workspace boundary
function resolveWorkspacePath(workspacePath: string, targetPath: string): string {
  const workspace = path.resolve(workspacePath)
  const resolved  = path.isAbsolute(targetPath)
    ? path.resolve(targetPath)
    : path.resolve(workspace, targetPath)

  if (!resolved.startsWith(workspace + path.sep) && resolved !== workspace) {
    throw new Error(`Security: Path "${targetPath}" is outside workspace boundary.`)
  }
  return resolved
}



ipcMain.handle('fs:readdir', async (_, dirPath: string) => {
  const absolutePath = path.isAbsolute(dirPath) ? dirPath : path.join(process.cwd(), dirPath)
  const entries = fs.readdirSync(absolutePath, { withFileTypes: true })
  return entries.map(entry => {
    const fullPath = path.join(absolutePath, entry.name).replace(/\\/g, '/')
    return {
      name:      entry.name,
      path:      fullPath,
      type:      entry.isDirectory() ? 'folder' : 'file',
      extension: entry.name.split('.').pop(),
    }
  })
})

ipcMain.handle('fs:readFile', async (_, filePath: string) => {
  const absolutePath = path.isAbsolute(filePath) ? filePath : path.join(process.cwd(), filePath)
  return fs.readFileSync(absolutePath, 'utf-8')
})

ipcMain.handle('fs:tree', async (_, { rootPath, maxDepth = 4 }: { rootPath: string; maxDepth?: number }) => {
  return buildFileTree(path.resolve(rootPath), 0, maxDepth)
})

ipcMain.handle('fs:writeFile', async (_, { path: filePath, content, workspacePath }: {
  path: string
  content: string
  workspacePath?: string
}) => {
  let absolutePath: string
  if (workspacePath) {
    // Boundary-checked write — used by the AI commit flow
    absolutePath = resolveWorkspacePath(workspacePath, filePath)
  } else {
    // Legacy direct write (from editor save) — resolve as absolute
    absolutePath = path.isAbsolute(filePath) ? filePath : path.join(process.cwd(), filePath)
  }
  console.log(`[IPC] fs:writeFile → ${absolutePath}`)
  fs.mkdirSync(path.dirname(absolutePath), { recursive: true })
  fs.writeFileSync(absolutePath, content, 'utf-8')
  return true
})

ipcMain.handle('fs:search', async (_, { rootPath, query }: { rootPath: string; query: string }) => {
  const { basicSearchSync } = require('../backend/tools/fsUtils')
  return basicSearchSync(rootPath, query)
})

ipcMain.handle('fs:delete', async (_, filePath: string) => {
  const p = path.resolve(filePath)
  if (fs.statSync(p).isDirectory()) {
    fs.rmSync(p, { recursive: true })
  } else {
    fs.unlinkSync(p)
  }
  return true
})

ipcMain.handle('fs:create', async (_, { path: filePath, type }: { path: string; type: 'file' | 'folder' }) => {
  const p = path.resolve(filePath)
  if (type === 'folder') {
    fs.mkdirSync(p, { recursive: true })
  } else {
    fs.mkdirSync(path.dirname(p), { recursive: true })
    fs.writeFileSync(p, '', 'utf-8')
  }
  return true
})

ipcMain.handle('git:branch', async (_, cwd) => {
  try {
    const { execSync } = require('child_process')
    return execSync('git rev-parse --abbrev-ref HEAD', { cwd, encoding: 'utf-8' }).trim()
  } catch (e) {
    return null
  }
})

// ─── IPC: Workspace Persistence ───────────────────────────────────────────────

const WORKSPACES_FILE = path.join(app.getPath('userData'), 'workspaces.json')

function getWorkspaces() {
  try {
    if (fs.existsSync(WORKSPACES_FILE)) return JSON.parse(fs.readFileSync(WORKSPACES_FILE, 'utf-8'))
  } catch (e) {}
  return []
}

function addWorkspace(workspace: { name: string; path: string }) {
  const list    = getWorkspaces()
  const filtered = list.filter((w: any) => w.path !== workspace.path)
  const newList  = [workspace, ...filtered].slice(0, 10)
  fs.writeFileSync(WORKSPACES_FILE, JSON.stringify(newList))
}

ipcMain.handle('git:status', async (_, cwd) => {
  try {
    const git = simpleGit(cwd)
    const status = await git.status()
    return {
      branch: status.current || 'detached',
      modified: status.modified,
      staged: status.staged,
      untracked: status.not_added,
      deleted: status.deleted,
    }
  } catch (e) {
    console.error('[IPC:git:status]', e)
    return null
  }
})

ipcMain.handle('workspaces:get', () => getWorkspaces())
ipcMain.handle('workspaces:add', (_, ws) => addWorkspace(ws))

// ─── IPC: Terminal (node-pty) ─────────────────────────────────────────────────

const ptyProcesses: Record<string, pty.IPty> = {}

ipcMain.on('terminal:create', (event, { id, cwd }: { id: string; cwd: string }) => {
  const shell = process.platform === 'win32' ? 'powershell.exe' : 'bash'
  const ptyProcess = pty.spawn(shell, [], {
    name: 'xterm-color',
    cols: 100,
    rows: 40,
    cwd: path.resolve(cwd),
    env: process.env as any,
  })

  ptyProcesses[id] = ptyProcess
  ptyProcess.onData((data)           => { event.sender.send(`terminal:data:${id}`, data) })
  ptyProcess.onExit(({ exitCode })   => {
    event.sender.send(`terminal:exit:${id}`, exitCode)
    delete ptyProcesses[id]
  })
})

ipcMain.on('terminal:write',  (_, { id, data }: { id: string; data: string }) => {
  if (ptyProcesses[id]) ptyProcesses[id].write(data)
})
ipcMain.on('terminal:resize', (_, { id, cols, rows }: { id: string; cols: number; rows: number }) => {
  if (ptyProcesses[id]) ptyProcesses[id].resize(cols, rows)
})
ipcMain.on('terminal:kill',   (_, id: string) => {
  if (ptyProcesses[id]) { ptyProcesses[id].kill(); delete ptyProcesses[id] }
})

const aiBackend = new ExcaliburBackend()
aiBackend.setupIpcHandlers(ipcMain)
