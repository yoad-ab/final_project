import pytest
from pathlib import Path
from unittest.mock import MagicMock

# Adjust imports according to your exact folder layout
from src.core.analysis import Analysis, AnalysisInput, AnalysisOutput
from src.core.artifacts import ArtifactManager
from src.core.recipe import Recipe
from src.core.analysis_runner import AnalysisExecutor

@pytest.fixture
def mock_artifact_manager():
    """Provides a mocked ArtifactManager."""
    manager = MagicMock(spec=ArtifactManager)
    manager.get_raw_data_directory.return_value = Path("/mock/raw/data/dir")
    return manager

@pytest.fixture
def executor(mock_artifact_manager):
    """Provides an instance of AnalysisExecutor with the mocked manager."""
    return AnalysisExecutor(artifact_manager=mock_artifact_manager)


# --- Tests ---

def test_run_analysis_on_data(executor, mock_artifact_manager):
    mock_analysis = MagicMock(spec=Analysis)
    mock_output = MagicMock(spec=AnalysisOutput)
    mock_analysis.run.return_value = mock_output
    
    run_folder = Path("/mock/run/folder")
    
    result = executor.run_analysis_on_data(
        analysis=mock_analysis,
        experiment_id="exp_01",
        data_id="data_99",
        run_folder=run_folder
    )
    
    mock_artifact_manager.get_raw_data_directory.assert_called_once_with("exp_01", "data_99")
    mock_analysis.run.assert_called_once()
    called_input = mock_analysis.run.call_args[0][0]
    
    assert isinstance(called_input, AnalysisInput)
    assert called_input.input_dir == Path("/mock/raw/data/dir")
    assert called_input.output_dir == run_folder
    assert result == mock_output


def test_run_analysis_on_output(executor):
    mock_current_analysis = MagicMock(spec=Analysis)
    mock_prev_analysis = MagicMock(spec=Analysis)
    mock_prev_output = MagicMock(spec=AnalysisOutput)
    mock_prev_output.analysis = mock_prev_analysis
    
    mock_expected_output = MagicMock(spec=AnalysisOutput)
    mock_current_analysis.run.return_value = mock_expected_output
    
    run_folder = Path("/mock/run/folder")
    
    result = executor.run_analysis_on_output(
        analysis=mock_current_analysis,
        previous_run=mock_prev_output,
        run_folder=run_folder
    )
    
    mock_current_analysis.run.assert_called_once()
    called_input = mock_current_analysis.run.call_args[0][0]
    
    assert isinstance(called_input, AnalysisInput)
    assert called_input.input_dir == run_folder
    assert called_input.output_dir == run_folder
    assert called_input.parent_output == mock_prev_output
    assert result == mock_expected_output


def test_run_recipe_with_multiple_analyses(executor, mock_artifact_manager):
    analysis1 = MagicMock(spec=Analysis)
    analysis2 = MagicMock(spec=Analysis)
    analysis3 = MagicMock(spec=Analysis)
    
    mock_recipe = MagicMock(spec=Recipe)
    mock_recipe.analyses = [analysis1, analysis2, analysis3]
    
    out1 = MagicMock(spec=AnalysisOutput)
    out1.analysis = analysis1
    analysis1.run.return_value = out1
    
    out2 = MagicMock(spec=AnalysisOutput)
    out2.analysis = analysis2
    analysis2.run.return_value = out2
    
    out3 = MagicMock(spec=AnalysisOutput)
    out3.analysis = analysis3
    analysis3.run.return_value = out3
    
    run_folder = Path("/mock/run/folder")
    
    final_output = executor.run_recipe(
        recipe=mock_recipe,
        experiment_id="exp_02",
        data_id="data_88",
        run_folder=run_folder
    )
    
    assert analysis1.run.called
    assert analysis2.run.called
    assert analysis3.run.called
    
    input_to_analysis2 = analysis2.run.call_args[0][0]
    assert input_to_analysis2.parent_output == out1
    
    input_to_analysis3 = analysis3.run.call_args[0][0]
    assert input_to_analysis3.parent_output == out2
    
    assert final_output == out3