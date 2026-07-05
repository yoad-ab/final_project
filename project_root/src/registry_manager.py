import csv
import os

def generate_run_id(registry_file="run_registry.csv"):
    """
    Generate the next sequential Run ID.

    Parameters
    ----------
    registry_file : str
        Path to the run registry CSV file.

    Returns
    -------
    str
        Next Run ID formatted as a 3-digit string (e.g., "001").
    """

    # Registry doesn't exist yet
    if not os.path.exists(registry_file):
        return "001"

    with open(registry_file, "r", newline="") as file:
        reader = list(csv.DictReader(file))

    # Registry exists but has no runs
    if len(reader) == 0:
        return "001"

    last_run_id = int(reader[-1]["Run ID"])
    return str(last_run_id + 1)


def update_run_registry(
    registry_path,
    run_id,
    start_time,
    end_time,
    dataset,
    analysis,
    status,
    run_path
):

    file_exists = os.path.isfile(registry_path)

    with open(registry_path, mode="a", newline="") as f:
        writer = csv.writer(f)

        if not file_exists:
            writer.writerow([
                "run_id",
                "start_time",
                "end_time",
                "dataset",
                "analysis",
                "status",
                "run_path"
            ])

        writer.writerow([
            run_id,
            start_time,
            end_time,
            dataset,
            analysis,
            status,
            run_path
        ])