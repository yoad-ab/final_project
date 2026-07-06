from pathlib import Path

from .analysis import Analysis, AnalysisInput, AnalysisOutput
from .artifacts import ArtifactManager
from .recipe import Recipe


class AnalysisExecutor(object):
    def __init__(self, artifact_manager: ArtifactManager) -> None:
        self.artifact_manager = artifact_manager

    def run_analysis_on_data(self, analysis: Analysis, experiment_id: str, data_id: str, run_folder: Path) -> AnalysisOutput:
        raw_data_dir = self.artifact_manager.get_raw_data_directory(experiment_id, data_id)
        # output_dir = self.artifact_manager.get_analysis_output_directory(analysis)
        output_dir = run_folder

        analysis_input = AnalysisInput(raw_data_dir, output_dir, None, None)
        analysis_output = analysis.run(analysis_input)

        return analysis_output

    def run_analysis_on_output(self, analysis: Analysis, previous_run: AnalysisOutput, run_folder: Path) -> AnalysisOutput:
        # input_dir = self.artifact_manager.get_analysis_output_directory(previous_run.analysis)
        # output_dir = self.artifact_manager.get_analysis_output_directory(analysis)
        input_dir = run_folder
        output_dir = run_folder

        analysis_input = AnalysisInput(input_dir, output_dir, previous_run.analysis, previous_run)  # Do we need both output and analysis?
        analysis_output = analysis.run(analysis_input)

        return analysis_output

    def run_recipe(self, recipe: Recipe, experiment_id: str, data_id: str, run_folder: Path) -> AnalysisOutput:
        # 1. copy all files from raw data dir (get_raw_data_directory?) -> run_folder
        # 2. run all analyses in run folder

        first_analysis, *rest_of_recipe = recipe.analyses

        output = self.run_analysis_on_data(first_analysis, experiment_id, data_id, run_folder)

        for analysis in rest_of_recipe:
            print("[+] Output is", output)
            output = self.run_analysis_on_output(analysis, output, run_folder)

        print("[+] Final output is", output)
        return output
