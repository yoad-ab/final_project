import { useEffect, useMemo, useRef, useState } from 'react'
import {
  AlertCircle,
  ChevronDown,
  ChevronRight,
  File,
  FolderOpen,
  Loader2,
  Pencil,
  ServerCrash,
  Trash2,
  Upload,
  X,
} from 'lucide-react'
import {
  useCreateDataSource,
  useDataSourceDetail,
  useDataSources,
  useDeleteDataSource,
  useDeleteFile,
  useRenameDataSource,
  useRenameFile,
  useUploadFiles,
  VIEWABLE_EXTENSIONS,
  type DataSourceEntry,
} from '@/api/data-sources'
import { ApiError } from '@/api/client'
import { makeTabId, useTabsStore } from '@/store/tabs'
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

// ── Helpers ───────────────────────────────────────────────────────────────

function fmtSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

function fmtRelTime(ts: number): string {
  const diff = Date.now() / 1000 - ts
  if (diff < 60) return 'just now'
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`
  return `${Math.floor(diff / 86400)}d ago`
}

function errorMessage(err: unknown): string {
  if (err instanceof ApiError && err.status === 0) return 'Cannot reach server'
  if (err instanceof Error) return err.message
  return 'Unknown error'
}

// ── Shared rename / delete dialogs ────────────────────────────────────────

function RenameDialog({
  open,
  title,
  description,
  value,
  onChange,
  onConfirm,
  onCancel,
  isPending,
}: {
  open: boolean
  title: string
  description: string
  value: string
  onChange: (v: string) => void
  onConfirm: () => void
  onCancel: () => void
  isPending: boolean
}) {
  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) onCancel() }}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>
        <input
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') onConfirm()
            if (e.key === 'Escape') onCancel()
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
            onClick={onConfirm}
            disabled={isPending || !value.trim()}
            style={{ background: 'var(--color-accent)', border: 'none', borderRadius: 5, color: '#fff', cursor: 'pointer', fontSize: 13, fontWeight: 600, padding: '5px 14px', opacity: isPending ? 0.7 : 1 }}
          >
            {isPending ? 'Renaming…' : 'Rename'}
          </button>
          <button
            onClick={onCancel}
            style={{ background: 'none', border: '1px solid var(--color-border)', borderRadius: 5, color: 'var(--color-text-2)', cursor: 'pointer', fontSize: 13, padding: '5px 14px' }}
          >
            Cancel
          </button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

function DeleteDialog({
  open,
  title,
  description,
  onConfirm,
  onCancel,
  isPending,
}: {
  open: boolean
  title: string
  description: string
  onConfirm: () => void
  onCancel: () => void
  isPending: boolean
}) {
  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) onCancel() }}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <button
            onClick={onConfirm}
            disabled={isPending}
            style={{ background: 'var(--color-red)', border: 'none', borderRadius: 5, color: '#fff', cursor: 'pointer', fontSize: 13, fontWeight: 600, padding: '5px 14px', opacity: isPending ? 0.7 : 1 }}
          >
            {isPending ? 'Deleting…' : 'Delete'}
          </button>
          <button
            onClick={onCancel}
            style={{ background: 'none', border: '1px solid var(--color-border)', borderRadius: 5, color: 'var(--color-text-2)', cursor: 'pointer', fontSize: 13, padding: '5px 14px' }}
          >
            Cancel
          </button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

// ── Inline error banner ───────────────────────────────────────────────────

function ErrorBanner({ message }: { message: string }) {
  return (
    <div style={{ margin: '4px 8px', padding: '6px 8px', background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: 5, fontSize: 11, color: 'var(--color-red)', display: 'flex', alignItems: 'flex-start', gap: 5 }}>
      <AlertCircle size={12} style={{ flexShrink: 0, marginTop: 1 }} />
      <span>{message}</span>
    </div>
  )
}

// ── Create form ───────────────────────────────────────────────────────────

function CreateForm({ onDone }: { onDone: () => void }) {
  const [expId, setExpId] = useState('')
  const [dataId, setDataId] = useState('')
  const [files, setFiles] = useState<File[]>([])
  const [localErr, setLocalErr] = useState('')
  const fileRef = useRef<HTMLInputElement>(null)
  const createDs = useCreateDataSource()
  const upload = useUploadFiles()

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLocalErr('')
    const exp = expId.trim()
    const did = dataId.trim()
    if (!exp || !did) {
      setLocalErr('Both fields are required')
      return
    }
    try {
      await createDs.mutateAsync({ experiment_id: exp, data_id: did })
      if (files.length > 0) {
        await upload.mutateAsync({ experimentId: exp, dataId: did, files })
      }
      onDone()
    } catch (err) {
      setLocalErr(errorMessage(err))
    }
  }

  const busy = createDs.isPending || upload.isPending

  return (
    <form
      onSubmit={handleSubmit}
      style={{
        margin: '6px 8px',
        padding: '10px',
        background: 'var(--color-bg-hover)',
        border: '1px solid var(--color-border)',
        borderRadius: 6,
        display: 'flex',
        flexDirection: 'column',
        gap: 7,
      }}
    >
      <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--color-text-2)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
        New data source
      </span>

      <input
        placeholder="experiment_id"
        value={expId}
        onChange={e => setExpId(e.target.value)}
        autoFocus
        disabled={busy}
        style={inputStyle}
      />
      <input
        placeholder="data_id"
        value={dataId}
        onChange={e => setDataId(e.target.value)}
        disabled={busy}
        style={inputStyle}
      />

      <button
        type="button"
        onClick={() => fileRef.current?.click()}
        disabled={busy}
        style={{
          ...inputStyle,
          cursor: 'pointer',
          textAlign: 'left',
          color: files.length ? 'var(--color-text-2)' : 'var(--color-text-3)',
          display: 'flex',
          alignItems: 'center',
          gap: 5,
        }}
      >
        <Upload size={11} />
        {files.length ? `${files.length} file${files.length > 1 ? 's' : ''} selected` : 'Choose files (optional)'}
      </button>
      <input
        ref={fileRef}
        type="file"
        multiple
        style={{ display: 'none' }}
        onChange={e => setFiles(Array.from(e.target.files ?? []))}
      />

      {localErr && <ErrorBanner message={localErr} />}

      <div style={{ display: 'flex', gap: 6 }}>
        <button type="submit" disabled={busy} style={primaryBtnStyle}>
          {busy
            ? <><Loader2 size={11} className="animate-spin" /> {upload.isPending ? 'Uploading…' : 'Creating…'}</>
            : 'Create'
          }
        </button>
        <button type="button" onClick={onDone} disabled={busy} style={ghostBtnStyle}>
          Cancel
        </button>
      </div>
    </form>
  )
}

// ── File row ──────────────────────────────────────────────────────────────

function FileRow({
  name,
  sizeBytes,
  experimentId,
  dataId,
}: {
  name: string
  sizeBytes: number
  lastModified: number
  experimentId: string
  dataId: string
}) {
  const [hovered, setHovered] = useState(false)
  const [localErr, setLocalErr] = useState('')
  const [renaming, setRenaming] = useState(false)
  const [renameName, setRenameName] = useState('')
  const [deleting, setDeleting] = useState(false)
  const deleteFile = useDeleteFile()
  const renameFile = useRenameFile()
  const openTab = useTabsStore((s) => s.openTab)

  const ext = name.slice(name.lastIndexOf('.')).toLowerCase()
  const isViewable = VIEWABLE_EXTENSIONS.has(ext)

  function handleOpen() {
    if (!isViewable) return
    openTab(makeTabId('datafile', `${experimentId}/${dataId}/${name}`))
  }

  async function handleDelete() {
    setLocalErr('')
    try {
      await deleteFile.mutateAsync({ experimentId, dataId, filename: name })
      setDeleting(false)
    } catch (err) {
      setLocalErr(errorMessage(err))
    }
  }

  function handleRename() {
    if (!renameName.trim() || renameName === name) { setRenaming(false); return }
    renameFile.mutate(
      { experimentId, dataId, filename: name, newName: renameName.trim() },
      { onSuccess: () => setRenaming(false) },
    )
  }

  return (
    <>
      <ContextMenu>
        <ContextMenuTrigger asChild>
          <div
            onMouseEnter={() => setHovered(true)}
            onMouseLeave={() => setHovered(false)}
            onClick={isViewable ? handleOpen : undefined}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 5,
              padding: '3px 10px 3px 44px',
              background: hovered ? 'var(--color-bg-hover)' : 'transparent',
              cursor: isViewable ? 'pointer' : 'default',
            }}
          >
            <File size={11} style={{ color: isViewable ? '#34d399' : 'var(--color-text-3)', flexShrink: 0 }} />
            <span style={{ flex: 1, fontSize: 12, color: isViewable ? 'var(--color-text)' : 'var(--color-text-2)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {name}
            </span>
            <span style={{ fontSize: 10, color: 'var(--color-text-3)', flexShrink: 0 }}>
              {fmtSize(sizeBytes)}
            </span>
            <button
              onClick={(e) => { e.stopPropagation(); deleteFile.mutate({ experimentId, dataId, filename: name }) }}
              disabled={deleteFile.isPending}
              title="Delete file"
              style={{
                ...iconBtnStyle,
                opacity: hovered || deleteFile.isPending ? 1 : 0,
                color: 'var(--color-text-3)',
                transition: 'opacity 0.1s',
                width: 18,
              }}
            >
              {deleteFile.isPending
                ? <Loader2 size={10} className="animate-spin" />
                : <X size={11} />
              }
            </button>
          </div>
        </ContextMenuTrigger>
        <ContextMenuContent>
          <ContextMenuItem onSelect={() => { setRenameName(name); setRenaming(true) }}>
            <Pencil size={13} />
            Rename
          </ContextMenuItem>
          <ContextMenuSeparator />
          <ContextMenuItem destructive onSelect={() => setDeleting(true)}>
            <Trash2 size={13} />
            Delete
          </ContextMenuItem>
        </ContextMenuContent>
      </ContextMenu>
      {localErr && (
        <div style={{ padding: '0 44px 2px', fontSize: 10, color: 'var(--color-red)' }}>{localErr}</div>
      )}
      <RenameDialog
        open={renaming}
        title="Rename File"
        description={`Enter a new name for "${name}".`}
        value={renameName}
        onChange={setRenameName}
        onConfirm={handleRename}
        onCancel={() => setRenaming(false)}
        isPending={renameFile.isPending}
      />
      <DeleteDialog
        open={deleting}
        title="Delete File"
        description={`Are you sure you want to delete "${name}"? This action cannot be undone.`}
        onConfirm={handleDelete}
        onCancel={() => setDeleting(false)}
        isPending={deleteFile.isPending}
      />
    </>
  )
}

// ── Data source item (data_id level) ─────────────────────────────────────

function DataSourceItem({ entry }: { entry: DataSourceEntry }) {
  const [expanded, setExpanded] = useState(false)
  const [hovered, setHovered] = useState(false)
  const [uploadErr, setUploadErr] = useState('')
  const [renaming, setRenaming] = useState(false)
  const [renameName, setRenameName] = useState('')
  const [deleting, setDeleting] = useState(false)
  const uploadRef = useRef<HTMLInputElement>(null)
  const upload = useUploadFiles()
  const deleteDs = useDeleteDataSource()
  const renameDs = useRenameDataSource()

  const detail = useDataSourceDetail(entry.experiment_id, entry.data_id, expanded)

  async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    setUploadErr('')
    const files = Array.from(e.target.files ?? [])
    if (!files.length) return
    try {
      await upload.mutateAsync({ experimentId: entry.experiment_id, dataId: entry.data_id, files })
    } catch (err) {
      setUploadErr(errorMessage(err))
    } finally {
      e.target.value = ''
    }
  }

  function handleRename() {
    if (!renameName.trim() || renameName === entry.data_id) { setRenaming(false); return }
    renameDs.mutate(
      { experimentId: entry.experiment_id, dataId: entry.data_id, newDataId: renameName.trim() },
      { onSuccess: () => setRenaming(false) },
    )
  }

  return (
    <div>
      <ContextMenu>
        <ContextMenuTrigger asChild>
          {/* data_id header row — indented under experiment */}
          <div
            onMouseEnter={() => setHovered(true)}
            onMouseLeave={() => setHovered(false)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 4,
              padding: '3px 8px 3px 20px',
              background: hovered ? 'var(--color-bg-hover)' : 'transparent',
            }}
          >
            <button
              onClick={() => setExpanded(v => !v)}
              style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer', color: 'var(--color-text-3)', display: 'flex', lineHeight: 1, flexShrink: 0 }}
            >
              {expanded ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
            </button>

            <FolderOpen size={12} style={{ color: '#a78bfa', flexShrink: 0 }} />

            <div style={{ flex: 1, minWidth: 0, cursor: 'pointer' }} onClick={() => setExpanded(v => !v)}>
              <div style={{ fontSize: 12, color: 'var(--color-text)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {entry.data_id}
              </div>
              <div style={{ fontSize: 10, color: 'var(--color-text-3)' }}>
                {entry.file_count} file{entry.file_count !== 1 ? 's' : ''} · {fmtSize(entry.total_size_bytes)}
              </div>
            </div>

            <span style={{ fontSize: 10, color: 'var(--color-text-3)', flexShrink: 0, opacity: hovered ? 0 : 1, transition: 'opacity 0.1s', pointerEvents: 'none' }}>
              {fmtRelTime(entry.last_modified)}
            </span>

            <div style={{ display: 'flex', gap: 2, flexShrink: 0, opacity: hovered ? 1 : 0, transition: 'opacity 0.1s' }}>
              <button
                onClick={e => { e.stopPropagation(); uploadRef.current?.click() }}
                disabled={upload.isPending}
                title="Upload files"
                style={iconBtnStyle}
              >
                {upload.isPending ? <Loader2 size={11} className="animate-spin" /> : <Upload size={11} />}
              </button>
            </div>

            <input ref={uploadRef} type="file" multiple style={{ display: 'none' }} onChange={handleUpload} />
          </div>
        </ContextMenuTrigger>
        <ContextMenuContent>
          <ContextMenuItem onSelect={() => { setRenameName(entry.data_id); setRenaming(true) }}>
            <Pencil size={13} />
            Rename
          </ContextMenuItem>
          <ContextMenuSeparator />
          <ContextMenuItem destructive onSelect={() => setDeleting(true)}>
            <Trash2 size={13} />
            Delete
          </ContextMenuItem>
        </ContextMenuContent>
      </ContextMenu>

      {uploadErr && <ErrorBanner message={uploadErr} />}

      {expanded && (
        <div style={{ paddingBottom: 2 }}>
          {detail.isLoading && (
            <div style={{ padding: '4px 44px', display: 'flex', alignItems: 'center', gap: 5, fontSize: 11, color: 'var(--color-text-3)' }}>
              <Loader2 size={11} className="animate-spin" /> Loading…
            </div>
          )}
          {detail.isError && (
            <ErrorBanner message={errorMessage(detail.error)} />
          )}
          {detail.data?.files.length === 0 && (
            <div style={{ padding: '4px 44px', fontSize: 11, color: 'var(--color-text-3)' }}>
              Empty — use ↑ to upload files
            </div>
          )}
          {detail.data?.files.map(f => (
            <FileRow
              key={f.name}
              name={f.name}
              sizeBytes={f.size_bytes}
              lastModified={f.last_modified}
              experimentId={entry.experiment_id}
              dataId={entry.data_id}
            />
          ))}
        </div>
      )}

      <RenameDialog
        open={renaming}
        title="Rename Dataset"
        description={`Enter a new name for "${entry.data_id}".`}
        value={renameName}
        onChange={setRenameName}
        onConfirm={handleRename}
        onCancel={() => setRenaming(false)}
        isPending={renameDs.isPending}
      />
      <DeleteDialog
        open={deleting}
        title="Delete Dataset"
        description={`Are you sure you want to delete "${entry.data_id}" and all its files? This action cannot be undone.`}
        onConfirm={() => deleteDs.mutate(
          { experimentId: entry.experiment_id, dataId: entry.data_id },
          { onSuccess: () => setDeleting(false) },
        )}
        onCancel={() => setDeleting(false)}
        isPending={deleteDs.isPending}
      />
    </div>
  )
}

// ── Experiment group (experiment_id level) ────────────────────────────────

function ExperimentGroup({ experimentId, entries }: { experimentId: string; entries: DataSourceEntry[] }) {
  const [expanded, setExpanded] = useState(true)
  const [hovered, setHovered] = useState(false)

  return (
    <div>
      <div
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        onClick={() => setExpanded(v => !v)}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 4,
          padding: '4px 8px 4px 6px',
          cursor: 'pointer',
          background: hovered ? 'var(--color-bg-hover)' : 'transparent',
        }}
      >
        <span style={{ color: 'var(--color-text-3)', display: 'flex', lineHeight: 1, flexShrink: 0 }}>
          {expanded ? <ChevronDown size={13} /> : <ChevronRight size={13} />}
        </span>
        <FolderOpen size={13} style={{ color: '#f59e0b', flexShrink: 0 }} />
        <span style={{ flex: 1, fontSize: 12, fontWeight: 600, color: 'var(--color-text)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {experimentId}
        </span>
        <span style={{ fontSize: 10, color: 'var(--color-text-3)', flexShrink: 0 }}>
          {entries.length} dataset{entries.length !== 1 ? 's' : ''}
        </span>
      </div>

      {expanded && entries.map(entry => (
        <DataSourceItem key={entry.data_id} entry={entry} />
      ))}
    </div>
  )
}

// ── Main explorer ─────────────────────────────────────────────────────────

export function DataSourceExplorer() {
  const [creating, setCreating] = useState(false)
  const { data, isLoading, isError, error } = useDataSources()

  useEffect(() => {
    function handleCreate() { setCreating(true) }
    window.addEventListener('ds-explorer:create', handleCreate)
    return () => window.removeEventListener('ds-explorer:create', handleCreate)
  }, [])

  const groups = useMemo(() => {
    const map = new Map<string, DataSourceEntry[]>()
    for (const entry of (data ?? [])) {
      const arr = map.get(entry.experiment_id) ?? []
      arr.push(entry)
      map.set(entry.experiment_id, arr)
    }
    return Array.from(map.entries())
  }, [data])

  if (isLoading) {
    return (
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, color: 'var(--color-text-3)', fontSize: 12 }}>
        <Loader2 size={14} className="animate-spin" /> Loading…
      </div>
    )
  }

  if (isError) {
    const isUnreachable = error instanceof TypeError || (error instanceof ApiError && error.status === 0)
    return (
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 8, color: isUnreachable ? 'var(--color-text-3)' : 'var(--color-red)', fontSize: 12, padding: '0 16px', textAlign: 'center' }}>
        {isUnreachable ? <ServerCrash size={20} /> : <AlertCircle size={20} />}
        <span style={{ fontWeight: 500 }}>{isUnreachable ? 'Cannot reach server' : 'Failed to load'}</span>
        <span style={{ fontSize: 11, color: 'var(--color-text-3)' }}>{errorMessage(error)}</span>
      </div>
    )
  }

  return (
    <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column' }}>
      {creating && <CreateForm onDone={() => setCreating(false)} />}

      {!creating && !data?.length && (
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--color-text-3)', fontSize: 12, padding: '0 16px', textAlign: 'center' }}>
          No data sources yet — press + to create one
        </div>
      )}

      {groups.map(([experimentId, entries]) => (
        <ExperimentGroup key={experimentId} experimentId={experimentId} entries={entries} />
      ))}
    </div>
  )
}

// ── Shared style tokens ───────────────────────────────────────────────────

const inputStyle: React.CSSProperties = {
  background: 'var(--color-bg-surface)',
  border: '1px solid var(--color-border)',
  borderRadius: 4,
  padding: '5px 7px',
  fontSize: 12,
  color: 'var(--color-text)',
  outline: 'none',
  width: '100%',
  boxSizing: 'border-box',
}

const primaryBtnStyle: React.CSSProperties = {
  flex: 1,
  background: 'var(--color-accent)',
  color: '#fff',
  border: 'none',
  borderRadius: 4,
  padding: '5px 10px',
  fontSize: 12,
  fontWeight: 600,
  cursor: 'pointer',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  gap: 4,
}

const ghostBtnStyle: React.CSSProperties = {
  flex: 1,
  background: 'none',
  border: '1px solid var(--color-border)',
  borderRadius: 4,
  padding: '5px 10px',
  fontSize: 12,
  color: 'var(--color-text-2)',
  cursor: 'pointer',
}

const iconBtnStyle: React.CSSProperties = {
  background: 'none',
  border: 'none',
  padding: '2px 3px',
  cursor: 'pointer',
  color: 'var(--color-text-3)',
  display: 'flex',
  alignItems: 'center',
  borderRadius: 3,
  lineHeight: 1,
}
