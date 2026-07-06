import { create } from 'zustand'

interface DirtyStore {
  dirty: Set<string>
  markDirty: (tabId: string) => void
  markClean: (tabId: string) => void
}

export const useDirtyStore = create<DirtyStore>((set) => ({
  dirty: new Set(),
  markDirty: (tabId) =>
    set((s) => {
      if (s.dirty.has(tabId)) return s
      const next = new Set(s.dirty)
      next.add(tabId)
      return { dirty: next }
    }),
  markClean: (tabId) =>
    set((s) => {
      if (!s.dirty.has(tabId)) return s
      const next = new Set(s.dirty)
      next.delete(tabId)
      return { dirty: next }
    }),
}))
