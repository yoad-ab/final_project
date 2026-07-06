import json
import os
from pathlib import Path

from ..core.recipe import Recipe
from .registry import dump, load


class RecipeRepository:
    def __init__(self, base_path: Path) -> None:
        self.base_path = base_path

    def _dir(self) -> Path:
        return self.base_path / "recipes"

    def _path(self, recipe_id: str) -> Path:
        return self._dir() / f"{recipe_id}.json"

    def exists(self, recipe_id: str) -> bool:
        return self._path(recipe_id).exists()

    def save(self, recipe: Recipe) -> None:
        if self.exists(recipe.recipe_id):
            raise FileExistsError(f"Recipe already exists: {recipe.recipe_id!r}. Use update() to overwrite.")
        self._write(recipe)

    def update(self, recipe: Recipe) -> None:
        if not self.exists(recipe.recipe_id):
            raise FileNotFoundError(f"Recipe not found: {recipe.recipe_id!r}. Use save() to create it.")
        self._write(recipe)

    def load(self, recipe_id: str) -> Recipe:
        path = self._path(recipe_id)
        if not path.exists():
            raise FileNotFoundError(f"Recipe not found: {recipe_id!r}")
        d = json.loads(path.read_text(encoding="utf-8"))
        return Recipe(d["recipe_id"], [load(a) for a in d["analyses"]])

    def delete(self, recipe_id: str) -> None:
        path = self._path(recipe_id)
        if not path.exists():
            raise FileNotFoundError(f"Recipe not found: {recipe_id!r}")
        path.unlink()

    def list(self) -> list[str]:
        if not self._dir().exists():
            return []
        return sorted(p.stem for p in self._dir().glob("*.json"))

    def _write(self, recipe: Recipe) -> None:
        self._dir().mkdir(parents=True, exist_ok=True)
        path = self._path(recipe.recipe_id)
        tmp = path.with_suffix(".json.tmp")
        d = {"recipe_id": recipe.recipe_id, "analyses": [dump(a) for a in recipe.analyses]}
        tmp.write_text(json.dumps(d, indent=2), encoding="utf-8")
        os.replace(tmp, path)
