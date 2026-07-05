from dataclasses import dataclass

from ..core.analysis import Analysis
from ..core.recipe import Recipe


@dataclass
class AnalysisDTO:
    analysis_id: str
    type_id: str
    params: dict


@dataclass
class RecipeDTO:
    recipe_id: str
    analyses: list[AnalysisDTO]


def analysis_to_dto(analysis: Analysis) -> AnalysisDTO:
    return AnalysisDTO(
        analysis_id=analysis.get_analysis_id(),
        type_id=analysis.get_type_id(),
        params=analysis.serialize(),
    )


def recipe_to_dto(recipe: Recipe) -> RecipeDTO:
    return RecipeDTO(
        recipe_id=recipe.recipe_id,
        analyses=[analysis_to_dto(a) for a in recipe.analyses],
    )
