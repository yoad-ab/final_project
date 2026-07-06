import csv
import os
from datetime import datetime
from pathlib import Path


def generate_run_id(history_file: Path):
    """
    Generate the next sequential Run ID.

    Parameters
    ----------
    history_file : str
        Path to the run registry CSV file.

    Returns
    -------
    str
        Next Run ID formatted as a 3-digit string (e.g., "001").
    """

    # Registry doesn't exist yet
    if not os.path.exists(history_file):
        return "1"

    with open(history_file, "r", newline="") as file:
        reader = list(csv.DictReader(file))

    # Registry exists but has no runs
    if len(reader) == 0:
        return "1"

    last_run_id = int(reader[-1]["run_id"])
    return str(last_run_id + 1)


def update_run_registry(registry_path: str, run_id: str, event_type: str, message: str):
    file_exists = os.path.isfile(registry_path)

    with open(registry_path, mode="a", newline="") as f:
        writer = csv.writer(f)

        if not file_exists:
            writer.writerow(["timestamp", "run_id", "event_type", "message"])

        writer.writerow([datetime.now().strftime("%Y-%m-%d %H:%M:%S"), run_id, event_type, message])
