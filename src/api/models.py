from typing import Any

from pydantic import BaseModel

from ..core.analysis import Analysis
from ..core.recipe import Recipe
from ..core.run import RunRecord, StepRecord


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


class RunCreate(BaseModel):
    experiment_id: str
    data_id: str


class StepOut(BaseModel):
    step_index: int
    analysis_id: str
    status: str
    duration_ms: int | None
    output_summary: str | None
    error: str | None

    @staticmethod
    def from_step(step: StepRecord) -> "StepOut":
        return StepOut(
            step_index=step.step_index,
            analysis_id=step.analysis_id,
            status=step.status.value,
            duration_ms=step.duration_ms,
            output_summary=step.output_summary,
            error=step.error,
        )


class RunOut(BaseModel):
    run_id: str
    recipe_id: str | None
    analysis_id: str | None
    experiment_id: str
    dataset_id: str
    status: str
    started_at: str
    completed_at: str | None
    # Absolute path to where this run's output files live on disk, so the UI
    # can tell the researcher where to look. Server-derived (not stored on the
    # record); None if it can't be resolved.
    output_path: str | None
    steps: list[StepOut]

    @staticmethod
    def from_record(run: RunRecord, output_path: str | None = None) -> "RunOut":
        return RunOut(
            run_id=run.run_id,
            recipe_id=run.recipe_id,
            analysis_id=run.analysis_id,
            experiment_id=run.experiment_id,
            dataset_id=run.dataset_id,
            status=run.status.value,
            started_at=run.started_at,
            completed_at=run.completed_at,
            output_path=output_path,
            steps=[StepOut.from_step(s) for s in run.steps],
        )
