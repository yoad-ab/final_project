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
import uuid
from datetime import datetime

from .analysis import AnalysisCompletionStatus, AnalysisOutput
from .analysis_runner import AnalysisExecutor
from .artifacts import ArtifactManager
from .recipe import Recipe
from .run import RunRecord, RunStatus, StepRecord

_SUMMARY_LIMIT = 200


def _new_run_id() -> str:
    """Timestamp + short random suffix.

    Deliberately NOT prefixed with 'run_': ArtifactManager.get_run_directory
    already prepends 'run_' when it creates the output folder, so prefixing
    here would produce a doubled 'run_run_' path.
    """
    return datetime.now().strftime("%Y%m%d_%H%M%S") + "_" + uuid.uuid4().hex[:4]


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
) -> RunRecord:
    """Run every analysis in the recipe in order, recording each step.

    A step that raises or reports FAILURE stops the run (later steps depend on
    earlier output), and the overall run is marked FAILURE. Each executed step
    is recorded either way, so the History view shows exactly where it stopped.
    """
    executor = AnalysisExecutor(artifacts)
    run_id = _new_run_id()
    run_folder = artifacts.get_run_directory(run_id)  # creates workspace/data/runs/run_<id>

    started_at = datetime.now().isoformat(timespec="seconds")
    steps: list[StepRecord] = []
    overall = RunStatus.SUCCESS
    prev_output: AnalysisOutput | None = None

    for index, analysis in enumerate(recipe.analyses):
        t0 = time.perf_counter()
        try:
            if index == 0:
                out = executor.run_analysis_on_data(analysis, experiment_id, data_id, run_folder)
            else:
                out = executor.run_analysis_on_output(analysis, prev_output, run_folder)

            duration_ms = int((time.perf_counter() - t0) * 1000)
            step_status = (
                RunStatus.SUCCESS
                if out.status == AnalysisCompletionStatus.SUCCESS
                else RunStatus.FAILURE
            )
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
