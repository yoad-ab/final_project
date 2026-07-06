from fastapi import APIRouter, Depends, HTTPException, status

from ...core.recipe import Recipe
from ...storage.storage_manager import StorageManager
from ..deps import get_storage
from ..models import RecipeCreate, RecipeOut, RecipeRename, RecipeUpdate

router = APIRouter(prefix="/recipes", tags=["recipes"])


@router.get("", response_model=list[RecipeOut])
def list_recipes(storage: StorageManager = Depends(get_storage)):
    return [RecipeOut.from_recipe(storage.recipes.load(rid)) for rid in storage.recipes.list()]


@router.post("", response_model=RecipeOut, status_code=status.HTTP_201_CREATED)
def create_recipe(body: RecipeCreate, storage: StorageManager = Depends(get_storage)):
    analyses = [storage.analyses.load(aid) for aid in body.analysis_ids]
    recipe = Recipe(body.recipe_id, analyses)
    storage.recipes.save(recipe)
    return RecipeOut.from_recipe(recipe)


@router.get("/{recipe_id}", response_model=RecipeOut)
def get_recipe(recipe_id: str, storage: StorageManager = Depends(get_storage)):
    return RecipeOut.from_recipe(storage.recipes.load(recipe_id))


@router.put("/{recipe_id}", response_model=RecipeOut)
def update_recipe(recipe_id: str, body: RecipeUpdate, storage: StorageManager = Depends(get_storage)):
    analyses = [storage.analyses.load(aid) for aid in body.analysis_ids]
    recipe = Recipe(recipe_id, analyses)
    storage.recipes.update(recipe)
    return RecipeOut.from_recipe(recipe)


@router.patch("/{recipe_id}", response_model=RecipeOut)
def rename_recipe(recipe_id: str, body: RecipeRename, storage: StorageManager = Depends(get_storage)):
    try:
        recipe = storage.recipes.rename(recipe_id, body.recipe_id)
    except FileNotFoundError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except FileExistsError as e:
        raise HTTPException(status_code=409, detail=str(e))
    return RecipeOut.from_recipe(recipe)


@router.delete("/{recipe_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_recipe(recipe_id: str, storage: StorageManager = Depends(get_storage)):
    storage.recipes.delete(recipe_id)
