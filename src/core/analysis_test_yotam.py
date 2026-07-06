from pathlib import Path

from ..storage import StorageManager
from .pipeline_runner import run_pipeline

s = StorageManager(Path("./workspace"))

recipe = s.recipes.load("example_yotam_recipe")

print(recipe)

for a in recipe.analyses:
    print("Analysis", a)

run_pipeline(recipe.analyses, s.artifacts, "experiment_1", "data_1")
