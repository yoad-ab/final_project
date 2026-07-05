from traceback import print_exc

from .analysis import Analysis, AnalysisCompletionStatus, AnalysisInput, AnalysisOutput


class PythonAnalysis(Analysis):
    # Just a sample of what this class should be, we should reimplement it
    # to properly run the code in the directory and stuff
    #
    # TODO: Also test edge cases of this (python code fails with various reasons...)

    def __init__(self, analysis_id: str, python_code: str) -> None:
        self.analysis_id = analysis_id
        self.python_code = python_code

    def __repr__(self) -> str:
        return f"PythonAnalysis(analysis_id={self.analysis_id!r}, python_code={self.python_code!r})"

    def get_type_id(self) -> str:
        return "python"

    def get_analysis_id(self) -> str:
        return self.analysis_id

    def run(self, inp: AnalysisInput) -> AnalysisOutput:
        try:
            returned_object = eval(self.python_code)
            return AnalysisOutput(AnalysisCompletionStatus.SUCCESS, returned_object, self, inp)
        except BaseException as be:
            print("[-] (temp log) exception happened in Python analysis", be)
            print_exc()
            return AnalysisOutput(AnalysisCompletionStatus.FAILURE, None, self, inp)
