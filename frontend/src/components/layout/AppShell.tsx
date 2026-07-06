import { useState, useEffect } from 'react'
import { ActivityBar, type SidebarSection } from './ActivityBar'
import { ContextPanel } from './ContextPanel'
import { EditorArea } from './EditorArea'
import { BottomPanel } from './BottomPanel'
import { AIDrawer } from '../assistant/AIDrawer'
import { useWorkspace } from '@/api/workspace'
import { useTabsStore } from '@/store/tabs'

export function AppShell() {
  const [activeSection, setActiveSection] = useState<SidebarSection | null>('analyses')
  const { data: workspace } = useWorkspace()
  const setWorkspaceId = useTabsStore((s) => s.setWorkspaceId)

  useEffect(() => {
    if (workspace?.path) setWorkspaceId(workspace.path)
  }, [workspace?.path, setWorkspaceId])

  useEffect(() => {
    function handler(e: Event) {
      const section = (e as CustomEvent<SidebarSection>).detail
      setActiveSection(section)
    }
    window.addEventListener('sidebar:show-section', handler)
    return () => window.removeEventListener('sidebar:show-section', handler)
  }, [])

  // Capture-phase listener: prevent the browser (Arc, Chrome, etc.) from acting
  // on Ctrl/Cmd+S before Monaco's own keybinding handler fires.
  useEffect(() => {
    function suppressBrowserSave(e: KeyboardEvent) {
      if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault()
      }
    }
    document.addEventListener('keydown', suppressBrowserSave, { capture: true })
    return () => document.removeEventListener('keydown', suppressBrowserSave, { capture: true })
  }, [])

  const [aiOpen, setAiOpen] = useState(false)
  const [bottomOpen, setBottomOpen] = useState(false)

  function handleActivityClick(section: SidebarSection) {
    setActiveSection(prev => prev === section ? null : section)
  }

  return (
    <div style={{ display: 'flex', height: '100vh', overflow: 'hidden' }}>
      <ActivityBar active={activeSection} onSelect={handleActivityClick} />

      {activeSection && (
        <ContextPanel section={activeSection} />
      )}

      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', minWidth: 0 }}>
        <EditorArea />
        {bottomOpen && <BottomPanel onClose={() => setBottomOpen(false)} />}
      </div>

      {aiOpen && <AIDrawer onClose={() => setAiOpen(false)} />}
    </div>
  )
}
