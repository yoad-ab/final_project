from abc import ABC, abstractmethod
from enum import Enum
from pathlib import Path
from traceback import print_exc


class AnalysisCompletionStatus(Enum):
    # I made this an enum because we might want to represent in the feature
    # other statuses like transient/retriable errors, or warnings, or whatever...

    SUCCESS = "SUCCESS"
    FAILURE = "FAILURE"


class AnalysisOutput(object):
    def __init__(
        self,
        status: AnalysisCompletionStatus,
        returned_object: object,
        analysis: "Analysis",
        analysis_input: "AnalysisInput",
    ) -> None:
        self.status = status
        self.returned_object = returned_object
        self.analysis = analysis
        self.analysis_input = analysis_input

    def __repr__(self) -> str:
        return f"AnalysisOutput(status={self.status!r}, returned_object={self.returned_object!r}, analysis={self.analysis!r}, analysis_input={self.analysis_input!r})"

    def __str__(self) -> str:
        return f"AnalysisOutput({self.status.value})"


class AnalysisInput(object):
    def __init__(
        self,
        input_dir: Path,
        output_dir: Path,
        parent: "Analysis | None",  # TODO: Not sure if the convention is to have the "" only around analysis
        parent_output: "AnalysisOutput | None",
    ) -> None:
        self.input_dir = input_dir
        self.output_dir = output_dir
        self.parent = parent
        self.parent_output = parent_output

    def to_output(
        self,
        status: AnalysisCompletionStatus,
        returned_object: object,
        analysis: "Analysis",
    ) -> AnalysisOutput:
        return AnalysisOutput(status, returned_object, analysis, self)

    def __repr__(self) -> str:
        return f"AnalysisInput(input_dir={self.input_dir!r}, output_dir={self.output_dir!r}, parent={self.parent!r}, parent_output={self.parent_output!r})"

    def __str__(self) -> str:
        return f"AnalysisInput(input_dir={self.input_dir}, output_dir={self.output_dir})"


class Analysis(ABC):
    @abstractmethod
    def run(self, inp: AnalysisInput) -> AnalysisOutput:
        pass

    @abstractmethod
    def get_type_id(self) -> str:
        """
        Returns the ID of the TYPE of the analysis (e.g. "python" or "shell")
        """
        pass

    @abstractmethod
    def get_analysis_id(self) -> str:
        """
        Returns the ID of the specific analysis (not a specific run, e.g. "mri_normalization" or "paired_t_test")
        """
        pass

    def __repr__(self) -> str:
        return f"{self.__class__.__name__}()"

    def __str__(self) -> str:
        return self.__class__.__name__


class PythonAnalysis(Analysis):
    # Just a sample of what this class should be, we should reimplement it
    # to properly run the code in the directory and stuff
    #
    # TODO: Also test edge cases of this (python code fails with various reasons...)

    def __init__(self, python_code: str) -> None:
        self.python_code = python_code

    def __repr__(self) -> str:
        return f"PythonAnalysis(python_code={self.python_code!r})"

    def __str__(self) -> str:
        code_snippet = self.python_code[:50].replace("\n", " ")
        if len(self.python_code) > 50:
            code_snippet += "..."
        return f"PythonAnalysis({code_snippet})"

    def get_type_id(self) -> str:
        return "python"

    def get_analysis_id(self) -> str:
        return "generic_python_analysis"

    def run(self, inp: AnalysisInput) -> AnalysisOutput:
        try:
            returned_object = eval(self.python_code)
            return inp.to_output(AnalysisCompletionStatus.SUCCESS, returned_object, self)
        except BaseException as be:
            print("[-] (temp log) exception happened in Python analysis", be)
            print_exc()
            return inp.to_output(AnalysisCompletionStatus.FAILURE, None, self)


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
        return self.base_path / "raw_data" / experiment_id / data_id

    def get_analysis_output_directory(self, analysis: Analysis) -> Path:
        # Whatever, uninteresting for now, we'll implement this later
        return self.base_path / "output_data" / analysis.get_analysis_id()


class AnalysisExecutor(object):
    def __init__(self, artifact_manager: ArtifactManager) -> None:
        self.artifact_manager = artifact_manager

    def run_analysis_on_data(self, analysis: Analysis, experiment_id: str, data_id: str) -> AnalysisOutput:
        raw_data_dir = self.artifact_manager.get_raw_data_directory(experiment_id, data_id)
        output_dir = self.artifact_manager.get_analysis_output_directory(analysis)

        analysis_input = AnalysisInput(raw_data_dir, output_dir, None, None)
        analysis_output = analysis.run(analysis_input)

        return analysis_output
