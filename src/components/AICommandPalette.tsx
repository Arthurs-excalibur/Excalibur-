import React, { useState, useEffect, useRef } from 'react'
import { useAppStore } from '../store/useAppStore'

export const AICommandPalette: React.FC = () => {
    const { isCommandPaletteOpen, setIsCommandPaletteOpen, runAITask } = useAppStore()
    const [input, setInput] = useState('')
    const containerRef = useRef<HTMLDivElement>(null)

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape') setIsCommandPaletteOpen(false)
        }
        window.addEventListener('keydown', handleKeyDown)
        return () => window.removeEventListener('keydown', handleKeyDown)
    }, [])

    if (!isCommandPaletteOpen) return null

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault()
        if (!input.trim()) return
        runAITask(input.trim())
        setInput('')
        setIsCommandPaletteOpen(false)
    }

    return (
        <div className="fixed inset-0 z-[100] flex items-start justify-center pt-[15vh] px-4 animate-fade-in pointer-events-none">
            <div 
                className="fixed inset-0 bg-black/40 backdrop-blur-sm pointer-events-auto" 
                onClick={() => setIsCommandPaletteOpen(false)}
            />
            
            <div 
                ref={containerRef}
                className="w-full max-w-2xl bg-surface-raised border border-border-strong rounded-2xl shadow-float overflow-hidden animate-slide-up pointer-events-auto"
            >
                <form onSubmit={handleSubmit} className="p-4">
                    <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-accent-purple/10 flex items-center justify-center text-accent-cyan font-bold text-xs ring-1 ring-accent-cyan/20">
                            EX
                        </div>
                        <input
                            autoFocus
                            type="text"
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            placeholder="What can I help you build?"
                            className="flex-1 bg-transparent text-lg text-text-primary outline-none placeholder:text-text-muted"
                        />
                        <div className="flex items-center gap-1.5 px-2 py-1 rounded bg-surface-overlay border border-border-subtle text-[10px] font-bold text-text-muted">
                            <span className="opacity-50">⏎</span>
                            <span>SUBMIT</span>
                        </div>
                    </div>
                </form>

                <div className="px-3 pb-3">
                    <div className="grid grid-cols-3 gap-2">
                        <Suggestion icon="🔍" text="Find code patterns" />
                        <Suggestion icon="🛠" text="Refactor selection" />
                        <Suggestion icon="🧪" text="Generate unit tests" />
                    </div>
                </div>

                <div className="bg-surface-overlay/50 border-t border-border-subtle px-4 py-2 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                         <Shortcut hint="ESC" label="CLOSE" />
                         <Shortcut hint="TAB" label="SETTINGS" />
                    </div>
                    <span className="text-[10px] text-text-muted font-bold tracking-widest uppercase opacity-40">Excalibur v0.1.0</span>
                </div>
            </div>
        </div>
    )
}

const Suggestion: React.FC<{ icon: string; text: string }> = ({ icon, text }) => (
    <div className="p-2 rounded-lg bg-surface-base/50 hover:bg-accent-purple/5 border border-border-subtle/30 hover:border-accent-purple/20 transition-all cursor-pointer group">
        <div className="text-sm mb-1">{icon}</div>
        <div className="text-[10px] text-text-muted group-hover:text-text-secondary leading-tight line-clamp-1">{text}</div>
    </div>
)

const Shortcut: React.FC<{ hint: string; label: string }> = ({ hint, label }) => (
    <div className="flex items-center gap-1.5">
        <span className="px-1.5 py-0.5 rounded bg-surface-base border border-border-subtle text-[9px] font-bold text-text-muted">{hint}</span>
        <span className="text-[9px] font-bold text-text-muted opacity-60 uppercase">{label}</span>
    </div>
)
