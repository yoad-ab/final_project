import { useEffect, useRef, useState } from 'react'
import Editor, { type OnMount, type BeforeMount } from '@monaco-editor/react'
import { Loader2, AlertCircle, Check, XCircle } from 'lucide-react'
import { useAnalysis, useCreateAnalysis, useUpdateAnalysis, useValidateCode, type ValidateResult } from '@/api/analyses'
import { useDraftsStore, type AnalysisDraft } from '@/store/drafts'
import { useTabsStore, makeTabId } from '@/store/tabs'
import { useDirtyStore } from '@/store/dirty'
import { ensureMonacoTheme } from '@/lib/monacoTheme'
import { AnalysisHintDrawer } from './AnalysisHintDrawer'
import { LangIcon, PythonIcon, BashIcon } from '@/components/icons/LangIcons'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogClose } from '@/components/ui/dialog'

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
  onValidate?: () => void
  isValidating?: boolean
  validateOk?: boolean
  validateError?: string
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
  onValidate,
  isValidating,
  validateOk,
  validateError,
}: HeaderProps) {
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
      <LangIcon typeId={typeId} size={15} />

      {/* Title / ID input */}
      <div style={{ flex: 1, minWidth: 0 }}>{titleNode}</div>

      {/* Type selector or badge */}
      {typeEditable ? (
        <Select value={typeId} onValueChange={(v) => onTypeChange?.(v as 'python' | 'shell')}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="python">
              <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <PythonIcon size={12} />
                Python
              </span>
            </SelectItem>
            <SelectItem value="shell" disabled>
              <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <BashIcon size={12} />
                Shell
                <span style={{ fontSize: 10, color: 'var(--color-text-3)', marginLeft: 2 }}>(soon)</span>
              </span>
            </SelectItem>
          </SelectContent>
        </Select>
      ) : (
        <span
          style={{
            display: 'flex', alignItems: 'center', gap: 5,
            fontSize: 11, fontWeight: 600, padding: '2px 7px', borderRadius: 3,
            background: typeId === 'python' ? 'rgba(59,130,246,0.15)' : 'rgba(16,185,129,0.15)',
            flexShrink: 0,
          }}
        >
          <LangIcon typeId={typeId} size={11} />
          {typeId === 'python' ? 'Python' : 'Shell'}
        </span>
      )}

      {/* Validate error */}
      {validateError && (
        <span style={{ fontSize: 11, color: 'var(--color-red)', maxWidth: 220, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={validateError}>
          {validateError}
        </span>
      )}

      {/* Save error */}
      {saveError && (
        <span style={{ fontSize: 11, color: 'var(--color-red)', maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {saveError}
        </span>
      )}

      {/* Validate button — Python only */}
      {typeId === 'python' && onValidate && (
        <button
          onClick={onValidate}
          disabled={isValidating}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 5,
            padding: '5px 12px',
            borderRadius: 5,
            border: '1px solid',
            borderColor: validateOk
              ? 'var(--color-green)'
              : validateError
                ? 'var(--color-red)'
                : 'var(--color-border)',
            fontSize: 13,
            fontWeight: 500,
            cursor: isValidating ? 'default' : 'pointer',
            background: 'transparent',
            color: validateOk
              ? 'var(--color-green)'
              : validateError
                ? 'var(--color-red)'
                : 'var(--color-text-2)',
            transition: 'border-color 0.15s, color 0.15s',
          }}
        >
          {isValidating ? (
            <Loader2 size={13} className="animate-spin" />
          ) : validateOk ? (
            <Check size={13} strokeWidth={2.5} />
          ) : null}
          {isValidating ? 'Validating…' : validateOk ? 'Valid' : 'Validate'}
        </button>
      )}

      {/* Save button */}
      <button
        onClick={onSave}
        disabled={saveDisabled}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 5,
          padding: '5px 14px',
          borderRadius: 5,
          border: 'none',
          fontSize: 13,
          fontWeight: 600,
          cursor: saveDisabled ? 'default' : 'pointer',
          background: saveOk
            ? 'var(--color-green)'
            : saveDisabled
              ? 'var(--color-bg-hover)'
              : 'var(--color-accent)',
          color: saveDisabled && !saveOk ? 'var(--color-text-3)' : '#fff',
          transition: 'background 0.15s, opacity 0.15s',
          opacity: saveDisabled && !saveOk ? 0.5 : 1,
        }}
      >
        {isSaving ? (
          <Loader2 size={13} className="animate-spin" />
        ) : saveOk ? (
          <Check size={13} strokeWidth={2.5} />
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
  const validateMutation = useValidateCode()
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const validateTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const { markDirty, markClean } = useDirtyStore()

  // Local edit buffer; undefined = in sync with server
  const [localCode, setLocalCode] = useState<string | undefined>(undefined)
  const [saveOk, setSaveOk] = useState(false)
  const [validateOk, setValidateOk] = useState(false)
  const [validateError, setValidateError] = useState<string | undefined>(undefined)

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

  function handleValidate() {
    setValidateOk(false)
    setValidateError(undefined)
    if (validateTimerRef.current) clearTimeout(validateTimerRef.current)
    validateMutation.mutate(
      { code: currentCode, typeId: data.type_id },
      {
        onSuccess: (result) => {
          if (result.valid) {
            setValidateOk(true)
            validateTimerRef.current = setTimeout(() => setValidateOk(false), 2500)
          } else {
            setValidateError(result.error ?? 'Validation failed')
          }
        },
        onError: (err) => setValidateError((err as Error).message),
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
        onValidate={handleValidate}
        isValidating={validateMutation.isPending}
        validateOk={validateOk}
        validateError={validateError}
      />
      <div style={{ display: 'flex', flex: 1, overflow: 'hidden', minHeight: 0 }}>
        <div style={{ flex: 1, overflow: 'hidden', minWidth: 0 }}>
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
        {data.type_id === 'python' && <AnalysisHintDrawer />}
      </div>
    </div>
  )
}

// ── New analysis editor ────────────────────────────────────────────────────

function NewAnalysisEditor({ tabId }: { tabId: string }) {
  const { drafts, upsertDraft, removeDraft } = useDraftsStore()
  const draft: AnalysisDraft = drafts[tabId] ?? { analysis_id: '', type_id: 'python', code: '' }

  const createMutation = useCreateAnalysis()
  const validateMutation = useValidateCode()
  const openTab  = useTabsStore((s) => s.openTab)
  const closeTab = useTabsStore((s) => s.closeTab)
  const { markDirty, markClean } = useDirtyStore()
  const [saveOk, setSaveOk] = useState(false)
  const [validateOk, setValidateOk] = useState(false)
  const [validateError, setValidateError] = useState<string | undefined>(undefined)
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const validateTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
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

  function handleValidateNew() {
    setValidateOk(false)
    setValidateError(undefined)
    if (validateTimerRef.current) clearTimeout(validateTimerRef.current)
    validateMutation.mutate(
      { code: draft.code, typeId: draft.type_id },
      {
        onSuccess: (result) => {
          if (result.valid) {
            setValidateOk(true)
            validateTimerRef.current = setTimeout(() => setValidateOk(false), 2500)
          } else {
            setValidateError(result.error ?? 'Validation failed')
          }
        },
        onError: (err) => setValidateError((err as Error).message),
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
              background: 'var(--color-bg-surface)',
              border: '1px solid var(--color-border)',
              borderRadius: 5,
              outline: 'none',
              fontSize: 13,
              color: 'var(--color-text)',
              fontFamily: 'var(--font-mono)',
              width: '100%',
              caretColor: 'var(--color-accent)',
              padding: '3px 8px',
            }}
            onFocus={e => (e.currentTarget.style.borderColor = 'var(--color-accent)')}
            onBlur={e => (e.currentTarget.style.borderColor = 'var(--color-border)')}
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
        onValidate={handleValidateNew}
        isValidating={validateMutation.isPending}
        validateOk={validateOk}
        validateError={validateError}
      />
      <div style={{ display: 'flex', flex: 1, overflow: 'hidden', minHeight: 0 }}>
        <div style={{ flex: 1, overflow: 'hidden', minWidth: 0 }}>
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
        {draft.type_id === 'python' && <AnalysisHintDrawer />}
      </div>
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
