from .analysis import Analysis


class Recipe(object):
    def __init__(self, recipe_id: str, analyses: list[Analysis]) -> None:
        """
        For now recipe would only be a list of analyses that get run sequentially
        """

        self.recipe_id = recipe_id
        self.analyses = analyses
