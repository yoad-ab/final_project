import { useEffect, useRef, useState } from 'react'
import Editor, { type OnMount, type BeforeMount } from '@monaco-editor/react'
import { FileCode2, Terminal, Loader2, AlertCircle, Check } from 'lucide-react'
import { useAnalysis, useCreateAnalysis, useUpdateAnalysis } from '@/api/analyses'
import { useDraftsStore, type AnalysisDraft } from '@/store/drafts'
import { useTabsStore, makeTabId } from '@/store/tabs'
import { useDirtyStore } from '@/store/dirty'
import { ensureMonacoTheme } from '@/lib/monacoTheme'

const beforeMount: BeforeMount = (monaco) => ensureMonacoTheme(monaco)

// ── Monaco config ─────────────────────────────────────────────────────────

const MONACO_OPTIONS = {
  fontSize: 13,
  fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
  minimap: { enabled: false },
  lineNumbers: 'on' as const,
  scrollBeyondLastLine: false,
  wordWrap: 'on' as const,
  padding: { top: 14, bottom: 14 },
  renderLineHighlight: 'all' as const,
  tabSize: 4,
  insertSpaces: true,
  automaticLayout: true,
  scrollbar: { verticalScrollbarSize: 6, horizontalScrollbarSize: 6 },
}

function codeKey(typeId: string) {
  return typeId === 'shell' ? 'shell_command' : 'python_code'
}

function monacoLang(typeId: string) {
  return typeId === 'shell' ? 'shell' : 'python'
}

// ── Shared primitives ─────────────────────────────────────────────────────

function CenteredSpinner() {
  return (
    <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--color-text-3)' }}>
      <Loader2 size={20} className="animate-spin" />
    </div>
  )
}

function CenteredError({ message }: { message: string }) {
  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 8, color: 'var(--color-red)', fontSize: 13 }}>
      <AlertCircle size={20} />
      {message}
    </div>
  )
}

// ── Header ────────────────────────────────────────────────────────────────

interface HeaderProps {
  titleNode: React.ReactNode
  typeId: 'python' | 'shell'
  typeEditable: boolean
  onTypeChange?: (t: 'python' | 'shell') => void
  isDirty: boolean
  isSaving: boolean
  saveOk: boolean
  saveError?: string
  onSave: () => void
  saveLabel?: string
  canSave?: boolean
}

function EditorHeader({
  titleNode,
  typeId,
  typeEditable,
  onTypeChange,
  isDirty,
  isSaving,
  saveOk,
  saveError,
  onSave,
  saveLabel = 'Save',
  canSave = true,
}: HeaderProps) {
  const TypeIcon = typeId === 'shell' ? Terminal : FileCode2
  const typeColor = typeId === 'shell' ? 'var(--color-badge-sh)' : 'var(--color-badge-py)'

  const saveDisabled = isSaving || !canSave || (!isDirty && saveLabel === 'Save')

  return (
    <div
      style={{
        height: 38,
        background: 'var(--color-bg-bar)',
        borderBottom: '1px solid var(--color-border)',
        display: 'flex',
        alignItems: 'center',
        gap: 8,
        padding: '0 12px',
        flexShrink: 0,
      }}
    >
      <TypeIcon size={14} style={{ color: typeColor, flexShrink: 0 }} strokeWidth={2} />

      {/* Title / ID input */}
      <div style={{ flex: 1, minWidth: 0 }}>{titleNode}</div>

      {/* Type selector or badge */}
      {typeEditable ? (
        <select
          value={typeId}
          onChange={(e) => onTypeChange?.(e.target.value as 'python' | 'shell')}
          style={{
            background: 'var(--color-bg-surface)',
            border: '1px solid var(--color-border)',
            borderRadius: 4,
            color: typeColor,
            fontSize: 11,
            fontWeight: 600,
            padding: '2px 6px',
            cursor: 'pointer',
            textTransform: 'uppercase',
            letterSpacing: '0.04em',
            outline: 'none',
          }}
        >
          <option value="python">Python</option>
          <option value="shell">Shell</option>
        </select>
      ) : (
        <span
          style={{
            fontSize: 10,
            fontWeight: 600,
            padding: '2px 6px',
            borderRadius: 3,
            textTransform: 'uppercase',
            letterSpacing: '0.04em',
            background: typeId === 'python' ? 'rgba(59,130,246,0.15)' : 'rgba(16,185,129,0.15)',
            color: typeColor,
            flexShrink: 0,
          }}
        >
          {typeId === 'python' ? 'py' : 'sh'}
        </span>
      )}

      {/* Error */}
      {saveError && (
        <span style={{ fontSize: 11, color: 'var(--color-red)', maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {saveError}
        </span>
      )}

      {/* Save button */}
      <button
        onClick={onSave}
        disabled={saveDisabled}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 5,
          padding: '4px 10px',
          borderRadius: 4,
          border: 'none',
          fontSize: 12,
          fontWeight: 500,
          cursor: saveDisabled ? 'default' : 'pointer',
          background: saveOk
            ? 'rgba(34,197,94,0.2)'
            : saveDisabled
              ? 'var(--color-bg-hover)'
              : 'rgba(124,106,247,0.25)',
          color: saveOk
            ? 'var(--color-green)'
            : saveDisabled
              ? 'var(--color-text-3)'
              : 'var(--color-accent)',
          transition: 'background 0.15s, color 0.15s',
        }}
      >
        {isSaving ? (
          <Loader2 size={12} className="animate-spin" />
        ) : saveOk ? (
          <Check size={12} strokeWidth={2.5} />
        ) : isDirty ? (
          <span style={{ width: 6, height: 6, borderRadius: '50%', background: 'currentColor', flexShrink: 0 }} />
        ) : null}
        {isSaving ? 'Saving…' : saveOk ? 'Saved' : saveLabel}
      </button>
    </div>
  )
}

// ── Existing analysis editor ───────────────────────────────────────────────

function ExistingAnalysisEditor({ tabId, analysisId }: { tabId: string; analysisId: string }) {
  const { data, isLoading, isError, error } = useAnalysis(analysisId)
  const updateMutation = useUpdateAnalysis()
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const { markDirty, markClean } = useDirtyStore()

  // Local edit buffer; undefined = in sync with server
  const [localCode, setLocalCode] = useState<string | undefined>(undefined)
  const [saveOk, setSaveOk] = useState(false)

  // Keep a ref to the save handler so Monaco's Ctrl+S always calls fresh version
  const handleSaveRef = useRef<() => void>(() => {})

  const onMount: OnMount = (editor, monaco) => {
    editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyS, () => handleSaveRef.current())
  }

  // Compute before early returns so the effect always runs unconditionally
  const serverCode = data ? ((data.params[codeKey(data.type_id)] as string) ?? '') : ''
  const isDirty = data !== undefined && localCode !== undefined && localCode !== serverCode

  useEffect(() => {
    isDirty ? markDirty(tabId) : markClean(tabId)
    return () => markClean(tabId)
  }, [isDirty, tabId, markDirty, markClean])

  if (isLoading) return <CenteredSpinner />
  if (isError)   return <CenteredError message={(error as Error).message} />
  if (!data)     return null

  const key    = codeKey(data.type_id)
  const lang   = monacoLang(data.type_id)
  const currentCode = localCode ?? serverCode

  function handleSave() {
    if (!isDirty) return
    updateMutation.mutate(
      { id: analysisId, params: { [key]: currentCode } },
      {
        onSuccess: () => {
          setLocalCode(undefined)
          setSaveOk(true)
          if (saveTimerRef.current) clearTimeout(saveTimerRef.current)
          saveTimerRef.current = setTimeout(() => setSaveOk(false), 1800)
        },
      },
    )
  }

  handleSaveRef.current = handleSave

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>
      <EditorHeader
        titleNode={
          <span style={{ fontSize: 13, color: 'var(--color-text-2)', fontFamily: 'var(--font-mono)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {analysisId}
          </span>
        }
        typeId={data.type_id}
        typeEditable={false}
        isDirty={isDirty}
        isSaving={updateMutation.isPending}
        saveOk={saveOk}
        saveError={updateMutation.isError ? (updateMutation.error as Error).message : undefined}
        onSave={handleSave}
      />
      <Editor
        key={analysisId}
        height="100%"
        language={lang}
        beforeMount={beforeMount}
        theme="pinpoint-dark"
        defaultValue={serverCode}
        onChange={(v) => setLocalCode(v ?? '')}
        onMount={onMount}
        options={MONACO_OPTIONS}
      />
    </div>
  )
}

// ── New analysis editor ────────────────────────────────────────────────────

function NewAnalysisEditor({ tabId }: { tabId: string }) {
  const { drafts, upsertDraft, removeDraft } = useDraftsStore()
  const draft: AnalysisDraft = drafts[tabId] ?? { analysis_id: '', type_id: 'python', code: '' }

  const createMutation = useCreateAnalysis()
  const openTab  = useTabsStore((s) => s.openTab)
  const closeTab = useTabsStore((s) => s.closeTab)
  const { markDirty, markClean } = useDirtyStore()
  const [saveOk, setSaveOk] = useState(false)
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const handleSaveRef = useRef<() => void>(() => {})

  const isDirtyNew = Boolean(draft.code || draft.analysis_id)
  useEffect(() => {
    isDirtyNew ? markDirty(tabId) : markClean(tabId)
    return () => markClean(tabId)
  }, [isDirtyNew, tabId, markDirty, markClean])

  const lang = monacoLang(draft.type_id)
  const key  = codeKey(draft.type_id)
  const canSave = Boolean(draft.analysis_id.trim())

  const onMount: OnMount = (editor, monaco) => {
    editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyS, () => handleSaveRef.current())
  }

  function handleSave() {
    if (!canSave) return
    createMutation.mutate(
      {
        analysis_id: draft.analysis_id.trim(),
        type_id: draft.type_id,
        params: { [key]: draft.code },
      },
      {
        onSuccess: (created) => {
          setSaveOk(true)
          if (saveTimerRef.current) clearTimeout(saveTimerRef.current)
          saveTimerRef.current = setTimeout(() => {
            closeTab(tabId)
            openTab(makeTabId('analysis', created.analysis_id))
            removeDraft(tabId)
          }, 600)
        },
      },
    )
  }

  handleSaveRef.current = handleSave

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>
      <EditorHeader
        titleNode={
          <input
            autoFocus
            value={draft.analysis_id}
            onChange={(e) => upsertDraft(tabId, { analysis_id: e.target.value })}
            placeholder="analysis-name"
            spellCheck={false}
            style={{
              background: 'transparent',
              border: 'none',
              outline: 'none',
              fontSize: 13,
              color: 'var(--color-text)',
              fontFamily: 'var(--font-mono)',
              width: '100%',
              caretColor: 'var(--color-accent)',
            }}
          />
        }
        typeId={draft.type_id}
        typeEditable={true}
        onTypeChange={(t) => upsertDraft(tabId, { type_id: t })}
        isDirty={Boolean(draft.code || draft.analysis_id)}
        isSaving={createMutation.isPending}
        saveOk={saveOk}
        saveError={createMutation.isError ? (createMutation.error as Error).message : undefined}
        onSave={handleSave}
        saveLabel="Create"
        canSave={canSave}
      />
      <Editor
        key={`${tabId}-${draft.type_id}`}
        height="100%"
        language={lang}
        beforeMount={beforeMount}
        theme="pinpoint-dark"
        defaultValue={draft.code}
        onChange={(v) => upsertDraft(tabId, { code: v ?? '' })}
        onMount={onMount}
        options={MONACO_OPTIONS}
      />
    </div>
  )
}

// ── Public component ──────────────────────────────────────────────────────

export function AnalysisEditor({ tabId }: { tabId: string }) {
  const analysisId = tabId.slice('analysis:'.length)
  const isNew = analysisId.startsWith('~new-')

  if (isNew) return <NewAnalysisEditor tabId={tabId} />
  return <ExistingAnalysisEditor tabId={tabId} analysisId={analysisId} />
}
