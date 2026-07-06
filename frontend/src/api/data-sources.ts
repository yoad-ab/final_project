import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { apiFetch } from './client'

const BASE = (import.meta.env.VITE_API_BASE_URL as string | undefined) ?? 'http://localhost:8000'

export interface FileInfo {
  name: string
  size_bytes: number
  last_modified: number
}

export interface DataSourceEntry {
  experiment_id: string
  data_id: string
  file_count: number
  total_size_bytes: number
  last_modified: number
}

export interface DataSourceDetail {
  experiment_id: string
  data_id: string
  files: FileInfo[]
}

export type DataFileContent =
  | {
      too_large: false
      size_bytes: number
      columns: string[]
      rows: (string | number | boolean | null)[][]
      row_count: number
      truncated: boolean
    }
  | {
      too_large: true
      size_bytes: number
      columns: []
      rows: []
      row_count: 0
      truncated: false
    }

export const VIEWABLE_EXTENSIONS = new Set(['.csv', '.tsv', '.xlsx', '.xls'])

const keys = {
  all: () => ['data-sources'] as const,
  detail: (exp: string, data: string) => ['data-sources', exp, data] as const,
  fileContent: (exp: string, data: string, filename: string) =>
    ['data-sources', exp, data, 'content', filename] as const,
}

export function useDataSources() {
  return useQuery({
    queryKey: keys.all(),
    queryFn: () => apiFetch<DataSourceEntry[]>('/data-sources'),
  })
}

export function useDataSourceDetail(experimentId: string, dataId: string, enabled = true) {
  return useQuery({
    queryKey: keys.detail(experimentId, dataId),
    queryFn: () => apiFetch<DataSourceDetail>(`/data-sources/${experimentId}/${dataId}`),
    enabled,
  })
}

export function useCreateDataSource() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (body: { experiment_id: string; data_id: string }) =>
      apiFetch<DataSourceEntry>('/data-sources', {
        method: 'POST',
        body: JSON.stringify(body),
      }),
    onSuccess: () => qc.invalidateQueries({ queryKey: keys.all() }),
  })
}

export function useUploadFiles() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({
      experimentId,
      dataId,
      files,
    }: {
      experimentId: string
      dataId: string
      files: File[]
    }) => {
      const form = new FormData()
      for (const f of files) form.append('files', f)
      const res = await fetch(`${BASE}/data-sources/${experimentId}/${dataId}/upload`, {
        method: 'POST',
        body: form,
      })
      if (!res.ok) {
        const body = await res.json().catch(() => ({}))
        throw new Error(body.detail ?? `${res.status} ${res.statusText}`)
      }
      return res.json()
    },
    onSuccess: (_data, { experimentId, dataId }) => {
      qc.invalidateQueries({ queryKey: keys.all() })
      qc.invalidateQueries({ queryKey: keys.detail(experimentId, dataId) })
    },
  })
}

export function useDeleteDataSource() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ experimentId, dataId }: { experimentId: string; dataId: string }) =>
      apiFetch(`/data-sources/${experimentId}/${dataId}`, { method: 'DELETE' }),
    onSuccess: () => qc.invalidateQueries({ queryKey: keys.all() }),
  })
}

export function useFileContent(experimentId: string, dataId: string, filename: string) {
  return useQuery({
    queryKey: keys.fileContent(experimentId, dataId, filename),
    queryFn: () =>
      apiFetch<DataFileContent>(
        `/data-sources/${experimentId}/${dataId}/files/${encodeURIComponent(filename)}/content`,
      ),
  })
}

export function useDeleteFile() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({
      experimentId,
      dataId,
      filename,
    }: {
      experimentId: string
      dataId: string
      filename: string
    }) =>
      apiFetch(`/data-sources/${experimentId}/${dataId}/${filename}`, { method: 'DELETE' }),
    onSuccess: (_data, { experimentId, dataId }) => {
      qc.invalidateQueries({ queryKey: keys.all() })
      qc.invalidateQueries({ queryKey: keys.detail(experimentId, dataId) })
    },
  })
}
