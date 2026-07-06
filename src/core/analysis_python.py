from traceback import print_exc

from .analysis import Analysis, AnalysisCompletionStatus, AnalysisInput, AnalysisOutput


class PythonAnalysis(Analysis):
    # Just a sample of what this class should be, we should reimplement it
    # to properly run the code in the directory and stuff
    #
    # TODO: Also test edge cases of this (python code fails with various reasons...)

    def __init__(self, analysis_id: str, python_code: str, user_arguments: dict | None = None) -> None:
        super().__init__(analysis_id)
        self.python_code = python_code
        self.user_arguments = user_arguments if user_arguments is not None else {}

    def __repr__(self) -> str:
        return f"PythonAnalysis(python_code={self.python_code!r}, user_arguments={self.user_arguments!r})"

    def __str__(self) -> str:
        code_snippet = self.python_code[:50].replace("\n", " ")
        if len(self.python_code) > 50:
            code_snippet += "..."
        return f"PythonAnalysis({code_snippet})"

    def get_type_id(self) -> str:
        return "python"

    def serialize(self) -> dict:
        return {"python_code": self.python_code}

    @classmethod
    def deserialize(cls, analysis_id: str, params: dict) -> "PythonAnalysis":
        return cls(analysis_id, params["python_code"])

    def verify(self):
        # TODO: call Yoad's code here -> process_and_run_with_venv
        # throw exception on error
        return super().verify()

    def run(self, inp: AnalysisInput) -> AnalysisOutput:
        try:
            # 1. Setup core environment with system paths
            execution_context = {"input_dir": inp.input_dir, "output_dir": inp.output_dir, "parent_output": inp.parent_output}

            # 2. Merge the GUI user arguments into the execution context
            execution_context.update(self.user_arguments)

            # 3. Run the code with access to everything
            exec(self.python_code, execution_context)

            returned_object = execution_context.get("result", True)
            return AnalysisOutput(AnalysisCompletionStatus.SUCCESS, returned_object, self, inp)

        except BaseException as be:
            print("[-] (temp log) exception happened in Python analysis", be)
            print_exc()
            return AnalysisOutput(AnalysisCompletionStatus.FAILURE, None, self, inp)
