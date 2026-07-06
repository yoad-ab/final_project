from fastapi import APIRouter, Depends

from ...storage.storage_manager import StorageManager
from ..deps import get_storage
from ..models import RunOut

router = APIRouter(prefix="/runs", tags=["history"])


def _output_path(storage: StorageManager, run_id: str) -> str:
    """Absolute on-disk location of a run's outputs (read-only, no mkdir)."""
    return str(storage.artifacts.run_directory(run_id).resolve())


@router.get("", response_model=list[RunOut])
def list_runs(storage: StorageManager = Depends(get_storage)):
    runs = [storage.runs.load(rid) for rid in storage.runs.list()]
    runs.sort(key=lambda r: r.started_at, reverse=True)  # newest first
    return [RunOut.from_record(r, _output_path(storage, r.run_id)) for r in runs]


@router.get("/{run_id}", response_model=RunOut)
def get_run(run_id: str, storage: StorageManager = Depends(get_storage)):
    run = storage.runs.load(run_id)
    return RunOut.from_record(run, _output_path(storage, run.run_id))
