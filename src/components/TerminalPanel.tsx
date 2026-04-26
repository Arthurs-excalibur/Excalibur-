import React, { useRef, useEffect } from 'react'
import { Terminal } from '@xterm/xterm'
import { FitAddon } from '@xterm/addon-fit'
import '@xterm/xterm/css/xterm.css'
import { useAppStore } from '../store/useAppStore'

export const TerminalPanel: React.FC = () => {
  const terminalRef = useRef<HTMLDivElement>(null)
  const xtermRef = useRef<Terminal | null>(null)
  const fitAddonRef = useRef<FitAddon | null>(null)
  
  const { 
    terminalId, 
    initTerminal, 
    writeToTerminal, 
    resizeTerminal,
    activeBottomTab,
    setActiveBottomTab,
    currentProjectPath
  } = useAppStore()

  // Initialize xterm.js
  useEffect(() => {
    if (!terminalRef.current) return

    const term = new Terminal({
      cursorBlink: true,
      theme: {
        background: '#0a0a0c',
        foreground: '#e4e4e7',
        cursor: '#a78bfa',
        selectionBackground: '#52525b',
        black: '#000000',
        red: '#ff5555',
        green: '#50fa7b',
        yellow: '#f1fa8c',
        blue: '#bd93f9',
        magenta: '#ff79c6',
        cyan: '#8be9fd',
        white: '#bfbfbf',
        brightBlack: '#4d4d4d',
        brightRed: '#ff6e67',
        brightGreen: '#5af78e',
        brightYellow: '#f4f99d',
        brightBlue: '#caa9fa',
        brightMagenta: '#ff92d0',
        brightCyan: '#9aedfe',
        brightWhite: '#e6e6e6',
      },
      fontSize: 12,
      fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
      allowProposedApi: true,
    })

    const fitAddon = new FitAddon()
    term.loadAddon(fitAddon)
    term.open(terminalRef.current)
    fitAddon.fit()

    xtermRef.current = term
    fitAddonRef.current = fitAddon

    // Handle user input
    term.onData((data) => {
      writeToTerminal(data)
    })

    // Listen for incoming data from the backend pty
    let cleanup: (() => void) | undefined
    if (terminalId) {
      cleanup = window.electron.on(`terminal:data:${terminalId}`, (data) => {
        term.write(data)
      })
    }

    const handleResize = () => {
      if (fitAddonRef.current) {
        fitAddonRef.current.fit()
        resizeTerminal(term.cols, term.rows)
      }
    }

    window.addEventListener('resize', handleResize)

    // Initial resize sync
    setTimeout(() => {
      handleResize()
    }, 100)

    return () => {
      if (cleanup) cleanup()
      window.removeEventListener('resize', handleResize)
      term.dispose()
    }
  }, [terminalId])

  // Ensure terminal is initialized when project opens
  useEffect(() => {
    if (!terminalId && currentProjectPath) {
      initTerminal(currentProjectPath)
    }
  }, [terminalId, currentProjectPath])

  // Refit when tab becomes active
  useEffect(() => {
    if (activeBottomTab === 'terminal' && fitAddonRef.current) {
      fitAddonRef.current.fit()
    }
  }, [activeBottomTab])

  return (
    <div className="flex flex-col h-full bg-surface-raised overflow-hidden">
      {/* Tab header */}
      <div className="flex items-center justify-between border-b border-border-subtle flex-shrink-0 bg-surface-base">
        <div className="tab-bar border-none">
          <button
            onClick={() => setActiveBottomTab('terminal')}
            className={`tab-item capitalize border-r-0 ${activeBottomTab === 'terminal' ? 'active' : ''}`}
          >
            Terminal
          </button>
          <button
            onClick={() => setActiveBottomTab('output')}
            className={`tab-item capitalize border-r-0 ${activeBottomTab === 'output' ? 'active' : ''}`}
          >
            Output
          </button>
        </div>

        <div className="flex items-center gap-1 px-4">
          <div className="flex items-center gap-2 text-[10px] font-bold text-text-muted uppercase tracking-wider">
            <span className="w-1.5 h-1.5 rounded-full bg-accent-green" />
            Active Shell
          </div>
        </div>
      </div>

      {/* Terminal Content */}
      <div className={`flex-1 relative overflow-hidden bg-[#0a0a0c] ${activeBottomTab !== 'terminal' ? 'hidden' : ''}`}>
        <div 
          ref={terminalRef} 
          className="absolute inset-x-0 inset-y-0 p-2"
        />
      </div>

      {/* Output Content */}
      {activeBottomTab === 'output' && (
        <div className="flex-1 overflow-y-auto p-4 bg-surface-raised">
          <p className="text-xs text-text-muted opacity-60 font-mono">
            System logs and execution trace will appear here.
          </p>
        </div>
      )}
    </div>
  )
}
