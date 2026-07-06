from ..core.analysis_python import PythonAnalysis
from .registry import dump, load, register
from .storage_manager import StorageManager

register("python", PythonAnalysis)

__all__ = ["StorageManager", "dump", "load"]
