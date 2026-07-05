from ..storage.registry import load
from ..storage.storage_manager import StorageManager
from .dto import AnalysisDTO, analysis_to_dto
from .exceptions import AlreadyExistsError, NotFoundError, UnknownTypeError


class AnalysisService:
    def __init__(self, storage: StorageManager) -> None:
        self._storage = storage

    def create(self, type_id: str, analysis_id: str, params: dict) -> AnalysisDTO:
        try:
            analysis = load({"type_id": type_id, "analysis_id": analysis_id, "data": params})
        except ValueError as e:
            raise UnknownTypeError(str(e)) from e
        try:
            self._storage.analyses.save(analysis)
        except FileExistsError as e:
            raise AlreadyExistsError(str(e)) from e
        return analysis_to_dto(analysis)

    def get(self, analysis_id: str) -> AnalysisDTO:
        try:
            return analysis_to_dto(self._storage.analyses.load(analysis_id))
        except FileNotFoundError as e:
            raise NotFoundError(str(e)) from e

    def list(self) -> list[AnalysisDTO]:
        return [analysis_to_dto(self._storage.analyses.load(aid)) for aid in self._storage.analyses.list()]

    def update(self, analysis_id: str, params: dict) -> AnalysisDTO:
        try:
            existing = self._storage.analyses.load(analysis_id)
        except FileNotFoundError as e:
            raise NotFoundError(str(e)) from e
        try:
            updated = load({"type_id": existing.get_type_id(), "analysis_id": analysis_id, "data": params})
        except ValueError as e:
            raise UnknownTypeError(str(e)) from e
        self._storage.analyses.update(updated)
        return analysis_to_dto(updated)

    def delete(self, analysis_id: str) -> None:
        try:
            self._storage.analyses.delete(analysis_id)
        except FileNotFoundError as e:
            raise NotFoundError(str(e)) from e
