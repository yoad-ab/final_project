from .analysis import Analysis


class Recipe(object):
    def __init__(self, recipe_id: str, analyses: list[Analysis]) -> None:
        """
        In v1, a recipe is a strictly linear sequence of analyses executed one after the other.
        Each analysis receives the output directory of the previous one as its input.

        This model is intentionally minimal. Future versions are expected to support richer
        execution graphs: conditional branching (routing execution to one of several paths
        based on analysis output), loops, parallel branches, and other control-flow primitives.
        The data model and executor should be evolved to represent a directed graph of analyses
        rather than a flat list when that work begins.
        """

        self.recipe_id = recipe_id
        self.analyses = analyses
