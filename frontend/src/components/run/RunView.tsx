import { useState } from 'react'
import { AlertCircle, Check, Copy, FolderOpen, Loader2 } from 'lucide-react'
import { useRun } from '@/api/history'
import { parseTabId, type TabId } from '@/store/tabs'
import type { RunRecord, RunStatus, StepRecord } from '@/types/run'

const STATUS_COLOR: Record<RunStatus, string> = {
  running:   '#f59e0b',
  success:   '#34d399',
  failure:   '#f87171',
  cancelled: 'var(--color-text-3)',
}

export function RunView({ tabId }: { tabId: TabId }) {
  const { label: runId } = parseTabId(tabId)
  const { data, isLoading, isError, error } = useRun(runId)

  if (isLoading) {
    return (
      <Centered>
        <Loader2 size={16} className="animate-spin" /> Loading run…
      </Centered>
    )
  }
  if (isError) {
    return (
      <Centered color="var(--color-red)">
        <AlertCircle size={18} /> {(error as Error).message}
      </Centered>
    )
  }
  if (!data) return <Centered>Run not found</Centered>

  return (
    <div style={{ flex: 1, overflowY: 'auto', padding: '18px 22px', fontSize: 13, color: 'var(--color-text)' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
        <span style={{ fontSize: 17, fontWeight: 600, fontFamily: 'var(--font-mono)' }}>{data.run_id}</span>
        <StatusBadge status={data.status} />
      </div>

      <FieldGrid run={data} />

      <OutputPath path={data.output_path ?? null} />

      <SectionTitle>Steps</SectionTitle>
      {data.steps.length === 0 ? (
        <div style={{ color: 'var(--color-text-3)', fontSize: 12 }}>No steps recorded.</div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {data.steps.map((s) => <StepCard key={s.step_index} step={s} />)}
        </div>
      )}
    </div>
  )
}

function FieldGrid({ run }: { run: RunRecord }) {
  const rows: [string, string][] = [
    ['Recipe', run.recipe_id ?? '—'],
    ['Analysis', run.analysis_id ?? '—'],
    ['Experiment', run.experiment_id],
    ['Dataset', run.dataset_id],
    ['Started', fmt(run.started_at)],
    ['Completed', run.completed_at ? fmt(run.completed_at) : '—'],
  ]
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'auto 1fr', columnGap: 16, rowGap: 5, margin: '14px 0 6px', maxWidth: 560 }}>
      {rows.map(([k, v]) => (
        <div key={k} style={{ display: 'contents' }}>
          <span style={{ color: 'var(--color-text-3)', fontSize: 12 }}>{k}</span>
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: 12 }}>{v}</span>
        </div>
      ))}
    </div>
  )
}

function OutputPath({ path }: { path: string | null }) {
  const [copied, setCopied] = useState(false)

  if (!path) return null

  async function copy() {
    try {
      await navigator.clipboard.writeText(path!)
      setCopied(true)
      setTimeout(() => setCopied(false), 1500)
    } catch {
      // clipboard unavailable (e.g. non-secure context) — no-op
    }
  }

  return (
    <div style={{ margin: '14px 0 2px' }}>
      <SectionTitle>Output location</SectionTitle>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, maxWidth: 720, border: '1px solid var(--color-border)', borderRadius: 6, padding: '8px 10px', background: 'var(--color-bg-panel)' }}>
        <FolderOpen size={14} style={{ color: 'var(--color-text-3)', flexShrink: 0 }} />
        <span style={{ flex: 1, fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--color-text-2)', overflowX: 'auto', whiteSpace: 'nowrap' }}>
          {path}
        </span>
        <button
          onClick={copy}
          title="Copy path"
          style={{ display: 'flex', alignItems: 'center', gap: 4, background: 'none', border: 'none', cursor: 'pointer', color: copied ? '#34d399' : 'var(--color-text-3)', fontSize: 11, flexShrink: 0, padding: '2px 4px' }}
        >
          {copied ? <Check size={13} /> : <Copy size={13} />}
          {copied ? 'Copied' : 'Copy'}
        </button>
      </div>
      <div style={{ marginTop: 5, fontSize: 11, color: 'var(--color-text-3)' }}>
        This run's output files are written here. The folder is created when the run actually executes.
      </div>
    </div>
  )
}

function StepCard({ step }: { step: StepRecord }) {
  return (
    <div style={{ border: '1px solid var(--color-border)', borderRadius: 6, padding: '9px 12px', background: 'var(--color-bg-panel)' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <span style={{ color: 'var(--color-text-3)', fontSize: 11, fontFamily: 'var(--font-mono)' }}>#{step.step_index}</span>
        <span style={{ flex: 1, fontFamily: 'var(--font-mono)', fontSize: 12 }}>{step.analysis_id}</span>
        {step.duration_ms != null && (
          <span style={{ color: 'var(--color-text-3)', fontSize: 11 }}>{step.duration_ms} ms</span>
        )}
        <StatusBadge status={step.status} />
      </div>
      {step.output_summary && (
        <div style={{ marginTop: 6, fontSize: 12, color: 'var(--color-text-2)' }}>{step.output_summary}</div>
      )}
      {step.error && (
        <pre style={{ marginTop: 6, fontSize: 11, color: 'var(--color-red)', whiteSpace: 'pre-wrap', fontFamily: 'var(--font-mono)' }}>{step.error}</pre>
      )}
    </div>
  )
}

function StatusBadge({ status }: { status: RunStatus }) {
  const color = STATUS_COLOR[status]
  return (
    <span style={{
      fontSize: 10, fontWeight: 600, padding: '2px 7px', borderRadius: 4,
      textTransform: 'uppercase', letterSpacing: '0.05em', flexShrink: 0,
      color, background: `color-mix(in srgb, ${color} 18%, transparent)`,
    }}>
      {status}
    </span>
  )
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ margin: '20px 0 10px', fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--color-text-2)' }}>
      {children}
    </div>
  )
}

function Centered({ children, color }: { children: React.ReactNode; color?: string }) {
  return (
    <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, fontSize: 13, color: color ?? 'var(--color-text-3)' }}>
      {children}
    </div>
  )
}

function fmt(iso: string): string {
  const d = new Date(iso)
  return isNaN(d.getTime()) ? iso : d.toLocaleString()
}
