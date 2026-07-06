import { Inbox } from 'lucide-react'
import { useRuns } from '@/api/history'
import { useTabsStore, makeTabId, selectActiveTab } from '@/store/tabs'
import {
  ContextItem,
  FilterInput,
  PanelError,
  PanelLoading,
} from '@/components/layout/ContextPanel'
import type { RunRecord, RunStatus } from '@/types/run'

// Runs are grouped by pipeline. Now that runs created by the Run button carry
// a real recipe_id, we group by that. Older/seed runs without one fall into
// "(ungrouped)". Change this single constant to repoint the grouping.
const GROUP_FIELD: keyof RunRecord = 'recipe_id'

const STATUS_COLOR: Record<RunStatus, string> = {
  running:   '#f59e0b',
  success:   '#34d399',
  failure:   '#f87171',
  cancelled: 'var(--color-text-3)',
}

function groupKey(run: RunRecord): string {
  const v = run[GROUP_FIELD]
  return (v == null || v === '') ? '(ungrouped)' : String(v)
}

export function HistoryList() {
  const { data, isLoading, isError, error } = useRuns()
  const openTab = useTabsStore((s) => s.openTab)
  const activeTab = useTabsStore(selectActiveTab)

  if (isLoading) return <PanelLoading />
  if (isError)   return <PanelError message={(error as Error).message} />

  if (!data?.length) {
    return (
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 8, color: 'var(--color-text-3)', padding: '0 16px', textAlign: 'center' }}>
        <Inbox size={28} strokeWidth={1.5} />
        <span style={{ fontSize: 13 }}>No runs yet</span>
      </div>
    )
  }

  // Group, preserving the backend's newest-first ordering within each group.
  const groups = new Map<string, RunRecord[]>()
  for (const run of data) {
    const key = groupKey(run)
    const bucket = groups.get(key)
    if (bucket) bucket.push(run)
    else groups.set(key, [run])
  }

  return (
    <div style={{ flex: 1, overflowY: 'auto' }}>
      <FilterInput placeholder="Filter runs..." />
      {[...groups.entries()].map(([key, runs]) => (
        <div key={key}>
          <div style={{ padding: '5px 10px 3px', fontSize: 10, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.07em', color: 'var(--color-text-3)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {key}
          </div>
          {runs.map((run) => {
            const tabId = makeTabId('run', run.run_id)
            return (
              <ContextItem
                key={run.run_id}
                primary={run.run_id}
                secondary={new Date(run.started_at).toLocaleString()}
                badge={<StatusDot status={run.status} />}
                isActive={activeTab === tabId}
                onClick={() => openTab(tabId)}
              />
            )
          })}
        </div>
      ))}
    </div>
  )
}

function StatusDot({ status }: { status: RunStatus }) {
  return (
    <span
      title={status}
      style={{ width: 8, height: 8, borderRadius: '50%', flexShrink: 0, background: STATUS_COLOR[status] }}
    />
  )
}
