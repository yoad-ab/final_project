from .analysis import Analysis, AnalysisInput, AnalysisOutput


class ShellAnalysis(Analysis):
    def __init__(self, analysis_id: str, shell_command: str) -> None:
        super().__init__(analysis_id)
        self.shell_command = shell_command

    def __repr__(self) -> str:
        return f"ShellAnalysis(analysis_id={self.analysis_id!r}, shell_command={self.shell_command!r})"

    def __str__(self) -> str:
        return f"ShellAnalysis({self.analysis_id}, {self.shell_command})"

    def get_type_id(self) -> str:
        return "shell"

    def serialize(self) -> dict:
        return {"shell_command": self.shell_command}

    @classmethod
    def deserialize(cls, analysis_id: str, params: dict) -> "ShellAnalysis":
        return cls(analysis_id, params["shell_command"])

    def run(self, inp: AnalysisInput) -> AnalysisOutput:
        raise NotImplementedError("ShellAnalysis is not yet implemented")
