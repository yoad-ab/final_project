from .registry import dump, load, register
from ..core.analysis_python import PythonAnalysis
from ..core.analysis_shell import ShellAnalysis

register("python", PythonAnalysis)
register("shell", ShellAnalysis)
