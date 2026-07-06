import { Fragment, useState } from 'react'
import {
  AlertCircle, Check, ChevronDown, Clock,
  Copy, FolderOpen, FolderSymlink, GitFork, Loader2, Play,
} from 'lucide-react'
import { useRun, openRunOutput } from '@/api/history'
import { parseTabId, type TabId } from '@/store/tabs'
import type { RunRecord, RunStatus, StepRecord } from '@/types/run'

// ── Color map ──────────────────────────────────────────────────────────────

const STATUS_COLOR: Record<RunStatus, string> = {
  running:   '#f59e0b',
  success:   '#34d399',
  failure:   '#f87171',
  cancelled: 'var(--color-text-3)',
}

// ── Status badge ───────────────────────────────────────────────────────────

function StatusBadge({ status }: { status: RunStatus }) {
  const color = STATUS_COLOR[status]
  return (
    <span style={{
      fontSize: 10, fontWeight: 600, padding: '2px 7px', borderRadius: 4,
      textTransform: 'uppercase' as const, letterSpacing: '0.05em', flexShrink: 0,
      color, background: `color-mix(in srgb, ${color} 18%, transparent)`,
    }}>
      {status}
    </span>
  )
}

// ── Connector arrow (mirrors RecipeEditor) ─────────────────────────────────

function Connector() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '3px 0' }}>
      <div style={{ width: 1, height: 14, background: 'var(--color-border)' }} />
      <div style={{ width: 0, height: 0, borderLeft: '4px solid transparent', borderRight: '4px solid transparent', borderTop: '5px solid var(--color-border)' }} />
    </div>
  )
}

// ── Step card (flow-chart node) ────────────────────────────────────────────

function RunStepCard({ step }: { step: StepRecord }) {
  const [expanded, setExpanded] = useState(true)
  const color = STATUS_COLOR[step.status]
  const hasContent = Boolean(step.output_summary || step.error)

  return (
    <div style={{
      width: 420,
      background: 'var(--color-bg-panel)',
      border: '1px solid var(--color-border)',
      borderLeftWidth: 3,
      borderLeftColor: color,
      borderRadius: 8,
      overflow: 'hidden',
    }}>
      {/* Header bar */}
      <div
        onClick={() => hasContent && setExpanded(e => !e)}
        style={{
          display: 'flex', alignItems: 'center', gap: 7,
          padding: '7px 10px',
          background: 'var(--color-bg-bar)',
          borderBottom: (expanded && hasContent) ? '1px solid var(--color-border)' : 'none',
          cursor: hasContent ? 'pointer' : 'default',
          userSelect: 'none' as const,
        }}
      >
        {/* Step index */}
        <span style={{ fontSize: 10, color: 'var(--color-text-3)', fontFamily: 'var(--font-mono)', flexShrink: 0, minWidth: 14 }}>
          {step.step_index + 1}
        </span>

        {/* Analysis ID */}
        <span style={{
          flex: 1, fontSize: 13, fontWeight: 500,
          color: 'var(--color-text)',
          overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
        }}>
          {step.analysis_id}
        </span>

        {/* Duration */}
        {step.duration_ms != null && (
          <span style={{ fontSize: 10, color: 'var(--color-text-3)', fontFamily: 'var(--font-mono)', flexShrink: 0 }}>
            {step.duration_ms < 1000
              ? `${step.duration_ms}ms`
              : `${(step.duration_ms / 1000).toFixed(2)}s`}
          </span>
        )}

        <StatusBadge status={step.status} />

        {/* Expand chevron */}
        {hasContent && (
          <ChevronDown
            size={12}
            style={{
              color: 'var(--color-text-3)', flexShrink: 0,
              transform: expanded ? 'rotate(0deg)' : 'rotate(-90deg)',
              transition: 'transform 0.15s',
            }}
          />
        )}
      </div>

      {/* Content area */}
      {expanded && hasContent && (
        <div style={{ padding: '7px 12px' }}>
          {step.output_summary && (
            <pre style={{
              margin: 0,
              fontFamily: 'var(--font-mono)', fontSize: 11,
              color: 'var(--color-text-3)', lineHeight: 1.55,
              whiteSpace: 'pre-wrap', wordBreak: 'break-word' as const,
              background: 'transparent',
            }}>
              {step.output_summary}
            </pre>
          )}
          {step.error && (
            <pre style={{
              margin: step.output_summary ? '6px 0 0' : 0,
              fontFamily: 'var(--font-mono)', fontSize: 11,
              color: 'var(--color-red)', lineHeight: 1.55,
              whiteSpace: 'pre-wrap', wordBreak: 'break-word' as const,
              background: 'transparent',
            }}>
              {step.error}
            </pre>
          )}
        </div>
      )}
    </div>
  )
}

// ── Metadata panel ─────────────────────────────────────────────────────────

function fmt(iso: string): string {
  const d = new Date(iso)
  return isNaN(d.getTime()) ? iso : d.toLocaleString()
}

function MetaField({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 2, minWidth: 0 }}>
      <span style={{
        fontSize: 10, fontWeight: 600, textTransform: 'uppercase' as const,
        letterSpacing: '0.07em', color: 'var(--color-text-3)',
      }}>
        {label}
      </span>
      <span style={{
        fontSize: 12, color: 'var(--color-text-2)',
        fontFamily: mono ? 'var(--font-mono)' : undefined,
        overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
      }} title={value}>
        {value}
      </span>
    </div>
  )
}

function RunMeta({ run }: { run: RunRecord }) {
  const [copied, setCopied] = useState(false)
  const [opening, setOpening] = useState(false)
  const succeeded = run.steps.filter(s => s.status === 'success').length

  async function copyPath() {
    try {
      await navigator.clipboard.writeText(run.output_path!)
      setCopied(true)
      setTimeout(() => setCopied(false), 1500)
    } catch {
      // clipboard unavailable
    }
  }

  async function openInExplorer() {
    setOpening(true)
    try {
      await openRunOutput(run.run_id)
    } finally {
      setOpening(false)
    }
  }

  const duration = run.completed_at ? formatDuration(run.started_at, run.completed_at) : null

  return (
    <div style={{
      borderBottom: '1px solid var(--color-border)',
      background: 'var(--color-bg-bar)',
      padding: '10px 16px 12px',
      flexShrink: 0,
    }}>
      {/* Field grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))',
        gap: '8px 28px',
      }}>
        {run.recipe_id && <MetaField label="Recipe" value={run.recipe_id} mono />}
        {run.analysis_id && <MetaField label="Analysis" value={run.analysis_id} mono />}
        <MetaField label="Experiment" value={run.experiment_id} mono />
        <MetaField label="Dataset" value={run.dataset_id} mono />
        <MetaField label="Started" value={fmt(run.started_at)} />
        <MetaField label="Completed" value={run.completed_at ? fmt(run.completed_at) : '—'} />
        {duration && <MetaField label="Duration" value={duration} mono />}
        <MetaField
          label="Steps"
          value={run.steps.length === 0 ? '—' : `${succeeded} / ${run.steps.length} succeeded`}
        />
      </div>

      {/* Output path row */}
      {run.output_path && (
        <div style={{ marginTop: 10, display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{
            fontSize: 10, fontWeight: 600, textTransform: 'uppercase' as const,
            letterSpacing: '0.07em', color: 'var(--color-text-3)', flexShrink: 0,
          }}>
            Output
          </span>
          <div style={{
            flex: 1, display: 'flex', alignItems: 'center', gap: 6,
            background: 'var(--color-bg-panel)', border: '1px solid var(--color-border)',
            borderRadius: 4, padding: '4px 8px', minWidth: 0,
          }}>
            <FolderOpen size={11} style={{ color: 'var(--color-text-3)', flexShrink: 0 }} />
            <span style={{
              flex: 1, fontFamily: 'var(--font-mono)', fontSize: 11,
              color: 'var(--color-text-2)', overflow: 'hidden',
              textOverflow: 'ellipsis', whiteSpace: 'nowrap',
            }}>
              {run.output_path}
            </span>
            <button
              onClick={copyPath}
              title="Copy output path"
              style={{
                display: 'flex', alignItems: 'center', gap: 3,
                background: 'none', border: 'none', cursor: 'pointer',
                color: copied ? '#34d399' : 'var(--color-text-3)',
                fontSize: 11, flexShrink: 0, padding: '1px 3px',
              }}
            >
              {copied ? <Check size={11} /> : <Copy size={11} />}
              {copied ? 'Copied' : 'Copy'}
            </button>
            <button
              onClick={openInExplorer}
              disabled={opening}
              title="Open in Explorer"
              style={{
                display: 'flex', alignItems: 'center', gap: 3,
                background: 'none', border: 'none',
                cursor: opening ? 'default' : 'pointer',
                color: opening ? 'var(--color-text-3)' : 'var(--color-text-2)',
                fontSize: 11, flexShrink: 0, padding: '1px 3px',
                borderLeft: '1px solid var(--color-border)',
                paddingLeft: 7, marginLeft: 3,
              }}
            >
              {opening ? <Loader2 size={11} className="animate-spin" /> : <FolderSymlink size={11} />}
              Open
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

// ── Flow canvas ────────────────────────────────────────────────────────────

function RunCanvas({ run }: { run: RunRecord }) {
  if (run.steps.length === 0) {
    return (
      <div style={{
        flex: 1, display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center',
        gap: 8, color: 'var(--color-text-3)', fontSize: 13,
      }}>
        <GitFork size={28} strokeWidth={1.2} />
        No steps recorded
      </div>
    )
  }

  return (
    <div style={{
      flex: 1, overflowY: 'auto',
      display: 'flex', flexDirection: 'column', alignItems: 'center',
      padding: '28px 24px 60px', gap: 0,
    }}>
      {run.steps.map((step, i) => (
        <Fragment key={step.step_index}>
          <RunStepCard step={step} />
          {i < run.steps.length - 1 && <Connector />}
        </Fragment>
      ))}
    </div>
  )
}

// ── Header bar ─────────────────────────────────────────────────────────────

function MetaChip({ label, value }: { label: string; value: string }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 4, flexShrink: 0 }}>
      <span style={{ fontSize: 10, color: 'var(--color-text-3)', textTransform: 'uppercase' as const, letterSpacing: '0.06em', fontWeight: 600 }}>
        {label}
      </span>
      <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--color-text-2)', maxWidth: 160, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
        {value}
      </span>
    </div>
  )
}

function formatDuration(startIso: string, endIso: string): string {
  const ms = new Date(endIso).getTime() - new Date(startIso).getTime()
  if (ms < 1000) return `${ms}ms`
  if (ms < 60_000) return `${(ms / 1000).toFixed(1)}s`
  const m = Math.floor(ms / 60_000)
  const s = Math.round((ms % 60_000) / 1000)
  return `${m}m ${s}s`
}

function RunHeader({ run }: { run: RunRecord }) {
  return (
    <div style={{
      height: 38, background: 'var(--color-bg-bar)', borderBottom: '1px solid var(--color-border)',
      display: 'flex', alignItems: 'center', gap: 8, padding: '0 12px', flexShrink: 0,
    }}>
      <Play size={14} style={{ color: STATUS_COLOR[run.status], flexShrink: 0 }} strokeWidth={2} />
      <span style={{ fontFamily: 'var(--font-mono)', fontSize: 13, color: 'var(--color-text-2)' }}>
        run #{run.run_id}
      </span>
      <StatusBadge status={run.status} />

      <div style={{ flex: 1 }} />

      <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
        {run.recipe_id && <MetaChip label="recipe" value={run.recipe_id} />}
        <MetaChip label="exp" value={run.experiment_id} />
        <MetaChip label="data" value={run.dataset_id} />
        {run.completed_at && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 4, flexShrink: 0 }}>
            <Clock size={10} style={{ color: 'var(--color-text-3)' }} />
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--color-text-2)' }}>
              {formatDuration(run.started_at, run.completed_at)}
            </span>
          </div>
        )}
      </div>
    </div>
  )
}

// ── Shared ─────────────────────────────────────────────────────────────────

function Centered({ children, color }: { children: React.ReactNode; color?: string }) {
  return (
    <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, fontSize: 13, color: color ?? 'var(--color-text-3)' }}>
      {children}
    </div>
  )
}

// ── Entry point ────────────────────────────────────────────────────────────

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
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>
      <RunHeader run={data} />
      <RunMeta run={data} />
      <RunCanvas run={data} />
    </div>
  )
}
