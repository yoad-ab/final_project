from fastapi import APIRouter, Depends, status

from ...app.context import AppContext
from ..deps import get_ctx
from ..models import AnalysisCreate, AnalysisOut, AnalysisUpdate

router = APIRouter(prefix="/analyses", tags=["analyses"])


@router.get("", response_model=list[AnalysisOut])
def list_analyses(ctx: AppContext = Depends(get_ctx)):
    return [AnalysisOut.from_dto(dto) for dto in ctx.analyses.list()]


@router.post("", response_model=AnalysisOut, status_code=status.HTTP_201_CREATED)
def create_analysis(body: AnalysisCreate, ctx: AppContext = Depends(get_ctx)):
    return AnalysisOut.from_dto(ctx.analyses.create(body.type_id, body.analysis_id, body.params))


@router.get("/{analysis_id}", response_model=AnalysisOut)
def get_analysis(analysis_id: str, ctx: AppContext = Depends(get_ctx)):
    return AnalysisOut.from_dto(ctx.analyses.get(analysis_id))


@router.put("/{analysis_id}", response_model=AnalysisOut)
def update_analysis(analysis_id: str, body: AnalysisUpdate, ctx: AppContext = Depends(get_ctx)):
    return AnalysisOut.from_dto(ctx.analyses.update(analysis_id, body.params))


@router.delete("/{analysis_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_analysis(analysis_id: str, ctx: AppContext = Depends(get_ctx)):
    ctx.analyses.delete(analysis_id)
