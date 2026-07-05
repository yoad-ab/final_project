import hashlib
from traceback import print_exc

from .analysis import Analysis, AnalysisCompletionStatus, AnalysisInput, AnalysisOutput


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

    def get_hash(self) -> str:
        return hashlib.sha256(self.python_code.encode()).hexdigest()

    def get_type_id(self) -> str:
        return "python"

    def get_analysis_id(self) -> str:
        return "generic_python_analysis"

    def run(self, inp: AnalysisInput) -> AnalysisOutput:
        try:
            returned_object = eval(self.python_code)
            return AnalysisOutput(AnalysisCompletionStatus.SUCCESS, returned_object, self, inp)
        except BaseException as be:
            print("[-] (temp log) exception happened in Python analysis", be)
            print_exc()
            return AnalysisOutput(AnalysisCompletionStatus.FAILURE, None, self, inp)
