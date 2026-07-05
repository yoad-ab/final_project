from abc import ABC, abstractmethod
from enum import Enum
from pathlib import Path


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
        analysis_input: "AnalysisInput | None",
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
