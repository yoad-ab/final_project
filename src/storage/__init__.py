from ..core.analysis_python import PythonAnalysis
from ..core.analysis_shell import ShellAnalysis
from .registry import dump, load, register
from .storage_manager import StorageManager

register("python", PythonAnalysis)
register("shell", ShellAnalysis)

__all__ = ["StorageManager", "dump", "load"]
