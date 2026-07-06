from fastapi import APIRouter, Depends, status

from ...storage.registry import load
from ...storage.storage_manager import StorageManager
from ..deps import get_storage
from ..models import AnalysisCreate, AnalysisOut, AnalysisUpdate

router = APIRouter(prefix="/analyses", tags=["analyses"])


@router.get("", response_model=list[AnalysisOut])
def list_analyses(storage: StorageManager = Depends(get_storage)):
    analyses_list = storage.analyses.list()
    loaded_analyses = [storage.analyses.load(aid) for aid in analyses_list]
    return [AnalysisOut.from_analysis(a) for a in loaded_analyses]


@router.post("", response_model=AnalysisOut, status_code=status.HTTP_201_CREATED)
def create_analysis(body: AnalysisCreate, storage: StorageManager = Depends(get_storage)):
    analysis = load(
        {
            "type_id": body.type_id,
            "analysis_id": body.analysis_id,
            "data": body.params,
        }
    )

    storage.analyses.save(analysis)

    return AnalysisOut.from_analysis(analysis)


@router.get("/{analysis_id}", response_model=AnalysisOut)
def get_analysis(analysis_id: str, storage: StorageManager = Depends(get_storage)):
    analysis = storage.analyses.load(analysis_id)
    return AnalysisOut.from_analysis(analysis)


@router.put("/{analysis_id}", response_model=AnalysisOut)
def update_analysis(analysis_id: str, body: AnalysisUpdate, storage: StorageManager = Depends(get_storage)):
    existing = storage.analyses.load(analysis_id)

    updated = load(
        {
            "type_id": existing.get_type_id(),
            "analysis_id": analysis_id,
            "data": body.params,
        }
    )

    storage.analyses.update(updated)
    return AnalysisOut.from_analysis(updated)


@router.delete("/{analysis_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_analysis(analysis_id: str, storage: StorageManager = Depends(get_storage)):
    storage.analyses.delete(analysis_id)
