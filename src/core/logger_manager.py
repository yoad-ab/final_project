import logging
import os
from datetime import datetime

# def create_run_folder(run_id, runs_dir="runs"):
#    """
#    Create a folder for the current run.
#
#    Parameters
#    ----------
#    run_id : str
#        Unique ID of the current run.
#
#    runs_dir : str
#        Directory where all runs are stored.
#
#    Returns
#    -------
#    str
#        Path to the created run folder.
#    """
#
#    run_folder = os.path.join(runs_dir, f"run_{run_id}")
#
#    os.makedirs(run_folder, exist_ok=True)
#
#    return run_folder


def setup_logger(run_folder):
    """
    Creates a log file inside the run folder and returns a logger object.
    """

    log_file_path = os.path.join(run_folder, "run.log")

    logger = logging.getLogger(log_file_path)
    logger.setLevel(logging.INFO)

    # Prevent duplicate handlers (important in notebooks / reruns)
    if not logger.handlers:
        file_handler = logging.FileHandler(log_file_path)
        file_handler.setLevel(logging.INFO)

        formatter = logging.Formatter("%(asctime)s - %(levelname)s - %(message)s")
        file_handler.setFormatter(formatter)

        logger.addHandler(file_handler)

    return logger


def write_run_header(logger, run_id, start_time, dataset_name, analysis_name):
    logger.info("=================================================")
    logger.info(f"Run ID: {run_id}")
    logger.info(f"Start Time: {start_time}")
    logger.info(f"Dataset: {dataset_name}")
    logger.info(f"Analysis: {analysis_name}")
    logger.info("-------------------------------------------------")


def log_event(logger, message):
    logger.info(message)


def log_error(logger, run_id, message):
    logger.error(f"[Run {run_id}] {message}")


def end_run(logger, status="Success"):
    end_time = datetime.now().strftime("%Y-%m-%d %H:%M:%S")

    logger.info("-------------------------------------------------")
    logger.info(f"End Time: {end_time}")
    logger.info(f"Status: {status}")
    logger.info("Run completed")
    logger.info("=================================================")
