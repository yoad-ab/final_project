import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export interface AnalysisDraft {
  analysis_id: string
  type_id: 'python' | 'shell'
  code: string
}

const DEFAULT_DRAFT: AnalysisDraft = { analysis_id: '', type_id: 'python', code: '' }

interface DraftsStore {
  drafts: Record<string, AnalysisDraft>
  upsertDraft: (tabId: string, patch: Partial<AnalysisDraft>) => void
  removeDraft: (tabId: string) => void
}

export const useDraftsStore = create<DraftsStore>()(
  persist(
    (set) => ({
      drafts: {},

      upsertDraft: (tabId, patch) =>
        set((state) => ({
          drafts: {
            ...state.drafts,
            [tabId]: { ...(state.drafts[tabId] ?? DEFAULT_DRAFT), ...patch },
          },
        })),

      removeDraft: (tabId) =>
        set((state) => {
          const { [tabId]: _removed, ...rest } = state.drafts
          return { drafts: rest }
        }),
    }),
    { name: 'pinpoint-drafts' },
  ),
)
