import ast
import pathlib
from fastapi import APIRouter, Depends, HTTPException, status

from ...core.user_code_reader import process_and_run_with_venv
from ...storage.registry import load
from ...storage.storage_manager import StorageManager
from ..deps import get_storage
from ..models import AnalysisCreate, AnalysisOut, AnalysisRename, AnalysisUpdate, AnalysisValidate, AnalysisValidateResult

router = APIRouter(prefix="/analyses", tags=["analyses"])


@router.get("", response_model=list[AnalysisOut])
def list_analyses(storage: StorageManager = Depends(get_storage)):
    print("Listing analyses...")
    analyses_list = storage.analyses.list()
    loaded_analyses = [storage.analyses.load(aid) for aid in analyses_list]
    return [AnalysisOut.from_analysis(a) for a in loaded_analyses]


@router.post("", response_model=AnalysisOut, status_code=status.HTTP_201_CREATED)
def create_analysis(body: AnalysisCreate, storage: StorageManager = Depends(get_storage)):
    try:
        process_and_run_with_venv(body.params["python_code"], pathlib.Path(storage.artifacts.base_path.parent))
    except SyntaxError as e:
        raise HTTPException(status_code=400, detail=f"Syntax error: {str(e)}")
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Error processing code: {str(e)}")
    analysis = load(
        {
            "type_id": body.type_id,
            "analysis_id": body.analysis_id,
            "data": body.params,
        }
    )

    storage.analyses.save(analysis)

    return AnalysisOut.from_analysis(analysis)


@router.post("/validate", response_model=AnalysisValidateResult)
def validate_code(body: AnalysisValidate):
    if body.type_id != "python":
        return AnalysisValidateResult(valid=True)
    try:
        ast.parse(body.code)
    except SyntaxError as e:
        return AnalysisValidateResult(valid=False, error=f"Syntax error on line {e.lineno}: {e.msg}")

    imports_ok, import_error = check_imports(body.code)
    if not imports_ok:
        return AnalysisValidateResult(valid=False, error=import_error)

    try:
        function_name = return_function_name(body.code)
        return AnalysisValidateResult(valid=True, function_name=function_name or None)
    except ValueError as e:
        return AnalysisValidateResult(valid=False, error=str(e))
    except Exception as e:
        return AnalysisValidateResult(valid=False, error=str(e))


@router.get("/{analysis_id}", response_model=AnalysisOut)
def get_analysis(analysis_id: str, storage: StorageManager = Depends(get_storage)):
    print(f"this")
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


@router.patch("/{analysis_id}", response_model=AnalysisOut)
def rename_analysis(analysis_id: str, body: AnalysisRename, storage: StorageManager = Depends(get_storage)):
    try:
        analysis = storage.analyses.rename(analysis_id, body.analysis_id)
    except FileNotFoundError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except FileExistsError as e:
        raise HTTPException(status_code=409, detail=str(e))
    return AnalysisOut.from_analysis(analysis)


@router.delete("/{analysis_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_analysis(analysis_id: str, storage: StorageManager = Depends(get_storage)):
    storage.analyses.delete(analysis_id)
