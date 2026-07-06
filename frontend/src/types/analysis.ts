export interface AnalysisDTO {
  analysis_id: string
  type_id: 'python' | 'shell'
  params: Record<string, unknown>
}
