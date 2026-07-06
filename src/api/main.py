import os
from contextlib import asynccontextmanager
from pathlib import Path

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from ..storage.storage_manager import StorageManager
from .routes import analyses, recipes
from .routes import data_sources as data_sources_router
from .routes import workspace as workspace_router


@asynccontextmanager
async def lifespan(app: FastAPI):
    workspace = Path(os.getenv("WORKSPACE_PATH", "./workspace"))
    workspace.mkdir(parents=True, exist_ok=True)
    app.state.storage = StorageManager(base_path=workspace)
    app.state.workspace_path = str(workspace.resolve())
    yield


app = FastAPI(title="Analysis Management System", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.exception_handler(FileNotFoundError)
async def not_found_handler(request: Request, exc: FileNotFoundError):
    return JSONResponse(status_code=404, content={"detail": str(exc)})


@app.exception_handler(FileExistsError)
async def already_exists_handler(request: Request, exc: FileExistsError):
    return JSONResponse(status_code=409, content={"detail": str(exc)})


@app.exception_handler(ValueError)
async def value_error_handler(request: Request, exc: ValueError):
    return JSONResponse(status_code=422, content={"detail": str(exc)})


app.include_router(analyses.router)
app.include_router(recipes.router)
app.include_router(workspace_router.router)
app.include_router(data_sources_router.router)
