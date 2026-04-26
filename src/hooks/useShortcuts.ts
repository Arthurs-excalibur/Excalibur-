import { useEffect } from 'react'
import { useAppStore } from '../store/useAppStore'

export const useKeyboardShortcuts = () => {
  const { 
    toggleSidebar, 
    toggleBottomPanel, 
    setActiveLeftTab, 
    isProjectOpen,
    sidebarCollapsed
  } = useAppStore()

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const isCmd = e.metaKey || e.ctrlKey

      if (isCmd && e.key === 'b') {
        e.preventDefault()
        toggleSidebar()
      }
      
      if (isCmd && e.key === 'j') {
        e.preventDefault()
        toggleBottomPanel()
      }

      if (isCmd && e.key === 'f') {
        e.preventDefault()
        if (sidebarCollapsed) toggleSidebar()
        setActiveLeftTab('search')
      }

      if (isCmd && e.key === 'e') {
          e.preventDefault()
          if (sidebarCollapsed) toggleSidebar()
          setActiveLeftTab('explorer')
      }

      if (isCmd && e.key === 'g') {
          e.preventDefault()
          if (sidebarCollapsed) toggleSidebar()
          setActiveLeftTab('git')
      }

      if (isCmd && e.key === 'l') {
          e.preventDefault()
          useAppStore.getState().toggleCommandPalette()
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [toggleSidebar, toggleBottomPanel, setActiveLeftTab, sidebarCollapsed])
}
