from traceback import print_exc
from pathlib import Path
from abc import ABC, abstractmethod
from enum import Enum
from typing import override


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
    ) -> None:
        self.status = status
        self.returned_object = returned_object


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


class Analysis(ABC):
    @abstractmethod
    def run(self, inp: AnalysisInput) -> AnalysisOutput:
        pass


class PythonAnalysis(ABC):
    # Just a sample of what this class should be, we should reimplement it
    # to properly run the code in the directory and stuff
    #
    # TODO: Also test edge cases of this (python code fails with various reasons...)

    def __init__(self, python_code: str) -> None:
        self.python_code = python_code

    @override
    def run(self, inp: AnalysisInput) -> AnalysisOutput:
        try:
            returned_object = eval(self.python_code)
            return AnalysisOutput(AnalysisCompletionStatus.SUCCESS, returned_object)
        except BaseException as be:
            print("[-] (temp log) exception happened in Python analysis", be)
            print_exc()
            return AnalysisOutput(AnalysisCompletionStatus.FAILURE, None)


class AnalysisExecutor(object):
    pass
