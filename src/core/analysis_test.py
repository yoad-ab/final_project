from pathlib import Path

from .analysis_python import PythonAnalysis
from .analysis_runner import AnalysisExecutor
from .artifacts import ArtifactManager
from .recipe import Recipe



python_analysis = PythonAnalysis("hello_world", """
print("hello world")
""")

python_analysis_2 = PythonAnalysis("hello_world_2", """
print("hello world 2")
""")




recipe = Recipe("hello_world_recipe", [python_analysis, python_analysis_2])

artifact_manager = ArtifactManager(Path("./data/"))
executor = AnalysisExecutor(artifact_manager)

output = executor.run_recipe(recipe, "experiment_1", "data_1")
print("Output:", output)
