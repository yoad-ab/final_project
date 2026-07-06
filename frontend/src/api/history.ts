import { useQuery } from '@tanstack/react-query'
import { apiFetch } from './client'
import type { RunRecord } from '@/types/run'

// ── raw fetch functions ────────────────────────────────────────────────────

export const listRuns = () =>
  apiFetch<RunRecord[]>('/runs')

export const getRun = (id: string) =>
  apiFetch<RunRecord>(`/runs/${id}`)

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
