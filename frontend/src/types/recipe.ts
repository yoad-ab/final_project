import type { AnalysisDTO } from './analysis'

export interface RecipeDTO {
  recipe_id: string
  analyses: AnalysisDTO[]
}
