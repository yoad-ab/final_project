from ..core.recipe import Recipe
from ..storage.registry import load
from ..storage.storage_manager import StorageManager
from .dto import AnalysisDTO, RecipeDTO, analysis_to_dto, recipe_to_dto
from .exceptions import AlreadyExistsError, NotFoundError, UnknownTypeError


def _dto_to_analysis(dto: AnalysisDTO):
    try:
        return load({"type_id": dto.type_id, "analysis_id": dto.analysis_id, "data": dto.params})
    except ValueError as e:
        raise UnknownTypeError(str(e)) from e


class RecipeService:
    def __init__(self, storage: StorageManager) -> None:
        self._storage = storage

    def create(self, recipe_id: str, analyses: list[AnalysisDTO]) -> RecipeDTO:
        recipe = Recipe(recipe_id, [_dto_to_analysis(a) for a in analyses])
        try:
            self._storage.recipes.save(recipe)
        except FileExistsError as e:
            raise AlreadyExistsError(str(e)) from e
        return recipe_to_dto(recipe)

    def get(self, recipe_id: str) -> RecipeDTO:
        try:
            return recipe_to_dto(self._storage.recipes.load(recipe_id))
        except FileNotFoundError as e:
            raise NotFoundError(str(e)) from e

    def list(self) -> list[RecipeDTO]:
        return [recipe_to_dto(self._storage.recipes.load(rid)) for rid in self._storage.recipes.list()]

    def update(self, recipe_id: str, analyses: list[AnalysisDTO]) -> RecipeDTO:
        if not self._storage.recipes.exists(recipe_id):
            raise NotFoundError(f"Recipe not found: {recipe_id!r}")
        recipe = Recipe(recipe_id, [_dto_to_analysis(a) for a in analyses])
        self._storage.recipes.update(recipe)
        return recipe_to_dto(recipe)

    def delete(self, recipe_id: str) -> None:
        try:
            self._storage.recipes.delete(recipe_id)
        except FileNotFoundError as e:
            raise NotFoundError(str(e)) from e
