from pathlib import Path

from .analysis import Analysis
from .analysis_runner import AnalysisExecutor
from .artifacts import ArtifactManager
from .recipe import Recipe

from .registry_manager import generate_run_id
from .analysis import AnalysisCompletionStatus


class AnalysisTestMichal(Analysis):
    def run(self, inp):
        sample_input_text = (inp.input_dir / "input.txt").read_text()
        sample_output_text = "The input was:" + sample_input_text

        (inp.output_dir / "output.txt").write_text(sample_output_text)

        return inp.to_output(
        status=AnalysisCompletionStatus.SUCCESS,
        returned_object=sample_output_text,
        analysis=self
    )

    def get_type_id(self) -> str:
        raise NotImplementedError

    def serialize(self) -> dict:
        raise NotImplementedError

    @classmethod
    def deserialize(cls, analysis_id: str, params: dict) -> "Analysis":
        raise NotImplementedError


a = AnalysisTestMichal("analysis_1")
r = Recipe("recipe_1", [a])


artifact_manager = ArtifactManager(Path("./data/"))
executor = AnalysisExecutor(artifact_manager)
run_id = generate_run_id()
run_folder = artifact_manager.get_run_directory(run_id)

# ?
executor.run_recipe(r, experiment_id="exp1", data_id="dataset1", run_folder=run_folder)