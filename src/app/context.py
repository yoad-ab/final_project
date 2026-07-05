from pathlib import Path

from ..storage.storage_manager import StorageManager
from .analysis_service import AnalysisService
from .recipe_service import RecipeService


class AppContext:
    def __init__(self, base_path: Path) -> None:
        storage = StorageManager(base_path)
        self.analyses = AnalysisService(storage)
        self.recipes = RecipeService(storage)
