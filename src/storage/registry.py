from ..core.analysis import Analysis

_REGISTRY: dict[str, type[Analysis]] = {}


def register(type_id: str, cls: type[Analysis]) -> None:
    _REGISTRY[type_id] = cls


def dump(analysis: Analysis) -> dict:
    return {
        "type_id": analysis.get_type_id(),
        "analysis_id": analysis.get_analysis_id(),
        "data": analysis.serialize(),
    }


def load(d: dict) -> Analysis:
    type_id = d["type_id"]
    if type_id not in _REGISTRY:
        raise ValueError(f"Unknown analysis type: {type_id!r}")
    return _REGISTRY[type_id].deserialize(d["analysis_id"], d["data"])
