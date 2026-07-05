from .analysis import Analysis, AnalysisInput, AnalysisOutput


class ShellAnalysis(Analysis):
    def __init__(self, analysis_id: str, shell_command: str) -> None:
        self.analysis_id = analysis_id
        self.shell_command = shell_command

    def __repr__(self) -> str:
        return f"ShellAnalysis(analysis_id={self.analysis_id!r}, shell_command={self.shell_command!r})"

    def __str__(self) -> str:
        return f"ShellAnalysis({self.analysis_id}, {self.shell_command})"

    def get_type_id(self) -> str:
        return "shell"

    def get_analysis_id(self) -> str:
        return self.analysis_id

    def run(self, inp: AnalysisInput) -> AnalysisOutput:
        raise NotImplementedError("ShellAnalysis is not yet implemented")
