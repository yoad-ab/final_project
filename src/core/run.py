from dataclasses import dataclass, field
from enum import Enum


class RunStatus(str, Enum):
    """Execution-level status only: did the run complete without error?

    Never a judgment about scientific validity of the result — an analysis
    that wants to flag a bad result should raise, turning it into FAILURE.
    """

    RUNNING = "running"
    SUCCESS = "success"
    FAILURE = "failure"
    CANCELLED = "cancelled"


@dataclass
class StepRecord:
    """One analysis execution inside a run. Mirrors frontend/src/types/run.ts."""

    step_index: int
    analysis_id: str
    status: RunStatus
    duration_ms: int | None = None
    output_summary: str | None = None
    error: str | None = None


@dataclass
class RunRecord:
    """One execution of a recipe (or single analysis). Mirrors frontend/src/types/run.ts."""

    run_id: str
    recipe_id: str | None
    analysis_id: str | None
    experiment_id: str
    dataset_id: str
    status: RunStatus
    started_at: str
    completed_at: str | None
    steps: list[StepRecord] = field(default_factory=list)
