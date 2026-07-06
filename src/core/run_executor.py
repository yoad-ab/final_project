"""Execute a recipe against a dataset and produce a RunRecord.

This is the write side of the Output Tracker: it actually runs a recipe's
analyses in order, timing each step and capturing per-step success/failure,
then hands back a RunRecord for the RunRepository to persist. It mirrors the
sequential logic of AnalysisExecutor.run_recipe, but records each step instead
of only returning the final output.

Status is strictly execution-level: SUCCESS means the step completed without
error, FAILURE means it raised or reported failure. It never judges whether a
result is scientifically "good".
"""

import time
from datetime import datetime
from typing import cast

from ..storage.run_repository import RunRepository

# avoid a circular import: import RunRepository lazily inside execute_recipe
from .analysis import AnalysisCompletionStatus, AnalysisOutput
from .analysis_runner import AnalysisExecutor
from .artifacts import ArtifactManager
from .recipe import Recipe
from .run import RunRecord, RunStatus, StepRecord

_SUMMARY_LIMIT = 200


def _new_run_id(existing_ids: list[str]) -> str:
    """Sequential integer run ID, one higher than the current maximum.

    Deliberately NOT prefixed with 'run_': ArtifactManager.get_run_directory
    already prepends 'run_' when it creates the output folder, so prefixing
    here would produce a doubled 'run_run_' path.
    """
    max_id = 0
    for rid in existing_ids:
        try:
            max_id = max(max_id, int(rid))
        except ValueError:
            pass
    return str(max_id + 1)


def _summarize(output: AnalysisOutput) -> str | None:
    try:
        text = str(output.returned_object).strip()
    except Exception:
        return None
    if not text:
        return None
    return text[:_SUMMARY_LIMIT] + ("…" if len(text) > _SUMMARY_LIMIT else "")


def execute_recipe(
    recipe: Recipe,
    experiment_id: str,
    data_id: str,
    artifacts: ArtifactManager,
    run_repo: "RunRepository | None" = None,
) -> RunRecord:
    """Run every analysis in the recipe in order, recording each step.

    A step that raises or reports FAILURE stops the run (later steps depend on
    earlier output), and the overall run is marked FAILURE. Each executed step
    is recorded either way, so the History view shows exactly where it stopped.
    """
    executor = AnalysisExecutor(artifacts)
    existing_ids = run_repo.list() if run_repo is not None else []
    run_id = _new_run_id(existing_ids)
    run_folder = artifacts.get_run_directory(run_id)  # creates workspace/data/runs/run_<id>

    started_at = datetime.now().isoformat(timespec="seconds")
    steps: list[StepRecord] = []
    overall = RunStatus.SUCCESS

    # Illegal but helps with the type check since we know we won't hit this edge case in runtime
    prev_output: AnalysisOutput = cast(AnalysisOutput, None)

    for index, analysis in enumerate(recipe.analyses):
        t0 = time.perf_counter()
        try:
            if index == 0:
                out = executor.run_analysis_on_data(analysis, experiment_id, data_id, run_folder)
            else:
                out = executor.run_analysis_on_output(analysis, prev_output, run_folder)

            duration_ms = int((time.perf_counter() - t0) * 1000)
            step_status = RunStatus.SUCCESS if out.status == AnalysisCompletionStatus.SUCCESS else RunStatus.FAILURE
            steps.append(
                StepRecord(
                    step_index=index,
                    analysis_id=analysis.get_analysis_id(),
                    status=step_status,
                    duration_ms=duration_ms,
                    output_summary=_summarize(out),
                    error=None,
                )
            )
            prev_output = out
            if step_status == RunStatus.FAILURE:
                overall = RunStatus.FAILURE
                break
        except Exception as exc:  # noqa: BLE001 - any analysis error becomes a recorded FAILURE
            duration_ms = int((time.perf_counter() - t0) * 1000)
            steps.append(
                StepRecord(
                    step_index=index,
                    analysis_id=analysis.get_analysis_id(),
                    status=RunStatus.FAILURE,
                    duration_ms=duration_ms,
                    output_summary=None,
                    error=f"{type(exc).__name__}: {exc}",
                )
            )
            overall = RunStatus.FAILURE
            break

    completed_at = datetime.now().isoformat(timespec="seconds")
    return RunRecord(
        run_id=run_id,
        recipe_id=recipe.recipe_id,
        analysis_id=None,
        experiment_id=experiment_id,
        dataset_id=data_id,
        status=overall,
        started_at=started_at,
        completed_at=completed_at,
        steps=steps,
    )
