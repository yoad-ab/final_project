import { useState } from 'react'
import { AlertCircle, Inbox, Loader2, Plus, Trash2 } from 'lucide-react'
import { useAnalyses, useDeleteAnalysis } from '@/api/analyses'
import { useRecipes, useDeleteRecipe } from '@/api/recipes'
import { cn } from '@/lib/utils'
import { useTabsStore, makeTabId, selectActiveTab } from '@/store/tabs'
import { DataSourceExplorer } from '@/components/data-sources/DataSourceExplorer'
import { HistoryList } from '@/components/history/HistoryList'
import type { SidebarSection } from './ActivityBar'

function newAnalysisTabId() {
  return makeTabId('analysis', `~new-${crypto.randomUUID().slice(0, 8)}`)
}

function newRecipeTabId() {
  return makeTabId('recipe', `~new-${crypto.randomUUID().slice(0, 8)}`)
}

interface Props {
  section: SidebarSection
}

const TITLES: Record<SidebarSection, string> = {
  analyses:      'Analyses',
  recipes:       'Recipes',
  'data-sources': 'Data Sources',
  search:        'Search',
  history:       'History',
}

export function ContextPanel({ section }: Props) {
  return (
    <div
      style={{
        width: 236,
        background: 'var(--color-bg-panel)',
        borderRight: '1px solid var(--color-border)',
        display: 'flex',
        flexDirection: 'column',
        flexShrink: 0,
        overflow: 'hidden',
      }}
    >
      <div style={{ padding: '9px 10px 7px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <span style={{ fontSize: 10, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.09em', color: 'var(--color-text-2)' }}>
          {TITLES[section]}
        </span>
        {(section === 'analyses' || section === 'recipes') && (
          <NewItemButton section={section} />
        )}
        {section === 'data-sources' && <DataSourceAddButton />}
      </div>

      {section === 'analyses'     && <AnalysesList />}
      {section === 'recipes'      && <RecipesList />}
      {section === 'data-sources' && <DataSourceExplorer />}
      {section === 'search'       && <SearchPanel />}
      {section === 'history'      && <HistoryList />}
    </div>
  )
}

// ── Data source add button (triggers create form inside DataSourceExplorer) ──

function DataSourceAddButton() {
  return (
    <button
      onClick={() => {
        const event = new CustomEvent('ds-explorer:create')
        window.dispatchEvent(event)
      }}
      style={{ background: 'none', border: 'none', color: 'var(--color-text-3)', cursor: 'pointer', lineHeight: 1, padding: '2px 4px', borderRadius: 4, display: 'flex', alignItems: 'center' }}
      title="New data source"
    >
      <Plus size={14} />
    </button>
  )
}

// ── New item button ────────────────────────────────────────────────────────

function NewItemButton({ section }: { section: 'analyses' | 'recipes' }) {
  const openTab = useTabsStore((s) => s.openTab)

  function handleClick() {
    if (section === 'analyses') openTab(newAnalysisTabId())
    if (section === 'recipes')  openTab(newRecipeTabId())
  }

  return (
    <button
      onClick={handleClick}
      style={{
        display: 'flex', alignItems: 'center', gap: 4,
        background: 'var(--color-accent)', border: 'none', color: '#fff',
        cursor: 'pointer', fontSize: 11, fontWeight: 600, lineHeight: 1,
        padding: '3px 8px', borderRadius: 4,
      }}
    >
      <Plus size={11} strokeWidth={2.5} />
      New
    </button>
  )
}

// ── Analyses list ──────────────────────────────────────────────────────────

function AnalysesList() {
  const { data, isLoading, isError, error } = useAnalyses()
  const openTab = useTabsStore((s) => s.openTab)
  const closeTab = useTabsStore((s) => s.closeTab)
  const activeTab = useTabsStore(selectActiveTab)
  const deleteAnalysis = useDeleteAnalysis()

  function handleDelete(analysisId: string) {
    if (!window.confirm(`Delete analysis "${analysisId}"? This cannot be undone.`)) return
    deleteAnalysis.mutate(analysisId)
    closeTab(makeTabId('analysis', analysisId))
  }

  if (isLoading) return <PanelLoading />
  if (isError)   return <PanelError message={(error as Error).message} />

  if (!data?.length) {
    return (
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 8, color: 'var(--color-text-3)', padding: '0 16px', textAlign: 'center' }}>
        <Inbox size={28} strokeWidth={1.5} />
        <span style={{ fontSize: 13 }}>No analyses created</span>
      </div>
    )
  }

  return (
    <div style={{ flex: 1, overflowY: 'auto' }}>
      <FilterInput placeholder="Filter analyses..." />
      {data.map(a => {
        const tabId = makeTabId('analysis', a.analysis_id)
        return (
          <ContextItem
            key={a.analysis_id}
            primary={a.analysis_id}
            badge={<TypeBadge typeId={a.type_id} />}
            isActive={activeTab === tabId}
            onClick={() => openTab(tabId)}
            onDelete={() => handleDelete(a.analysis_id)}
            deleteTitle="Delete analysis"
          />
        )
      })}
    </div>
  )
}

// ── Recipes list ───────────────────────────────────────────────────────────

function RecipesList() {
  const { data, isLoading, isError, error } = useRecipes()
  const openTab = useTabsStore((s) => s.openTab)
  const closeTab = useTabsStore((s) => s.closeTab)
  const activeTab = useTabsStore(selectActiveTab)
  const deleteRecipe = useDeleteRecipe()

  function handleDelete(recipeId: string) {
    if (!window.confirm(`Delete recipe "${recipeId}"? This cannot be undone.`)) return
    deleteRecipe.mutate(recipeId)
    closeTab(makeTabId('recipe', recipeId))
  }

  if (isLoading) return <PanelLoading />
  if (isError)   return <PanelError message={(error as Error).message} />

  if (!data?.length) {
    return <PlaceholderPanel label="No recipes yet — create one with +" />
  }

  return (
    <div style={{ flex: 1, overflowY: 'auto' }}>
      <FilterInput placeholder="Filter recipes..." />
      {data.map(r => {
        const tabId = makeTabId('recipe', r.recipe_id)
        return (
          <ContextItem
            key={r.recipe_id}
            primary={r.recipe_id}
            secondary={`${r.analyses.length} step${r.analyses.length === 1 ? '' : 's'}`}
            isActive={activeTab === tabId}
            onClick={() => openTab(tabId)}
            onDelete={() => handleDelete(r.recipe_id)}
            deleteTitle="Delete recipe"
          />
        )
      })}
    </div>
  )
}

// ── Shared primitives ──────────────────────────────────────────────────────

export function FilterInput({ placeholder }: { placeholder: string }) {
  return (
    <div style={{ margin: '0 8px 7px', background: 'var(--color-bg-surface)', border: '1px solid var(--color-border)', borderRadius: 6, display: 'flex', alignItems: 'center', padding: '5px 8px', gap: 6, color: 'var(--color-text-3)', fontSize: 12 }}>
      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/></svg>
      <span>{placeholder}</span>
    </div>
  )
}

export function ContextItem({
  primary,
  secondary,
  badge,
  isActive,
  onClick,
  onDelete,
  deleteTitle,
}: {
  primary: string
  secondary?: string
  badge?: React.ReactNode
  isActive?: boolean
  onClick?: () => void
  onDelete?: () => void
  deleteTitle?: string
}) {
  const [hovered, setHovered] = useState(false)
  const showDelete = Boolean(onDelete) && hovered

  return (
    <div
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      className={cn(
        'flex items-center gap-[7px] cursor-pointer px-[10px] py-[5px] transition-colors',
        isActive ? 'bg-[var(--color-bg-hover)]' : 'hover:bg-[var(--color-bg-hover)]',
      )}
    >
      {badge}
      <span
        style={{
          flex: 1,
          fontSize: 13,
          color: isActive ? 'var(--color-text)' : 'var(--color-text-2)',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap',
          fontWeight: isActive ? 500 : 400,
        }}
      >
        {primary}
      </span>
      {secondary && !showDelete && (
        <span style={{ fontSize: 11, color: 'var(--color-text-3)', flexShrink: 0 }}>
          {secondary}
        </span>
      )}
      {onDelete && (
        <button
          onClick={(e) => { e.stopPropagation(); onDelete() }}
          title={deleteTitle ?? 'Delete'}
          style={{
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            background: 'none', border: 'none', cursor: 'pointer',
            color: 'var(--color-text-3)', padding: 2, borderRadius: 3,
            flexShrink: 0, width: 18, height: 18, lineHeight: 1,
            opacity: showDelete ? 1 : 0, transition: 'opacity 0.1s',
          }}
          onMouseEnter={(e) => { e.currentTarget.style.color = 'var(--color-red)' }}
          onMouseLeave={(e) => { e.currentTarget.style.color = 'var(--color-text-3)' }}
        >
          <Trash2 size={13} />
        </button>
      )}
    </div>
  )
}

function TypeBadge({ typeId }: { typeId: string }) {
  const isPy = typeId === 'python'
  return (
    <span style={{
      fontSize: 10, fontWeight: 600, padding: '1px 5px', borderRadius: 3,
      textTransform: 'uppercase', letterSpacing: '0.04em', flexShrink: 0,
      background: isPy ? 'rgba(59,130,246,0.2)' : 'rgba(16,185,129,0.2)',
      color: isPy ? '#60a5fa' : '#34d399',
    }}>
      {isPy ? 'py' : 'sh'}
    </span>
  )
}

export function PanelLoading() {
  return (
    <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, color: 'var(--color-text-3)', fontSize: 12 }}>
      <Loader2 size={14} className="animate-spin" />
      Loading...
    </div>
  )
}

export function PanelError({ message }: { message: string }) {
  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 6, color: 'var(--color-red)', fontSize: 12, padding: '0 12px', textAlign: 'center' }}>
      <AlertCircle size={18} />
      {message}
    </div>
  )
}

export function PlaceholderPanel({ label }: { label: string }) {
  return (
    <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--color-text-3)', fontSize: 12, padding: '0 16px', textAlign: 'center' }}>
      {label}
    </div>
  )
}

function SearchPanel() {
  return (
    <div style={{ padding: '0 8px', display: 'flex', flexDirection: 'column', gap: 4 }}>
      <div style={{ background: 'var(--color-bg-surface)', border: '1px solid var(--color-border)', borderRadius: 6, display: 'flex', alignItems: 'center', padding: '7px 8px', gap: 6, color: 'var(--color-text-2)', fontSize: 13 }}>
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/></svg>
        Search...
      </div>
      <PlaceholderPanel label="Global search coming soon" />
    </div>
  )
}
