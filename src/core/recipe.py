from .analysis import Analysis


class Recipe(object):
    def __init__(self, analyses: list[Analysis]) -> None:
        """
        For now recipe would only be a list of analyses that get run sequentially
        """

        self.analyses = analyses
