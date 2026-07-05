from pathlib import Path

from .analysis_python import PythonAnalysis
from .analysis_runner import AnalysisExecutor
from .artifacts import ArtifactManager

python_analysis = PythonAnalysis("""
print("hello world")
""")


artifact_manager = ArtifactManager(Path("./data/"))
executor = AnalysisExecutor(artifact_manager)

output = executor.run_analysis_on_data(python_analysis, "experiment_1", "data_1")
print("Output:", output)
