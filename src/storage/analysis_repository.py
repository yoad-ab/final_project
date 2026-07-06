import json
import os
from pathlib import Path

from ..core.analysis import Analysis
from .registry import dump, load


class AnalysisRepository:
    def __init__(self, base_path: Path) -> None:
        self.base_path = base_path

    def _dir(self) -> Path:
        return self.base_path / "analyses"

    def _path(self, analysis_id: str) -> Path:
        return self._dir() / f"{analysis_id}.json"

    def exists(self, analysis_id: str) -> bool:
        return self._path(analysis_id).exists()

    def save(self, analysis: Analysis) -> None:
        if self.exists(analysis.get_analysis_id()):
            raise FileExistsError(f"Analysis already exists: {analysis.get_analysis_id()!r}. Use update() to overwrite.")
        self._write(analysis)

    def update(self, analysis: Analysis) -> None:
        if not self.exists(analysis.get_analysis_id()):
            raise FileNotFoundError(f"Analysis not found: {analysis.get_analysis_id()!r}. Use save() to create it.")
        self._write(analysis)

    def load(self, analysis_id: str) -> Analysis:
        path = self._path(analysis_id)
        if not path.exists():
            raise FileNotFoundError(f"Analysis not found: {analysis_id!r}")
        return load(json.loads(path.read_text(encoding="utf-8")))

    def delete(self, analysis_id: str) -> None:
        path = self._path(analysis_id)
        if not path.exists():
            raise FileNotFoundError(f"Analysis not found: {analysis_id!r}")
        path.unlink()

    def list(self) -> list[str]:
        if not self._dir().exists():
            return []
        return sorted(p.stem for p in self._dir().glob("*.json"))

    def _write(self, analysis: Analysis) -> None:
        self._dir().mkdir(parents=True, exist_ok=True)
        path = self._path(analysis.get_analysis_id())
        tmp = path.with_suffix(".json.tmp")
        tmp.write_text(json.dumps(dump(analysis), indent=2), encoding="utf-8")
        os.replace(tmp, path)
