from fastapi import APIRouter, Request

router = APIRouter(prefix="/workspace", tags=["workspace"])


@router.get("")
def get_workspace(request: Request):
    return {"path": request.app.state.workspace_path}
