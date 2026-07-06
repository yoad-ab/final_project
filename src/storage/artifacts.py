import shutil
from pathlib import Path

from ..core.analysis import Analysis

_FORBIDDEN = frozenset([".", ".."])


def _safe_name(value: str, field: str) -> str:
    """Reject empty strings, path separators, and traversal components."""
    value = value.strip()
    if not value:
        raise ValueError(f"{field} must not be empty")
    if value in _FORBIDDEN or "/" in value or "\\" in value or "\0" in value:
        raise ValueError(f"{field} contains invalid characters: {value!r}")
    return value


class ArtifactManager(object):
    def __init__(self, base_path: Path) -> None:
        self.base_path = base_path

    def _raw(self) -> Path:
        return self.base_path / "raw_data"

    def _ds_path(self, experiment_id: str, data_id: str) -> Path:
        return self._raw() / experiment_id / data_id

    def get_raw_data_directory(self, experiment_id: str, data_id: str) -> Path:
        """
        I still don't know what the format exactly is going to be so for now let's say experiment id is something
        lower case e.g. "mri_exp_1" or something, and for extra caution and for supporting future abilities for nesting
        data directories (hierarchical organization) we'll assume that data_id may contain "/" characters
        """

        # Does this work with "/" entries in data_id?
        path = self.base_path / "raw_data" / experiment_id / data_id
        if not path.exists():
            raise FileNotFoundError(f"Raw data directory not found: {path}")
        return path

    def get_analysis_output_directory(self, analysis: Analysis) -> Path:
        path = self.base_path / "output_data" / analysis.get_analysis_id()
        path.mkdir(parents=True, exist_ok=True)
        return path

    # ── Data source management ────────────────────────────────────────────────

    def list_data_sources(self) -> list[dict]:
        raw_data_path = self._raw()
        if not raw_data_path.exists():
            return []
        result = []
        for exp_dir in sorted(raw_data_path.iterdir()):
            if not exp_dir.is_dir():
                continue
            for data_dir in sorted(exp_dir.iterdir()):
                if not data_dir.is_dir():
                    continue
                files = [f for f in data_dir.iterdir() if f.is_file()]
                total_size = sum(f.stat().st_size for f in files)
                last_mod = max(
                    (f.stat().st_mtime for f in files),
                    default=data_dir.stat().st_mtime,
                )
                result.append({
                    "experiment_id": exp_dir.name,
                    "data_id": data_dir.name,
                    "file_count": len(files),
                    "total_size_bytes": total_size,
                    "last_modified": last_mod,
                })
        return result

    def create_raw_data_directory_new(self, experiment_id: str, data_id: str) -> Path:
        experiment_id = _safe_name(experiment_id, "experiment_id")
        data_id = _safe_name(data_id, "data_id")
        path = self._ds_path(experiment_id, data_id)
        if path.exists():
            raise FileExistsError(f"Data source already exists: {experiment_id}/{data_id}")
        path.mkdir(parents=True)
        return path

    def delete_raw_data_directory(self, experiment_id: str, data_id: str) -> None:
        experiment_id = _safe_name(experiment_id, "experiment_id")
        data_id = _safe_name(data_id, "data_id")
        path = self._ds_path(experiment_id, data_id)
        if not path.exists():
            raise FileNotFoundError(f"Data source not found: {experiment_id}/{data_id}")
        shutil.rmtree(path)
        # clean up empty experiment folder
        exp_dir = self._raw() / experiment_id
        if exp_dir.exists() and not any(exp_dir.iterdir()):
            exp_dir.rmdir()

    def get_raw_data_files(self, experiment_id: str, data_id: str) -> list[dict]:
        experiment_id = _safe_name(experiment_id, "experiment_id")
        data_id = _safe_name(data_id, "data_id")
        path = self._ds_path(experiment_id, data_id)
        if not path.exists():
            raise FileNotFoundError(f"Data source not found: {experiment_id}/{data_id}")
        result = []
        for f in sorted(path.iterdir()):
            if f.is_file():
                stat = f.stat()
                result.append({
                    "name": f.name,
                    "size_bytes": stat.st_size,
                    "last_modified": stat.st_mtime,
                })
        return result

    def save_file(self, experiment_id: str, data_id: str, filename: str, content: bytes) -> None:
        experiment_id = _safe_name(experiment_id, "experiment_id")
        data_id = _safe_name(data_id, "data_id")
        # strip directory components from uploaded filename
        safe_filename = Path(filename).name
        safe_filename = _safe_name(safe_filename, "filename")
        path = self._ds_path(experiment_id, data_id)
        path.mkdir(parents=True, exist_ok=True)
        (path / safe_filename).write_bytes(content)

    def get_raw_data_file_path(self, experiment_id: str, data_id: str, filename: str) -> Path:
        experiment_id = _safe_name(experiment_id, "experiment_id")
        data_id = _safe_name(data_id, "data_id")
        filename = _safe_name(filename, "filename")
        path = self._ds_path(experiment_id, data_id) / filename
        if not path.exists():
            raise FileNotFoundError(f"File not found: {filename}")
        return path

    def delete_file(self, experiment_id: str, data_id: str, filename: str) -> None:
        experiment_id = _safe_name(experiment_id, "experiment_id")
        data_id = _safe_name(data_id, "data_id")
        filename = _safe_name(filename, "filename")
        path = self._ds_path(experiment_id, data_id) / filename
        if not path.exists():
            raise FileNotFoundError(f"File not found: {filename}")
        path.unlink()
