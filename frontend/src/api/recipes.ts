import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { apiFetch } from './client'
import type { RecipeDTO } from '@/types/recipe'

// ── raw fetch functions ────────────────────────────────────────────────────

export const listRecipes = () =>
  apiFetch<RecipeDTO[]>('/recipes')

export const getRecipe = (id: string) =>
  apiFetch<RecipeDTO>(`/recipes/${id}`)

export const createRecipe = (body: { recipe_id: string; analysis_ids?: string[] }) =>
  apiFetch<RecipeDTO>('/recipes', { method: 'POST', body: JSON.stringify(body) })

export const updateRecipe = (id: string, analysis_ids: string[]) =>
  apiFetch<RecipeDTO>(`/recipes/${id}`, { method: 'PUT', body: JSON.stringify({ analysis_ids }) })

export const deleteRecipe = (id: string) =>
  apiFetch<void>(`/recipes/${id}`, { method: 'DELETE' })

// ── query keys ────────────────────────────────────────────────────────────

export const recipeKeys = {
  all:    () => ['recipes'] as const,
  detail: (id: string) => ['recipes', id] as const,
}

// ── hooks ─────────────────────────────────────────────────────────────────

export function useRecipes() {
  return useQuery({
    queryKey: recipeKeys.all(),
    queryFn:  listRecipes,
  })
}

export function useRecipe(id: string) {
  return useQuery({
    queryKey: recipeKeys.detail(id),
    queryFn:  () => getRecipe(id),
    enabled:  Boolean(id),
  })
}

export function useCreateRecipe() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: createRecipe,
    onSuccess: () => qc.invalidateQueries({ queryKey: recipeKeys.all() }),
  })
}

export function useUpdateRecipe() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, analysis_ids }: { id: string; analysis_ids: string[] }) =>
      updateRecipe(id, analysis_ids),
    onSuccess: (_data, { id }) => {
      qc.invalidateQueries({ queryKey: recipeKeys.all() })
      qc.invalidateQueries({ queryKey: recipeKeys.detail(id) })
    },
  })
}

export function useDeleteRecipe() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: deleteRecipe,
    onSuccess: (_data, id) => {
      qc.invalidateQueries({ queryKey: recipeKeys.all() })
      qc.removeQueries({ queryKey: recipeKeys.detail(id) })
    },
  })
}
