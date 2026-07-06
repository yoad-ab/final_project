from fastapi import Request

from ..storage.storage_manager import StorageManager


def get_storage(request: Request) -> StorageManager:
    return request.app.state.storage
