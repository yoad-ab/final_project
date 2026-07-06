import { create } from 'zustand'
import { persist } from 'zustand/middleware'

// "analysis:foo" | "recipe:bar" | "run:baz"
export type TabId = string

export type TabKind = 'analysis' | 'recipe' | 'run' | 'datafile'

export function parseTabId(tabId: TabId): { kind: TabKind; label: string } {
  const idx = tabId.indexOf(':')
  return {
    kind: tabId.slice(0, idx) as TabKind,
    label: tabId.slice(idx + 1),
  }
}

export function makeTabId(kind: TabKind, id: string): TabId {
  return `${kind}:${id}`
}

interface WorkspaceState {
  tabs: TabId[]
  activeTab: TabId | null
}

interface TabsStore {
  workspaceId: string
  workspaces: Record<string, WorkspaceState>

  setWorkspaceId: (id: string) => void
  openTab: (tabId: TabId) => void
  closeTab: (tabId: TabId) => void
  setActiveTab: (tabId: TabId) => void
  reorderTabs: (activeId: TabId, overId: TabId) => void
}

function getWs(state: TabsStore): WorkspaceState {
  return state.workspaces[state.workspaceId] ?? { tabs: [], activeTab: null }
}

function setWs(state: TabsStore, ws: WorkspaceState): Partial<TabsStore> {
  return {
    workspaces: { ...state.workspaces, [state.workspaceId]: ws },
  }
}

export const useTabsStore = create<TabsStore>()(
  persist(
    (set) => ({
      workspaceId: 'default',
      workspaces: {},

      setWorkspaceId: (id) => set({ workspaceId: id }),

      openTab: (tabId) =>
        set((state) => {
          const ws = getWs(state)
          if (ws.tabs.includes(tabId)) {
            return setWs(state, { ...ws, activeTab: tabId })
          }
          return setWs(state, { tabs: [...ws.tabs, tabId], activeTab: tabId })
        }),

      closeTab: (tabId) =>
        set((state) => {
          const ws = getWs(state)
          const tabs = ws.tabs.filter((t) => t !== tabId)
          let activeTab = ws.activeTab
          if (activeTab === tabId) {
            const idx = ws.tabs.indexOf(tabId)
            activeTab = tabs[Math.min(idx, tabs.length - 1)] ?? null
          }
          return setWs(state, { tabs, activeTab })
        }),

      setActiveTab: (tabId) =>
        set((state) => {
          const ws = getWs(state)
          return setWs(state, { ...ws, activeTab: tabId })
        }),

      reorderTabs: (activeId, overId) =>
        set((state) => {
          const ws = getWs(state)
          const oldIdx = ws.tabs.indexOf(activeId)
          const newIdx = ws.tabs.indexOf(overId)
          if (oldIdx === -1 || newIdx === -1 || oldIdx === newIdx) return state
          const tabs = [...ws.tabs]
          tabs.splice(oldIdx, 1)
          tabs.splice(newIdx, 0, activeId)
          return setWs(state, { ...ws, tabs })
        }),
    }),
    { name: 'pinpoint-ui' },
  ),
)

// Stable fallback so selectors never return a new reference on every call
const EMPTY_TABS: TabId[] = []

export const selectTabs = (s: TabsStore) =>
  s.workspaces[s.workspaceId]?.tabs ?? EMPTY_TABS

export const selectActiveTab = (s: TabsStore) =>
  s.workspaces[s.workspaceId]?.activeTab ?? null
