from pathlib import Path

from .analysis import Analysis


class ArtifactManager(object):
    def __init__(self, base_path: Path) -> None:
        self.base_path = base_path

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

    def get_run_directory(self, run_id: str) -> Path:
        """
        Create (if needed) and return the directory for a specific run.
        """

        path = self.base_path / "runs" / f"run_{run_id}"
        path.mkdir(parents=True, exist_ok=True)

        return path

    #def get_analysis_output_directory(self, analysis: Analysis) -> Path:
    #    path = self.base_path / "output_data" / analysis.get_analysis_id()
    #    path.mkdir(parents=True, exist_ok=True)
    #    return path
