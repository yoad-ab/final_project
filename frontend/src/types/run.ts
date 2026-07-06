export type RunStatus = 'running' | 'success' | 'failure' | 'cancelled'

export interface StepRecord {
  step_index: number
  analysis_id: string
  status: RunStatus
  duration_ms: number | null
  output_summary: string | null
  error: string | null
}

export interface RunRecord {
  run_id: string
  recipe_id: string | null
  analysis_id: string | null
  experiment_id: string
  dataset_id: string
  status: RunStatus
  started_at: string
  completed_at: string | null
  steps: StepRecord[]
}
