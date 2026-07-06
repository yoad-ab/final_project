import { useState } from 'react'
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
  horizontalListSortingStrategy,
  useSortable,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { DatabaseZap, FileCode2, GitFork, LayoutGrid, Play, Sheet, Upload, X } from 'lucide-react'
import {
  useTabsStore,
  makeTabId,
  selectTabs,
  selectActiveTab,
  parseTabId,
  type TabId,
  type TabKind,
} from '@/store/tabs'
import { useDirtyStore } from '@/store/dirty'
import { AnalysisEditor } from '@/components/editor/AnalysisEditor'
import { DataFileViewer } from '@/components/editor/DataFileViewer'
import { RecipeEditor } from '@/components/editor/RecipeEditor'

// ── Icons per tab kind ────────────────────────────────────────────────────

const KIND_ICON: Record<TabKind, React.ElementType> = {
  analysis: FileCode2,
  recipe: GitFork,
  run: Play,
  datafile: Sheet,
}

const KIND_COLOR: Record<TabKind, string> = {
  analysis: '#60a5fa',
  recipe: '#34d399',
  run: '#f59e0b',
  datafile: '#34d399',
}

function getTabDisplayLabel(kind: TabKind, label: string): string {
  if (kind === 'datafile') return label.slice(label.lastIndexOf('/') + 1)
  if (label.startsWith('~new-')) return 'Untitled'
  return label
}

// ── Individual sortable tab ───────────────────────────────────────────────

interface SortableTabProps {
  tabId: TabId
  isActive: boolean
  onActivate: () => void
  onClose: (e: React.MouseEvent) => void
}

function SortableTab({ tabId, isActive, onActivate, onClose }: SortableTabProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: tabId })

  const [hovered, setHovered] = useState(false)
  const isDirty = useDirtyStore((s) => s.dirty.has(tabId))

  const { kind, label } = parseTabId(tabId)
  const Icon = KIND_ICON[kind] ?? FileCode2
  const color = KIND_COLOR[kind] ?? 'var(--color-text-3)'

  // Show dot when dirty and not hovering; show X when hovering (or clean + hovering)
  const showDot = isDirty && !hovered
  const btnVisible = hovered || isDirty

  return (
    <div
      ref={setNodeRef}
      style={{
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.4 : 1,
        flexShrink: 0,
      }}
    >
      <div
        onClick={onActivate}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        style={{
          height: 33,
          display: 'flex',
          alignItems: 'center',
          gap: 5,
          padding: '0 8px 0 10px',
          minWidth: 90,
          maxWidth: 200,
          cursor: 'pointer',
          userSelect: 'none',
          position: 'relative',
          background: isActive ? 'var(--color-bg-surface)' : hovered ? 'var(--color-bg-hover)' : 'transparent',
          borderRight: '1px solid var(--color-border)',
          boxSizing: 'border-box',
        }}
        {...attributes}
        {...listeners}
      >
        {/* Active indicator */}
        {isActive && (
          <div
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              height: 2,
              background: color,
            }}
          />
        )}

        <Icon
          size={12}
          style={{ color, flexShrink: 0 }}
          strokeWidth={2}
        />

        <span
          style={{
            flex: 1,
            fontSize: 12,
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
            color: isActive ? 'var(--color-text)' : 'var(--color-text-2)',
          }}
        >
          {getTabDisplayLabel(kind, label)}
        </span>

        <button
          onClick={(e) => { e.stopPropagation(); onClose(e) }}
          style={{
            background: 'none',
            border: 'none',
            padding: '2px 2px',
            cursor: 'pointer',
            color: isDirty && !hovered ? 'var(--color-accent)' : 'var(--color-text-3)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            borderRadius: 3,
            flexShrink: 0,
            lineHeight: 1,
            width: 18,
            height: 18,
            opacity: btnVisible ? 1 : 0,
            transition: 'opacity 0.1s, color 0.1s',
          }}
        >
          {showDot
            ? <span style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--color-accent)', display: 'block' }} />
            : <X size={11} strokeWidth={2.5} />
          }
        </button>
      </div>
    </div>
  )
}

// ── Tab strip ─────────────────────────────────────────────────────────────

function TabStrip() {
  const tabs = useTabsStore(selectTabs)
  const activeTab = useTabsStore(selectActiveTab)
  const openTab = useTabsStore((s) => s.openTab)
  const closeTab = useTabsStore((s) => s.closeTab)
  const setActiveTab = useTabsStore((s) => s.setActiveTab)
  const reorderTabs = useTabsStore((s) => s.reorderTabs)

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
  )

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event
    if (over && active.id !== over.id) {
      reorderTabs(active.id as TabId, over.id as TabId)
    }
  }

  return (
    <div
      style={{
        height: 35,
        background: 'var(--color-bg-bar)',
        borderBottom: '1px solid var(--color-border)',
        display: 'flex',
        alignItems: 'flex-end',
        flexShrink: 0,
        overflowX: 'auto',
        overflowY: 'hidden',
        scrollbarWidth: 'none',
      }}
    >
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
      >
        <SortableContext items={tabs} strategy={horizontalListSortingStrategy}>
          <div style={{ display: 'flex', alignItems: 'flex-end', minWidth: 'max-content' }}>
            {tabs.map((tabId) => (
              <SortableTab
                key={tabId}
                tabId={tabId}
                isActive={tabId === activeTab}
                onActivate={() => setActiveTab(tabId)}
                onClose={() => closeTab(tabId)}
              />
            ))}
          </div>
        </SortableContext>
      </DndContext>
    </div>
  )
}

// ── Tab content router ─────────────���──────────────────────────────────────

function TabContent({ tabId }: { tabId: TabId }) {
  const { kind, label } = parseTabId(tabId)

  if (kind === 'analysis') return <AnalysisEditor tabId={tabId} />
  if (kind === 'recipe')   return <RecipeEditor tabId={tabId} />
  if (kind === 'datafile') return <DataFileViewer tabId={tabId} />

  // Placeholder for run — coming soon
  const color = KIND_COLOR[kind] ?? 'var(--color-text-3)'
  return (
    <div
      style={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        color: 'var(--color-text-3)',
      }}
    >
      <span style={{ fontSize: 13, color, fontFamily: 'var(--font-mono)' }}>{label}</span>
      <span style={{ fontSize: 12 }}>{kind} editor coming soon</span>
    </div>
  )
}

// ── Empty state ───────────────────────────────────────────────────────────

function newAnalysisTabId() {
  return makeTabId('analysis', `~new-${crypto.randomUUID().slice(0, 8)}`)
}

function newRecipeTabId() {
  return makeTabId('recipe', `~new-${crypto.randomUUID().slice(0, 8)}`)
}

function EmptyState() {
  const openTab = useTabsStore((s) => s.openTab)

  function openDataSource() {
    window.dispatchEvent(new CustomEvent('sidebar:show-section', { detail: 'data-sources' }))
    setTimeout(() => window.dispatchEvent(new CustomEvent('ds-explorer:create')), 80)
  }

  return (
    <div
      style={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 28,
        color: 'var(--color-text-3)',
      }}
    >
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
        <LayoutGrid size={52} strokeWidth={1} style={{ color: 'var(--color-text-3)' }} />
        <span style={{ fontSize: 22, fontWeight: 600, color: 'var(--color-text-2)' }}>
          No editor open
        </span>
      </div>

      <div style={{ display: 'flex', gap: 12 }}>
        <button
          onClick={() => openTab(newAnalysisTabId())}
          style={{
            display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10,
            background: 'var(--color-accent)', border: 'none', color: '#fff',
            cursor: 'pointer', borderRadius: 10, padding: '20px 28px',
            fontSize: 14, fontWeight: 600, minWidth: 130,
          }}
        >
          <FileCode2 size={28} strokeWidth={1.5} />
          New Analysis
        </button>

        <button
          onClick={() => openTab(newRecipeTabId())}
          style={{
            display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10,
            background: 'var(--color-accent)', border: 'none', color: '#fff',
            cursor: 'pointer', borderRadius: 10, padding: '20px 28px',
            fontSize: 14, fontWeight: 600, minWidth: 130,
          }}
        >
          <GitFork size={28} strokeWidth={1.5} />
          New Recipe
        </button>

        <button
          onClick={openDataSource}
          style={{
            display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10,
            background: 'var(--color-accent)', border: 'none', color: '#fff',
            cursor: 'pointer', borderRadius: 10, padding: '20px 28px',
            fontSize: 14, fontWeight: 600, minWidth: 130,
          }}
        >
          <Upload size={28} strokeWidth={1.5} />
          Upload Data
        </button>
      </div>
    </div>
  )
}

// ── Main component ────────────────────────────────────────────────────────

export function EditorArea() {
  const tabs = useTabsStore(selectTabs)
  const activeTab = useTabsStore(selectActiveTab)

  return (
    <div
      style={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
        minHeight: 0,
        background: 'var(--color-bg-surface)',
      }}
    >
      <TabStrip />

      {tabs.length === 0 || activeTab === null ? (
        <EmptyState />
      ) : (
        tabs.map(tabId => (
          <div
            key={tabId}
            style={{
              display: tabId === activeTab ? 'flex' : 'none',
              flexDirection: 'column',
              flex: 1,
              overflow: 'hidden',
              minHeight: 0,
            }}
          >
            <TabContent tabId={tabId} />
          </div>
        ))
      )}
    </div>
  )
}
