import { AlertCircle, Inbox, Loader2, Pencil, Plus, Trash2 } from 'lucide-react'
import { useState } from 'react'
import { LangIcon } from '@/components/icons/LangIcons'
import { useAnalyses, useDeleteAnalysis, useRenameAnalysis } from '@/api/analyses'
import { useDeleteRecipe, useRecipes, useRenameRecipe } from '@/api/recipes'
import { cn } from '@/lib/utils'
import { useTabsStore, makeTabId, selectActiveTab } from '@/store/tabs'
import { DataSourceExplorer } from '@/components/data-sources/DataSourceExplorer'
import { HistoryList } from '@/components/history/HistoryList'
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSeparator,
  ContextMenuTrigger,
} from '@/components/ui/context-menu'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
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
        cursor: 'pointer', fontSize: 13, fontWeight: 600, lineHeight: 1,
        padding: '3px 8px', borderRadius: 4,
      }}
    >
      <Plus size={12} strokeWidth={2.5} />
      New
    </button>
  )
}

// ── Analyses list ──────────────────────────────────────────────────────────

function AnalysesList() {
  const { data, isLoading, isError, error } = useAnalyses()
  const openTab    = useTabsStore((s) => s.openTab)
  const activeTab  = useTabsStore(selectActiveTab)
  const deleteMut  = useDeleteAnalysis()
  const renameMut  = useRenameAnalysis()

  const [renameTarget, setRenameTarget] = useState<string | null>(null)
  const [renameName,   setRenameName]   = useState('')
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null)

  function openRename(id: string) {
    setRenameTarget(id)
    setRenameName(id)
  }

  function handleRename() {
    if (!renameTarget || !renameName.trim() || renameName === renameTarget) {
      setRenameTarget(null)
      return
    }
    renameMut.mutate({ id: renameTarget, newId: renameName.trim() }, {
      onSuccess: () => setRenameTarget(null),
    })
  }

  function handleDelete() {
    if (!deleteTarget) return
    deleteMut.mutate(deleteTarget, {
      onSuccess: () => setDeleteTarget(null),
    })
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
    <>
      <div style={{ flex: 1, overflowY: 'auto' }}>
        <FilterInput placeholder="Filter analyses..." />
        {data.map(a => {
          const tabId = makeTabId('analysis', a.analysis_id)
          return (
            <ContextMenu key={a.analysis_id}>
              <ContextMenuTrigger asChild>
                <div>
                  <ContextItem
                    primary={a.analysis_id}
                    badge={<TypeBadge typeId={a.type_id} />}
                    isActive={activeTab === tabId}
                    onClick={() => openTab(tabId)}
                  />
                </div>
              </ContextMenuTrigger>
              <ContextMenuContent>
                <ContextMenuItem onSelect={() => openRename(a.analysis_id)}>
                  <Pencil size={13} />
                  Rename
                </ContextMenuItem>
                <ContextMenuSeparator />
                <ContextMenuItem destructive onSelect={() => setDeleteTarget(a.analysis_id)}>
                  <Trash2 size={13} />
                  Delete
                </ContextMenuItem>
              </ContextMenuContent>
            </ContextMenu>
          )
        })}
      </div>

      {/* Rename dialog */}
      <Dialog open={renameTarget !== null} onOpenChange={(open) => { if (!open) setRenameTarget(null) }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Rename Analysis</DialogTitle>
            <DialogDescription>Enter a new name for "{renameTarget}".</DialogDescription>
          </DialogHeader>
          <input
            value={renameName}
            onChange={(e) => setRenameName(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleRename()
              if (e.key === 'Escape') setRenameTarget(null)
            }}
            autoFocus
            style={{
              width: '100%',
              background: 'var(--color-bg-surface)',
              border: '1px solid var(--color-border)',
              borderRadius: 6,
              color: 'var(--color-text)',
              fontSize: 13,
              padding: '6px 10px',
              outline: 'none',
            }}
          />
          <DialogFooter>
            <button
              onClick={handleRename}
              disabled={renameMut.isPending || !renameName.trim()}
              style={{ background: 'var(--color-accent)', border: 'none', borderRadius: 5, color: '#fff', cursor: 'pointer', fontSize: 13, fontWeight: 600, padding: '5px 14px', opacity: renameMut.isPending ? 0.7 : 1 }}
            >
              {renameMut.isPending ? 'Renaming…' : 'Rename'}
            </button>
            <button
              onClick={() => setRenameTarget(null)}
              style={{ background: 'none', border: '1px solid var(--color-border)', borderRadius: 5, color: 'var(--color-text-2)', cursor: 'pointer', fontSize: 13, padding: '5px 14px' }}
            >
              Cancel
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete confirmation dialog */}
      <Dialog open={deleteTarget !== null} onOpenChange={(open) => { if (!open) setDeleteTarget(null) }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Analysis</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete "{deleteTarget}"? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <button
              onClick={handleDelete}
              disabled={deleteMut.isPending}
              style={{ background: 'var(--color-red)', border: 'none', borderRadius: 5, color: '#fff', cursor: 'pointer', fontSize: 13, fontWeight: 600, padding: '5px 14px', opacity: deleteMut.isPending ? 0.7 : 1 }}
            >
              {deleteMut.isPending ? 'Deleting…' : 'Delete'}
            </button>
            <button
              onClick={() => setDeleteTarget(null)}
              style={{ background: 'none', border: '1px solid var(--color-border)', borderRadius: 5, color: 'var(--color-text-2)', cursor: 'pointer', fontSize: 13, padding: '5px 14px' }}
            >
              Cancel
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}

// ── Recipes list ───────────────────────────────────────────────────────────

function RecipesList() {
  const { data, isLoading, isError, error } = useRecipes()
  const openTab   = useTabsStore((s) => s.openTab)
  const activeTab = useTabsStore(selectActiveTab)
  const deleteMut = useDeleteRecipe()
  const renameMut = useRenameRecipe()

  const [renameTarget, setRenameTarget] = useState<string | null>(null)
  const [renameName,   setRenameName]   = useState('')
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null)

  function openRename(id: string) {
    setRenameTarget(id)
    setRenameName(id)
  }

  function handleRename() {
    if (!renameTarget || !renameName.trim() || renameName === renameTarget) {
      setRenameTarget(null)
      return
    }
    renameMut.mutate({ id: renameTarget, newId: renameName.trim() }, {
      onSuccess: () => setRenameTarget(null),
    })
  }

  function handleDelete() {
    if (!deleteTarget) return
    deleteMut.mutate(deleteTarget, {
      onSuccess: () => setDeleteTarget(null),
    })
  }

  if (isLoading) return <PanelLoading />
  if (isError)   return <PanelError message={(error as Error).message} />

  if (!data?.length) {
    return <PlaceholderPanel label="No recipes yet — create one with +" />
  }

  return (
    <>
      <div style={{ flex: 1, overflowY: 'auto' }}>
        <FilterInput placeholder="Filter recipes..." />
        {data.map(r => {
          const tabId = makeTabId('recipe', r.recipe_id)
          return (
            <ContextMenu key={r.recipe_id}>
              <ContextMenuTrigger asChild>
                <div>
                  <ContextItem
                    primary={r.recipe_id}
                    secondary={`${r.analyses.length} step${r.analyses.length === 1 ? '' : 's'}`}
                    isActive={activeTab === tabId}
                    onClick={() => openTab(tabId)}
                  />
                </div>
              </ContextMenuTrigger>
              <ContextMenuContent>
                <ContextMenuItem onSelect={() => openRename(r.recipe_id)}>
                  <Pencil size={13} />
                  Rename
                </ContextMenuItem>
                <ContextMenuSeparator />
                <ContextMenuItem destructive onSelect={() => setDeleteTarget(r.recipe_id)}>
                  <Trash2 size={13} />
                  Delete
                </ContextMenuItem>
              </ContextMenuContent>
            </ContextMenu>
          )
        })}
      </div>

      {/* Rename dialog */}
      <Dialog open={renameTarget !== null} onOpenChange={(open) => { if (!open) setRenameTarget(null) }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Rename Recipe</DialogTitle>
            <DialogDescription>Enter a new name for "{renameTarget}".</DialogDescription>
          </DialogHeader>
          <input
            value={renameName}
            onChange={(e) => setRenameName(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleRename()
              if (e.key === 'Escape') setRenameTarget(null)
            }}
            autoFocus
            style={{
              width: '100%',
              background: 'var(--color-bg-surface)',
              border: '1px solid var(--color-border)',
              borderRadius: 6,
              color: 'var(--color-text)',
              fontSize: 13,
              padding: '6px 10px',
              outline: 'none',
            }}
          />
          <DialogFooter>
            <button
              onClick={handleRename}
              disabled={renameMut.isPending || !renameName.trim()}
              style={{ background: 'var(--color-accent)', border: 'none', borderRadius: 5, color: '#fff', cursor: 'pointer', fontSize: 13, fontWeight: 600, padding: '5px 14px', opacity: renameMut.isPending ? 0.7 : 1 }}
            >
              {renameMut.isPending ? 'Renaming…' : 'Rename'}
            </button>
            <button
              onClick={() => setRenameTarget(null)}
              style={{ background: 'none', border: '1px solid var(--color-border)', borderRadius: 5, color: 'var(--color-text-2)', cursor: 'pointer', fontSize: 13, padding: '5px 14px' }}
            >
              Cancel
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete confirmation dialog */}
      <Dialog open={deleteTarget !== null} onOpenChange={(open) => { if (!open) setDeleteTarget(null) }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Recipe</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete "{deleteTarget}"? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <button
              onClick={handleDelete}
              disabled={deleteMut.isPending}
              style={{ background: 'var(--color-red)', border: 'none', borderRadius: 5, color: '#fff', cursor: 'pointer', fontSize: 13, fontWeight: 600, padding: '5px 14px', opacity: deleteMut.isPending ? 0.7 : 1 }}
            >
              {deleteMut.isPending ? 'Deleting…' : 'Delete'}
            </button>
            <button
              onClick={() => setDeleteTarget(null)}
              style={{ background: 'none', border: '1px solid var(--color-border)', borderRadius: 5, color: 'var(--color-text-2)', cursor: 'pointer', fontSize: 13, padding: '5px 14px' }}
            >
              Cancel
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
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
  return (
    <span style={{ flexShrink: 0, display: 'flex', alignItems: 'center' }}>
      <LangIcon typeId={typeId} size={13} />
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
