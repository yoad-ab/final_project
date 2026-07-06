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
  // Absolute path to this run's output files on disk. Server-derived; may be
  // absent on records produced before the field existed.
  output_path?: string | null
  steps: StepRecord[]
}
