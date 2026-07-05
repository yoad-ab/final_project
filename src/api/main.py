import os
from contextlib import asynccontextmanager
from pathlib import Path

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from ..app.context import AppContext
from ..app.exceptions import AlreadyExistsError, NotFoundError, UnknownTypeError
from .routes import analyses, recipes


@asynccontextmanager
async def lifespan(app: FastAPI):
    workspace = Path(os.getenv("WORKSPACE_PATH", "./workspace"))
    workspace.mkdir(parents=True, exist_ok=True)
    app.state.ctx = AppContext(base_path=workspace)
    yield


app = FastAPI(title="Analysis Management System", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.exception_handler(NotFoundError)
async def not_found_handler(request: Request, exc: NotFoundError):
    return JSONResponse(status_code=404, content={"detail": str(exc)})


@app.exception_handler(AlreadyExistsError)
async def already_exists_handler(request: Request, exc: AlreadyExistsError):
    return JSONResponse(status_code=409, content={"detail": str(exc)})


@app.exception_handler(UnknownTypeError)
async def unknown_type_handler(request: Request, exc: UnknownTypeError):
    return JSONResponse(status_code=422, content={"detail": str(exc)})


app.include_router(analyses.router)
app.include_router(recipes.router)
