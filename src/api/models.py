from typing import Any

from pydantic import BaseModel

from ..core.analysis import Analysis
from ..core.recipe import Recipe


class FileInfo(BaseModel):
    name: str
    size_bytes: int
    last_modified: float


class DataSourceEntry(BaseModel):
    experiment_id: str
    data_id: str
    file_count: int
    total_size_bytes: int
    last_modified: float


class DataSourceDetail(BaseModel):
    experiment_id: str
    data_id: str
    files: list[FileInfo]


class DataSourceCreate(BaseModel):
    experiment_id: str
    data_id: str


class DataFileContent(BaseModel):
    too_large: bool
    size_bytes: int
    columns: list[str]
    rows: list[list[Any]]
    row_count: int
    truncated: bool


class AnalysisCreate(BaseModel):
    analysis_id: str
    type_id: str
    params: dict = {}


class AnalysisUpdate(BaseModel):
    params: dict


class AnalysisOut(BaseModel):
    analysis_id: str
    type_id: str
    params: dict

    @staticmethod
    def from_analysis(analysis: Analysis) -> "AnalysisOut":
        return AnalysisOut(
            analysis_id=analysis.get_analysis_id(),
            type_id=analysis.get_type_id(),
            params=analysis.serialize(),
        )


class RecipeCreate(BaseModel):
    recipe_id: str
    analysis_ids: list[str] = []


class RecipeUpdate(BaseModel):
    analysis_ids: list[str]


class RecipeOut(BaseModel):
    recipe_id: str
    analyses: list[AnalysisOut]

    @staticmethod
    def from_recipe(recipe: Recipe) -> "RecipeOut":
        return RecipeOut(
            recipe_id=recipe.recipe_id,
            analyses=[AnalysisOut.from_analysis(a) for a in recipe.analyses],
        )
