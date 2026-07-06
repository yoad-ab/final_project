import { useState, useEffect } from 'react'
import { ActivityBar, type SidebarSection } from './ActivityBar'
import { ContextPanel } from './ContextPanel'
import { MenuBar } from './MenuBar'
import { StatusBar } from './StatusBar'
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
  const [aiOpen, setAiOpen] = useState(false)
  const [bottomOpen, setBottomOpen] = useState(false)

  function handleActivityClick(section: SidebarSection) {
    setActiveSection(prev => prev === section ? null : section)
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', overflow: 'hidden' }}>
      <MenuBar onToggleAI={() => setAiOpen(o => !o)} aiOpen={aiOpen} />

      <div style={{ flex: 1, display: 'flex', overflow: 'hidden', minHeight: 0 }}>
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

      <StatusBar onToggleBottom={() => setBottomOpen(o => !o)} />
    </div>
  )
}
