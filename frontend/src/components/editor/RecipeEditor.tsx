import { Fragment, useEffect, useRef, useState } from 'react'
import { useDirtyStore } from '@/store/dirty'
import {
  DndContext,
  PointerSensor,
  useSensor,
  useSensors,
  closestCenter,
  type DragEndEvent,
} from '@dnd-kit/core'
import {
  SortableContext,
  verticalListSortingStrategy,
  useSortable,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import {
  GripVertical, GitFork, FileCode2, Terminal,
  X, ExternalLink, Plus, Loader2, Check, AlertCircle,
} from 'lucide-react'
import { useRecipe, useCreateRecipe, useUpdateRecipe } from '@/api/recipes'
import { useAnalyses } from '@/api/analyses'
import { useTabsStore, makeTabId } from '@/store/tabs'
import type { AnalysisDTO } from '@/types/analysis'

// ── Step state (stable drag ID per slot) ──────────────────────────────────

interface StepState {
  id: string      // stable UUID for dnd-kit
  analysis: AnalysisDTO
}

function toStepStates(analyses: AnalysisDTO[]): StepState[] {
  return analyses.map(a => ({ id: crypto.randomUUID(), analysis: a }))
}

// ── Shared helpers ─────────────────────────────────────────────────────────

function codePreview(a: AnalysisDTO): string {
  const raw = a.type_id === 'shell'
    ? (a.params.shell_command as string) ?? ''
    : (a.params.python_code as string) ?? ''
  const lines = raw.split('\n').filter(l => l.trim())
  if (!lines.length) return '(empty)'
  return lines.slice(0, 2).join('\n')
}

function TypeBadge({ typeId }: { typeId: string }) {
  const isPy = typeId === 'python'
  return (
    <span style={{
      fontSize: 9, fontWeight: 700, padding: '1px 5px', borderRadius: 3,
      textTransform: 'uppercase' as const, letterSpacing: '0.06em', flexShrink: 0,
      background: isPy ? 'rgba(59,130,246,0.18)' : 'rgba(16,185,129,0.18)',
      color: isPy ? '#60a5fa' : '#34d399',
      fontFamily: 'var(--font-mono)',
    }}>
      {isPy ? 'py' : 'sh'}
    </span>
  )
}

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

// ── Step card ─────────────────────────────────────────────────────────────

interface StepCardProps {
  step: StepState
  index: number
  onRemove: () => void
  onOpenInTab: () => void
}

function StepCard({ step, index, onRemove, onOpenInTab }: StepCardProps) {
  const { analysis } = step
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: step.id })

  const Icon = analysis.type_id === 'shell' ? Terminal : FileCode2
  const iconColor = analysis.type_id === 'shell' ? '#34d399' : '#60a5fa'

  return (
    <div
      ref={setNodeRef}
      style={{
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.45 : 1,
        zIndex: isDragging ? 10 : 'auto',
      }}
    >
      <div
        style={{
          width: 420,
          background: 'var(--color-bg-panel)',
          border: '1px solid var(--color-border)',
          borderRadius: 8,
          overflow: 'hidden',
        }}
        className="recipe-step-card"
      >
        {/* Card header */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: 7,
          padding: '7px 10px',
          background: 'var(--color-bg-bar)',
          borderBottom: '1px solid var(--color-border)',
        }}>
          {/* Drag handle */}
          <div
            {...attributes} {...listeners}
            style={{ cursor: 'grab', color: 'var(--color-text-3)', display: 'flex', alignItems: 'center', flexShrink: 0, touchAction: 'none' }}
          >
            <GripVertical size={13} />
          </div>

          {/* Step number */}
          <span style={{ fontSize: 10, color: 'var(--color-text-3)', fontFamily: 'var(--font-mono)', flexShrink: 0, minWidth: 14 }}>
            {index + 1}
          </span>

          <Icon size={12} style={{ color: iconColor, flexShrink: 0 }} />
          <TypeBadge typeId={analysis.type_id} />

          <span style={{
            flex: 1, fontSize: 13, fontWeight: 500,
            color: 'var(--color-text)',
            overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
          }}>
            {analysis.analysis_id}
          </span>

          <button onClick={onOpenInTab} title="Open in tab" className="recipe-icon-btn">
            <ExternalLink size={11} />
          </button>
          <button onClick={onRemove} title="Remove step" className="recipe-icon-btn">
            <X size={11} />
          </button>
        </div>

        {/* Code preview */}
        <pre style={{
          margin: 0, padding: '7px 12px',
          fontFamily: 'var(--font-mono)', fontSize: 11,
          color: 'var(--color-text-3)', lineHeight: 1.55,
          overflow: 'hidden', whiteSpace: 'pre',
          textOverflow: 'ellipsis',
          background: 'transparent',
        }}>
          {codePreview(analysis)}
        </pre>
      </div>
    </div>
  )
}

// ── Connector arrow ───────────────────────────────────────────────────────

function Connector() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '3px 0' }}>
      <div style={{ width: 1, height: 14, background: 'var(--color-border)' }} />
      <div style={{ width: 0, height: 0, borderLeft: '4px solid transparent', borderRight: '4px solid transparent', borderTop: '5px solid var(--color-border)' }} />
    </div>
  )
}

// ── Add Step button + inline picker ───────────────────────────────────────

interface AddStepProps {
  insertIndex: number
  activeIndex: number | null
  query: string
  onOpen: (i: number) => void
  onClose: () => void
  onQueryChange: (q: string) => void
  onSelect: (a: AnalysisDTO, i: number) => void
  analyses: AnalysisDTO[]
}

function AddStep({ insertIndex, activeIndex, query, onOpen, onClose, onQueryChange, onSelect, analyses }: AddStepProps) {
  const isOpen = activeIndex === insertIndex

  const filtered = analyses.filter(a =>
    !query || a.analysis_id.toLowerCase().includes(query.toLowerCase())
  )

  if (!isOpen) {
    return (
      <button onClick={() => onOpen(insertIndex)} className="add-step-btn">
        <Plus size={11} />
        Add Step
      </button>
    )
  }

  return (
    <div style={{
      width: 420,
      background: 'var(--color-bg-panel)',
      border: `1px solid var(--color-accent)`,
      borderRadius: 8,
      overflow: 'hidden',
      boxShadow: '0 8px 32px rgba(0,0,0,0.45)',
    }}>
      <div style={{ padding: '7px 10px', borderBottom: '1px solid var(--color-border)', display: 'flex', alignItems: 'center', gap: 8 }}>
        <input
          autoFocus
          value={query}
          onChange={e => onQueryChange(e.target.value)}
          placeholder="Search analyses…"
          style={{
            flex: 1, background: 'transparent', border: 'none', outline: 'none',
            fontSize: 13, color: 'var(--color-text)', caretColor: 'var(--color-accent)',
          }}
        />
        <button onClick={onClose} className="recipe-icon-btn"><X size={12} /></button>
      </div>

      <div style={{ maxHeight: 220, overflowY: 'auto' }}>
        {filtered.length === 0 ? (
          <div style={{ padding: '12px 14px', fontSize: 12, color: 'var(--color-text-3)' }}>
            No analyses found
          </div>
        ) : filtered.map(a => (
          <div
            key={a.analysis_id}
            onClick={() => { onSelect(a, insertIndex); onClose(); onQueryChange('') }}
            className="add-step-option"
            style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '7px 14px', cursor: 'pointer' }}
          >
            <TypeBadge typeId={a.type_id} />
            <span style={{ fontSize: 13, color: 'var(--color-text)' }}>{a.analysis_id}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

// ── Recipe canvas ─────────────────────────────────────────────────────────

interface CanvasProps {
  steps: StepState[]
  allAnalyses: AnalysisDTO[]
  onReorder: (activeId: string, overId: string) => void
  onRemove: (index: number) => void
  onInsert: (a: AnalysisDTO, index: number) => void
}

function RecipeCanvas({ steps, allAnalyses, onReorder, onRemove, onInsert }: CanvasProps) {
  const openTab = useTabsStore(s => s.openTab)
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }))
  const [activeInsert, setActiveInsert] = useState<number | null>(null)
  const [query, setQuery] = useState('')

  function handleDragEnd(e: DragEndEvent) {
    const { active, over } = e
    if (over && active.id !== over.id) onReorder(active.id as string, over.id as string)
  }

  function closeInsert() { setActiveInsert(null); setQuery('') }

  const addStepProps = {
    activeIndex: activeInsert,
    query,
    onOpen: setActiveInsert,
    onClose: closeInsert,
    onQueryChange: setQuery,
    onSelect: onInsert,
    analyses: allAnalyses,
  }

  if (steps.length === 0) {
    return (
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 14 }}>
        <GitFork size={30} strokeWidth={1.2} style={{ color: 'var(--color-text-3)' }} />
        <span style={{ fontSize: 14, color: 'var(--color-text-2)' }}>No steps yet</span>
        <AddStep insertIndex={0} {...addStepProps} />
      </div>
    )
  }

  return (
    <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '28px 24px 60px', gap: 0 }}>
      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
        <SortableContext items={steps.map(s => s.id)} strategy={verticalListSortingStrategy}>
          {steps.map((step, i) => (
            <Fragment key={step.id}>
              <StepCard
                step={step}
                index={i}
                onRemove={() => onRemove(i)}
                onOpenInTab={() => openTab(makeTabId('analysis', step.analysis.analysis_id))}
              />
              <Connector />
              <AddStep insertIndex={i + 1} {...addStepProps} />
              {i < steps.length - 1 && <Connector />}
            </Fragment>
          ))}
        </SortableContext>
      </DndContext>
    </div>
  )
}

// ── Header ─────────────────────────────────────────────────────────────────

interface HeaderProps {
  titleNode: React.ReactNode
  stepCount: number
  isDirty: boolean
  isSaving: boolean
  saveOk: boolean
  saveError?: string
  canSave?: boolean
  onSave: () => void
  saveLabel?: string
}

function RecipeHeader({ titleNode, stepCount, isDirty, isSaving, saveOk, saveError, canSave = true, onSave, saveLabel = 'Save' }: HeaderProps) {
  const saveDisabled = isSaving || !canSave || (!isDirty && saveLabel === 'Save')

  return (
    <div style={{
      height: 38, background: 'var(--color-bg-bar)', borderBottom: '1px solid var(--color-border)',
      display: 'flex', alignItems: 'center', gap: 8, padding: '0 12px', flexShrink: 0,
    }}>
      <GitFork size={14} style={{ color: '#34d399', flexShrink: 0 }} strokeWidth={2} />
      <div style={{ flex: 1, minWidth: 0 }}>{titleNode}</div>

      <span style={{ fontSize: 11, color: 'var(--color-text-3)', flexShrink: 0 }}>
        {stepCount} step{stepCount !== 1 ? 's' : ''}
      </span>

      {saveError && (
        <span style={{ fontSize: 11, color: 'var(--color-red)', maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {saveError}
        </span>
      )}

      <button
        onClick={onSave}
        disabled={saveDisabled}
        style={{
          display: 'flex', alignItems: 'center', gap: 5,
          padding: '4px 10px', borderRadius: 4, border: 'none',
          fontSize: 12, fontWeight: 500,
          cursor: saveDisabled ? 'default' : 'pointer',
          background: saveOk
            ? 'rgba(34,197,94,0.2)'
            : saveDisabled
              ? 'var(--color-bg-hover)'
              : 'rgba(52,211,153,0.2)',
          color: saveOk
            ? 'var(--color-green)'
            : saveDisabled
              ? 'var(--color-text-3)'
              : '#34d399',
          transition: 'background 0.15s, color 0.15s',
        }}
      >
        {isSaving ? <Loader2 size={12} className="animate-spin" /> :
          saveOk ? <Check size={12} strokeWidth={2.5} /> :
          isDirty ? <span style={{ width: 6, height: 6, borderRadius: '50%', background: 'currentColor', flexShrink: 0 }} /> : null}
        {isSaving ? 'Saving…' : saveOk ? 'Saved' : saveLabel}
      </button>
    </div>
  )
}

// ── Existing recipe editor ─────────────────────────────────────────────────

function ExistingRecipeEditor({ tabId, recipeId }: { tabId: string; recipeId: string }) {
  const { data, isLoading, isError, error } = useRecipe(recipeId)
  const { data: allAnalyses = [] } = useAnalyses()
  const updateMutation = useUpdateRecipe()
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const { markDirty, markClean } = useDirtyStore()

  const [steps, setSteps] = useState<StepState[] | null>(null)
  const [saveOk, setSaveOk] = useState(false)

  // Initialize once when data arrives
  useEffect(() => {
    if (data && steps === null) setSteps(toStepStates(data.analyses))
  }, [data, steps])

  const serverIds = data?.analyses.map(a => a.analysis_id) ?? []
  const localIds  = steps ? steps.map(s => s.analysis.analysis_id) : serverIds
  const isDirty   = steps !== null && JSON.stringify(serverIds) !== JSON.stringify(localIds)

  useEffect(() => {
    isDirty ? markDirty(tabId) : markClean(tabId)
    return () => markClean(tabId)
  }, [isDirty, tabId, markDirty, markClean])

  if (isLoading || steps === null) return <CenteredSpinner />
  if (isError) return <CenteredError message={(error as Error).message} />

  function handleSave() {
    if (!isDirty) return
    updateMutation.mutate(
      { id: recipeId, analysis_ids: localIds },
      {
        onSuccess: () => {
          setSaveOk(true)
          if (saveTimerRef.current) clearTimeout(saveTimerRef.current)
          saveTimerRef.current = setTimeout(() => setSaveOk(false), 1800)
        },
      },
    )
  }

  function handleReorder(activeId: string, overId: string) {
    setSteps(prev => {
      if (!prev) return prev
      const oldIdx = prev.findIndex(s => s.id === activeId)
      const newIdx = prev.findIndex(s => s.id === overId)
      if (oldIdx === -1 || newIdx === -1) return prev
      const next = [...prev]
      next.splice(oldIdx, 1)
      next.splice(newIdx, 0, prev[oldIdx])
      return next
    })
  }

  function handleRemove(index: number) {
    setSteps(prev => prev?.filter((_, i) => i !== index) ?? [])
  }

  function handleInsert(analysis: AnalysisDTO, index: number) {
    const step: StepState = { id: crypto.randomUUID(), analysis }
    setSteps(prev => {
      if (!prev) return [step]
      const next = [...prev]
      next.splice(index, 0, step)
      return next
    })
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>
      <RecipeHeader
        titleNode={
          <span style={{ fontSize: 13, color: 'var(--color-text-2)', fontFamily: 'var(--font-mono)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {recipeId}
          </span>
        }
        stepCount={steps.length}
        isDirty={isDirty}
        isSaving={updateMutation.isPending}
        saveOk={saveOk}
        saveError={updateMutation.isError ? (updateMutation.error as Error).message : undefined}
        onSave={handleSave}
      />
      <RecipeCanvas
        steps={steps}
        allAnalyses={allAnalyses}
        onReorder={handleReorder}
        onRemove={handleRemove}
        onInsert={handleInsert}
      />
    </div>
  )
}

// ── New recipe editor ──────────────────────────────────────────────────────

function NewRecipeEditor({ tabId }: { tabId: string }) {
  const { data: allAnalyses = [] } = useAnalyses()
  const createMutation = useCreateRecipe()
  const openTab  = useTabsStore(s => s.openTab)
  const closeTab = useTabsStore(s => s.closeTab)
  const { markDirty, markClean } = useDirtyStore()

  const [recipeId, setRecipeId] = useState('')
  const [steps, setSteps]       = useState<StepState[]>([])
  const [saveOk, setSaveOk]     = useState(false)
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const canSave = Boolean(recipeId.trim())
  const isDirtyNew = Boolean(recipeId || steps.length)
  useEffect(() => {
    isDirtyNew ? markDirty(tabId) : markClean(tabId)
    return () => markClean(tabId)
  }, [isDirtyNew, tabId, markDirty, markClean])

  function handleSave() {
    if (!canSave) return
    createMutation.mutate(
      { recipe_id: recipeId.trim(), analysis_ids: steps.map(s => s.analysis.analysis_id) },
      {
        onSuccess: (created) => {
          setSaveOk(true)
          if (saveTimerRef.current) clearTimeout(saveTimerRef.current)
          saveTimerRef.current = setTimeout(() => {
            closeTab(tabId)
            openTab(makeTabId('recipe', created.recipe_id))
          }, 600)
        },
      },
    )
  }

  function handleReorder(activeId: string, overId: string) {
    setSteps(prev => {
      const oldIdx = prev.findIndex(s => s.id === activeId)
      const newIdx = prev.findIndex(s => s.id === overId)
      if (oldIdx === -1 || newIdx === -1) return prev
      const next = [...prev]
      next.splice(oldIdx, 1)
      next.splice(newIdx, 0, prev[oldIdx])
      return next
    })
  }

  function handleRemove(index: number) {
    setSteps(prev => prev.filter((_, i) => i !== index))
  }

  function handleInsert(analysis: AnalysisDTO, index: number) {
    const step: StepState = { id: crypto.randomUUID(), analysis }
    setSteps(prev => {
      const next = [...prev]
      next.splice(index, 0, step)
      return next
    })
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>
      <RecipeHeader
        titleNode={
          <input
            autoFocus
            value={recipeId}
            onChange={e => setRecipeId(e.target.value)}
            placeholder="recipe-name"
            spellCheck={false}
            style={{
              background: 'transparent', border: 'none', outline: 'none',
              fontSize: 13, color: 'var(--color-text)', fontFamily: 'var(--font-mono)',
              width: '100%', caretColor: 'var(--color-accent)',
            }}
          />
        }
        stepCount={steps.length}
        isDirty={Boolean(recipeId || steps.length)}
        isSaving={createMutation.isPending}
        saveOk={saveOk}
        saveError={createMutation.isError ? (createMutation.error as Error).message : undefined}
        canSave={canSave}
        onSave={handleSave}
        saveLabel="Create"
      />
      <RecipeCanvas
        steps={steps}
        allAnalyses={allAnalyses}
        onReorder={handleReorder}
        onRemove={handleRemove}
        onInsert={handleInsert}
      />
    </div>
  )
}

// ── Public entry point ────────────────────────────────────────────────────

export function RecipeEditor({ tabId }: { tabId: string }) {
  const recipeId = tabId.slice('recipe:'.length)
  const isNew = recipeId.startsWith('~new-')
  if (isNew) return <NewRecipeEditor tabId={tabId} />
  return <ExistingRecipeEditor tabId={tabId} recipeId={recipeId} />
}
