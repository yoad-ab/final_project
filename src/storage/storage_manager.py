from pathlib import Path

from .analysis_repository import AnalysisRepository
from .recipe_repository import RecipeRepository


class StorageManager:
    def __init__(self, base_path: Path) -> None:
        self.analyses = AnalysisRepository(base_path)
        self.recipes = RecipeRepository(base_path)
