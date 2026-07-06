from pathlib import Path

from ..core.artifacts import ArtifactManager
from .analysis_repository import AnalysisRepository
from .recipe_repository import RecipeRepository


class StorageManager:
    """
    Owns the entire workspace layout:

        workspace/
        ├── analyses/   ← AnalysisRepository
        ├── recipes/    ← RecipeRepository
        └── data/       ← ArtifactManager (raw input + analysis output)

    Everything below base_path is an implementation detail of this class.
    Callers (AppContext) only need to know the workspace root.
    """

    def __init__(self, base_path: Path = Path("./")) -> None:
        self.analyses = AnalysisRepository(base_path)
        self.recipes = RecipeRepository(base_path)
        self.artifacts = ArtifactManager(base_path / "data")
