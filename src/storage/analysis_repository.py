import json
import os
from pathlib import Path

from ..core.analysis import Analysis
from .registry import dump, load


class AnalysisRepository:
    def __init__(self, base_path: Path) -> None:
        self.base_path = base_path
        if((self._dir() / "predetermined_analyses").exists()):
            for file in (self._dir() / "predetermined_analyses").glob("*.json"):
                if(file.name not in [f.name for f in self._dir().glob("*.json")]):
                    file.rename(file.parent.parent / file.name)
                    Path(file.parent/file.name).write_bytes(Path(file.parent.parent / file.name).read_bytes())

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

    def rename(self, old_id: str, new_id: str) -> "Analysis":
        old_path = self._path(old_id)
        if not old_path.exists():
            raise FileNotFoundError(f"Analysis not found: {old_id!r}")
        if self.exists(new_id):
            raise FileExistsError(f"Analysis already exists: {new_id!r}")
        data = json.loads(old_path.read_text(encoding="utf-8"))
        data["analysis_id"] = new_id
        new_analysis = load(data)
        self._write(new_analysis)
        old_path.unlink()
        return new_analysis

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
