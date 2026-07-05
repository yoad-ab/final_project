from fastapi import APIRouter, Depends, status

from ...app.context import AppContext
from ..deps import get_ctx
from ..models import RecipeCreate, RecipeOut, RecipeUpdate

router = APIRouter(prefix="/recipes", tags=["recipes"])


@router.get("", response_model=list[RecipeOut])
def list_recipes(ctx: AppContext = Depends(get_ctx)):
    return [RecipeOut.from_dto(dto) for dto in ctx.recipes.list()]


@router.post("", response_model=RecipeOut, status_code=status.HTTP_201_CREATED)
def create_recipe(body: RecipeCreate, ctx: AppContext = Depends(get_ctx)):
    analyses = [ctx.analyses.get(aid) for aid in body.analysis_ids]
    return RecipeOut.from_dto(ctx.recipes.create(body.recipe_id, analyses))


@router.get("/{recipe_id}", response_model=RecipeOut)
def get_recipe(recipe_id: str, ctx: AppContext = Depends(get_ctx)):
    return RecipeOut.from_dto(ctx.recipes.get(recipe_id))


@router.put("/{recipe_id}", response_model=RecipeOut)
def update_recipe(recipe_id: str, body: RecipeUpdate, ctx: AppContext = Depends(get_ctx)):
    analyses = [ctx.analyses.get(aid) for aid in body.analysis_ids]
    return RecipeOut.from_dto(ctx.recipes.update(recipe_id, analyses))


@router.delete("/{recipe_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_recipe(recipe_id: str, ctx: AppContext = Depends(get_ctx)):
    ctx.recipes.delete(recipe_id)
