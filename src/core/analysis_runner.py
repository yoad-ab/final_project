from .analysis import Analysis, AnalysisInput, AnalysisOutput
from .artifacts import ArtifactManager


class AnalysisExecutor(object):
    def __init__(self, artifact_manager: ArtifactManager) -> None:
        self.artifact_manager = artifact_manager

    def run_analysis_on_data(self, analysis: Analysis, experiment_id: str, data_id: str) -> AnalysisOutput:
        raw_data_dir = self.artifact_manager.get_raw_data_directory(experiment_id, data_id)
        output_dir = self.artifact_manager.get_analysis_output_directory(analysis)

        analysis_input = AnalysisInput(raw_data_dir, output_dir, None, None)
        analysis_output = analysis.run(analysis_input)

        return analysis_output
