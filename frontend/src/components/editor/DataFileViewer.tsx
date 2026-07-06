import { useMemo } from 'react'
import {
  AllCommunityModule,
  colorSchemeDark,
  ModuleRegistry,
  themeBalham,
} from 'ag-grid-community'
import type { ColDef } from 'ag-grid-community'
import { AgGridReact } from 'ag-grid-react'
import { AlertCircle, FileSpreadsheet, Loader2, ServerCrash } from 'lucide-react'
import { useFileContent } from '@/api/data-sources'
import { parseTabId } from '@/store/tabs'
import { ApiError } from '@/api/client'

ModuleRegistry.registerModules([AllCommunityModule])

const darkTheme = themeBalham.withPart(colorSchemeDark).withParams({
  backgroundColor: 'var(--color-bg-surface)',
  foregroundColor: 'var(--color-text)',
  borderColor: 'var(--color-border)',
  oddRowBackgroundColor: 'var(--color-bg-bar)',
  rowHoverColor: 'var(--color-bg-hover)',
  headerBackgroundColor: 'var(--color-bg-bar)',
  headerTextColor: 'var(--color-text-2)',
  fontFamily: 'var(--font-sans)',
  fontSize: 12,
  cellHorizontalPaddingScale: 0.8,
})

function fmtSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

function errorMessage(err: unknown): string {
  if (err instanceof ApiError && err.status === 0) return 'Cannot reach server'
  if (err instanceof Error) return err.message
  return 'Unknown error'
}

export function DataFileViewer({ tabId }: { tabId: string }) {
  const { label } = parseTabId(tabId)
  // label = "experimentId/dataId/filename"
  const slash1 = label.indexOf('/')
  const slash2 = label.indexOf('/', slash1 + 1)
  const experimentId = label.slice(0, slash1)
  const dataId = label.slice(slash1 + 1, slash2)
  const filename = label.slice(slash2 + 1)

  const { data, isLoading, isError, error } = useFileContent(experimentId, dataId, filename)

  const columnDefs: ColDef[] = useMemo(
    () =>
      (data && !data.too_large ? data.columns : []).map((col) => ({
        headerName: col,
        field: col,
        minWidth: 80,
        flex: 1,
        sortable: true,
        resizable: true,
        filter: true,
      })),
    [data],
  )

  const rowData = useMemo(() => {
    if (!data || data.too_large) return []
    return data.rows.map((row) => {
      const obj: Record<string, unknown> = {}
      data.columns.forEach((col, i) => {
        obj[col] = row[i]
      })
      return obj
    })
  }, [data])

  return (
    <div
      style={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
        minHeight: 0,
      }}
    >
      {/* Header bar */}
      <div
        style={{
          height: 36,
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          padding: '0 12px',
          borderBottom: '1px solid var(--color-border)',
          background: 'var(--color-bg-bar)',
          flexShrink: 0,
        }}
      >
        <FileSpreadsheet size={14} style={{ color: '#34d399', flexShrink: 0 }} />
        <span style={{ fontSize: 13, fontWeight: 500, color: 'var(--color-text)', flex: 1 }}>
          {filename}
        </span>
        {data && !isLoading && !isError && !data.too_large && (
          <span style={{ fontSize: 11, color: 'var(--color-text-3)' }}>
            {data.row_count.toLocaleString()} rows · {data.columns.length} cols · {fmtSize(data.size_bytes)}
          </span>
        )}
        {data?.truncated && (
          <span
            style={{
              fontSize: 10,
              color: 'var(--color-accent)',
              background: 'rgba(99,102,241,0.12)',
              padding: '2px 6px',
              borderRadius: 4,
            }}
          >
            first 10,000 rows shown
          </span>
        )}
      </div>

      {/* Body */}
      <div style={{ flex: 1, minHeight: 0, overflow: 'hidden' }}>
        {isLoading && (
          <div
            style={{
              flex: 1,
              height: '100%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 8,
              color: 'var(--color-text-3)',
              fontSize: 13,
            }}
          >
            <Loader2 size={16} className="animate-spin" /> Loading…
          </div>
        )}

        {isError && (
          <div
            style={{
              height: '100%',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 8,
              color: 'var(--color-red)',
              fontSize: 13,
              padding: '0 24px',
              textAlign: 'center',
            }}
          >
            <AlertCircle size={24} />
            <span style={{ fontWeight: 500 }}>Failed to load file</span>
            <span style={{ fontSize: 11, color: 'var(--color-text-3)' }}>{errorMessage(error)}</span>
          </div>
        )}

        {data?.too_large && (
          <div
            style={{
              height: '100%',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 8,
              color: 'var(--color-text-3)',
              fontSize: 13,
              padding: '0 24px',
              textAlign: 'center',
            }}
          >
            <ServerCrash size={28} style={{ color: 'var(--color-text-3)' }} />
            <span style={{ fontWeight: 500, color: 'var(--color-text-2)' }}>File too large to preview</span>
            <span style={{ fontSize: 11 }}>{fmtSize(data.size_bytes)} · limit is 10 MB</span>
          </div>
        )}

        {data && !data.too_large && !isLoading && !isError && (
          <div style={{ height: '100%', width: '100%' }}>
            <AgGridReact
              theme={darkTheme}
              columnDefs={columnDefs}
              rowData={rowData}
              defaultColDef={{ sortable: true, resizable: true, filter: true }}
            />
          </div>
        )}
      </div>
    </div>
  )
}
