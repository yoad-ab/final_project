import { useQuery } from '@tanstack/react-query'
import { apiFetch } from './client'

export interface WorkspaceInfo {
  path: string
}

export function useWorkspace() {
  return useQuery({
    queryKey: ['workspace'],
    queryFn: () => apiFetch<WorkspaceInfo>('/workspace'),
    staleTime: Infinity,
    retry: false,
  })
}
