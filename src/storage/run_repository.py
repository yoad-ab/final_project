import json
import os
from pathlib import Path

from ..core.run import RunRecord, RunStatus, StepRecord


class RunRepository:
    def __init__(self, base_path: Path) -> None:
        self.base_path = base_path

    def _dir(self) -> Path:
        return self.base_path / "runs"

    def _path(self, run_id: str) -> Path:
        return self._dir() / f"{run_id}.json"

    def exists(self, run_id: str) -> bool:
        return self._path(run_id).exists()

    def save(self, run: RunRecord) -> None:
        if self.exists(run.run_id):
            raise FileExistsError(f"Run already exists: {run.run_id!r}. Use update() to overwrite.")
        self._write(run)

    def update(self, run: RunRecord) -> None:
        if not self.exists(run.run_id):
            raise FileNotFoundError(f"Run not found: {run.run_id!r}. Use save() to create it.")
        self._write(run)

    def load(self, run_id: str) -> RunRecord:
        path = self._path(run_id)
        if not path.exists():
            raise FileNotFoundError(f"Run not found: {run_id!r}")
        d = json.loads(path.read_text(encoding="utf-8"))
        return _load_run(d)

    def delete(self, run_id: str) -> None:
        path = self._path(run_id)
        if not path.exists():
            raise FileNotFoundError(f"Run not found: {run_id!r}")
        path.unlink()

    def list(self) -> list[str]:
        if not self._dir().exists():
            return []
        ids = [p.stem for p in self._dir().glob("*.json")]

        def _sort_key(rid: str):
            try:
                return (0, int(rid))
            except ValueError:
                return (1, rid)

        return sorted(ids, key=_sort_key)

    def _write(self, run: RunRecord) -> None:
        self._dir().mkdir(parents=True, exist_ok=True)
        path = self._path(run.run_id)
        tmp = path.with_suffix(".json.tmp")
        tmp.write_text(json.dumps(_dump_run(run), indent=2), encoding="utf-8")
        os.replace(tmp, path)


# ── dict <-> dataclass (enum round-trips as its string value) ──────────────


def _dump_run(run: RunRecord) -> dict:
    return {
        "run_id": run.run_id,
        "recipe_id": run.recipe_id,
        "analysis_id": run.analysis_id,
        "experiment_id": run.experiment_id,
        "dataset_id": run.dataset_id,
        "status": run.status.value,
        "started_at": run.started_at,
        "completed_at": run.completed_at,
        "steps": [
            {
                "step_index": s.step_index,
                "analysis_id": s.analysis_id,
                "status": s.status.value,
                "duration_ms": s.duration_ms,
                "output_summary": s.output_summary,
                "error": s.error,
            }
            for s in run.steps
        ],
    }


def _load_run(d: dict) -> RunRecord:
    return RunRecord(
        run_id=d["run_id"],
        recipe_id=d.get("recipe_id"),
        analysis_id=d.get("analysis_id"),
        experiment_id=d["experiment_id"],
        dataset_id=d["dataset_id"],
        status=RunStatus(d["status"]),
        started_at=d["started_at"],
        completed_at=d.get("completed_at"),
        steps=[
            StepRecord(
                step_index=s["step_index"],
                analysis_id=s["analysis_id"],
                status=RunStatus(s["status"]),
                duration_ms=s.get("duration_ms"),
                output_summary=s.get("output_summary"),
                error=s.get("error"),
            )
            for s in d.get("steps", [])
        ],
    )
