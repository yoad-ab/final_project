import csv
import os
from datetime import datetime
from pathlib import Path

from .analysis_runner import AnalysisExecutor
from .artifacts import ArtifactManager
from .logger_manager import end_run, log_error, log_event, setup_logger, write_run_header
from .recipe import Recipe
from .registry_manager import generate_run_id, update_run_registry


def update_run_history(
    history_path: Path, run_id: str, start_time: str, end_time: str, dataset: str, analyses: list, status: str, run_path: str
):
    print("update_run_history", history_path)
    file_exists = os.path.isfile(history_path)

    with open(history_path, mode="a", newline="") as f:
        writer = csv.writer(f)

        if not file_exists:
            writer.writerow(["run_id", "start_time", "end_time", "dataset", "analyses", "status", "run_path"])

        writer.writerow([run_id, start_time, end_time, dataset, ",".join(analyses), status, run_path])


def run_pipeline(selected_analyses, artifact_manager: ArtifactManager, experiment_id: str, data_id: str):
    # artifact_manager = ArtifactManager(Path("./data/"))
    executor = AnalysisExecutor(artifact_manager)

    run_id = generate_run_id(artifact_manager.get_history_log_path())
    print("Run id", run_id)
    run_folder = artifact_manager.get_run_directory(run_id)
    registry_path = run_folder / "run_registry.csv"

    start_time = datetime.now().strftime("%Y-%m-%d %H:%M:%S")

    status = "FAILURE"
    output = None

    # Registry (EVENT LOG)
    update_run_registry(str(registry_path), run_id, "START", "Pipeline started")

    # logger
    logger = setup_logger(run_folder)
    recipe = Recipe(f"ui_recipe_{run_id}", selected_analyses)
    write_run_header(logger, run_id, start_time, dataset_name=data_id, analysis_name=recipe.recipe_id)
    log_event(logger, "Pipeline started")

    # Registry (EVENT LOG)
    update_run_registry(str(registry_path), run_id, "EVENT", "Logger initialized & recipe created")

    try:
        # Execute recipe
        output = executor.run_recipe(recipe, experiment_id=experiment_id, data_id=data_id, run_folder=run_folder)

        status = output.status.value

        log_event(logger, f"Pipeline finished with status: {status}")

    except Exception as e:
        log_error(logger, run_id, str(e))

        update_run_registry(str(registry_path), run_id, "ERROR", str(e))

        raise

    finally:
        # Registry update
        end_time = datetime.now().strftime("%Y-%m-%d %H:%M:%S")

        # Registry (EVENT LOG)
        update_run_registry(str(registry_path), run_id, "END", f"Pipeline finished with status {status}")

        update_run_history(
            history_path=artifact_manager.get_history_log_path(),
            run_id=run_id,
            start_time=start_time,
            end_time=end_time,
            dataset=data_id,
            analyses=[a.get_analysis_id() for a in recipe.analyses],
            status=status,
            run_path=str(run_folder),
        )

        # End logging
        end_run(logger, status=status)

    return output
