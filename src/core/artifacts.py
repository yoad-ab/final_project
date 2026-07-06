import shutil
from pathlib import Path


class ArtifactManager(object):
    def __init__(self, base_path: Path) -> None:
        self.base_path = base_path

    def _raw_data_path(self, experiment_id: str, data_id: str) -> Path:
        return self.base_path / "raw_data" / experiment_id / data_id

    def get_history_log_path(self) -> Path:
        return self.base_path / "run_history.log"

    def get_raw_data_directory(self, experiment_id: str, data_id: str) -> Path:
        """
        I still don't know what the format exactly is going to be so for now let's say experiment id is something
        lower case e.g. "mri_exp_1" or something, and for extra caution and for supporting future abilities for nesting
        data directories (hierarchical organization) we'll assume that data_id may contain "/" characters
        """

        # Does this work with "/" entries in data_id?
        path = self._raw_data_path(experiment_id, data_id)
        if not path.exists():
            raise FileNotFoundError(f"Raw data directory not found: {path}")
        return path

    def list_data_sources(self) -> list[dict]:
        raw_root = self.base_path / "raw_data"
        if not raw_root.exists():
            return []

        results = []
        for marker in raw_root.rglob(".datasource"):
            ds_dir = marker.parent
            parts = ds_dir.relative_to(raw_root).parts
            experiment_id = parts[0]
            data_id = "/".join(parts[1:]) if len(parts) > 1 else ""

            files = [f for f in ds_dir.iterdir() if f.is_file() and f.name != ".datasource"]
            total_size = sum(f.stat().st_size for f in files)
            last_modified = max((f.stat().st_mtime for f in files), default=ds_dir.stat().st_mtime)
            results.append(
                {
                    "experiment_id": experiment_id,
                    "data_id": data_id,
                    "file_count": len(files),
                    "total_size_bytes": total_size,
                    "last_modified": last_modified,
                }
            )
        return results

    def create_raw_data_directory_new(self, experiment_id: str, data_id: str) -> Path:
        path = self._raw_data_path(experiment_id, data_id)
        path.mkdir(parents=True, exist_ok=True)
        (path / ".datasource").touch()
        return path

    def get_raw_data_files(self, experiment_id: str, data_id: str) -> list[dict]:
        path = self.get_raw_data_directory(experiment_id, data_id)
        files = []
        for f in path.iterdir():
            if f.is_file() and f.name != ".datasource":
                stat = f.stat()
                files.append({"name": f.name, "size_bytes": stat.st_size, "last_modified": stat.st_mtime})
        return files

    def save_file(self, experiment_id: str, data_id: str, filename: str, content: bytes) -> Path:
        path = self._raw_data_path(experiment_id, data_id)
        if not path.exists():
            raise FileNotFoundError(f"Raw data directory not found: {path}")
        file_path = path / filename
        file_path.write_bytes(content)
        return file_path

    def get_raw_data_file_path(self, experiment_id: str, data_id: str, filename: str) -> Path:
        path = self._raw_data_path(experiment_id, data_id) / filename
        if not path.exists():
            raise FileNotFoundError(f"File not found: {path}")
        return path

    def delete_raw_data_directory(self, experiment_id: str, data_id: str) -> None:
        path = self._raw_data_path(experiment_id, data_id)
        if not path.exists():
            raise FileNotFoundError(f"Raw data directory not found: {path}")
        shutil.rmtree(path)

    def delete_file(self, experiment_id: str, data_id: str, filename: str) -> None:
        path = self._raw_data_path(experiment_id, data_id) / filename
        if not path.exists():
            raise FileNotFoundError(f"File not found: {path}")
        path.unlink()

    def rename_file(self, experiment_id: str, data_id: str, old_name: str, new_name: str) -> None:
        dir_path = self._raw_data_path(experiment_id, data_id)
        old_path = dir_path / old_name
        new_path = dir_path / new_name
        if not old_path.exists():
            raise FileNotFoundError(f"File not found: {old_path}")
        if new_path.exists():
            raise FileExistsError(f"File already exists: {new_name!r}")
        old_path.rename(new_path)

    def rename_data_source(self, experiment_id: str, old_data_id: str, new_data_id: str) -> None:
        old_path = self._raw_data_path(experiment_id, old_data_id)
        new_path = self._raw_data_path(experiment_id, new_data_id)
        if not old_path.exists():
            raise FileNotFoundError(f"Data source not found: {old_path}")
        if new_path.exists():
            raise FileExistsError(f"Data source already exists: {new_data_id!r}")
        old_path.rename(new_path)

    def rename_experiment(self, old_experiment_id: str, new_experiment_id: str) -> None:
        old_path = self.base_path / "raw_data" / old_experiment_id
        new_path = self.base_path / "raw_data" / new_experiment_id
        if not old_path.exists():
            raise FileNotFoundError(f"Experiment not found: {old_experiment_id!r}")
        if new_path.exists():
            raise FileExistsError(f"Experiment already exists: {new_experiment_id!r}")
        old_path.rename(new_path)

    def delete_experiment(self, experiment_id: str) -> None:
        path = self.base_path / "raw_data" / experiment_id
        if not path.exists():
            raise FileNotFoundError(f"Experiment not found: {experiment_id!r}")
        shutil.rmtree(path)

    def get_run_directory(self, run_id: str) -> Path:
        """
        Create (if needed) and return the directory for a specific run.
        """
        path = self.base_path / "runs" / f"run_{run_id}"
        path.mkdir(parents=True, exist_ok=True)
        return path

    # def get_analysis_output_directory(self, analysis: Analysis) -> Path:
    #    path = self.base_path / "output_data" / analysis.get_analysis_id()
    #    path.mkdir(parents=True, exist_ok=True)
    #    return path
