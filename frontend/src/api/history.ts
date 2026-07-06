import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { apiFetch } from './client'
import type { RunRecord } from '@/types/run'

// ── raw fetch functions ────────────────────────────────────────────────────

export const listRuns = () =>
  apiFetch<RunRecord[]>('/runs')

export const getRun = (id: string) =>
  apiFetch<RunRecord>(`/runs/${id}`)

export const runRecipe = (recipeId: string, body: { experiment_id: string; data_id: string }) =>
  apiFetch<RunRecord>(`/recipes/${recipeId}/run`, { method: 'POST', body: JSON.stringify(body) })

// ── query keys ────────────────────────────────────────────────────────────

export const historyKeys = {
  all:    () => ['runs'] as const,
  detail: (id: string) => ['runs', id] as const,
}

// ── hooks ─────────────────────────────────────────────────────────────────

export function useRuns() {
  return useQuery({
    queryKey: historyKeys.all(),
    queryFn:  listRuns,
  })
}

export function useRun(id: string) {
  return useQuery({
    queryKey: historyKeys.detail(id),
    queryFn:  () => getRun(id),
    enabled:  Boolean(id),
  })
}

export function useRunRecipe() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ recipeId, experiment_id, data_id }: { recipeId: string; experiment_id: string; data_id: string }) =>
      runRecipe(recipeId, { experiment_id, data_id }),
    // A new run was recorded — refresh the History list so it shows up.
    onSuccess: () => qc.invalidateQueries({ queryKey: historyKeys.all() }),
  })
}
