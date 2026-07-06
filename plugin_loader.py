import importlib.util
import inspect
from pathlib import Path


def get_function_parameters(file_path: Path, function_name: str) -> list:
    spec = importlib.util.spec_from_file_location("custom_module", file_path)

    if spec is None or spec.loader is None:
        return []

    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)

    func = getattr(module, function_name)

    signature = inspect.signature(func)
    parameters = list(signature.parameters.keys())

    return parameters