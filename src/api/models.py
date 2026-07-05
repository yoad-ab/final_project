from pydantic import BaseModel

from ..app.dto import AnalysisDTO, RecipeDTO


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
    def from_dto(dto: AnalysisDTO) -> "AnalysisOut":
        return AnalysisOut(analysis_id=dto.analysis_id, type_id=dto.type_id, params=dto.params)


class RecipeCreate(BaseModel):
    recipe_id: str
    analysis_ids: list[str] = []


class RecipeUpdate(BaseModel):
    analysis_ids: list[str]


class RecipeOut(BaseModel):
    recipe_id: str
    analyses: list[AnalysisOut]

    @staticmethod
    def from_dto(dto: RecipeDTO) -> "RecipeOut":
        return RecipeOut(
            recipe_id=dto.recipe_id,
            analyses=[AnalysisOut.from_dto(a) for a in dto.analyses],
        )
