import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { apiFetch } from './client'
import type { AnalysisDTO } from '@/types/analysis'

// ── raw fetch functions ────────────────────────────────────────────────────

export const listAnalyses = () =>
  apiFetch<AnalysisDTO[]>('/analyses')

export const getAnalysis = (id: string) =>
  apiFetch<AnalysisDTO>(`/analyses/${id}`)

export const createAnalysis = (body: { analysis_id: string; type_id: string; params?: Record<string, unknown> }) =>
  apiFetch<AnalysisDTO>('/analyses', { method: 'POST', body: JSON.stringify(body) })

export const updateAnalysis = (id: string, params: Record<string, unknown>) =>
  apiFetch<AnalysisDTO>(`/analyses/${id}`, { method: 'PUT', body: JSON.stringify({ params }) })

export const deleteAnalysis = (id: string) =>
  apiFetch<void>(`/analyses/${id}`, { method: 'DELETE' })

export const renameAnalysis = (id: string, newId: string) =>
  apiFetch<AnalysisDTO>(`/analyses/${id}`, { method: 'PATCH', body: JSON.stringify({ analysis_id: newId }) })

export interface ValidateResult {
  valid: boolean
  error?: string
  function_name?: string
}

export const validateCode = (code: string, typeId: string) =>
  apiFetch<ValidateResult>('/analyses/validate', { method: 'POST', body: JSON.stringify({ code, type_id: typeId }) })

// ── query keys ────────────────────────────────────────────────────────────

export const analysisKeys = {
  all:    () => ['analyses'] as const,
  detail: (id: string) => ['analyses', id] as const,
}

// ── hooks ─────────────────────────────────────────────────────────────────

export function useAnalyses() {
  return useQuery({
    queryKey: analysisKeys.all(),
    queryFn:  listAnalyses,
  })
}

export function useAnalysis(id: string) {
  return useQuery({
    queryKey: analysisKeys.detail(id),
    queryFn:  () => getAnalysis(id),
    enabled:  Boolean(id),
  })
}

export function useCreateAnalysis() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: createAnalysis,
    onSuccess: () => qc.invalidateQueries({ queryKey: analysisKeys.all() }),
  })
}

export function useUpdateAnalysis() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, params }: { id: string; params: Record<string, unknown> }) =>
      updateAnalysis(id, params),
    onSuccess: (_data, { id }) => {
      qc.invalidateQueries({ queryKey: analysisKeys.all() })
      qc.invalidateQueries({ queryKey: analysisKeys.detail(id) })
    },
  })
}

export function useDeleteAnalysis() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: deleteAnalysis,
    onSuccess: (_data, id) => {
      qc.invalidateQueries({ queryKey: analysisKeys.all() })
      qc.removeQueries({ queryKey: analysisKeys.detail(id) })
    },
  })
}

export function useValidateCode() {
  return useMutation({
    mutationFn: ({ code, typeId }: { code: string; typeId: string }) =>
      validateCode(code, typeId),
  })
}

export function useRenameAnalysis() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, newId }: { id: string; newId: string }) => renameAnalysis(id, newId),
    onSuccess: (_data, { id }) => {
      qc.invalidateQueries({ queryKey: analysisKeys.all() })
      qc.removeQueries({ queryKey: analysisKeys.detail(id) })
    },
  })
}
