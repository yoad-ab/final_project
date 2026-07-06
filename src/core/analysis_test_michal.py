from pathlib import Path

from .analysis import Analysis
from .analysis_runner import AnalysisExecutor
from .artifacts import ArtifactManager
from .recipe import Recipe


class AnalysisTestMichal(Analysis):
    def run(self, inp):
        sample_input_text = (inp.input_dir / "input.txt").read_text()
        sample_output_text = "The input was:" + sample_input_text

        (inp.output_dir / "output.txt").write_text(sample_output_text)

        return super().run(inp)

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

# ?
executor.run_recipe(r)
