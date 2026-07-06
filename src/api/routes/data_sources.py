import json
import time
from pathlib import Path

import pandas as pd
from fastapi import APIRouter, Depends, HTTPException, UploadFile, status

from ...storage.storage_manager import StorageManager
from ..deps import get_storage
from ..models import DataFileContent, DataSourceCreate, DataSourceDetail, DataSourceEntry, FileInfo

router = APIRouter(prefix="/data-sources", tags=["data-sources"])

_FORBIDDEN = frozenset([".", ".."])
_MAX_UPLOAD_BYTES = 500 * 1024 * 1024  # 500 MB per file


def _validate_name(value: str, field: str) -> str:
    value = value.strip()
    if not value:
        raise HTTPException(status_code=422, detail=f"{field} must not be empty")
    if value in _FORBIDDEN or "/" in value or "\\" in value or "\0" in value:
        raise HTTPException(status_code=422, detail=f"{field} contains invalid characters")
    return value


@router.get("", response_model=list[DataSourceEntry])
def list_data_sources(storage: StorageManager = Depends(get_storage)):
    return storage.artifacts.list_data_sources()


@router.post("", response_model=DataSourceEntry, status_code=status.HTTP_201_CREATED)
def create_data_source(body: DataSourceCreate, storage: StorageManager = Depends(get_storage)):
    exp = _validate_name(body.experiment_id, "experiment_id")
    did = _validate_name(body.data_id, "data_id")
    storage.artifacts.create_raw_data_directory_new(exp, did)
    return DataSourceEntry(
        experiment_id=exp,
        data_id=did,
        file_count=0,
        total_size_bytes=0,
        last_modified=time.time(),
    )


@router.get("/{experiment_id}/{data_id}", response_model=DataSourceDetail)
def get_data_source(
    experiment_id: str,
    data_id: str,
    storage: StorageManager = Depends(get_storage),
):
    exp = _validate_name(experiment_id, "experiment_id")
    did = _validate_name(data_id, "data_id")
    files = storage.artifacts.get_raw_data_files(exp, did)
    return DataSourceDetail(
        experiment_id=exp,
        data_id=did,
        files=[FileInfo(**f) for f in files],
    )


@router.post("/{experiment_id}/{data_id}/upload", status_code=status.HTTP_200_OK)
async def upload_files(
    experiment_id: str,
    data_id: str,
    files: list[UploadFile],
    storage: StorageManager = Depends(get_storage),
):
    exp = _validate_name(experiment_id, "experiment_id")
    did = _validate_name(data_id, "data_id")

    if not files:
        raise HTTPException(status_code=422, detail="No files provided")

    saved = []
    for file in files:
        # Use only the final name component, never a full path
        raw_name = file.filename or "upload"
        filename = Path(raw_name).name
        if not filename:
            raise HTTPException(status_code=422, detail=f"Invalid filename: {raw_name!r}")

        content = await file.read()
        if len(content) > _MAX_UPLOAD_BYTES:
            raise HTTPException(
                status_code=413,
                detail=f"{filename} exceeds maximum file size of {_MAX_UPLOAD_BYTES // (1024 * 1024)} MB",
            )
        storage.artifacts.save_file(exp, did, filename, content)
        saved.append(filename)

    return {"uploaded": len(saved), "files": saved}


_VIEWABLE_SUFFIXES = frozenset([".csv", ".tsv", ".xlsx", ".xls"])
_MAX_PREVIEW_BYTES = 10 * 1024 * 1024  # 10 MB
_MAX_PREVIEW_ROWS = 10_000


@router.get("/{experiment_id}/{data_id}/files/{filename}/content", response_model=DataFileContent)
def get_file_content(
    experiment_id: str,
    data_id: str,
    filename: str,
    storage: StorageManager = Depends(get_storage),
) -> DataFileContent:
    exp = _validate_name(experiment_id, "experiment_id")
    did = _validate_name(data_id, "data_id")
    fname = _validate_name(filename, "filename")

    try:
        path = storage.artifacts.get_raw_data_file_path(exp, did, fname)
    except FileNotFoundError:
        raise HTTPException(status_code=404, detail=f"File not found: {fname}")

    suffix = path.suffix.lower()
    if suffix not in _VIEWABLE_SUFFIXES:
        raise HTTPException(status_code=415, detail=f"Cannot preview file type: {suffix!r}")

    size = path.stat().st_size
    if size > _MAX_PREVIEW_BYTES:
        return DataFileContent(too_large=True, size_bytes=size, columns=[], rows=[], row_count=0, truncated=False)

    try:
        if suffix in (".csv", ".tsv"):
            df = pd.read_csv(path, sep="\t" if suffix == ".tsv" else ",", nrows=_MAX_PREVIEW_ROWS + 1)
        else:
            df = pd.read_excel(path, nrows=_MAX_PREVIEW_ROWS + 1)
    except Exception as exc:
        raise HTTPException(status_code=422, detail=f"Failed to parse file: {exc}")

    truncated = len(df) > _MAX_PREVIEW_ROWS
    if truncated:
        df = df.iloc[:_MAX_PREVIEW_ROWS]

    df.columns = [str(c) for c in df.columns]
    split = json.loads(df.to_json(orient="split", default_handler=str))
    return DataFileContent(
        too_large=False,
        size_bytes=size,
        columns=split["columns"],
        rows=split["data"],
        row_count=len(df),
        truncated=truncated,
    )


@router.delete("/{experiment_id}/{data_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_data_source(
    experiment_id: str,
    data_id: str,
    storage: StorageManager = Depends(get_storage),
):
    exp = _validate_name(experiment_id, "experiment_id")
    did = _validate_name(data_id, "data_id")
    storage.artifacts.delete_raw_data_directory(exp, did)


@router.delete("/{experiment_id}/{data_id}/{filename}", status_code=status.HTTP_204_NO_CONTENT)
def delete_file(
    experiment_id: str,
    data_id: str,
    filename: str,
    storage: StorageManager = Depends(get_storage),
):
    exp = _validate_name(experiment_id, "experiment_id")
    did = _validate_name(data_id, "data_id")
    fname = _validate_name(filename, "filename")
    storage.artifacts.delete_file(exp, did, fname)
